import React from 'react';
import { SubTopicItem, POINT_CATEGORIES } from '../../viewmodel/usePostSessionViewModel';
import { SearchBar } from '../../../../components/common/SearchBar';
import { Card } from '../../../../components/common/Card';
import { Badge } from '../../../../components/common/Badge';
import { BookOpen } from 'lucide-react';

interface LegislativeSummaryNotesTabProps {
  subTopics: SubTopicItem[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
}

export const LegislativeSummaryNotesTab: React.FC<LegislativeSummaryNotesTabProps> = ({
  subTopics,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange
}) => {
  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Executive Summary Notes</span>
              <Badge variant="success">Sub-Topic Discussion Notes</Badge>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Sub-topic wise key discussion & evidence notes recorded across parliamentary proceedings
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Sub-Topics</span>
            <span className="text-sm font-mono font-bold text-amber-400">{subTopics.length} Topics</span>
          </div>
          <div className="text-center px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase block">Discussion Points</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              {subTopics.reduce((acc, curr) => acc + curr.key_points.length, 0)} Points
            </span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder="Search sub-topics or discussion points..."
          className="flex-1 max-w-md"
        />

        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {POINT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                activeCategory === cat
                  ? 'bg-amber-600 text-white shadow-sm font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-Topic Cards */}
      <div className="space-y-3">
        {subTopics.map((sub) => (
          <Card key={sub.id} className="p-4 bg-slate-900/90 border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Badge variant="gold" className="font-mono">
                  {sub.id}
                </Badge>
                <h3 className="text-xs font-bold text-slate-100">{sub.title}</h3>
              </div>
              <Badge variant="neutral">{sub.category}</Badge>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                Key Discussion & Evidence Points:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {sub.key_points.map((pt, pIdx) => {
                  const [titlePart, ...rest] = pt.split(": ");
                  const descPart = rest.join(": ");
                  return (
                    <div
                      key={pIdx}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 flex items-start gap-2.5 text-xs leading-relaxed"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0 mt-2" />
                      <div>
                        <strong className="text-slate-200 font-bold">{titlePart}: </strong>
                        <span className="text-slate-300">{descPart || titlePart}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
