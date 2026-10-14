import React from 'react';
import { Member, MemberScorecard } from '../../../../shared/types';
import { MemberSelfCamera } from '../MemberSelfCamera';
import { Button } from '../../../../components/common/Button';
import { ShieldAlert, LogOut } from 'lucide-react';

interface SuspensionFullscreenViewProps {
  currentMember: Member;
  scorecard: MemberScorecard | null;
  onLogout: () => void;
}

export const SuspensionFullscreenView: React.FC<SuspensionFullscreenViewProps> = ({
  currentMember,
  scorecard,
  onLogout
}) => {
  const violationCount =
    (scorecard?.statistics?.time_violations || 0) +
    (scorecard?.statistics?.seat_violations || 0) +
    (scorecard?.statistics?.interruptions || 0) +
    (scorecard?.statistics?.offensive_incidents || 0) || 3;

  return (
    <div
      id="suspension-fullscreen-mode"
      className="fixed inset-0 bg-slate-950 z-50 flex flex-col items-center justify-center p-6 text-center select-none overflow-hidden"
    >
      <div className="max-w-2xl w-full border-4 border-red-600 rounded-3xl bg-red-950/50 p-8 sm:p-12 shadow-[0_0_80px_rgba(239,68,68,0.35)] backdrop-blur-md flex flex-col items-center">
        <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 animate-bounce mb-3" />

        <div className="font-mono text-xs sm:text-sm text-red-400/80 mb-1 tracking-widest">
          ================================
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-red-500 tracking-tight leading-none mb-1 animate-pulse">
          YOU ARE SUSPENDED
        </h1>
        <h2 className="text-lg sm:text-2xl font-bold text-red-300 tracking-wide uppercase mb-2">
          EXIT THE CHAMBER
        </h2>
        <div className="font-mono text-xs sm:text-sm text-red-400/80 mb-5 tracking-widest">
          ================================
        </div>

        <div className="bg-slate-900/90 border border-red-500/40 rounded-2xl p-4 sm:p-5 w-full space-y-2 text-left mb-5 font-mono text-xs sm:text-sm text-slate-200">
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span className="text-slate-400">Member:</span>
            <span className="font-bold text-amber-400">
              {currentMember.member_id} - {currentMember.name}
            </span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span className="text-slate-400">Seat:</span>
            <span className="font-bold text-sky-400">{currentMember.seat_id}</span>
          </div>
          <div className="flex justify-between border-b border-slate-800 pb-1">
            <span className="text-slate-400">Violation Count:</span>
            <span className="font-bold text-rose-400">{violationCount}</span>
          </div>
          <div className="pt-2 text-center text-xs text-rose-300 font-sans leading-relaxed">
            Your participation in the current session has been suspended.
            <br />
            Please leave the chamber under Rule 374.
          </div>
        </div>

        <div className="font-mono text-xs sm:text-sm text-red-400/80 mb-5 tracking-widest">
          ================================
        </div>

        <p className="text-xs text-slate-400 max-w-lg mb-5">
          Microphone line{" "}
          <strong className="text-rose-400">
            {currentMember.mic_id || `MIC-${currentMember.seat_id}`}
          </strong>{" "}
          has been permanently deactivated. Parliamentary Marshals have been notified of this enforcement.
        </p>

        <Button
          variant="danger"
          size="lg"
          onClick={onLogout}
          icon={<LogOut className="w-4 h-4" />}
          className="rounded-2xl border-2 border-red-400 shadow-2xl px-6 py-3"
        >
          ACKNOWLEDGE & LEAVE TERMINAL
        </Button>
      </div>

      {/* Exit Proctoring Corner Camera Feed */}
      <div className="fixed bottom-6 right-6 w-72 sm:w-80 h-48 sm:h-56 rounded-2xl border-2 border-red-500 bg-slate-950 p-2 shadow-2xl flex flex-col z-50 hidden md:flex">
        <div className="flex items-center justify-between text-[10px] text-red-400 font-bold mb-1">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            EXIT PROCTORING FEED
          </span>
          <span className="font-mono">{currentMember.camera_id || `CAM-${currentMember.seat_id}`}</span>
        </div>
        <div className="flex-1 min-h-0 rounded overflow-hidden">
          <MemberSelfCamera
            memberId={currentMember.member_id}
            seatId={currentMember.seat_id}
            micId={currentMember.mic_id || `MIC-${currentMember.seat_id}`}
            memberName={currentMember.name}
          />
        </div>
      </div>
    </div>
  );
};
