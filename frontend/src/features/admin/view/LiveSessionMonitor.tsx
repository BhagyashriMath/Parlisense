import React, { useState } from "react";
import { useParliament } from "../../../infrastructure/context/ParliamentContext";
import { LiveSessionSummary } from "../../chamber-monitoring/view/LiveSessionSummary";
import { SimulationControls } from "../../chamber-monitoring/view/SimulationControls";
import {
  FileText,
  Cpu,
  CheckCircle2,
  Flag,
  Radio,
  Volume2,
  AlertTriangle,
  Flame,
  Shield,
  Activity,
  Layers,
  Sparkles,
  LayoutGrid,
  Mic,
  Clock,
  Compass,
  Eye,
} from "lucide-react";

interface LiveSessionMonitorProps {
  onEndSession: () => void;
  onOpenReport: () => void;
}

export function LiveSessionMonitor({ onEndSession, onOpenReport }: LiveSessionMonitorProps) {
  const { telemetry } = useParliament();
  const [activeRightTab, setActiveRightTab] = useState<"STT" | "SUMMARY">("STT");

  const aiModules = telemetry?.ai_modules_health || {
    speech_recognition: "ACTIVE",
    nlp_agenda_analysis: "ACTIVE",
    emotion_detection: "ACTIVE",
    offensive_detection: "ACTIVE",
    computer_vision: "ACTIVE",
    noise_analysis: "ACTIVE",
    rule_engine: "ACTIVE",
    database_storage: "ACTIVE"
  };

  const activeSpeaker = telemetry?.active_speaker;
  const activeSpeakerLabel = activeSpeaker?.name || "No active speaker";
  const aiOutput = telemetry?.ai_output;
  const recentAlerts = telemetry?.recent_alerts || [];
  const activeAlerts = recentAlerts.filter((alert) => alert.status === "ACTIVE");

  return (
    <div id="live-session-monitor-view" className="h-full flex-1 min-h-0 flex flex-col gap-1.5 overflow-y-auto lg:overflow-hidden text-slate-200">
      
      {/* Top Administration Metrics Header */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 flex-shrink-0">
        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-semibold">Session Status</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5 truncate flex items-center gap-1">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> LIVE ACTIVE
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold">Session Runtime</span>
          <div className="text-sm font-black text-slate-100 font-mono mt-0.5">
            {telemetry?.session_duration_formatted || "00:00:00"}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold">Floor Speaker</span>
          <div className="text-xs font-bold text-amber-300 truncate mt-0.5">
            {activeSpeakerLabel}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold">Acoustic Noise</span>
          <div className="text-xs font-black text-blue-400 font-mono mt-0.5 flex items-center gap-1">
            <Volume2 className="w-3 h-3 text-blue-400" />
            {aiOutput?.noise_level ? `${aiOutput.noise_level} dB` : "52 dB"}
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-slate-400 text-[10px] font-semibold">Decorum Rating</span>
          <div className="text-sm font-black text-emerald-400 font-mono mt-0.5">
            94.2% Order
          </div>
        </div>

        <div className="p-1 rounded-lg bg-slate-900 border border-slate-800 shadow-sm flex items-center col-span-2 sm:col-span-1">
          <button
            id="admin-live-end-session-btn"
            onClick={onEndSession}
            className="w-full h-full py-1.5 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
            title="Conclude live sitting and transition to post-session summary"
          >
            <Flag className="w-3.5 h-3.5" />
            <span>End Session & View Summary</span>
          </button>
        </div>
      </div>

      {/* AI Subsystems Health Status Radar */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 p-1.5 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <h3 className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
              AI Pipelines & Real-Time Sensors Status
            </h3>
          </div>
          <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono font-bold flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" /> 8 PIPELINES ONLINE & SYNCHRONIZED
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 text-xs">
          {Object.entries(aiModules).map(([modName, status]) => (
            <div key={modName} className="p-1 rounded bg-slate-950/80 border border-slate-800/90 text-center">
              <div className="text-[9px] text-slate-400 capitalize truncate leading-none mb-0.5">
                {modName.replace(/_/g, " ")}
              </div>
              <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/80 leading-none inline-block">
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Middle Section: AI Monitoring Data + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1.5 flex-1 min-h-0">
        
        {/* Left Column (6 Cols): Live AI Monitoring Data */}
        <div className="lg:col-span-6 flex flex-col min-h-0 gap-1.5">

          {/* Active speaker detail card */}
          <div className="flex-shrink-0 bg-slate-900 rounded-lg border border-emerald-500/30 px-3 py-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Current Floor Speaker</span>
              <span className="ml-auto text-[9px] font-mono text-emerald-400 bg-emerald-950/50 px-1.5 py-0.2 rounded border border-emerald-500/30">
                {activeSpeaker ? `${activeSpeaker.seat_id || "—"} · ${activeSpeaker.mic_id || `MIC-${activeSpeaker.seat_id || "—"}`}` : "No floor assignment"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Name</p>
                <p className="text-[11px] font-bold text-slate-100 truncate">{activeSpeaker?.name || "No active speaker"}</p>
              </div>
              <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Role</p>
                <p className="text-[10px] font-semibold text-amber-400 truncate">{activeSpeaker?.role?.split(" ").slice(0, 2).join(" ") || "—"}</p>
              </div>
              <div className="bg-slate-950/70 rounded-lg border border-slate-800 p-2">
                <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-0.5">Party</p>
                <p className="text-[10px] font-semibold text-slate-300 truncate">{activeSpeaker?.party || "—"}</p>
              </div>
            </div>
          </div>

          {/* Live AI metrics grid */}
          <div className="flex-1 min-h-0 bg-slate-900 rounded-lg border border-slate-800 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-slate-800 flex-shrink-0">
              <Eye className="w-3 h-3 text-sky-400" />
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Live AI Detection Readings</span>
              <span className="ml-auto text-[8px] font-mono text-emerald-400">Real-time</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-2 grid grid-cols-2 gap-2 content-start">
              {/* Speaking time */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <Clock className="w-2.5 h-2.5 text-amber-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Floor Time</span>
                </div>
                <p className="text-base font-black font-mono text-amber-400">
                  {Math.floor((telemetry?.speaking_duration_seconds || 0) / 60)}:{String((telemetry?.speaking_duration_seconds || 0) % 60).padStart(2, "0")}
                </p>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${Math.min(100, ((telemetry?.member_speaking_seconds?.[activeSpeaker?.member_id || ""] ?? telemetry?.speaking_duration_seconds ?? 0) / (activeSpeaker?.allocated_time_seconds || 300)) * 100)}%` }} />
                </div>
              </div>
              {/* Agenda relevance */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <Compass className="w-2.5 h-2.5 text-sky-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Agenda Match</span>
                </div>
                <p className="text-base font-black font-mono text-sky-400">{aiOutput?.agenda_relevance_percentage || 85}%</p>
                <p className="text-[8px] text-slate-500 truncate mt-0.5">{aiOutput?.agenda_status || "On Topic"}</p>
              </div>
              {/* Emotion */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <Activity className="w-2.5 h-2.5 text-purple-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Sentiment</span>
                </div>
                <p className={`text-sm font-black ${aiOutput?.emotion === "Angry" || aiOutput?.emotion === "Heated" ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                  {aiOutput?.emotion || "Neutral"}
                </p>
              </div>
              {/* Noise */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <Volume2 className="w-2.5 h-2.5 text-blue-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Noise Level</span>
                </div>
                <p className={`text-base font-black font-mono ${(aiOutput?.noise_level || 0) > 80 ? "text-rose-400" : "text-blue-400"}`}>
                  {(aiOutput?.noise_level || 52).toFixed(1)} dB
                </p>
                <p className="text-[8px] text-slate-500 mt-0.5">{aiOutput?.noise_category || "Normal Noise"}</p>
              </div>
              {/* Disruption */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-2.5 h-2.5 text-orange-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Disruption</span>
                </div>
                <p className={`text-sm font-black ${aiOutput?.disruption_level === "Severe" ? "text-rose-400" : aiOutput?.disruption_level === "Moderate" ? "text-amber-400" : "text-emerald-400"}`}>
                  {aiOutput?.disruption_level || "Low"}
                </p>
              </div>
              {/* Seat status */}
              <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1">
                  <Shield className="w-2.5 h-2.5 text-emerald-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Seat Status</span>
                </div>
                <p className={`text-sm font-black ${aiOutput?.seat_status?.includes("Well") || aiOutput?.seat_status?.includes("Moved") ? "text-rose-400" : "text-emerald-400"}`}>
                  {aiOutput?.seat_status || "Seated"}
                </p>
              </div>
              {/* Recent alerts count */}
              <div className="col-span-2 bg-slate-950/80 rounded-lg border border-slate-800 p-2.5">
                <div className="flex items-center gap-1 mb-1.5">
                  <Flame className="w-2.5 h-2.5 text-rose-400" />
                  <span className="text-[8px] text-slate-500 uppercase tracking-wider font-semibold">Recent Alerts</span>
                  <span className="ml-auto text-[9px] font-mono font-bold text-rose-400">{activeAlerts.length} active</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {activeAlerts.slice(0, 4).map((a) => (
                    <span key={a.alert_id} className={`text-[8px] px-1.5 py-0.5 rounded border font-semibold ${
                      a.severity === "CRITICAL" ? "bg-rose-950/50 text-rose-300 border-rose-500/40" :
                      a.severity === "HIGH" ? "bg-orange-950/50 text-orange-300 border-orange-500/40" :
                      a.severity === "MEDIUM" ? "bg-amber-950/50 text-amber-300 border-amber-500/40" :
                      "bg-sky-950/50 text-sky-300 border-sky-500/40"
                    }`}>
                      {a.type.replace(/_/g, " ")}
                    </span>
                  ))}
                  {activeAlerts.length === 0 && <span className="text-[9px] text-slate-500">No active alerts</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (6 Cols): Live Speech-to-Text / National Summary / Seat Map */}
        <div className="lg:col-span-6 flex flex-col min-h-[380px] lg:min-h-0 h-full bg-slate-900 rounded-lg border border-slate-800 p-2 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto">
              <button
                id="tab-admin-stt"
                onClick={() => setActiveRightTab("STT")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  activeRightTab === "STT"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Radio className="w-3 h-3 text-amber-300 animate-pulse" />
                <span>Live Speech-to-Text</span>
              </button>

              <button
                onClick={() => setActiveRightTab("SUMMARY")}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  activeRightTab === "SUMMARY"
                    ? "bg-amber-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>National Summary</span>
              </button>
            </div>

            <span className="text-[9px] font-mono text-emerald-400 hidden sm:inline">Continuous AI Analysis</span>
          </div>

          <div className="flex-1 min-h-0 flex flex-col mt-1 overflow-hidden">
            {activeRightTab === "STT" ? (
              <LiveSessionSummary className="flex-1 border-0 bg-transparent p-0" defaultExpanded={true} initialTab="stt" />
            ) : (
              <LiveSessionSummary className="flex-1 border-0 bg-transparent p-0" defaultExpanded={true} initialTab="ideas" />
            )}
          </div>
        </div>

      </div>

      {/* AI Simulator & Floor Controls */}
      <div className="flex-shrink-0">
        <SimulationControls />
      </div>

    </div>
  );
}
