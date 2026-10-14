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
// Only flag movement when pixel-difference ratio exceeds this threshold
// (0.12 = 12% of pixels changed significantly — ignores minor head/hand movement)
// Head/upper-body motion often changes a relatively small part of the frame.
// Measure a central upper-body region instead of requiring 12% of the whole
// image (which made normal head turns effectively invisible).
const MOTION_THRESHOLD_RATIO = 0.06;
// Pixel brightness delta to count as "changed"
const PIXEL_DELTA = 35;
// How many consecutive high-motion frames before reporting a violation
const VIOLATION_FRAMES = 4;
// How often to sample frames for motion (ms)
const SAMPLE_INTERVAL_MS = 500;
// Cooldown between sending violation reports to the server (ms)
const REPORT_COOLDOWN_MS = 15000;

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
  const lastReportTime = useRef(0);
  const sampleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setPresence((p) => ({ ...p, present: true, confidence: 0.9 }));
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
    setCameraActive(false);
    setPresence({ present: false, movement: "NONE", seatCompliant: true, confidence: 0, lastViolation: null });
  }, []);

  // ── Send presence/violation report to server ──
  const reportPresence = useCallback(async (violationType: string, confidence: number) => {
    const now = Date.now();
    if (now - lastReportTime.current < REPORT_COOLDOWN_MS) return;
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

  // ── Frame-differencing motion detection ──
  const sampleFrame = useCallback(() => {
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

    // Presence check: if most pixels are very dark → no one in frame
    let brightPixels = 0;
    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const brightness = (currentFrame.data[i] + currentFrame.data[i + 1] + currentFrame.data[i + 2]) / 3;
      if (brightness > 30) brightPixels++;
    }
    const presenceRatio = brightPixels / (W * H);
    const isPresent = presenceRatio > 0.15; // at least 15% non-black pixels

    if (!isPresent) {
      setPresence((p) => ({ ...p, present: false, movement: "NONE", seatCompliant: false, confidence: 0.85, lastViolation: "Member not detected in camera frame" }));
      motionFrameCount.current = 0;
      prevFrameRef.current = currentFrame;

      // Report absence after cooldown
      reportPresence("MEMBER_ABSENT", 0.85);
      return;
    }

    // Motion detection via pixel differencing
    if (prevFrameRef.current) {
      const prev = prevFrameRef.current;
      let diffPixels = 0;
      // Focus on the member's head/torso and ignore the noisy outer edges.
      const minX = Math.floor(W * 0.2);
      const maxX = Math.ceil(W * 0.8);
      const minY = Math.floor(H * 0.05);
      const maxY = Math.ceil(H * 0.72);
      const total = (maxX - minX) * (maxY - minY);

      for (let y = minY; y < maxY; y++) for (let x = minX; x < maxX; x++) {
        const i = (y * W + x) * 4;
        const dr = Math.abs(currentFrame.data[i]     - prev.data[i]);
        const dg = Math.abs(currentFrame.data[i + 1] - prev.data[i + 1]);
        const db = Math.abs(currentFrame.data[i + 2] - prev.data[i + 2]);
        if ((dr + dg + db) / 3 > PIXEL_DELTA) diffPixels++;
      }

      const motionRatio = diffPixels / total;

      if (motionRatio > MOTION_THRESHOLD_RATIO) {
        // Significant movement
        motionFrameCount.current++;
        const movementLevel: "NORMAL" | "SIGNIFICANT" = motionFrameCount.current >= VIOLATION_FRAMES ? "SIGNIFICANT" : "NORMAL";
        const confidence = Math.min(0.95, 0.6 + motionRatio * 2);

        setPresence({
          present: true,
          movement: movementLevel,
          seatCompliant: movementLevel !== "SIGNIFICANT",
          confidence,
          lastViolation: movementLevel === "SIGNIFICANT" ? "Significant movement detected — possible seat departure" : null,
        });

        if (movementLevel === "SIGNIFICANT") {
          reportPresence("UNAUTHORIZED_MOVEMENT", confidence);
        }
      } else {
        // Normal / settled
        motionFrameCount.current = Math.max(0, motionFrameCount.current - 1);
        setPresence({
          present: true,
          movement: motionFrameCount.current > 2 ? "NORMAL" : "NONE",
          seatCompliant: true,
          confidence: 0.95,
          lastViolation: null,
        });
      }
    }

    prevFrameRef.current = currentFrame;
  }, [reportPresence]);

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
                  presence.movement === "SIGNIFICANT"
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                    : presence.movement === "NORMAL"
                    ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                    : "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                }`}>
                  {presence.movement === "SIGNIFICANT" ? "MOVEMENT ⚠" : presence.movement === "NORMAL" ? "MOVING" : "SEATED ✓"}
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
