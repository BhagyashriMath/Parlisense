import React from 'react';
import { Card } from './Card';

export interface StatWidgetProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  subtext?: string;
  trend?: {
    value: string | number;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'gold' | 'danger' | 'success' | 'info';
  className?: string;
}

export const StatWidget: React.FC<StatWidgetProps> = ({
  label,
  value,
  icon,
  subtext,
  trend,
  variant = 'default',
  className = ''
}) => {
  const variantGradients = {
    default: 'from-slate-900/90 to-slate-900/60 border-slate-800',
    gold: 'from-amber-950/30 to-slate-900/80 border-amber-500/30',
    danger: 'from-rose-950/30 to-slate-900/80 border-rose-500/30',
    success: 'from-emerald-950/30 to-slate-900/80 border-emerald-500/30',
    info: 'from-sky-950/30 to-slate-900/80 border-sky-500/30'
  };

  const iconColors = {
    default: 'text-slate-400 bg-slate-800/70',
    gold: 'text-amber-400 bg-amber-950/60 border border-amber-500/30',
    danger: 'text-rose-400 bg-rose-950/60 border border-rose-500/30',
    success: 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30',
    info: 'text-sky-400 bg-sky-950/60 border border-sky-500/30'
  };

  return (
    <Card
      className={`bg-gradient-to-br ${variantGradients[variant]} p-4 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            {label}
          </p>
          <div className="text-2xl font-black text-slate-100 tracking-tight mt-1">
            {value}
          </div>
        </div>
        {icon && (
          <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconColors[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
          {subtext && <span className="text-slate-400">{subtext}</span>}
          {trend && (
            <span
              className={`font-semibold ${
                trend.direction === 'up'
                  ? 'text-emerald-400'
                  : trend.direction === 'down'
                  ? 'text-rose-400'
                  : 'text-slate-400'
              }`}
            >
              {trend.direction === 'up' ? '↑' : trend.direction === 'down' ? '↓' : '•'} {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
};
