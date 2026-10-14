import React from 'react';
import { Member } from '../../../../shared/types';
import { Badge } from '../../../../components/common/Badge';
import { Button } from '../../../../components/common/Button';
import { Select } from '../../../../components/common/Select';
import { Award, AlertTriangle, Mic, Radio, Clock } from 'lucide-react';

interface MemberProfileBannerProps {
  currentMember: Member;
  members: Member[];
  selectedMemberId: string | null;
  onSelectMember: (id: string) => void;
  isSpeaking: boolean;
  remainingSeconds: number;
  timePercent: number;
  isWarningZone: boolean;
  isQuotaExhausted: boolean;
  myExitRequest: any;
  onOpenScorecard: (memberId: string) => void;
  onOpenEmergencyModal: () => void;
}

export const MemberProfileBanner: React.FC<MemberProfileBannerProps> = ({
  currentMember,
  members,
  selectedMemberId,
  onSelectMember,
  isSpeaking,
  remainingSeconds,
  timePercent,
  isWarningZone,
  isQuotaExhausted,
  myExitRequest,
  onOpenScorecard,
  onOpenEmergencyModal
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 sm:p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 flex-shrink-0">
      {/* Left Identity Info */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-600 to-amber-900 border-2 border-amber-500/40 flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-md flex-shrink-0">
          {currentMember.seat_id}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <h1 className="text-xs sm:text-sm font-black text-slate-100 truncate">{currentMember.name}</h1>
            <Badge variant="gold" className="font-mono text-[9px]">
              {currentMember.seat_id}
            </Badge>
            {isSpeaking && (
              <Badge variant="success" pulse className="font-mono text-[9px] flex items-center gap-1">
                <Mic className="w-2.5 h-2.5 animate-pulse" /> ON FLOOR
              </Badge>
            )}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 truncate mt-0.5">
            {currentMember.role || "Member of Parliament"} • {currentMember.party || "NDF"} • {currentMember.constituency}
          </p>
          {/* Mobile Quota Display (< md) */}
          <div className="flex md:hidden items-center gap-1.5 text-[10px] font-mono mt-0.5">
            <span className="text-slate-400">Quota:</span>
            <span
              className={`font-black ${
                isQuotaExhausted ? "text-rose-400 animate-pulse" : isWarningZone ? "text-amber-400" : "text-emerald-400"
              }`}
            >
              {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* Center Speaking Quota Bar (Desktop/Tablet >= md) */}
      <div className="hidden md:flex items-center gap-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 flex-shrink-0">
        <div>
          <span className="text-[10px] text-slate-500 uppercase block font-semibold">Remaining Quota</span>
          <span
            className={`text-xs font-black font-mono ${
              isQuotaExhausted
                ? "text-rose-400 animate-pulse"
                : isWarningZone
                ? "text-amber-400"
                : "text-slate-100"
            }`}
          >
            {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s
          </span>
        </div>
        <div className="w-20 lg:w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isQuotaExhausted ? "bg-rose-500" : isWarningZone ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ width: `${timePercent}%` }}
          />
        </div>
      </div>

      {/* Right Controls & Switcher */}
      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
        {/* MP Switcher for testing/demo */}
        <select
          value={selectedMemberId || currentMember.member_id}
          onChange={(e) => onSelectMember(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500 flex-1 sm:flex-none min-w-0"
        >
          {members.map((m) => (
            <option key={m.member_id} value={m.member_id}>
              {m.seat_id} - {m.name}
            </option>
          ))}
        </select>

        <Button
          variant="gold"
          size="sm"
          onClick={() => onOpenScorecard(currentMember.member_id)}
          icon={<Award className="w-3.5 h-3.5" />}
          className="flex-1 sm:flex-none justify-center text-xs"
        >
          Scorecard
        </Button>

        <Button
          variant={myExitRequest ? "secondary" : "danger"}
          size="sm"
          onClick={onOpenEmergencyModal}
          disabled={Boolean(myExitRequest && myExitRequest.status === "PENDING")}
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          className="flex-1 sm:flex-none justify-center text-xs"
        >
          {myExitRequest && myExitRequest.status === "PENDING" ? "Exit Pending" : "Emergency Exit"}
        </Button>
      </div>
    </div>
  );
};
