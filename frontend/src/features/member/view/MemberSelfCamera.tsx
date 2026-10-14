/**
 * MemberSelfCamera
 *
 * Displays the LOGGED-IN / ASSIGNED member's OWN live webcam feed.
 * Purpose: physical presence & movement monitoring (proctoring-style).
 *
 * What it does:
 *  - Streams the member's own webcam (not the active speaker feed)
 *  - Runs canvas-based frame-differencing to detect significant movement
 *  - Applies a reasonable threshold so normal head/hand motion is ignored
 *  - Reports violations to the server via /api/ai/member-presence
 *  - Shows monitoring status indicators below the video
 *
 * What it does NOT do:
 *  - It does NOT show the current floor speaker's video
 *  - It does NOT touch the shared isWebcamActive context state
 *    (so the Speaker Dashboard camera is completely independent)
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Camera, Video, VideoOff, CheckCircle2, User } from "lucide-react";
import {
  unpackCascade,
  runCascade,
  clusterDetections,
  rgbaToGrayscale,
  ClassifyRegionFn,
} from "../../../utils/picoDetector";
import { API_BASE } from "../../../infrastructure/api/api";

interface MemberSelfCameraProps {
  memberId: string;
  seatId: string;
  micId: string;
  memberName: string;
  className?: string;
}

interface PresenceStatus {
  present: boolean;
  movement: "NONE" | "NORMAL" | "SIGNIFICANT";
  seatCompliant: boolean;
  confidence: number;
  lastViolation: string | null;
}

// ── Motion detection constants ──
// High threshold to ignore normal head turns, breathing, note-taking, and posture shifts.
// Only flag movement when pixel-difference ratio exceeds 0.22 (22% of zone area changed).
const MOTION_THRESHOLD_RATIO = 0.22;
// Pixel brightness delta to count as "changed" (higher delta avoids webcam sensor noise)
const PIXEL_DELTA = 45;
// Require at least 8 consecutive high-motion frames (4.0s of sustained movement)
// before flagging an unauthorized movement violation.
const VIOLATION_FRAMES = 8;
// How often to sample frames for motion (ms)
const SAMPLE_INTERVAL_MS = 500;
// Cooldown between sending violation reports to the server (ms)
const REPORT_COOLDOWN_MS = 20000;

export function MemberSelfCamera({
  memberId,
  seatId,
  micId,
  memberName,
  className = "",
}: MemberSelfCameraProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const motionFrameCount = useRef(0);
  const missingFaceFrameCount = useRef(0);
  const lastReportTime = useRef(0);
  const serverViolationActiveRef = useRef(false);
  const sampleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceDetectorRef = useRef<any>(null);
  const classifyRegionRef = useRef<ClassifyRegionFn | null>(null);

  // Load pico facefinder cascade from public directory on mount
  useEffect(() => {
    let cancelled = false;
    const modelUrl = `${import.meta.env.BASE_URL || "/"}models/facefinder`.replace(/\/{2,}/g, "/");
    fetch(modelUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        if (!cancelled) {
          const bytes = new Int8Array(buffer);
          classifyRegionRef.current = unpackCascade(bytes);
        }
      })
      .catch((err) => {
        console.warn("Could not load local facefinder cascade:", err);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && "FaceDetector" in window) {
      try {
        faceDetectorRef.current = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 1 });
      } catch {
        faceDetectorRef.current = null;
      }
    }
  }, []);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [presence, setPresence] = useState<PresenceStatus>({
    present: false,
    movement: "NONE",
    seatCompliant: true,
    confidence: 0,
    lastViolation: null,
  });

  // ── Start webcam ──
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraActive(true);
      setPresence((p) => ({ ...p, present: false, confidence: 0.5 }));
    } catch (err: any) {
      const msg =
        err?.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access."
          : err?.name === "NotFoundError"
          ? "No camera device found on this machine."
          : `Camera unavailable: ${err?.message || "unknown error"}`;
      setCameraError(msg);
      setCameraActive(false);
    }
  }, []);

  // ── Stop webcam ──
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
    prevFrameRef.current = null;
    motionFrameCount.current = 0;
    missingFaceFrameCount.current = 0;
    setCameraActive(false);
    setPresence({ present: false, movement: "NONE", seatCompliant: true, confidence: 0, lastViolation: null });
  }, []);

  // ── Send presence/violation report to server ──
  const reportPresence = useCallback(async (violationType: string, confidence: number) => {
    const now = Date.now();
    // Allow immediate recovery report and absence report without cooldown
    const isStateTransition = violationType === "NORMAL" || violationType === "MEMBER_ABSENT";
    if (!isStateTransition && now - lastReportTime.current < REPORT_COOLDOWN_MS) return;
    lastReportTime.current = now;

    try {
      await fetch(`${API_BASE}/api/ai/member-presence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(typeof window !== "undefined" && sessionStorage.getItem("parlisense_token")
            ? { Authorization: `Bearer ${sessionStorage.getItem("parlisense_token")}` }
            : {})
        },
        body: JSON.stringify({
          member_id: memberId,
          seat_id: seatId,
          mic_id: micId,
          violation_type: violationType,
          confidence: confidence.toFixed(2),
          timestamp: new Date().toISOString(),
          session_id: null, // server fills this in
        }),
      });
    } catch {
      // network errors are silently swallowed — not critical
    }
  }, [memberId, seatId, micId]);

  // ── Frame-differencing motion & face presence detection ──
  const sampleFrame = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;

    const W = 160; // downsample for performance
    const H = 90;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, W, H);
    const currentFrame = ctx.getImageData(0, 0, W, H);

    // 1. Face visibility check
    let isFaceDetected = false;

    // A. Real-time sliding-window face cascade detection (pure TS pico detector)
    if (classifyRegionRef.current) {
      try {
        const image = {
          pixels: rgbaToGrayscale(currentFrame.data, H, W),
          nrows: H,
          ncols: W,
          ldim: W,
        };
        const params = {
          shiftfactor: 0.1,
          minsize: 20,
          maxsize: 75,
          scalefactor: 1.15,
        };
        let dets = runCascade(image, classifyRegionRef.current, params);
        dets = clusterDetections(dets, 0.2);
        // Scores above 1.5 confirm a real facial structure (eyes, nose, mouth)
        const confidentFaces = dets.filter((d: any) => d[3] > 1.5);
        if (confidentFaces.length > 0) {
          isFaceDetected = true;
        }
      } catch (err) {
        console.warn("[MemberSelfCamera] pico detection error:", err);
      }
    }

    // B. Native browser FaceDetector API if supported
    if (!isFaceDetected && faceDetectorRef.current && canvas) {
      try {
        const faces = await faceDetectorRef.current.detect(canvas);
        if (faces && faces.length > 0) {
          isFaceDetected = true;
        }
      } catch {}
    }

    if (!isFaceDetected) {
      missingFaceFrameCount.current++;
    } else {
      missingFaceFrameCount.current = 0;
    }

    const hasNoFace = missingFaceFrameCount.current >= 2; // 1.0s without face

    if (hasNoFace) {
      setPresence({
        present: false,
        movement: "NONE",
        seatCompliant: false,
        confidence: 0.95,
        lastViolation: "No face visible in camera frame — marked NOT SEATED",
      });
      motionFrameCount.current = 0;
      prevFrameRef.current = currentFrame;

      serverViolationActiveRef.current = true;
      reportPresence("MEMBER_ABSENT", 0.95);
      return;
    }

    // If face just returned from being not seated / absent:
    if (!presence.present && isFaceDetected) {
      setPresence((p) => ({
        ...p,
        present: true,
        seatCompliant: true,
        lastViolation: null,
      }));
      if (serverViolationActiveRef.current) {
        serverViolationActiveRef.current = false;
        reportPresence("NORMAL", 0.95);
      }
    }

    // 2. Motion detection via pixel differencing with designated boundary zone
    if (prevFrameRef.current) {
      const prev = prevFrameRef.current;
      let diffPixels = 0;
      // Designated boundary box: generous center zone with buffer margin (15% to 85% width, 5% to 85% height)
      const minX = Math.floor(W * 0.15);
      const maxX = Math.ceil(W * 0.85);
      const minY = Math.floor(H * 0.05);
      const maxY = Math.ceil(H * 0.85);
      const total = (maxX - minX) * (maxY - minY);

      for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
        const i = (y * W + x) * 4;
        const dr = Math.abs(currentFrame.data[i]     - prev.data[i]);
        const dg = Math.abs(currentFrame.data[i + 1] - prev.data[i + 1]);
        const db = Math.abs(currentFrame.data[i + 2] - prev.data[i + 2]);
        if ((dr + dg + db) / 3 > PIXEL_DELTA) diffPixels++;
      }

      const motionRatio = diffPixels / total;

      // Only extensive movement that exceeds threshold consistently triggers a violation
      if (motionRatio > MOTION_THRESHOLD_RATIO) {
        motionFrameCount.current++;
        const isViolation = motionFrameCount.current >= VIOLATION_FRAMES;
        const movementLevel: "NORMAL" | "SIGNIFICANT" = isViolation ? "SIGNIFICANT" : "NORMAL";
        const confidence = Math.min(0.95, 0.5 + motionRatio);

        setPresence({
          present: true,
          movement: movementLevel,
          seatCompliant: !isViolation,
          confidence,
          lastViolation: isViolation ? "Sustained seat displacement detected" : null,
        });

        if (isViolation) {
          serverViolationActiveRef.current = true;
          reportPresence("UNAUTHORIZED_MOVEMENT", confidence);
        }
      } else {
        // Natural decay of motion counter allows graceful recovery from brief shifts
        motionFrameCount.current = Math.max(0, motionFrameCount.current - 1);
        const isMinorMotion = motionRatio > 0.06;
        setPresence({
          present: true,
          movement: isMinorMotion ? "NORMAL" : "NONE",
          seatCompliant: true,
          confidence: 0.95,
          lastViolation: null,
        });

        // Automatically clear violation on server if previously triggered and member is settled
        if (serverViolationActiveRef.current && motionFrameCount.current === 0) {
          serverViolationActiveRef.current = false;
          reportPresence("NORMAL", 0.95);
        }
      }
    }

    prevFrameRef.current = currentFrame;
  }, [reportPresence, presence.present]);

  // Start sampling when camera becomes active
  useEffect(() => {
    if (cameraActive) {
      sampleTimerRef.current = setInterval(sampleFrame, SAMPLE_INTERVAL_MS);
    } else {
      if (sampleTimerRef.current) clearInterval(sampleTimerRef.current);
    }
    return () => { if (sampleTimerRef.current) clearInterval(sampleTimerRef.current); };
  }, [cameraActive, sampleFrame]);

  // Auto-start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // ── Status indicators (kept internally for violation reporting, not displayed) ──

  return (
    <div className={`bg-slate-900 rounded-lg border border-slate-800 p-2 shadow-sm flex flex-col h-full min-h-0 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="p-1 rounded bg-slate-800 text-sky-400 border border-slate-700">
            <Camera className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider leading-none">
                MY LIVE CAMERA
              </h3>
              {cameraActive ? (
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  LIVE
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-slate-800 text-slate-400 border border-slate-700">
                  OFF
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 leading-none mt-0.5">
              Seat {seatId} · {micId} · Presence & Movement Monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {!cameraActive ? (
            <button onClick={startCamera}
              className="px-1.5 py-0.5 text-[9px] font-semibold rounded border bg-sky-800/30 text-sky-300 border-sky-700/50 hover:bg-sky-800/50 flex items-center gap-1 transition-colors">
              <Video className="w-3 h-3" /> Start Camera
            </button>
          ) : (
            <button onClick={stopCamera}
              className="px-1.5 py-0.5 text-[9px] font-semibold rounded border bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 flex items-center gap-1 transition-colors">
              <VideoOff className="w-3 h-3" /> Stop
            </button>
          )}
        </div>
      </div>

      {/* Video stage — square feed centered on the dark stage; keeps the
          member's face fully visible instead of cropping a landscape window */}
      <div className="relative w-full flex-1 min-h-0 rounded overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center"
        style={{ minHeight: "120px" }}>

        {/* Square viewport */}
        <div className="relative h-full overflow-hidden rounded bg-slate-950 border border-slate-800"
          style={{ aspectRatio: "1 / 1", minHeight: "120px" }}>

          {/* Live video */}
          <video ref={videoRef} playsInline muted
            className={`absolute inset-0 w-full h-full object-cover ${cameraActive ? "opacity-90" : "hidden"}`} />

          {/* Hidden motion-detection canvas (off-screen sampling) */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Designated Seating Boundary Guide Box Overlay */}
          {cameraActive && (
            <div className={`absolute inset-x-[10%] top-[6%] bottom-[20%] pointer-events-none rounded-lg border transition-colors duration-300 ${
              !presence.present
                ? "border-rose-500/80 bg-rose-950/10 border-solid"
                : presence.movement === "SIGNIFICANT"
                ? "border-amber-400/60 border-dashed"
                : "border-sky-400/40 border-dashed"
            }`}>
              <div className={`absolute top-1 left-1.5 px-1.5 py-0.2 rounded text-[8px] font-mono font-bold tracking-wider flex items-center gap-1 shadow-sm ${
                !presence.present
                  ? "bg-rose-950/90 border border-rose-500/60 text-rose-300"
                  : "bg-slate-950/85 border border-sky-500/30 text-sky-300"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${
                  !presence.present
                    ? "bg-rose-500 animate-ping"
                    : presence.movement === "SIGNIFICANT"
                    ? "bg-amber-400 animate-ping"
                    : presence.movement === "NORMAL"
                    ? "bg-amber-400"
                    : "bg-emerald-400"
                }`} />
                {!presence.present ? "NO FACE DETECTED" : "SEATING BOUNDARY"}
              </div>
              {/* Corner brackets */}
              <div className={`absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 ${!presence.present ? "border-rose-500" : "border-sky-400"}`} />
              <div className={`absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 ${!presence.present ? "border-rose-500" : "border-sky-400"}`} />
              <div className={`absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 ${!presence.present ? "border-rose-500" : "border-sky-400"}`} />
              <div className={`absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 ${!presence.present ? "border-rose-500" : "border-sky-400"}`} />
            </div>
          )}

          {/* Active violation warning banner inside camera viewport when face is not visible */}
          {cameraActive && !presence.present && (
            <div className="absolute top-2 left-2 right-2 p-1.5 rounded-lg bg-rose-950/95 border border-rose-500/80 text-rose-200 text-[10px] font-semibold flex items-center justify-between gap-1.5 shadow-lg backdrop-blur-sm z-20 animate-pulse">
              <span className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0 animate-ping" />
                <span className="truncate">⚠ VIOLATION: No face visible — Member marked NOT SEATED</span>
              </span>
              <span className="font-mono text-[8px] bg-rose-900/80 text-rose-300 px-1 py-0.2 rounded border border-rose-500/40 font-bold uppercase flex-shrink-0">
                NOT SEATED
              </span>
            </div>
          )}

          {/* Camera error state */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center bg-slate-950">
              <VideoOff className="w-8 h-8 text-rose-500/60" />
              <p className="text-[10px] text-rose-400 font-semibold leading-snug">{cameraError}</p>
              <button onClick={startCamera}
                className="px-3 py-1 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-[10px] font-bold mt-1">
                Retry Camera
              </button>
            </div>
          )}

          {/* Camera off placeholder */}
          {!cameraActive && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950">
              <User className="w-10 h-10 text-slate-700" />
              <p className="text-[10px] text-slate-500">Camera inactive</p>
            </div>
          )}

          {/* Member identity overlay — bottom bar */}
          {cameraActive && (
            <div className="absolute bottom-2 left-2 right-2 p-1.5 bg-slate-950/85 border border-sky-500/30 rounded-lg backdrop-blur-md flex items-center justify-between gap-2 shadow-lg z-10">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${presence.present ? "bg-emerald-400" : "bg-rose-500 animate-pulse"}`} />
                <div className="min-w-0">
                  <span className="font-bold text-slate-100 text-[10px] truncate block">{memberName}</span>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-mono">
                    <span className="text-amber-400">{seatId}</span>
                    <span>·</span>
                    <span className="text-sky-400">{micId}</span>
                    <span>·</span>
                    <span className="text-slate-500">{memberId}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  !presence.present
                    ? "bg-rose-500/25 text-rose-300 border-rose-500/50 animate-pulse"
                    : presence.movement === "SIGNIFICANT"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : presence.movement === "NORMAL"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                }`}>
                  {!presence.present
                    ? "NOT SEATED ✗"
                    : presence.movement === "SIGNIFICANT"
                    ? "MOVEMENT ⚠"
                    : presence.movement === "NORMAL"
                    ? "MOVING"
                    : "SEATED ✓"}
                </span>
                <span className="text-[8px] text-slate-500 font-mono mt-0.5">
                  Confidence: {(presence.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
