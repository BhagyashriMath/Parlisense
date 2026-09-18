import React, { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { useParliament } from "../infrastructure/context/ParliamentContext";
import { Header } from "../shared/components/Header";
import { ScorecardModal, SessionReportModal } from "../features/scorecard";
import { playChamberAlertChime } from "../shared/utils/sound";

interface MainLayoutProps {
  children?: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { telemetry, isMuted } = useParliament();
  const prevAlertCount = useRef(0);

  // Play subtle acoustic chime on critical alert if audio is unmuted
  useEffect(() => {
    const alerts = telemetry?.recent_alerts || [];
    if (alerts.length > prevAlertCount.current) {
      const latest = alerts[0];
      if (!isMuted && (latest.severity === "CRITICAL" || latest.severity === "HIGH")) {
        playChamberAlertChime(latest.severity === "CRITICAL" ? "CRITICAL" : "HIGH");
      }
    }
    prevAlertCount.current = alerts.length;
  }, [telemetry?.recent_alerts, isMuted]);

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full max-w-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      <Header />

      <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden flex flex-col">
        {children || <Outlet />}
      </main>

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
