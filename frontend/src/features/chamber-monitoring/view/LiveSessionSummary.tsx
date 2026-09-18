import React, { useState, useRef, useEffect } from "react";
import { useParliament } from "../../../infrastructure/context/ParliamentContext";
import {
  Mic,
  Lightbulb,
  FileCheck2,
  Tag,
  TrendingUp,
  Landmark,
  ChevronDown,
  ChevronUp,
  Layers,
  Search,
  Radio,
  Volume2
} from "lucide-react";

interface LiveSessionSummaryProps {
  compact?: boolean;
  className?: string;
  defaultExpanded?: boolean;
  initialTab?: "stt" | "ideas" | "suggestions" | "topics";
}

export function LiveSessionSummary({
  compact = false,
  className = "",
  defaultExpanded = true,
  initialTab = "stt"
}: LiveSessionSummaryProps) {
  const { telemetry, interimTranscript, isMicActive } = useParliament();
  const summary = telemetry?.national_development_summary;
  const [activeTab, setActiveTab] = useState<"stt" | "ideas" | "suggestions" | "topics">(initialTab);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [sttFilter, setSttFilter] = useState("");
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const ideas = summary?.transformative_ideas || [];
  const suggestions = summary?.policy_suggestions || [];
  const topics = summary?.key_topics || [];

  // Extract chronological sentence-by-sentence transcription from telemetry
  const transcripts = telemetry?.recent_transcripts || [];
  const sentences = transcripts.flatMap((t) => {
    const rawSentences = t.text
      .split(/(?<=[.?!])\s+/)
      .filter((s) => s.trim().length > 0);

    return rawSentences.map((sentence, idx) => ({
      id: `${t.id}-s${idx}`,
      time: t.time,
      text: sentence.trim()
    }));
  });

  const filteredSentences = sentences.filter((s) =>
    s.text.toLowerCase().includes(sttFilter.toLowerCase())
  );

  useEffect(() => {
    if (activeTab === "stt" && transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [sentences, activeTab]);

  if (!summary) {
    return (
      <div id="live-session-summary" className={`bg-slate-900 rounded-lg border border-slate-800 p-3 shadow-sm ${className}`}>
        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Mic className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Connecting to Speech-to-Text Module & Parliamentary Pipelines...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      id="live-session-summary"
      className={`bg-slate-900/95 rounded-lg border border-slate-800/90 shadow-sm flex flex-col min-h-0 overflow-hidden ${className}`}
    >
      {/* Header Bar */}
      <div className="bg-slate-950/80 px-3 py-2 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Landmark className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider truncate">
                AI Session Monitor & Parliamentary Feed
              </h3>
              <span className="px-1.5 py-0.2 text-[9px] font-mono rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Analysis
              </span>
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              Continuous Speech-to-Text transcription & parliamentary analytics engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[9px] font-mono text-slate-500 hidden sm:inline">
            Updated: {summary.last_updated}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isExpanded ? "Collapse Summary" : "Expand Summary"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Sub-Navigation Tabs */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex-shrink-0 gap-1 overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                id="tab-live-speech-to-text"
                onClick={() => setActiveTab("stt")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "stt"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Mic className="w-3 h-3 text-amber-400 animate-pulse" />
                <span>Live Speech-to-Text</span>
                <span className="px-1 py-0.2 rounded-full text-[9px] bg-amber-950 text-amber-300 border border-amber-800">
                  {sentences.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("ideas")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "ideas"
                    ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                <span>Transformative Ideas</span>
                <span className="px-1 py-0.2 rounded-full text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-800">
                    {ideas.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab("suggestions")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "suggestions"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <FileCheck2 className="w-3 h-3" />
                <span>Policy Suggestions</span>
                <span className="px-1 py-0.2 rounded-full text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                {suggestions.length}
              </span>
              </button>
              <button
                onClick={() => setActiveTab("topics")}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                  activeTab === "topics"
                    ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>Key Agenda Topics</span>
              </button>
            </div>

            <div className="hidden md:flex items-center gap-1 text-[10px] text-amber-400/90 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>National Impact Focus</span>
            </div>
          </div>

          {/* Tab Content Panel */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0 text-xs">
            {/* LIVE SPEECH-TO-TEXT SECTION */}
            {activeTab === "stt" && (
              <div className="space-y-2 h-full flex flex-col min-h-0">
                <div className="flex items-center justify-between gap-2 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-300 text-[11px] font-bold">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                    <span>Real-Time Transcribed Parliamentary Speech (Chronological)</span>
                  </div>
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-500 absolute left-2 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter spoken text..."
                      value={sttFilter}
                      onChange={(e) => setSttFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded pl-6 pr-2 py-0.5 text-[10px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-28 sm:w-36"
                    />
                  </div>
                </div>

                {/* Chronological Sentence Stream (No Speaker Name/ID/Role) */}
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-[140px]">
                  {filteredSentences.length === 0 ? (
                    <div className="text-center py-6 text-slate-500">
                      <Volume2 className="w-5 h-5 mx-auto mb-1 text-slate-600 animate-pulse" />
                      <span>Transcribing active floor proceedings...</span>
                    </div>
                  ) : (
                    filteredSentences.map((item, idx) => {
                      const isLatest = idx === filteredSentences.length - 1;
                      return (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border transition-all ${
                            isLatest
                              ? "bg-amber-950/20 border-amber-500/40 shadow-sm"
                              : "bg-slate-950/70 border-slate-800/80 hover:border-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <span className="text-[9px] font-mono text-slate-500 px-1 py-0.2 rounded bg-slate-900 border border-slate-800 flex-shrink-0 mt-0.5">
                              {item.time}
                            </span>
                            <p className="flex-1 text-slate-200 text-xs leading-relaxed font-sans">
                              {item.text}
                              {isLatest && (
                                <span className="inline-block w-1.5 h-3 bg-amber-400 ml-1 animate-pulse align-middle" />
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  {interimTranscript && (
                    <div
                      className="p-2 rounded-lg border border-sky-500/40 bg-sky-950/30"
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-[9px] font-mono text-sky-300 px-1 py-0.2 rounded bg-sky-900 border border-sky-700 flex-shrink-0 mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                          Recognizing
                        </span>
                        <p className="flex-1 text-slate-200 text-xs leading-relaxed font-sans">
                          {interimTranscript}
                          <span className="inline-block w-1.5 h-3 bg-sky-400 ml-1 animate-pulse align-middle" />
                        </p>
                      </div>
                    </div>
                  )}
                  <div ref={transcriptEndRef} />
                </div>
                {isMicActive && (
                  <div className="flex-shrink-0 text-[9px] font-mono text-emerald-300/80 flex items-center gap-1 pt-1 border-t border-slate-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live speech recognition active
                  </div>
                )}
              </div>
            )}

            {activeTab === "ideas" && (
              <div className="space-y-2">
                {ideas.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-indigo-900/40 hover:border-indigo-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                          {item.id}
                        </span>
                        <span className="font-bold text-slate-200 text-xs">{item.idea}</span>
                      </div>
                      <span className="text-[10px] text-amber-300 font-medium bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
                        {item.member_name} ({item.party || "MP"})
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">
                      {item.national_benefit}
                    </p>
                    <div className="text-[10px] text-indigo-300/80 font-mono">
                      Impact Area: {item.impact_area}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "suggestions" && (
              <div className="space-y-2">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-emerald-900/40 hover:border-emerald-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded font-mono text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                          {item.id}
                        </span>
                        <span className="font-bold text-slate-200 text-xs">{item.focus}</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold">
                        {item.development_potential} Potential
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed mb-1.5">
                      {item.suggestion}
                    </p>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Proposed by: <span className="text-slate-200 font-semibold">{item.member_name}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "topics" && (
              <div className="space-y-2">
                {topics.map((t, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950/80 border border-sky-900/40 hover:border-sky-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-bold text-slate-200 text-xs">{t.title}</h4>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-700/50">
                        {t.relevance_score}% Topicality
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {t.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
