import React from 'react';
import { Button } from '../../../../components/common/Button';
import { Badge } from '../../../../components/common/Badge';
import { AlertTriangle, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { SuspensionRecommendation } from '../../model/speaker.types';

interface SpeakerDecisionsProps {
  suspensionRecs: SuspensionRecommendation[];
  pendingEmergencyRequests: any[];
  onConfirmSuspension: (rec: SuspensionRecommendation) => void;
  onRejectSuspension: (alertId: string, memberName: string, memberId?: string) => void;
  onEmergencyDecision: (requestId: string, approved: boolean, memberName: string) => void;
}

export const SpeakerDecisions: React.FC<SpeakerDecisionsProps> = ({
  suspensionRecs,
  pendingEmergencyRequests,
  onConfirmSuspension,
  onRejectSuspension,
  onEmergencyDecision
}) => {
  const activeSuspension = suspensionRecs[0];

  return (
    <>
      {/* Rule 374 Suspension Recommendation — scoped inline to Decorum Interaction */}
      {activeSuspension && (
        <div className="bg-slate-900 rounded-xl border border-rose-700/60 p-3 shadow-md space-y-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4" />
            <span>Rule 374 Suspension Recommendation</span>
          </div>
          <p className="text-[10px] text-slate-400">Persistent level-3 decorum breach detected. Review within Decorum Interaction.</p>
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-rose-200">{activeSuspension.member_name}</p>
                <p className="text-xs text-rose-300/80 font-mono mt-0.5">
                  Seat: {activeSuspension.seat_id} • Member ID: {activeSuspension.member_id}
                </p>
              </div>
              <Badge variant="danger" pulse>
                3RD LEVEL INFRACTION
              </Badge>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">Violation Details:</p>
              <p>{activeSuspension.title || "Persistent chamber disruption and disregard for the authority of the Chair."}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Timestamp: {activeSuspension.timestamp}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onRejectSuspension(activeSuspension.alert_id, activeSuspension.member_name, activeSuspension.member_id)}
              >
                Decline Suspension
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => onConfirmSuspension(activeSuspension)}
                icon={<ShieldAlert className="w-3.5 h-3.5" />}
              >
                Confirm & Enforce Rule 374
              </Button>
            </div>
        </div>
      )}

      {/* Emergency Exit Requests Banner (if any) */}
      {pendingEmergencyRequests.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3 shadow-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Pending Emergency Floor Exit Requests ({pendingEmergencyRequests.length})</span>
            </div>
            <Badge variant="warning" pulse>ACTION REQUIRED</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pendingEmergencyRequests.map((req: any) => {
              const reqId = req.id || req.request_id;
              const memberName = req.member_name || "Hon. Member";
              const seatId = req.seat_id || "Desk";
              const reasonText = req.reason || req.reason_type || req.notes || "Urgent departure requested";
              return (
                <div
                  key={reqId}
                  className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{memberName}</span>
                      <Badge variant="gold" className="font-mono text-[10px]">
                        {seatId}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      <strong className="text-amber-300">Reason:</strong> {reasonText}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onEmergencyDecision(reqId, false, memberName)}
                      className="text-slate-400 hover:text-rose-400 cursor-pointer"
                    >
                      Deny
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onEmergencyDecision(reqId, true, memberName)}
                      icon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      className="cursor-pointer"
                    >
                      Grant
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
