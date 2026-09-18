import React from 'react';
import { useSpeakerViewModel } from '../viewmodel/useSpeakerViewModel';
import { SpeakerHeaderBar } from './components/SpeakerHeaderBar';
import { SpeakerDecisions } from './components/SpeakerDecisions';
import { SpeakerCameraWorkspace } from './components/SpeakerCameraWorkspace';
import { SpeakerMemberRosterPanel } from './components/SpeakerMemberRosterPanel';
import { SpeakerRaisedHandsPanel } from './components/SpeakerRaisedHandsPanel';
import { AcousticNoiseMeter } from '../../chamber-monitoring/view/AcousticNoiseMeter';
import { SimulationControls } from '../../chamber-monitoring/view/SimulationControls';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { ShieldAlert, AlertCircle, AlertTriangle, Play, FileText, Calendar } from 'lucide-react';
import { MemberSessionSummary } from '../../../shared/types';
import { ScheduleSessionModal } from './components/ScheduleSessionModal';
import { useParliament } from '../../../infrastructure/context/ParliamentContext';

export function SpeakerDashboard() {
  const { liveMicDb, isMicActive, currentUser } = useParliament();
  const [activeMobileView, setActiveMobileView] = React.useState<"floor" | "decorum" | "roster">("floor");
  const {
    telemetry,
    members,
    disciplineMap,
    suspensionRecs,
    cameraMode,
    notifications,
    completeSummary,
    memberFilter,
    ai,
    activeSpeaker,
    speakingTime,
    allocatedTime,
    timeRemaining,
    timePercent,
    isTimeOver,
    relevancePct,
    pendingEmergencyRequests,
    speakingRequests,
    pendingRaisedHands,
    handleGrantFloor,
    handleRejectFloor,
    handleReleaseFloor,
    setCameraMode,
    setMemberFilter,
    handleConfirmSuspension,
    handleRejectSuspension,
    handleRevokeSuspension,
    handleManualSuspend,
    handleEmergencyDecision,
    switchSpeaker,
    openScorecard,
    sessionActive,
    isPaused,
    handleTogglePause,
    isEndingSession,
    endSessionAndGenerateReport,
    isStartingSession,
    startSession,
    isScheduleModalOpen,
    setIsScheduleModalOpen,
    isScheduling,
    handleScheduleSession,
    openReport
  } = useSpeakerViewModel();

  const isLiveActive = sessionActive && !isPaused;
  const hasActiveSpeaker = !!telemetry?.active_speaker && (telemetry.speaking_duration_seconds ?? 0) > 0;
  const currentNoiseLevel = !isLiveActive
    ? 0
    : isMicActive && liveMicDb !== undefined && liveMicDb !== null
    ? Math.round(liveMicDb)
    : hasActiveSpeaker
    ? (typeof ai?.noise_level === "number" ? ai.noise_level : 0)
    : 0;

  const memberSummaries: MemberSessionSummary[] =
    completeSummary?.member_wise_summary ||
    members.map((m) => {
      const discipline = disciplineMap[m.member_id] || { warnings: 0, suspended: false };
      const isSusp = discipline.suspended || m.status === "SUSPENDED";
      return {
        member_id: m.member_id,
        name: m.name,
        seat_id: m.seat_id,
        mic_id: m.mic_id || `MIC-${m.seat_id}`,
        role: m.role || "Member of Parliament",
        party: m.party || "NDF",
        status: isSusp ? "SUSPENDED" : (m.status || "ACTIVE"),
        presence: (isSusp ? "Suspended" : "Present") as any,
        speaking_time_formatted: "3m 15s",
        speaking_time_seconds: 195,
        speeches_count: 1,
        agenda_relevance_pct: 92,
        violations_count: isSusp ? 3 : (m.violations_count || 0),
        warnings_count: isSusp ? 3 : (m.warnings_count || 0),
        seat_compliance_pct: 100,
        behavior_emotion: isSusp ? "Disciplinary Suspension" : "Constructive & Calm",
        positive_marks: {
          agenda_relevance_points: 25,
          constructive_proposals_points: 20,
          foundational_discussion_points: 20,
          decorum_conduct_bonus: isSusp ? 0 : 15,
          total_positive_marks: isSusp ? 45 : 80
        },
        negative_deductions: {
          speaking_time_overage_deduction: 0,
          off_topic_speech_deduction: 0,
          interruptions_cross_talk_deduction: 0,
          disruptive_movement_deduction: 0,
          offensive_language_deduction: 0,
          excessive_noise_deduction: 0,
          rule_violations_deduction: isSusp ? 30 : 0,
          total_negative_deductions: isSusp ? 30 : 0
        },
        member_summary: {
          discussion_summary: `${m.name} presented legislative input, emphasizing fiscal discipline.`,
          subject_notes_points: ["Legislative Oversight: Strengthen committees."],
          major_ideas_raised: ["Strengthen oversight committees."],
          policy_keywords: ["Fiscal Accountability"]
        },
        speaking_score: 95,
        agenda_score: 92,
        discipline_score: isSusp ? 0 : 100,
        seat_score: 100,
        violations_score: isSusp ? 0 : 100,
        final_score: isSusp ? 45 : 92.5,
        grade: isSusp ? "D Action Required" : "A+ Exemplary"
      };
    });

  const filteredMembers = memberSummaries.filter(
    (m) =>
      m.name.toLowerCase().includes(memberFilter.toLowerCase()) ||
      m.seat_id.toLowerCase().includes(memberFilter.toLowerCase())
  );

  const activeSpeakerMember = members.find((m) => m.seat_id === activeSpeaker?.seat_id);

  return (
    <div id="speaker-dashboard-view" className="h-full flex-1 min-h-0 flex flex-col gap-1.5 overflow-hidden">
      {/* 1. Header Identity and Telemetry Bar */}
      <SpeakerHeaderBar
        activeSpeaker={activeSpeaker}
        speakingTime={speakingTime}
        timeRemaining={timeRemaining}
        timePercent={timePercent}
        isTimeOver={isTimeOver}
        relevancePct={relevancePct}
        noiseLevel={currentNoiseLevel}
        totalViolations={telemetry?.recent_alerts?.filter((alert) => alert.status === "ACTIVE").length || 0}
        sessionActive={sessionActive}
        isPaused={isPaused}
        isEndingSession={isEndingSession}
        isStartingSession={isStartingSession}
        onOpenReport={openReport}
        onEndSession={endSessionAndGenerateReport}
        onStartSession={startSession}
        onTogglePause={handleTogglePause}
        onOpenSchedule={() => setIsScheduleModalOpen(true)}
      />

      {/* Prominent Session Paused Notification Banner */}
      {sessionActive && isPaused && (
        <div className="bg-amber-950/80 border border-amber-500/50 text-amber-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between shadow-md animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="uppercase tracking-wide">
              PARLIAMENTARY SITTING PAUSED — FLOOR TIMERS & DECORUM MONITORS TEMPORARILY SUSPENDED
            </span>
          </div>
          <button
            onClick={handleTogglePause}
            className="px-2.5 py-0.5 rounded bg-amber-500 text-slate-950 font-black hover:bg-amber-400 transition-colors text-[10px] uppercase cursor-pointer"
          >
            Resume Sitting
          </button>
        </div>
      )}

      {/* Schedule Session Modal */}
      <ScheduleSessionModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSchedule={handleScheduleSession}
        currentTopic={telemetry?.current_bill || "Digital Education & AI Governance Bill 2026"}
        isScheduling={isScheduling}
      />

      {/* Mobile / Tablet Workspace Switcher (< lg) */}
      <div className="flex lg:hidden items-center bg-slate-900 p-1 rounded-xl border border-slate-800 flex-shrink-0">
        <button
          onClick={() => setActiveMobileView("floor")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
            activeMobileView === "floor"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Chamber Floor
        </button>
        <button
          onClick={() => setActiveMobileView("decorum")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
            activeMobileView === "decorum"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Decorum & Audio
        </button>
        <button
          onClick={() => setActiveMobileView("roster")}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold text-center transition-all ${
            activeMobileView === "roster"
              ? "bg-amber-600 text-white shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Roster ({filteredMembers.length})
        </button>
      </div>

      {/* 3. Main Operational Chamber Workspace */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-1.5 overflow-hidden">
        {/* Left Column: Camera Matrix & Live Whisper STT Transcript (7 cols) */}
        <div
          className={`lg:col-span-7 flex flex-col min-h-0 overflow-hidden ${
            activeMobileView === "floor" ? "flex-1 min-h-[340px]" : "hidden lg:flex"
          }`}
        >
          <SpeakerCameraWorkspace
            cameraMode={cameraMode}
            onCameraModeChange={setCameraMode}
            activeSpeakerMember={activeSpeakerMember}
            members={members}
          />
        </div>

        {/* Center-Right Column: Acoustic Meter & Live AI Decorum Log (2.5 cols) */}
        <div
          className={`lg:col-span-2 flex flex-col gap-1.5 min-h-0 overflow-hidden ${
            activeMobileView === "decorum" ? "flex-1 min-h-[340px]" : "hidden lg:flex"
          }`}
        >
          {/* Noise Level */}
          <div className="h-44 flex-shrink-0 bg-slate-900 rounded-xl border border-slate-800 p-2.5 overflow-hidden shadow-sm flex flex-col">
            <AcousticNoiseMeter />
          </div>

          {/* AI Decorum Log */}
          <div className="flex-1 min-h-0 bg-slate-900 rounded-xl border border-slate-800 p-2.5 overflow-hidden shadow-sm flex flex-col">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              <span>Decorum Infractions</span>
            </h3>
            <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
              {notifications.length === 0 ? (
                <p className="text-[11px] text-slate-500 italic text-center py-6">
                  No active chamber infractions logged.
                </p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div
                    key={n.id}
                    className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 truncate">{n.title}</span>
                      <Badge variant={n.severity === "CRITICAL" ? "danger" : "warning"}>
                        {n.severity}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400">{n.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
          <SpeakerDecisions
            suspensionRecs={suspensionRecs}
            pendingEmergencyRequests={pendingEmergencyRequests}
            onConfirmSuspension={handleConfirmSuspension}
            onRejectSuspension={handleRejectSuspension}
            onEmergencyDecision={handleEmergencyDecision}
          />
        </div>

        {/* Right Column: Raised Hands Queue + Member Discipline Roster (3 cols) */}
        <div
          className={`lg:col-span-3 flex flex-col gap-1.5 min-h-0 overflow-hidden ${
            activeMobileView === "roster" ? "flex-1 min-h-[340px]" : "hidden lg:flex"
          }`}
        >
          <SpeakerRaisedHandsPanel
            requests={pendingRaisedHands}
            activeSpeakerId={activeSpeaker?.member_id}
            isSessionActive={isLiveActive}
            onGrant={handleGrantFloor}
            onReject={handleRejectFloor}
            onReleaseFloor={handleReleaseFloor}
          />
          <div className="flex-1 min-h-0 flex flex-col">
            <SpeakerMemberRosterPanel
              members={filteredMembers}
              filterText={memberFilter}
              onFilterChange={setMemberFilter}
              activeSpeakerId={activeSpeaker?.seat_id}
              disciplineMap={disciplineMap}
              onSwitchSpeaker={switchSpeaker}
              onOpenScorecard={openScorecard}
              onRevokeSuspension={handleRevokeSuspension}
              onSuspendMember={handleManualSuspend}
              currentUserId={currentUser?.memberId}
              currentUserName={currentUser?.memberName}
              currentUserRole={currentUser?.role}
            />
          </div>
        </div>
      </div>
    </div>

  );
}
