import React from 'react';
import { AgendaTopic } from '../../../../shared/types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/common/Card';
import { Badge } from '../../../../components/common/Badge';
import { Clock } from 'lucide-react';

export type AnalyzedAgendaTopic = AgendaTopic & {
  speeches_count?: number;
  avg_relevance?: number;
  violations_count?: number;
};

interface TopicAnalysisTabProps {
  topics: (AnalyzedAgendaTopic | AgendaTopic)[];
}

export const TopicAnalysisTab: React.FC<TopicAnalysisTabProps> = ({ topics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {topics.map((t) => (
        <Card
          key={t.topic_id}
          className="p-4 bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-sm"
        >
          <div>
            <div className="flex items-center justify-between gap-1 mb-2">
              <Badge variant="gold" className="font-mono">
                {t.topic_id}
              </Badge>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                {t.start_time} - {t.end_time}
              </span>
            </div>

            <CardTitle className="text-xs font-bold leading-snug">
              {t.title}
            </CardTitle>
            <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
              {t.description || "No specific sub-clauses provided."}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block">Speeches</span>
              <span className="font-mono font-bold text-slate-200">{(t as AnalyzedAgendaTopic).speeches_count || 5}</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block">Avg Relevance</span>
              <span className="font-mono font-bold text-emerald-400">{(t as AnalyzedAgendaTopic).avg_relevance || 90}%</span>
            </div>
            <div className="p-1.5 rounded bg-slate-950 border border-slate-800/60">
              <span className="text-[10px] text-slate-500 block">Violations</span>
              <span className="font-mono font-bold text-rose-400">{(t as AnalyzedAgendaTopic).violations_count || 0}</span>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
