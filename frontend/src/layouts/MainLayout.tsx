import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { useParliament } from "../infrastructure/context/ParliamentContext";
import { Header } from "../shared/components/Header";
import { ScorecardModal, SessionReportModal } from "../features/scorecard";
import { getAudioContext, unlockChamberAudio } from "../shared/utils/chamberAudio";
import { Volume2 } from "lucide-react";

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [audioNeedsUnlock, setAudioNeedsUnlock] = useState(false);

  useEffect(() => {
    const checkAudioState = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        setAudioNeedsUnlock(true);
      } else {
        setAudioNeedsUnlock(false);
      }
    };

    checkAudioState();
    const interval = setInterval(checkAudioState, 2000);

    const onUserInteraction = () => {
      unlockChamberAudio();
      setTimeout(checkAudioState, 150);
    };

    window.addEventListener("click", onUserInteraction, { passive: true });
    window.addEventListener("keydown", onUserInteraction, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("click", onUserInteraction);
      window.removeEventListener("keydown", onUserInteraction);
    };
  }, []);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black relative">
      <Header />

      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col">
        {children || <Outlet />}
      </main>

      {/* Floating Prompt if Browser Autoplay Policy has Suspended Chamber Audio */}
      {audioNeedsUnlock && (
        <button
          id="enable-chamber-audio-floating-btn"
          onClick={() => {
            unlockChamberAudio(true);
            setAudioNeedsUnlock(false);
          }}
          className="fixed bottom-9 right-4 z-50 flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-3.5 py-1.5 rounded-full shadow-2xl border-2 border-amber-300 text-xs cursor-pointer transition-transform hover:scale-105 animate-pulse"
          title="Click to enable live speech audio and alert chimes"
        >
          <Volume2 className="w-4 h-4 text-slate-950 flex-shrink-0" />
          <span>Click to Enable Chamber Audio</span>
        </button>
      )}

      {/* Chamber Modals */}
      <ScorecardModal />
      <SessionReportModal />

      {/* Sleek single-line status footer */}
      <footer className="h-6 sm:h-7 bg-slate-950/95 border-t border-slate-800/80 px-2 sm:px-4 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-500 font-mono flex-shrink-0">
        <span className="truncate mr-2">AI Parliamentary Decision-Support System • YOLO • Whisper • Decorum</span>
        <span className="hidden md:inline flex-shrink-0">Telemetry Active • 30 FPS • Low Latency</span>
      </footer>
    </div>
  );
}

export default MainLayout;
