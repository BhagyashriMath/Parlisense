import React from 'react';
import { Card } from '../../../../components/common/Card';
import { Badge } from '../../../../components/common/Badge';
import { Award, BookOpen, Lightbulb } from 'lucide-react';

interface MemberScorecardSummaryWidgetProps {
  overallScore: number;
  pos: any;
  neg: any;
  memSummary: any;
}

export const MemberScorecardSummaryWidget: React.FC<MemberScorecardSummaryWidgetProps> = ({
  overallScore,
  pos,
  neg,
  memSummary
}) => {
  return (
    <Card className="p-4 bg-slate-900/90 border-slate-800 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Live Legislative Performance
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400">Live Score:</span>
          <Badge variant="gold" size="md" className="font-mono text-xs">
            {overallScore} / 100
          </Badge>
        </div>
      </div>

      {/* Marks breakdown */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/40 space-y-1">
          <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">
            + Positive Marks
          </span>
          <div className="text-[10px] font-mono text-slate-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Relevance:</span>
              <span className="text-emerald-400 font-bold">+{pos.agenda_relevance_points || 25}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Proposals:</span>
              <span className="text-emerald-400 font-bold">+{pos.constructive_proposals_points || 20}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Decorum:</span>
              <span className="text-emerald-400 font-bold">+{pos.decorum_conduct_bonus || 15}</span>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-800/40 space-y-1">
          <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">
            - Deductions
          </span>
          <div className="text-[10px] font-mono text-slate-300 space-y-0.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Time Overage:</span>
              <span className="text-rose-400 font-bold">-{neg.speaking_time_overage_deduction || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Off-Topic:</span>
              <span className="text-rose-400 font-bold">-{neg.off_topic_speech_deduction || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cross-talk:</span>
              <span className="text-rose-400 font-bold">-{neg.interruptions_cross_talk_deduction || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Discussion Points & Ideas */}
      {memSummary && (
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Recorded Discussion Points
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {memSummary.discussion_summary || "Active participation recorded on national policy clauses."}
            </p>
          </div>

          {memSummary.major_ideas_raised && memSummary.major_ideas_raised.length > 0 && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3" /> Policy Ideas Proposed
              </span>
              <div className="space-y-1">
                {memSummary.major_ideas_raised.map((idea: string, idx: number) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[10px] text-slate-300">
                    <span className="w-3.5 h-3.5 rounded-full bg-sky-500/20 text-sky-300 font-mono text-[9px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{idea}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
