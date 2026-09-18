import React from 'react';
import { Card } from '../../../../components/common/Card';
import { Badge } from '../../../../components/common/Badge';
import { Clock, Activity, Armchair, ShieldCheck } from 'lucide-react';

interface MemberQuotaWidgetProps {
  allocatedSeconds: number;
  usedSeconds: number;
  remainingSeconds: number;
  timePercent: number;
  isQuotaExhausted: boolean;
  isWarningZone: boolean;
  relevancePct: number;
  isMoved: boolean;
  seatInfo: any;
}

export const MemberQuotaWidget: React.FC<MemberQuotaWidgetProps> = ({
  allocatedSeconds,
  usedSeconds,
  remainingSeconds,
  timePercent,
  isQuotaExhausted,
  isWarningZone,
  relevancePct,
  isMoved,
  seatInfo
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
      {/* Floor Time Quota */}
      <Card className="p-3 bg-slate-900/90 border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            Floor Time Quota
          </span>
          <Badge variant={isQuotaExhausted ? "danger" : isWarningZone ? "warning" : "success"}>
            {isQuotaExhausted ? "EXHAUSTED" : isWarningZone ? "WARNING" : "ACTIVE"}
          </Badge>
        </div>
        <div className="text-xl font-black font-mono text-slate-100">
          {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
        </div>
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isQuotaExhausted ? "bg-rose-500" : isWarningZone ? "bg-amber-400" : "bg-emerald-400"
              }`}
              style={{ width: `${timePercent}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Used: {Math.floor(usedSeconds / 60)}m {usedSeconds % 60}s</span>
            <span>Allocated: {Math.floor(allocatedSeconds / 60)}m</span>
          </div>
        </div>
      </Card>

      {/* Bill Relevance */}
      <Card className="p-3 bg-slate-900/90 border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Agenda Relevance
          </span>
          <Badge variant={relevancePct >= 70 ? "success" : relevancePct >= 40 ? "warning" : "danger"}>
            {relevancePct >= 70 ? "OPTIMAL" : "MARGINAL"}
          </Badge>
        </div>
        <div className="text-xl font-black font-mono text-slate-100">
          {relevancePct}%
        </div>
        <p className="text-[10px] text-slate-400">
          AI semantic alignment score with the active legislative agenda.
        </p>
      </Card>

      {/* Seat Compliance */}
      <Card className="p-3 bg-slate-900/90 border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Armchair className="w-3.5 h-3.5 text-blue-400" />
            Seat Placement
          </span>
          <Badge variant={isMoved ? "danger" : "success"}>
            {isMoved ? "OUT OF SEAT" : "COMPLIANT"}
          </Badge>
        </div>
        <div className="text-xl font-black font-mono text-slate-100 flex items-center gap-1.5">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>{isMoved ? "Moved Zone" : "At Bench"}</span>
        </div>
        <p className="text-[10px] text-slate-400">
          Physical bench vision compliance tracking.
        </p>
      </Card>
    </div>
  );
};
