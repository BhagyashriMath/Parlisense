import React from 'react';
import { useMemberViewModel } from '../viewmodel/useMemberViewModel';
import { MemberSessionEndedView } from './components/MemberSessionEndedView';
import { MemberProfileBanner } from './components/MemberProfileBanner';
import { MemberQuotaWidget } from './components/MemberQuotaWidget';
import { MemberScorecardSummaryWidget } from './components/MemberScorecardSummaryWidget';
import { SuspensionFullscreenView } from './components/SuspensionFullscreenView';
import { EmergencyExitModal } from './components/EmergencyExitModal';
import { MemberSelfCamera } from './MemberSelfCamera';
import { CameraStreamView } from '../../chamber-monitoring/view/CameraStreamView';
import { ChamberVideoGrid } from '../../../shared/components/ChamberVideoGrid';
import { LiveTranscript } from '../../chamber-monitoring/view/LiveTranscript';
import { AcousticNoiseMeter } from '../../chamber-monitoring/view/AcousticNoiseMeter';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { Video, Camera, ShieldAlert, AlertTriangle, AlertCircle, Calendar, Mic, Hand } from 'lucide-react';

export function MemberDashboard() {
  const [activeMobileView, setActiveMobileView] = React.useState<"feed" | "quota">("feed");
  const {
    telemetry,
    members,
    currentMember,
    selectedMemberId,
    scorecard,
    emergencyModalOpen,
    emergencyType,
    notifications,
    memberSuspended,
    cameraView,
    sessionActive,
    isPaused,
    isSpeaking,
    myHandRaised,
    handleRaiseHand,
    handleWithdrawHand,
    seatInfo,
    isMoved,
    allocatedSeconds,
    usedSeconds,
    remainingSeconds,
    isQuotaExhausted,
    timePercent,
    isWarningZone,
    relevancePct,
    overallScore,
    pos,
    neg,
    memSummary,
    myExitRequest,
    setSelectedMemberId,
    setEmergencyModalOpen,
    setEmergencyType,
    setCameraView,
    handleEmergencySubmit,
    openScorecard,
    openReport,
    isDeskReviewMode,
    setIsDeskReviewMode,
    logout
  } = useMemberViewModel();

  // Full screen suspension check
  if (memberSuspended) {
    return (
      <SuspensionFullscreenView
        currentMember={currentMember}
        scorecard={scorecard}
        onLogout={logout}
      />
    );
  }

  // Session Concluded / Upcoming Session check: Display official notice or adjournment view unless reviewing desk
  if (!sessionActive && !isDeskReviewMode) {
    return (
      <MemberSessionEndedView
        currentMember={currentMember}
        scorecard={scorecard}
        sessionId={telemetry?.session_id}
        scheduledSession={telemetry?.scheduled_session}
        onOpenScorecard={openScorecard}
        onOpenReport={openReport}
        onInspectDesk={() => setIsDeskReviewMode(true)}
        onLogout={logout}
      />
    );
  }

  return (
    <div id="member-dashboard-view" className="h-full flex-1 min-h-0 flex flex-col gap-2 overflow-hidden text-slate-200">
      {/* Sitting Scheduled Banner */}
      {!sessionActive && telemetry?.scheduled_session?.status === "SCHEDULED" && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/50 rounded-xl px-4 py-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30 font-mono">
                  Sitting Scheduled
                </span>
                <span className="text-xs font-bold text-white">
                  {telemetry.scheduled_session.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Scheduled: <strong className="text-amber-300">{telemetry.scheduled_session.session_date}</strong> • {telemetry.scheduled_session.start_time} - {telemetry.scheduled_session.end_time} • Floor Limit: {Math.round((telemetry.scheduled_session.max_speaking_time_seconds || 300) / 60)}m
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsDeskReviewMode(false)}
              className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              Notice View
            </button>
          </div>
        </div>
      )}

      {/* Sitting Concluded Desk Review Banner */}
      {!sessionActive && telemetry?.scheduled_session?.status !== "SCHEDULED" && (
        <div className="bg-amber-950/80 border border-amber-500/50 rounded-xl px-4 py-2 flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
              🏛️ SITTING CONCLUDED — DESK REVIEW MODE
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Floor proceedings are adjourned. Viewing recorded desk telemetry & transcript.
            </span>
          </div>
          <button
            onClick={() => setIsDeskReviewMode(false)}
            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-1 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            Return to Session Summary
          </button>
        </div>
      )}

      {/* Sitting Temporarily Paused Banner */}
      {sessionActive && isPaused && (
        <div className="bg-amber-950/90 border border-amber-500/60 rounded-xl px-4 py-2 flex items-center justify-between shadow-lg flex-shrink-0 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-black text-xs uppercase font-mono tracking-wider flex items-center gap-1.5">
              ⏸️ SITTING TEMPORARILY PAUSED BY HON. SPEAKER
            </span>
            <span className="text-xs text-slate-300 hidden sm:inline">
              Floor microphones and timers are paused. Please remain in place until the chair resumes proceedings.
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
            SITTING PAUSED
          </span>
        </div>
      )}
      {/* 1. Member Profile & Floor Quota Banner */}
      <MemberProfileBanner
        currentMember={currentMember}
        members={members}
        selectedMemberId={selectedMemberId}
        onSelectMember={setSelectedMemberId}
        isSpeaking={isSpeaking}
        remainingSeconds={remainingSeconds}
        timePercent={timePercent}
        isWarningZone={isWarningZone}
        isQuotaExhausted={isQuotaExhausted}
        myExitRequest={myExitRequest}
        onOpenScorecard={openScorecard}
        onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
      />

      {/* Request to Speak / Raise Hand Action Strip */}
      {sessionActive && (
        <div className="flex-shrink-0 flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-amber-600/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              {isSpeaking ? (
                <Mic className="w-4 h-4 text-emerald-400 animate-pulse" />
              ) : myHandRaised ? (
                <Hand className="w-4 h-4 text-amber-400" />
              ) : (
                <Hand className="w-4 h-4 text-slate-400" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-100 truncate">
                {isSpeaking
                  ? "You hold the floor — addressing the House"
                  : myHandRaised
                  ? "Hand raised — awaiting recognition by the Chair"
                  : "Seek the floor to address the House"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                {isSpeaking
                  ? "Microphone live · floor clock running"
                  : myHandRaised
                  ? "You can withdraw your request at any time"
                  : "The Speaker will see your raised hand and may grant the floor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {myHandRaised ? (
              <button
                onClick={handleWithdrawHand}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Hand className="w-3.5 h-3.5" />
                Withdraw
              </button>
            ) : isSpeaking ? (
              <Badge variant="success" className="font-mono text-[10px] flex items-center gap-1">
                <Mic className="w-3 h-3 animate-pulse" /> ON FLOOR
              </Badge>
            ) : (
              <button
                onClick={handleRaiseHand}
                disabled={isPaused}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-[11px] font-black flex items-center gap-1 transition-all shadow-sm cursor-pointer"
              >
                <Hand className="w-3.5 h-3.5" />
                {isPaused ? "Sitting Paused" : "Raise Hand"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile / Tablet Workspace Switcher (< lg) */}
      <div className="flex lg:hidden items-center bg-slate-900 p-1 rounded-xl border border-slate-800 flex-shrink-0">
        <button
          onClick={() => setActiveMobileView("feed")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
            activeMobileView === "feed"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Desk Cam & Transcript
        </button>
        <button
          onClick={() => setActiveMobileView("quota")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
            activeMobileView === "quota"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Quotas & Advisories ({notifications.length})
        </button>
      </div>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 overflow-hidden">
        {/* Left Column: Camera Feed + STT (6 cols) */}
        <div
          className={`lg:col-span-6 flex flex-col gap-2 min-h-0 overflow-hidden ${
            activeMobileView === "feed" ? "flex-1 min-h-[340px]" : "hidden lg:flex"
          }`}
        >
          {/* Member's Own Camera: Physical Presence & Movement Monitoring */}
          <div className="h-52 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm flex flex-col">
            <MemberSelfCamera
              memberId={currentMember.member_id}
              seatId={currentMember.seat_id}
              micId={currentMember.mic_id}
              memberName={currentMember.name}
            />
          </div>

          {/* Multi-Participant Chamber Video Feeds (Speaker + All Members) */}
          <div className="flex-1 min-h-0">
            <ChamberVideoGrid />
          </div>

          {/* Live Transcript */}
          <div className="h-56 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-sm flex flex-col">
            <LiveTranscript textOnly={true} />
          </div>
        </div>

        {/* Right Column: Quotas, Disciplinary Alerts & Scorecard Summary (6 cols) */}
        <div
          className={`lg:col-span-6 flex flex-col gap-2 min-h-0 overflow-y-auto pr-1 ${
            activeMobileView === "quota" ? "flex-1 min-h-[340px]" : "hidden lg:flex"
          }`}
        >
          {/* Quota & Compliance Widgets */}
          <MemberQuotaWidget
            allocatedSeconds={allocatedSeconds}

            usedSeconds={usedSeconds}
            remainingSeconds={remainingSeconds}
            timePercent={timePercent}
            isQuotaExhausted={isQuotaExhausted}
            isWarningZone={isWarningZone}
            relevancePct={relevancePct}
            isMoved={isMoved}
            seatInfo={seatInfo}
          />

          {/* Disciplinary & Decorum Alerts Feed */}
          <Card className="p-3.5 bg-slate-900/90 border-slate-800 space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                Live Disciplinary & Conduct Advisories
              </span>
              <Badge variant={notifications.length > 0 ? "warning" : "success"}>
                {notifications.length} Active
              </Badge>
            </div>

            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-4">
                  Conduct compliant. No parliamentary decorum warnings active.
                </p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-200">{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.description || n.member_audio_message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Performance & Scorecard Summary Widget */}
          <MemberScorecardSummaryWidget
            overallScore={overallScore}
            pos={pos}
            neg={neg}
            memSummary={memSummary}
          />
        </div>
      </div>

      {/* 3. Emergency Exit Request Modal */}
      <EmergencyExitModal
        isOpen={emergencyModalOpen}
        onClose={() => setEmergencyModalOpen(false)}
        emergencyType={emergencyType}
        onEmergencyTypeChange={setEmergencyType}
        onSubmit={handleEmergencySubmit}
      />
    </div>
  );
}
