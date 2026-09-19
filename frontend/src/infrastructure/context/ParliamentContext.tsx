import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import confetti from "canvas-confetti";
import { SessionTelemetry, MemberScorecard, SessionReport, Member, UserSession } from "../../shared/types";
import {
  subscribeToSessionStream,
  fetchMembers,
  fetchMemberScorecard,
  fetchSessionReport,
  triggerEmergency as apiTriggerEmergency,
  resetEmergency as apiResetEmergency,
  setActiveSpeaker as apiSetActiveSpeaker,
  raiseHand as apiRaiseHand,
  withdrawHand as apiWithdrawHand,
  rejectFloorRequest as apiRejectFloorRequest,
  releaseFloor as apiReleaseFloor,
  toggleSessionState as apiToggleSessionState,
  startSession as apiStartSession,
  stopSession as apiStopSession,
  pauseSession as apiPauseSession,
  resumeSession as apiResumeSession,
  setSessionMode as apiSetSessionMode,
  acknowledgeAlert as apiAcknowledgeAlert,
  simulateAIEvent as apiSimulateAIEvent,
  sendAudioTelemetry
} from "../api/api";

export interface ParliamentContextType {
  telemetry: SessionTelemetry | null;
  members: Member[];
  refreshMembers: () => Promise<void>;
  currentTab: "speaker" | "member" | "admin";
  setCurrentTab: (tab: "speaker" | "member" | "admin") => void;
  currentUser: UserSession | null;
  activeView: "login" | "register" | "dashboard";
  setActiveView: (view: "login" | "register" | "dashboard") => void;
  login: (role: "admin" | "speaker" | "member", memberId?: string, displayName?: string) => void;
  logout: () => void;
  navigateToRegister: () => void;
  navigateToLogin: () => void;
  selectedMemberId: string;
  setSelectedMemberId: (id: string) => void;
  activeScorecard: MemberScorecard | null;
  isScorecardOpen: boolean;
  openScorecard: (memberId: string) => Promise<void>;
  closeScorecard: () => void;
  activeReport: SessionReport | null;
  isReportOpen: boolean;
  openReport: () => Promise<void>;
  closeReport: () => void;
  isEndingSession: boolean;
  endSessionAndGenerateReport: () => Promise<void>;
  triggerEmergency: (source?: string) => Promise<void>;
  resetEmergency: () => Promise<void>;
  switchSpeaker: (memberId: string) => Promise<void>;
  raiseHand: () => Promise<boolean>;
  withdrawHand: () => Promise<void>;
  rejectFloorRequest: (memberId: string) => Promise<void>;
  releaseFloor: () => Promise<void>;
  startSession: () => Promise<void>;
  toggleSession: (start: boolean) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  switchMode: (mode: "LIVE" | "DEMO") => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  simulateEvent: (eventType: string) => Promise<void>;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isWebcamActive: boolean;
  setIsWebcamActive: (active: boolean) => void;
  isMicActive: boolean;
  setIsMicActive: (active: boolean) => void;
  liveMicDb: number;
  interimTranscript: string;
}

export const ParliamentContext = createContext<ParliamentContextType | undefined>(undefined);

export function ParliamentProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [telemetry, setTelemetry] = useState<SessionTelemetry | null>(null);
  const [members, setMembers] = useState<Member[]>([]);

  // Authentication & Role Session
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get("role") as "admin" | "speaker" | "member" | null;
    const id = params.get("id");
    if (role && (role === "admin" || role === "speaker" || role === "member")) {
      return {
        role,
        memberId: id || (role === "member" ? "M001" : undefined),
        loginTime: new Date().toLocaleTimeString()
      };
    }
    try {
      const saved = sessionStorage.getItem("parlisense_auth_user") || localStorage.getItem("parlisense_auth_user");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return null;
  });

  const [activeView, setActiveView] = useState<"login" | "register" | "dashboard">(() => {
    if (window.location.pathname === "/register" || window.location.hash === "#register") return "register";
    return currentUser ? "dashboard" : "login";
  });

  const [currentTab, setCurrentTab] = useState<"speaker" | "member" | "admin">(() => {
    return currentUser?.role || "speaker";
  });

  const [selectedMemberId, setSelectedMemberId] = useState<string>(() => {
    return currentUser?.memberId || "M001";
  });
  const [activeScorecard, setActiveScorecard] = useState<MemberScorecard | null>(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<SessionReport | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [liveMicDb, setLiveMicDb] = useState<number>(52.4);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isEndingSession, setIsEndingSession] = useState(false);

  // Tracks mic intent so the Web Speech API restart logic survives stale closures
  const micActiveRef = useRef(isMicActive);
  micActiveRef.current = isMicActive;
  // Tracks the floor member so recognition is NOT torn down/restarted whenever
  // a scorecard selects a different member mid-speech.
  const selectedMemberIdRef = useRef(selectedMemberId);
  selectedMemberIdRef.current = selectedMemberId;

  const refreshMembers = async () => {
    try {
      const res = await fetchMembers();
      const list = res?.members ?? (Array.isArray(res) ? res : []);
      setMembers(list);
    } catch (err) {
      console.error("Failed to refresh members:", err);
    }
  };

  useEffect(() => {
    refreshMembers();

    const unsubscribe = subscribeToSessionStream((data) => {
      setTelemetry(data);
    });

    return () => unsubscribe();
  }, []);

  // Real-time microphone: dB analyser + Web Speech API STT
  useEffect(() => {
    if (!isMicActive) return;

    let audioContext: AudioContext | null = null;
    let micStream: MediaStream | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    let recognition: any = null;
    let recognitionRunning = false;
    let restartTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const startRecognition = () => {
      if (cancelled || recognitionRunning || !recognition) return;
      try {
        recognition.start();
        recognitionRunning = true;
      } catch (_) {
        recognitionRunning = false;
      }
    };

    const stopRecognition = () => {
      if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
      }
      if (recognition) {
        recognitionRunning = false;
        try { recognition.stop(); } catch (_) {}
      }
    };

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Guard against cancellation races: if the effect cleaned up while
        // the permission prompt was open, drop the stream immediately.
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        micStream = stream;
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        intervalId = setInterval(() => {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          // Calculate realistic acoustic decibels (42 dB ambient up to 96 dB for loud voice)
          const decibels = Math.round((42 + (avg / 128) * 46) * 10) / 10;
          setLiveMicDb(decibels);
          sendAudioTelemetry(decibels, undefined, selectedMemberIdRef.current).catch(() => {});
        }, 300);

        if (SpeechRecognitionAPI) {
          recognition = new SpeechRecognitionAPI();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = "en-IN";
          recognition.maxAlternatives = 1;

          recognition.onresult = (event: any) => {
            let interim = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
              const text = event.results[i][0].transcript.trim();
              if (event.results[i].isFinal) {
                if (text.length > 3) {
                  sendAudioTelemetry(0, text, selectedMemberIdRef.current).catch(() => {});
                }
              } else interim += text;
            }
            if (!cancelled) setInterimTranscript(interim);
          };

          recognition.onerror = (e: any) => {
            recognitionRunning = false;
            if (e.error !== "aborted" && e.error !== "not-allowed" && !cancelled) {
              if (restartTimer) clearTimeout(restartTimer);
              restartTimer = setTimeout(startRecognition, 350);
            }
          };

          recognition.onend = () => {
            recognitionRunning = false;
            if (!cancelled && micActiveRef.current) {
              if (restartTimer) clearTimeout(restartTimer);
              restartTimer = setTimeout(startRecognition, 350);
            }
          };

          startRecognition();
        } else {
          console.warn("Web Speech API not supported in this browser. Chrome recommended.");
        }
      })
      .catch((err) => {
        console.warn("Microphone access not granted:", err);
        if (!cancelled) setIsMicActive(false);
      });

    return () => {
      cancelled = true;
      setInterimTranscript("");
      stopRecognition();
      if (intervalId) clearInterval(intervalId);
      if (micStream) micStream.getTracks().forEach((t) => t.stop());
      if (audioContext) audioContext.close();
    };
  }, [isMicActive]);

  const openScorecard = async (memberId: string) => {
    try {
      const card = await fetchMemberScorecard(memberId);
      setActiveScorecard(card);
      setSelectedMemberId(memberId);
      setIsScorecardOpen(true);
    } catch (err) {
      console.error("Failed to load scorecard:", err);
    }
  };

  const closeScorecard = () => {
    setIsScorecardOpen(false);
  };

  const openReport = async () => {
    try {
      const rep = await fetchSessionReport();
      setActiveReport(rep);
      setIsReportOpen(true);
    } catch (err) {
      console.error("Failed to load session report:", err);
    }
  };

  const closeReport = () => {
    setIsReportOpen(false);
  };

  const endSessionAndGenerateReport = async () => {
    setIsEndingSession(true);
    // Instant optimistic update across all local components & tabs
    setTelemetry((prev) => (prev ? { ...prev, is_active: false, is_paused: false } : null));
    setIsMicActive(false);

    try {
      await apiStopSession();
    } catch (err) {
      console.warn("API stopSession warning:", err);
    }

    try {
      const rep = await fetchSessionReport();
      setActiveReport(rep);
      setIsReportOpen(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d97706", "#f59e0b", "#10b981", "#3b82f6"]
        });
      } catch (_) {}
    } catch (err) {
      console.error("Failed to generate session report:", err);
    } finally {
      setIsEndingSession(false);
    }
  };

  const triggerEmergency = async (source?: string) => {
    try {
      await apiTriggerEmergency(source);
    } catch (err) {
      console.error("Failed to trigger emergency:", err);
    }
  };

  const resetEmergency = async () => {
    try {
      await apiResetEmergency();
    } catch (err) {
      console.error("Failed to reset emergency:", err);
    }
  };

  const switchSpeaker = async (memberId: string) => {
    try {
      await apiSetActiveSpeaker(memberId);
    } catch (err) {
      console.error("Failed to switch speaker:", err);
    }
  };

  const raiseHand = async (): Promise<boolean> => {
    try {
      await apiRaiseHand();
      return true;
    } catch (err) {
      console.error("Failed to raise hand:", err);
      return false;
    }
  };

  const withdrawHand = async () => {
    try {
      await apiWithdrawHand();
    } catch (err) {
      console.error("Failed to withdraw hand:", err);
    }
  };

  const rejectFloorRequest = async (memberId: string) => {
    try {
      await apiRejectFloorRequest(memberId);
    } catch (err) {
      console.error("Failed to decline request:", err);
    }
  };

  const releaseFloor = async () => {
    try {
      await apiReleaseFloor();
    } catch (err) {
      console.error("Failed to release floor:", err);
    }
  };

  const pauseSession = async () => {
    try {
      await apiPauseSession();
    } catch (err) {
      console.error("Failed to pause session:", err);
    }
  };

  const resumeSession = async () => {
    try {
      await apiResumeSession();
    } catch (err) {
      console.error("Failed to resume session:", err);
    }
  };

  const startSession = async () => {
    try {
      await apiStartSession();
      setTelemetry((prev) => prev ? {
        ...prev,
        is_active: true,
        is_paused: false,
        active_speaker: undefined,
        speaking_duration_seconds: 0,
        member_speaking_seconds: {}
      } : prev);
    } catch (err) {
      console.error("Failed to start session:", err);
      throw err;
    }
  };

  const toggleSession = async (start: boolean) => {
    try {
      if (!start) {
        await pauseSession();
      } else if (!telemetry?.is_active) {
        // Fresh launch: use the live start endpoint instead of the resume
        // endpoint (which expects an already-active, paused session).
        await startSession();
      } else {
        await resumeSession();
      }
    } catch (err) {
      console.error("Failed to toggle session:", err);
    }
  };

  const switchMode = async (mode: "LIVE" | "DEMO") => {
    try {
      await apiSetSessionMode(mode);
    } catch (err) {
      console.error("Failed to switch mode:", err);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await apiAcknowledgeAlert(alertId);
    } catch (err) {
      console.error("Failed to acknowledge alert:", err);
    }
  };

  const simulateEvent = async (eventType: string) => {
    try {
      await apiSimulateAIEvent(eventType);
    } catch (err) {
      console.error("Failed to simulate event:", err);
    }
  };

  const login = (role: "admin" | "speaker" | "member", memberId?: string, displayName?: string) => {
    const resolvedMemberId = memberId || (role === "speaker"
      ? members.find((member) => member.role?.toLowerCase() === "speaker")?.member_id
      : role === "member" ? (members[0]?.member_id || "M001") : undefined);
    const mem = resolvedMemberId ? members.find((m) => m.member_id === resolvedMemberId) : undefined;
    const session: UserSession = {
      role,
      memberId: resolvedMemberId,
      memberName: mem?.name || displayName || (role === "admin" ? "Parliament Administrator" : undefined),
      seatId: mem?.seat_id,
      loginTime: new Date().toLocaleTimeString()
    };
    setCurrentUser(session);
    try {
      sessionStorage.setItem("parlisense_auth_user", JSON.stringify(session));
    } catch (_) {}
    if (session.memberId) {
      setSelectedMemberId(session.memberId);
    }
    setCurrentTab(role);
    setActiveView("dashboard");
    navigate("/dashboard");
  };

  const logout = () => {
    sessionStorage.removeItem("parlisense_token");
    setCurrentUser(null);
    try {
      localStorage.removeItem("parlisense_auth_user");
      sessionStorage.removeItem("parlisense_auth_user");
    } catch (_) {}
    window.history.replaceState({}, "", window.location.pathname);
    setActiveView("login");
    navigate("/login");
  };

  const navigateToRegister = () => {
    setActiveView("register");
    navigate("/register");
  };

  const navigateToLogin = () => {
    setActiveView("login");
    navigate("/login");
  };

  useEffect(() => {
    if (currentUser?.role === "member" && currentUser.memberId) {
      const m = members.find((x) => x.member_id === currentUser.memberId);
      if (m && (!currentUser.memberName || !currentUser.seatId)) {
        setCurrentUser((prev) => prev ? ({ ...prev, memberName: m.name, seatId: m.seat_id }) : null);
      }
    }
  }, [members, currentUser]);

  // Synchronize router location with activeView and currentTab
  useEffect(() => {
    if (location.pathname === "/register") {
      setActiveView("register");
    } else if (location.pathname === "/login") {
      setActiveView("login");
    } else if (location.pathname === "/speaker") {
      setCurrentTab("speaker");
      setActiveView("dashboard");
    } else if (location.pathname.startsWith("/member")) {
      setCurrentTab("member");
      setActiveView("dashboard");
    } else if (location.pathname === "/admin") {
      setCurrentTab("admin");
      setActiveView("dashboard");
    } else if (location.pathname === "/dashboard" || location.pathname === "/") {
      setActiveView("dashboard");
    }
  }, [location.pathname]);

  return (
    <ParliamentContext.Provider
      value={{
        telemetry,
        members,
        refreshMembers,
        currentTab,
        setCurrentTab,
        currentUser,
        activeView,
        setActiveView,
        login,
        logout,
        navigateToRegister,
        navigateToLogin,
        selectedMemberId,
        setSelectedMemberId,
        activeScorecard,
        isScorecardOpen,
        openScorecard,
        closeScorecard,
        activeReport,
        isReportOpen,
        openReport,
        closeReport,
        isEndingSession,
        endSessionAndGenerateReport,
        triggerEmergency,
        resetEmergency,
        switchSpeaker,
        raiseHand,
        withdrawHand,
        rejectFloorRequest,
        releaseFloor,
        startSession,
        toggleSession,
        pauseSession,
        resumeSession,
        switchMode,
        acknowledgeAlert,
        simulateEvent,
        isMuted,
        setIsMuted,
        isWebcamActive,
        setIsWebcamActive,
        isMicActive,
        setIsMicActive,
        liveMicDb,
        interimTranscript
      }}
    >
      {children}
    </ParliamentContext.Provider>
  );
}

export function useParliament() {
  const context = useContext(ParliamentContext);
  if (!context) {
    throw new Error("useParliament must be used within a ParliamentProvider");
  }
  return context;
}
