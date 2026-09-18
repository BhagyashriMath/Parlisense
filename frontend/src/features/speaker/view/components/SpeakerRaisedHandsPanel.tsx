import React from 'react';
import { SpeakingRequest } from '../../../../shared/types';
import { Badge } from '../../../../components/common/Badge';
import { Hand, Mic, X, LogOut } from 'lucide-react';

interface SpeakerRaisedHandsPanelProps {
  requests: SpeakingRequest[];
  activeSpeakerId: string | undefined;
  isSessionActive: boolean;
  onGrant: (memberId: string) => void;
  onReject: (memberId: string) => void;
  onReleaseFloor?: () => void;
}

export const SpeakerRaisedHandsPanel: React.FC<SpeakerRaisedHandsPanelProps> = ({
  requests,
  activeSpeakerId,
  isSessionActive,
  onGrant,
  onReject,
  onReleaseFloor
}) => {
  const waitingFor = (requestedAt: number) => {
    const s = Math.max(0, Math.floor((Date.now() - requestedAt) / 1000));
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 shadow-sm overflow-hidden">
      <div className="px-2.5 py-2 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Hand className="w-3.5 h-3.5 text-amber-400" />
            <span>Requests to Speak</span>
          </h3>
          {requests.length > 0 && (
            <Badge variant="warning" className="font-mono text-[9px] animate-pulse">
              {requests.length} Raised
            </Badge>
          )}
        </div>
        {onReleaseFloor && activeSpeakerId && (
          <button
            onClick={onReleaseFloor}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
            title="Release the floor — end the current member's turn"
          >
            <LogOut className="w-3 h-3" />
            <span>Release Floor</span>
          </button>
        )}
      </div>

      <div className="space-y-1 p-1.5 max-h-44 overflow-y-auto">
        {requests.length === 0 ? (
          <p className="text-[11px] text-slate-500 italic text-center py-3">
            {isSessionActive
              ? "No members are seeking the floor."
              : "Requests appear once the sitting is live."}
          </p>
        ) : (
          requests.map((r) => (
            <div
              key={r.member_id}
              className="p-2 rounded-lg bg-amber-950/20 border border-amber-600/40 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-[10px] font-mono flex-shrink-0">
                  {r.seat_id}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-100 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {r.seat_id} · waiting {waitingFor(r.requested_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => onGrant(r.member_id)}
                  className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-sm border border-amber-400/50"
                  title="Recognize this member and grant the floor"
                >
                  <Mic className="w-3 h-3" />
                  <span>Grant</span>
                </button>
                <button
                  onClick={() => onReject(r.member_id)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer border border-slate-700"
                  title="Decline this request"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};