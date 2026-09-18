import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

export interface FilterPanelProps {
  title?: string;
  onReset?: () => void;
  children: React.ReactNode;
  className?: string;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  title = 'Filters',
  onReset,
  children,
  className = ''
}) => {
  return (
    <div className={`bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-sm ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 tracking-wider uppercase">
          <Filter className="w-3.5 h-3.5 text-amber-500" />
          <span>{title}</span>
        </div>
        {onReset && (
          <button
            onClick={onReset}
            className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
};
