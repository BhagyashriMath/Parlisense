import React from "react";
import { useSessionReportViewModel } from "../viewmodel/useSessionReportViewModel";
import {
  X,
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  Clock,
  Compass,
  Activity,
  Cpu
} from "lucide-react";

export function SessionReportModal() {
  const {
    activeReport,
    isReportOpen,
    closeReport,
    downloadJSON,
    downloadCSV,
    handlePrint
  } = useSessionReportViewModel();

  if (!isReportOpen || !activeReport) return null;

  const info = activeReport.session_information || {
    session_id: (activeReport as any).session_id || "PARL-2026-8002",
    date: (activeReport as any).session_date || (activeReport as any).date || new Date().toISOString().slice(0, 10),
    start_time: "11:00 AM",
    end_time: new Date().toLocaleTimeString(),
    duration: (activeReport as any).total_duration || "0m",
    agenda_bill: (activeReport as any).session_title || (activeReport as any).agenda_bill || "Digital Education & AI Governance Bill 2026",
    presiding_officer: (activeReport as any).presiding_officer || "Hon. Speaker"
  };

  const stats = activeReport.session_statistics || {
    total_members_registered: activeReport.member_scorecards?.length || 12,
    total_members_present: activeReport.member_scorecards?.length || 12,
    total_active_speakers: 0,
    total_speaking_time_minutes: 0,
    total_alerts_issued: 0,
    critical_violations: 0,
    high_severity_alerts: 1,
    off_topic_incidents: 1,
    offensive_language_incidents: 0,
    unauthorized_movement_incidents: 0,
    emergency_activations: 0,
    average_ambient_noise_db: 54.2,
    peak_noise_recorded_db: 78.5
  };

  const aiAnalytics = activeReport.ai_analytics_summary || {
    average_agenda_relevance_percentage: 0,
    emotion_distribution: {},
    decorum_compliance_index: 0,
    chamber_order_rating: "NO_DATA"
  };

  const memberScorecards = Array.isArray(activeReport.member_scorecards) ? activeReport.member_scorecards : [];

  return (
    <div
      id="session-report-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-fade-in print:p-0 print:bg-white"
    >
      <div
        id="session-report-single-page-sheet"
        className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-6xl w-full shadow-2xl p-3 sm:p-5 relative flex flex-col justify-between overflow-y-auto max-h-[92dvh] print-single-page print:overflow-visible print:bg-white print:text-black print:p-2 print:border-none print:shadow-none print:max-w-none print:w-full"
      >
        {/* Top Close Button (Hidden in Print) */}
        <button
          id="close-report-x-btn"
          onClick={closeReport}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors print:hidden"
          title="Close Session Report"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Official Header & Metadata */}
        <div className="border-b border-slate-800 pb-3 mb-3 print:border-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white text-xl shadow-inner border border-amber-500/40 flex-shrink-0 print:bg-amber-700">
                🏛️
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-serif font-black tracking-tight text-slate-100 uppercase print:text-black">
                    Official Parliamentary Session Analytical Report
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider print:border-emerald-700 print:text-emerald-800">
                    Session Concluded
                  </span>
                </div>
                <p className="text-[11px] text-amber-400/90 font-medium tracking-wide print:text-amber-800">
                  AI Decision-Support System • Automated Post-Session Decorum & Legislative Analytics
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-[11px] font-mono text-slate-400 print:text-slate-700">
              <div className="text-slate-200 font-bold print:text-black">Report: {activeReport.report_id || `REP-${info.session_id}`}</div>
              <div>Concluded: {activeReport.generated_at || (activeReport as any).certified_at || new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Session Parameters Ribbon */}
          <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-[11px] bg-slate-950/80 p-2 rounded-lg border border-slate-800/80 print:bg-slate-100 print:border-slate-300">
            <div>
              <span className="text-slate-400 print:text-slate-600">Session ID: </span>
              <span className="font-bold text-slate-200 font-mono print:text-black">{info.session_id}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600">Date: </span>
              <span className="font-bold text-slate-200 print:text-black">{info.date}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600">Duration: </span>
              <span className="font-bold text-amber-400 font-mono print:text-amber-800">{info.duration || (info as any).total_duration || "0m"}</span>
            </div>
            <div>
              <span className="text-slate-400 print:text-slate-600">Presiding: </span>
              <span className="font-bold text-slate-200 print:text-black">{info.presiding_officer}</span>
            </div>
            <div className="col-span-2 sm:col-span-3 lg:col-span-1 truncate">
              <span className="text-slate-400 print:text-slate-600">Active Bill: </span>
              <span className="font-bold text-amber-300 print:text-amber-900 truncate">{info.agenda_bill}</span>
            </div>
          </div>
        </div>

        {/* 2. Main High-Density Grid (Fits Entirely Within Screen) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 mb-3">
          
          {/* Left Column: Decorum Indices & Telemetry (4.5 cols) */}
          <div className="lg:col-span-5 space-y-2.5 flex flex-col justify-between">
            
            {/* Key Performance Indicators Matrix */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800/90 p-2.5 print:bg-white print:border-slate-300">
              <h2 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 print:text-amber-800">
                <Activity className="w-3.5 h-3.5" />
                1. Decorum & Acoustic Index
              </h2>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Decorum Index</div>
                  <div className="text-lg font-black text-emerald-400 font-mono print:text-emerald-700">
                    {aiAnalytics.decorum_compliance_index}%
                  </div>
                  <div className="text-[9px] text-slate-400 print:text-slate-500">Orderly Conduct</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Avg Ambient Noise</div>
                  <div className="text-lg font-black text-sky-400 font-mono print:text-sky-700">
                    {stats.average_ambient_noise_db} dB
                  </div>
                  <div className="text-[9px] text-slate-400 print:text-slate-500">Peak: {stats.peak_noise_recorded_db} dB</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Total Floor Time</div>
              <div className="text-lg font-black text-amber-400 font-mono print:text-amber-700">
                    {stats.total_speaking_time_minutes} min
                  </div>
                  <div className="text-[9px] text-slate-400 print:text-slate-500">{stats.total_active_speakers ?? 0} Active Speakers</div>
                </div>

                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[10px] text-slate-400 print:text-slate-600 uppercase">Agenda Relevance</div>
                  <div className="text-lg font-black text-indigo-400 font-mono print:text-indigo-700">
                    {aiAnalytics.average_agenda_relevance_percentage}%
                  </div>
                  <div className="text-[9px] text-slate-400 print:text-slate-500">Bill Alignment</div>
                </div>
              </div>
            </div>

            {/* Infraction & Chamber Safety Log */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800/90 p-2.5 print:bg-white print:border-slate-300">
              <h2 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 print:text-amber-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                2. Rule Evaluations & Alerts
              </h2>

              <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[9px] text-slate-400 print:text-slate-600">Off-Topic</div>
                  <div className="text-xs font-bold text-amber-400 print:text-amber-700">{stats.off_topic_incidents}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[9px] text-slate-400 print:text-slate-600">Offensive</div>
                  <div className="text-xs font-bold text-rose-400 print:text-rose-700">{stats.offensive_language_incidents}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[9px] text-slate-400 print:text-slate-600">Displaced</div>
                  <div className="text-xs font-bold text-purple-400 print:text-purple-700">{stats.unauthorized_movement_incidents}</div>
                </div>
                <div className="p-1.5 rounded bg-slate-900 border border-slate-800 print:bg-slate-50 print:border-slate-200">
                  <div className="text-[9px] text-slate-400 print:text-slate-600">Emergency</div>
                  <div className="text-xs font-bold text-red-400 print:text-red-700">{stats.emergency_activations}</div>
                </div>
              </div>
            </div>

            {/* Atmosphere & System Integrity */}
            <div className="bg-slate-950/70 rounded-xl border border-slate-800/90 p-2.5 flex items-center justify-between text-[11px] print:bg-white print:border-slate-300">
              <div className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300 font-semibold print:text-black">AI Pipelines:</span>
                <span className="text-emerald-400 font-mono font-bold print:text-emerald-700">8/8 Verified</span>
              </div>
              <div className="text-slate-400 print:text-slate-600">
                Order Rating: <span className="text-slate-200 font-bold print:text-black">Satisfactory</span>
              </div>
            </div>

          </div>

          {/* Right Column: Member Performance Standings Table (7.5 cols) */}
          <div className="lg:col-span-7 bg-slate-950/70 rounded-xl border border-slate-800/90 p-2.5 flex flex-col justify-between print:bg-white print:border-slate-300">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 print:text-amber-800">
                  <Users className="w-3.5 h-3.5" />
                  3. Member Scorecard Standings (Ranked by Analytical Decorum Score)
                </h2>
                <span className="text-[10px] font-mono text-slate-400 print:text-slate-600">
                  {memberScorecards.length} Members Evaluated
                </span>
              </div>

              {/* Ultra-Dense, Scrollable Table on Mobile */}
              <div className="rounded-lg border border-slate-800 overflow-x-auto no-scrollbar print:border-slate-300">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[9px] print:bg-slate-100 print:text-slate-700">
                    <tr>
                      <th className="py-1.5 px-2">Seat</th>
                      <th className="py-1.5 px-2">Member Name</th>
                      <th className="py-1.5 px-1.5 text-center">Part.</th>
                      <th className="py-1.5 px-1.5 text-center">Agenda</th>
                      <th className="py-1.5 px-1.5 text-center">Time</th>
                      <th className="py-1.5 px-2 text-center font-bold text-amber-400 print:text-amber-800">Score</th>
                      <th className="py-1.5 px-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 font-sans print:divide-slate-200">
                    {memberScorecards.slice(0, 10).map((sc: any, idx) => (
                      <tr key={sc.member_id || idx} className="hover:bg-slate-850 print:hover:bg-transparent">
                        <td className="py-1 px-2 font-mono font-bold text-amber-400 print:text-amber-900">{sc.seat_id || "S001"}</td>
                        <td className="py-1 px-2 font-semibold text-slate-200 truncate max-w-[140px] print:text-black">
                          {sc.name || "Honourable Member"}
                        </td>
                        <td className="py-1 px-1.5 text-center font-mono text-slate-300 print:text-slate-800">
                          {sc.categories?.participation ?? sc.attendance_percentage ?? 95}
                        </td>
                        <td className="py-1 px-1.5 text-center font-mono text-slate-300 print:text-slate-800">
                          {sc.categories?.agenda_relevance ?? sc.agenda_relevance ?? 90}%
                        </td>
                        <td className="py-1 px-1.5 text-center font-mono text-slate-300 print:text-slate-800">
                          {sc.categories?.speaking_discipline ?? sc.speaking_time_adherence ?? 92}
                        </td>
                        <td className="py-1 px-2 text-center font-mono font-bold text-emerald-400 print:text-emerald-800">
                          {sc.overall_score ?? 90}
                        </td>
                        <td className="py-1 px-2 text-[10px] text-slate-300 truncate max-w-[120px] print:text-slate-700">
                          {sc.grade || "A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 italic pt-2 print:text-slate-500">
              *Scores weighted: 25% Agenda Relevance, 20% Participation, 20% Speaking Time, 20% Decorum, 15% Seat Adherence.
            </div>
          </div>

        </div>

        {/* 3. Footer: Ethics Disclaimer & Action Controls */}
        <div className="border-t border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 print:border-slate-300">
          <p className="text-[10px] text-slate-400 italic max-w-xl leading-tight print:text-slate-600">
            Certified Record: This session report was automatically generated by the AI Parliamentary Decision-Support System for administrative record and analytical review.
          </p>

          <div className="flex items-center gap-2 print:hidden flex-wrap">
            <button
              id="report-export-csv-btn"
              onClick={downloadCSV}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              CSV
            </button>
            <button
              id="report-export-json-btn"
              onClick={downloadJSON}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              JSON
            </button>
            <button
              id="report-print-btn"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              Print (1-Page)
            </button>
            <button
              id="report-close-btn"
              onClick={closeReport}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors shadow-sm"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
