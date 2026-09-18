import React, { useRef, useEffect, useState } from "react";
import { useParliament } from "../../../infrastructure/context/ParliamentContext";
import { MessageSquareText, Sparkles } from "lucide-react";

interface LiveTranscriptProps {
  /** When true, shows only the spoken text — no speaker name, seat, emotion badges */
  textOnly?: boolean;
}

const DEFAULT_FLAGGED_WORDS = [
  "shameful", "liar", "lies", "lie", "corrupt", "corruption", "cheat", "scam",
  "shut up", "nonsense", "fraud", "disgrace", "idiot", "rubbish", "bribe", "thief", "criminal", "fool"
];

function highlightOffensiveWords(text: string, flaggedWords: string[]) {
  const wordsToFind = Array.from(new Set([...DEFAULT_FLAGGED_WORDS, ...flaggedWords.map(w => w.toLowerCase().trim())])).filter(Boolean);
  if (wordsToFind.length === 0 || !text) return text;

  // Escape regex special chars and sort longest first so "shut up" matches before "up"
  const sortedWords = wordsToFind.sort((a, b) => b.length - a.length);
  const pattern = new RegExp(`\\b(${sortedWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi");

  const parts = text.split(pattern);
  return parts.map((part, index) => {
    const isOffensive = wordsToFind.some(w => w.toLowerCase() === part.toLowerCase());
    if (isOffensive) {
      return (
        <span
          key={index}
          className="bg-red-500/25 text-red-300 font-bold px-1 py-0.5 rounded border border-red-500/40 inline-flex items-center gap-0.5 animate-pulse mx-0.5"
          title="Unparliamentary Language Flagged by AI"
        >
          <span className="text-[10px]">⚠️</span>
          {part}
        </span>
      );
    }
    return part;
  });
}

export function LiveTranscript({ textOnly = false }: LiveTranscriptProps) {
  const { telemetry, interimTranscript, isMicActive } = useParliament();
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);
  const [filterText, setFilterText] = useState("");

  const sttSupported =
    typeof window !== "undefined" &&
    !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const flaggedWords = telemetry?.ai_output?.flagged_words || [];
  const transcripts = telemetry?.recent_transcripts || [];

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcripts, interimTranscript]);

  const filtered = transcripts.filter((t) =>
    t.text.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div id="live-transcript-panel" className="bg-slate-900 rounded-lg border border-slate-800 p-2 shadow-sm flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-slate-800 text-amber-400 border border-slate-700">
            <MessageSquareText className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-[11px] font-bold text-slate-200 uppercase tracking-wider leading-none">
              Live Speech-to-Text
            </h3>
            <p className="text-[9px] text-slate-500 leading-none mt-0.5">Whisper STT — real-time floor feed</p>
          </div>
        </div>
        <input
          type="text"
          placeholder="Search..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="px-2 py-0.5 text-[10px] rounded bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-24 sm:w-32"
        />
      </div>

      {/* Transcript stream */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-0.5">
        {filtered.length === 0 ? (
          <div className="text-slate-500 text-center py-6 text-[11px]">Awaiting floor speech…</div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              {/* text-only mode: just timestamp + spoken text */}
              {textOnly ? (
                <div className="flex items-start gap-1.5">
                  <span className="font-mono text-[10px] text-amber-500/70 flex-shrink-0 mt-0.5 leading-none">
                    {entry.time}
                  </span>
                  <p className="text-base text-slate-100 leading-snug font-sans font-medium">
                    {highlightOffensiveWords(entry.text, flaggedWords)}
                  </p>
                </div>
              ) : (
                /* full mode */
                <>
                  <div className="flex items-center justify-between mb-0.5 gap-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[9px] text-amber-400 bg-amber-950/40 px-1 rounded border border-amber-500/30">
                        {entry.time}
                      </span>
                      <span className="font-bold text-slate-200 text-sm">{entry.speakerName}</span>
                      {entry.seatId && (
                        <span className="text-[9px] text-slate-400 font-mono">({entry.seatId})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-[9px] px-1 py-0.2 rounded border font-medium ${
                        entry.emotion === "Heated" || entry.emotion === "Angry"
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                          : entry.emotion === "Positive"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-slate-800 text-slate-300 border-slate-700"
                      }`}>
                        {entry.emotion}
                      </span>
                      {entry.relevance !== undefined && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-sky-950/40 text-sky-300 border border-sky-500/30 font-mono">
                          {Math.round(entry.relevance * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-200 leading-snug font-sans text-base font-medium">
                    {highlightOffensiveWords(entry.text, flaggedWords)}
                  </p>
                </>
              )}
            </div>
          ))
        )}
        <div ref={transcriptEndRef} />
      </div>

      {/* Real-time interim STT — words appear as they are recognized */}
      {interimTranscript && (
        <div className="mt-1 pt-1 border-t border-slate-800/80 flex-shrink-0">
          <div className="flex items-center gap-1 text-[9px] font-bold text-sky-300 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            RECOGNIZING…
          </div>
          <p className="text-base text-sky-200/90 leading-snug font-sans font-medium">
            {highlightOffensiveWords(interimTranscript, flaggedWords)}
          </p>
        </div>
      )}

      <div className="mt-1 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[9px] text-slate-500 font-mono flex-shrink-0">
        <span className="flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5 text-amber-400" />
          {textOnly ? "Text-only feed" : "Full STT feed"}
        </span>
        <span className="flex items-center gap-1">
          {isMicActive ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
          )}
          {isMicActive ? "LIVE" : (!sttSupported ? "STT UNSUPPORTED" : "MIC OFF")}
        </span>
      </div>
    </div>
  );
}
