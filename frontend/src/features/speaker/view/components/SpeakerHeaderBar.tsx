import React from 'react';
import { Mic, Flag, Volume2, ShieldAlert, FileText, Play, Pause, Calendar, User } from 'lucide-react';
import { SessionTelemetry } from '../../../../shared/types';
import { Button } from '../../../../components/common/Button';

interface SpeakerHeaderBarProps {
  activeSpeaker: SessionTelemetry["active_speaker"] | undefined;
  speakingTime: number;
  timeRemaining: number;
  timePercent: number;
  isTimeOver: boolean;
  relevancePct: number;
  noiseLevel: number;
  totalViolations: number;
  sessionActive?: boolean;
  isPaused?: boolean;
  isEndingSession?: boolean;
  isStartingSession?: boolean;
  onOpenReport?: () => void;
  onEndSession: () => void;
  onStartSession?: () => void;
  onTogglePause?: () => void;
  onOpenSchedule?: () => void;
}

export const SpeakerHeaderBar: React.FC<SpeakerHeaderBarProps> = ({
  activeSpeaker,
  speakingTime,
  timePercent,
  isTimeOver,
  relevancePct,
  noiseLevel,
  totalViolations,
  sessionActive = true,
  isPaused = false,
  isEndingSession = false,
  isStartingSession = false,
  onOpenReport,
  onEndSession,
  onStartSession,
  onTogglePause,
  onOpenSchedule
}) => {
  return (
    <div className="flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 shadow-sm flex items-stretch gap-0 flex-col md:flex-row overflow-hidden">
      {/* Presiding Officer Identity */}
      <div className="flex items-center justify-between sm:justify-start gap-3 px-3.5 py-2 sm:py-2.5 bg-gradient-to-br from-amber-950/40 to-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex-shrink-0 w-full md:w-auto md:min-w-[190px] lg:min-w-[210px]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-800 border-2 border-amber-400/40 flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md">
            <User className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <p className="text-[9px] text-amber-400 font-semibold uppercase tracking-wider">Presiding Officer</p>
            <p className="text-sm font-black text-slate-100 leading-tight">Hon. Speaker</p>
            <p className="text-[9px] text-slate-400 hidden sm:block">Pro-Tem Authority Console</p>
          </div>
        </div>
      </div>

      {/* Live Telemetry KPI Cards */}
      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-800">
        {/* Floor Speaker */}
        <div className="bg-slate-900 px-2.5 sm:px-3 py-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 uppercase font-semibold">Floor Speaker</span>
          <div className="flex items-center gap-1 mt-0.5 min-w-0">
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-0.5 flex-shrink-0 font-mono">
              <Mic className="w-2.5 h-2.5 animate-pulse" /> {activeSpeaker?.seat_id || "—"}
            </span>
            <span className="text-xs font-bold text-slate-100 truncate">{activeSpeaker?.name || "—"}</span>
          </div>
          <p className="text-[9px] text-slate-500 truncate">
            {activeSpeaker?.role?.split(" ")[0] || "MP"} · {activeSpeaker?.party || "NDF"}
          </p>
        </div>

        {/* Speaking Time */}
        <div className="bg-slate-900 px-2.5 sm:px-3 py-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 uppercase font-semibold">Floor Time</span>
          <span
            className={`text-sm font-black font-mono ${
              isTimeOver ? "text-rose-400 animate-pulse" : "text-slate-100"
            }`}
          >
            {Math.floor(speakingTime / 60)}:{String(speakingTime % 60).padStart(2, "0")}
          </span>
          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full rounded-full transition-all ${
                isTimeOver
                  ? "bg-rose-500"
                  : timePercent > 80
                  ? "bg-amber-400"
                  : "bg-emerald-400"
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
        </div>

        {/* AI Relevance */}
        <div className="bg-slate-900 px-2.5 sm:px-3 py-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 uppercase font-semibold">AI Relevance</span>
          <span
            className={`text-sm font-black font-mono ${
              relevancePct >= 70
                ? "text-emerald-400"
                : relevancePct >= 40
                ? "text-amber-400"
                : "text-rose-400"
            }`}
          >
            {relevancePct}%
          </span>
          <p className="text-[9px] text-slate-500">Bill Alignment</p>
        </div>

        {/* Acoustic Decibels */}
        <div className="bg-slate-900 px-2.5 sm:px-3 py-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 uppercase font-semibold">Acoustic Noise</span>
          <div className="flex items-center gap-1">
            <Volume2 className={`w-3.5 h-3.5 flex-shrink-0 ${noiseLevel > 0 ? "text-blue-400" : "text-slate-600"}`} />
            <span className="text-sm font-black text-slate-100 font-mono">{noiseLevel} dB</span>
          </div>
          <p className="text-[9px] text-slate-500">{noiseLevel > 78 ? "Above Normal" : noiseLevel > 0 ? "Chamber Calm" : "Silence / Idle"}</p>
        </div>

        {/* Infractions */}
        <div className="bg-slate-900 px-2.5 sm:px-3 py-2 flex flex-col justify-between">
          <span className="text-[9px] text-slate-500 uppercase font-semibold">Infractions</span>
          <div className="flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
            <span className="text-sm font-black font-mono text-orange-400">{totalViolations}</span>
          </div>
          <p className="text-[9px] text-slate-500">Auto Flagged</p>
        </div>

        {/* End Session or Pause/Resume or Start & Schedule Session Actions */}
        <div className="bg-slate-900 p-2 flex items-center gap-1.5 justify-center flex-wrap col-span-2 sm:col-span-1 lg:col-span-1">
          {sessionActive ? (
            <div className="flex items-center gap-1.5 w-full h-full">
              <Button
                id="speaker-pause-session-btn"
                variant={isPaused ? "gold" : "secondary"}
                size="sm"
                onClick={onTogglePause}
                icon={isPaused ? <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" /> : <Pause className="w-3 h-3 text-amber-400 fill-amber-400" />}
                className="flex-1 h-full cursor-pointer text-xs font-bold"
                title={isPaused ? "Resume paused sitting" : "Pause sitting without ending"}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
              <Button
                id="speaker-end-session-btn"
                variant="danger"
                size="sm"
                isLoading={isEndingSession}
                onClick={onEndSession}
                icon={<Flag className="w-3 h-3" />}
                className="flex-1 h-full shadow-rose-950/40 cursor-pointer text-xs font-bold"
                title="Conclude parliamentary sitting and generate final certified report"
              >
                {isEndingSession ? "Ending..." : "End"}
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap w-full justify-center">
              {onOpenReport && (
                <Button
                  id="speaker-report-btn"
                  variant="secondary"
                  size="sm"
                  onClick={onOpenReport}
                  icon={<FileText className="w-3.5 h-3.5 text-amber-400" />}
                  className="cursor-pointer text-xs flex-1 sm:flex-none"
                >
                  Report
                </Button>
              )}
              <Button
                id="speaker-schedule-btn"
                variant="gold"
                size="sm"
                onClick={onOpenSchedule}
                icon={<Calendar className="w-3.5 h-3.5" />}
                className="shadow-amber-950/40 cursor-pointer text-xs flex-1 sm:flex-none"
              >
                Schedule
              </Button>
              <Button
                id="speaker-start-session-btn"
                variant="primary"
                size="sm"
                isLoading={isStartingSession}
                onClick={onStartSession}
                icon={<Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
                className="shadow-emerald-950/40 cursor-pointer bg-emerald-600 hover:bg-emerald-500 border-emerald-500 text-white font-bold text-xs flex-1 sm:flex-none"
              >
                {isStartingSession ? "Calling..." : "Start"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>

  );
};
