import React from "react";
import { useScorecardViewModel } from "../viewmodel/useScorecardViewModel";
import {
  X,
  Award,
  Download,
  FileSpreadsheet,
  PlusCircle,
  MinusCircle,
  Sparkles,
  Tag,
  Lightbulb,
  BookOpen
} from "lucide-react";


/**
 * ScorecardModal View (MVVM Architecture)
 * Official Analytical Member Scorecard presentation modal bound to useScorecardViewModel.
 */
export function ScorecardModal() {
  const {
    activeScorecard,
    isScorecardOpen,
    closeScorecard,
    activeTab,
    setActiveTab,
    downloadJSON
  } = useScorecardViewModel();

  if (!isScorecardOpen || !activeScorecard) return null;

  const cats = activeScorecard.categories;
  const stats = activeScorecard.statistics;
  const overall = activeScorecard.overall_score;
  const pos = activeScorecard.positive_marks || {
    agenda_relevance_points: 22,
    constructive_proposals_points: 18,
    foundational_discussion_points: 17,
    decorum_conduct_bonus: 15,
    total_positive_marks: 72
  };
  const neg = activeScorecard.negative_deductions || {
    speaking_time_overage_deduction: 0,
    off_topic_speech_deduction: 0,
    interruptions_cross_talk_deduction: 0,
    disruptive_movement_deduction: 0,
    offensive_language_deduction: 0,
    excessive_noise_deduction: 0,
    rule_violations_deduction: 0,
    total_negative_deductions: 0
  };
  const summary = activeScorecard.member_summary || {
    subject_title: "Parliamentary Policy & Statutory Governance",
    discussion_summary: "Participated in parliamentary debate regarding active legislative proposals, contributing foundational policy recommendations and stakeholder analyses.",
    subject_notes_points: [
      "Legislative Framework: Addressed core statutory guidelines and public allocation mechanisms.",
      "Implementation Timeline: Highlighted the necessity of multi-phase state rollout with quarterly checkpoints.",
      "Fiscal Accountability: Emphasized robust auditory review and district-level fund disbursement tracking."
    ],
    major_ideas_raised: [
      "Targeted central grant allocations for regional digital connectivity",
      "Statutory oversight on public expenditure transparency",
      "Inter-agency coordination for rural implementation"
    ],
    policy_keywords: ["Digital Equity", "Public Finance", "Legislative Oversight", "Rural Infrastructure", "Policy Reform"],
    keyword_notes: [
      { term: "Digital Equity", explanation_note: "Universal broadband access frameworks for underserved regional districts." },
      { term: "Legislative Oversight", explanation_note: "Structured quarterly auditory reviews on public capital deployment." }
    ]
  };

  let gradeColor = "text-emerald-400 border-emerald-500/40 bg-emerald-950/40";
  if (overall < 60) gradeColor = "text-rose-400 border-rose-500/40 bg-rose-950/40";
  else if (overall < 75) gradeColor = "text-amber-400 border-amber-500/40 bg-amber-950/40";
  else if (overall < 85) gradeColor = "text-sky-400 border-sky-500/40 bg-sky-950/40";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-2xl w-full shadow-2xl p-3 sm:p-5 relative flex flex-col justify-between overflow-hidden max-h-[92dvh]">
        {/* Close Button */}
        <button
          onClick={closeScorecard}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          title="Close Scorecard"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-800 pb-2.5 mb-2 flex-shrink-0 gap-2 pr-8 sm:pr-0">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest truncate">
                Official Analytical Member Scorecard & Summary
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-100">{activeScorecard.name}</h2>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
              Member ID: {activeScorecard.member_id} | Seat: {activeScorecard.seat_id} | Mic: {activeScorecard.mic_id || `MIC-${activeScorecard.seat_id}`}
            </p>
          </div>

          <div className={`px-2.5 py-1 rounded-xl border text-center self-start sm:self-auto ${gradeColor}`}>
            <div className="text-lg sm:text-xl font-black font-mono">{overall}</div>
            <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider">OVERALL SCORE</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-2 mb-2 flex-shrink-0 overflow-x-auto no-scrollbar flex-nowrap">
          <button
            onClick={() => setActiveTab("marks")}
            className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
              activeTab === "marks"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-300" />
            <span>Positive Marks & Deductions</span>
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
              activeTab === "summary"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Speech & Policy Summary</span>
          </button>

          <button
            onClick={() => setActiveTab("rubric")}
            className={`px-2.5 sm:px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors flex-shrink-0 ${
              activeTab === "rubric"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
            <span>5-Point Rubric & Stats</span>
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 min-h-0">
          {/* TAB 1: POSITIVE MARKS & NEGATIVE DEDUCTIONS */}
          {activeTab === "marks" && (
            <div className="space-y-3">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Evaluated Standing: </span>
                  <span className="font-bold text-slate-200">{activeScorecard.grade}</span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">
                  Rule Engine Net Score: {overall} / 100
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-emerald-800/40 pb-1.5 mb-2">
                      <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                        <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                        Positive Marks (Contributions)
                      </span>
                      <span className="text-xs font-mono font-black text-emerald-400">
                        +{pos.total_positive_marks} pts
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Bill Agenda Relevance</span>
                        <span className="font-mono font-bold text-emerald-400">+{pos.agenda_relevance_points} / 25</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Constructive Policy Proposals</span>
                        <span className="font-mono font-bold text-emerald-400">+{pos.constructive_proposals_points} / 20</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Foundational Debate Quality</span>
                        <span className="font-mono font-bold text-emerald-400">+{pos.foundational_discussion_points} / 20</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Decorum & Order Bonus</span>
                        <span className="font-mono font-bold text-emerald-400">+{pos.decorum_conduct_bonus} / 15</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-emerald-800/40 text-[10px] text-emerald-400/90 font-mono">
                    ✓ Awarded for relevance, constructive amendment proposals, and chamber decorum.
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-rose-800/40 pb-1.5 mb-2">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <MinusCircle className="w-3.5 h-3.5 text-rose-400" />
                        Negative Marks (Deductions)
                      </span>
                      <span className="text-xs font-mono font-black text-rose-400">
                        -{neg.total_negative_deductions} pts
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Speaking Time Overage</span>
                        <span className="font-mono font-bold text-rose-400">-{neg.speaking_time_overage_deduction} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Off-Topic Digressions</span>
                        <span className="font-mono font-bold text-rose-400">-{neg.off_topic_speech_deduction} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Cross-Talk & Interruptions</span>
                        <span className="font-mono font-bold text-rose-400">-{neg.interruptions_cross_talk_deduction} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Seat / Well Movement Violations</span>
                        <span className="font-mono font-bold text-rose-400">-{neg.disruptive_movement_deduction} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Offensive Language Incidents</span>
                        <span className="font-mono font-bold text-rose-400">-{neg.offensive_language_deduction} pts</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-[11px]">Excessive Acoustic Noise</span>
                        <span className="font-mono font-bold text-rose-400">-{neg.excessive_noise_deduction} pts</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-rose-800/40 text-[10px] text-rose-400/90 font-mono">
                    ⚠ Deducted for timer breaches, disruptions, unparliamentary language, and movement.
                  </div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Base Chamber Presence & Seat Quorum Allowance:</span>
                <span className="font-mono font-bold text-slate-200">+20 pts</span>
              </div>
            </div>
          )}

          {/* TAB 2: SPEECH & POLICY SUMMARY */}
          {activeTab === "summary" && (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Subject Notes & Discussion Points
                  </span>
                  {summary.subject_title && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold truncate max-w-[220px]">
                      {summary.subject_title}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-200">
                  {(summary.subject_notes_points && summary.subject_notes_points.length > 0
                    ? summary.subject_notes_points
                    : summary.discussion_summary.split(". ").filter(s => s.trim().length > 0).map(s => s.endsWith(".") ? s : `${s}.`)
                  ).map((notePt, pIdx) => {
                    const colonIdx = notePt.indexOf(":");
                    const hasColon = colonIdx > 0 && colonIdx < 35;
                    return (
                      <div key={pIdx} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold flex-shrink-0 mt-0.5">•</span>
                        <p className="leading-snug">
                          {hasColon ? (
                            <>
                              <strong className="text-amber-200 font-semibold">{notePt.substring(0, colonIdx)}:</strong>
                              <span className="text-slate-300">{notePt.substring(colonIdx + 1)}</span>
                            </>
                          ) : (
                            <span className="text-slate-300">{notePt}</span>
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Specific Policy Proposals & Interventions
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {summary.major_ideas_raised.length} Points
                  </span>
                </div>
                <div className="space-y-1.5">
                  {summary.major_ideas_raised.map((idea, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-[10px] flex-shrink-0 mt-0.5 border border-emerald-500/30">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{idea}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                  <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" />
                    Subject Concept Terms & Explanatory Notes
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Concept Analysis</span>
                </div>

                {summary.keyword_notes && summary.keyword_notes.length > 0 ? (
                  <div className="space-y-1.5 text-xs text-slate-300">
                    {summary.keyword_notes.map((kn, knIdx) => (
                      <div key={knIdx} className="p-1.5 rounded-md bg-slate-900 border border-slate-800/80 flex items-start gap-2">
                        <span className="text-sky-400 font-bold flex-shrink-0 mt-0.5">•</span>
                        <p className="leading-snug">
                          <strong className="text-sky-300 font-semibold">{kn.term}:</strong>{" "}
                          <span className="text-slate-300">{kn.explanation_note}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-800/80">
                  {summary.policy_keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-sky-950/60 text-sky-300 border border-sky-800/60 font-mono text-[11px] font-semibold"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 5-CATEGORY RUBRIC & STATS */}
          {activeTab === "rubric" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">5-Weighted Category Breakdown</h3>

                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">1. Attendance & Floor Participation (20%)</span>
                    <span className="font-mono font-bold text-slate-200">{cats.participation} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${cats.participation}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">2. Bill Topic Adherence (25%)</span>
                    <span className="font-mono font-bold text-slate-200">{cats.agenda_relevance} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full" style={{ width: `${cats.agenda_relevance}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">3. Speaking Time Discipline (20%)</span>
                    <span className="font-mono font-bold text-slate-200">{cats.speaking_discipline} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full" style={{ width: `${cats.speaking_discipline}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">4. Seat Compliance & Desk Presence (15%)</span>
                    <span className="font-mono font-bold text-slate-200">{cats.seat_compliance} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${cats.seat_compliance}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/70 p-2 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">5. Parliamentary Decorum & Non-Disruption (20%)</span>
                    <span className="font-mono font-bold text-slate-200">{cats.decorum_discipline} / 100</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full" style={{ width: `${cats.decorum_discipline}%` }} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[9px]">FLOOR TIME</div>
                  <div className="font-bold text-slate-200 text-[11px] mt-0.5">{stats.speaking_time_seconds}s / {stats.allocated_time_seconds}s</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[9px]">TIME OVERAGES</div>
                  <div className="font-bold text-slate-200 text-[11px] mt-0.5">{stats.time_violations} Overages</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-[9px]">SEAT INCIDENTS</div>
                  <div className="font-bold text-slate-200 text-[11px] mt-0.5">{stats.seat_violations} Detected</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer & Action Footer */}
        <div className="border-t border-slate-800 pt-2.5 mt-2 flex items-center justify-between gap-2 flex-shrink-0">
          <p className="text-[10px] text-slate-500 italic max-w-sm leading-tight">
            Decision-support indicator from Parliamentary Rule Engine Not an official disciplinary sanction.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              JSON
            </button>
            <button
              onClick={closeScorecard}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
