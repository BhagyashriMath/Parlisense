import { Request, Response } from "express";
import { sessionService } from "../services/session.service";
import { telemetryService } from "../services/telemetry.service";
import { memberService } from "../services/member.service";
import { scorecardRepository } from "../repositories/scorecard.repository";
import { auditRepository } from "../repositories/audit.repository";
import { alertRepository } from "../repositories/alert.repository";
import { notificationRepository } from "../repositories/notification.repository";
import { aiService } from "../services/ai.service";

export class SessionController {
  async scheduleSession(req: Request, res: Response): Promise<void> {
    const { title, session_date, start_time, end_time, max_speaking_time_seconds, agenda, description, scheduled_by } = req.body;
    if (!title || !session_date || !start_time || !end_time) {
      res.status(400).json({ error: "title, session_date, start_time, and end_time are required." });
      return;
    }

    try {
      const result = await sessionService.scheduleSession({
        title,
        session_date,
        start_time,
        end_time,
        max_speaking_time_seconds: Number(max_speaking_time_seconds) || 300,
        agenda,
        description,
        scheduled_by: scheduled_by || "Hon. Speaker"
      });
      telemetryService.broadcast();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to schedule session" });
    }
  }

  async getNotifications(req: Request, res: Response): Promise<void> {
    const notifs = await notificationRepository.getAll(50);
    res.json({ notifications: notifs });
  }

  async getMemberNotifications(req: Request, res: Response): Promise<void> {
    const { memberId } = req.params;
    const notifs = await notificationRepository.findByMemberId(memberId, 50);
    res.json({ notifications: notifs });
  }

  async getConfig(req: Request, res: Response): Promise<void> {
    const config = sessionService.getConfig();
    const readiness = await sessionService.getReadiness();
    res.json({
      config,
      readiness
    });
  }

  updateConfig(req: Request, res: Response): void {
    const updated = sessionService.updateConfig(req.body);
    telemetryService.broadcast();
    res.json({ status: "CONFIG_SAVED", config: updated });
  }

  getTopics(req: Request, res: Response): void {
    res.json(sessionService.getTopics());
  }

  addTopic(req: Request, res: Response): void {
    const topic = sessionService.addTopic(req.body);
    res.status(201).json(topic);
  }

  deleteTopic(req: Request, res: Response): void {
    const deleted = sessionService.deleteTopic(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: "Topic not found" });
      return;
    }
    res.json({ status: "DELETED", id: req.params.id });
  }

  async getStatus(req: Request, res: Response): Promise<void> {
    const config = sessionService.getConfig();
    const state = telemetryService.getState();
    const activeMember = state.activeSpeakerId
      ? await memberService.getById(state.activeSpeakerId)
      : undefined;
    res.json({
      session_id: config.session_id,
      is_active: state.isActive,
      mode: state.mode,
      current_bill: config.current_topic,
      active_speaker: activeMember,
      emergency_active: state.emergencyActive,
      status: config.status,
      is_locked: config.is_locked
    });
  }

  async getCurrent(req: Request, res: Response): Promise<void> {
    res.json(await telemetryService.generateCurrentTelemetry());
  }

  getSummaryLive(req: Request, res: Response): void {
    const state = telemetryService.getState();
    const summary = aiService.generateLiveSummary(state.currentBill, []);
    res.json(summary);
  }

  getTimeline(req: Request, res: Response): void {
    const timeline = sessionService.getTimeline();
    res.json({ timeline, total_events: timeline.length });
  }

  async getAudit(req: Request, res: Response): Promise<void> {
    const events = await auditRepository.getRecent(250);
    res.json({ events, total_events: events.length });
  }

  async startSession(req: Request, res: Response): Promise<void> {
    const result = await sessionService.startSession();
    telemetryService.clearSpeakingRequests();
    telemetryService.updateState({
      sessionId: result.session_id,
      isActive: true,
      isPaused: false,
      pausedElapsedSeconds: 0,
      pauseTimestamp: null,
      startTime: Date.now(),
      activeSpeakerId: "",
      speakingStartTime: Date.now(),
      speakingDuration: 0,
      forcedEvent: null,
      speakingRequests: []
    });
    telemetryService.broadcast();

    res.json(result);
  }

  async stopSession(req: Request, res: Response): Promise<void> {
    const result = await sessionService.stopSession();
    telemetryService.clearSpeakingRequests();
    telemetryService.updateState({
      isActive: false,
      isPaused: false,
      speakingRequests: []
    });
    telemetryService.broadcast();

    res.json(result);
  }

  async pauseSession(req: Request, res: Response): Promise<void> {
    const state = telemetryService.getState();
    if (!state.isActive) {
      res.status(409).json({ error: "Start a session before pausing it" });
      return;
    }
    if (state.isPaused) {
      res.status(409).json({ error: "Session is already paused" });
      return;
    }
    const result = await sessionService.pauseSession();
    telemetryService.updateState({
      isPaused: true
    });
    res.json(result);
  }

  async resumeSession(req: Request, res: Response): Promise<void> {
    const state = telemetryService.getState();
    if (!state.isActive) {
      await this.startSession(req, res);
      return;
    }
    if (!state.isPaused) {
      res.status(409).json({ error: "Session is already running" });
      return;
    }
    const result = await sessionService.resumeSession();
    telemetryService.updateState({
      isActive: true,
      isPaused: false
    });
    res.json(result);
  }

  setMode(req: Request, res: Response): void {
    const { mode } = req.body;
    if (mode === "LIVE" || mode === "DEMO") {
      telemetryService.updateState({ mode });
      res.json({ status: "MODE_UPDATED", mode });
      return;
    }
    res.status(400).json({ error: "Invalid mode. Use 'LIVE' or 'DEMO'." });
  }

  async raiseHand(req: Request, res: Response): Promise<void> {
    const memberId = req.user?.id;
    if (!memberId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const state = telemetryService.getState();
    if (!state.isActive || state.isPaused) {
      res.status(409).json({ error: "The House is not in session. Wait until proceedings are live to raise your hand." });
      return;
    }
    if (state.activeSpeakerId === memberId) {
      res.status(409).json({ error: "You already hold the floor." });
      return;
    }
    const member = await memberService.getById(memberId);
    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const request = telemetryService.raiseRequest(member);
    if (!request) {
      res.status(409).json({ error: "Hand already raised. Await the Speaker's recognition." });
      return;
    }
    telemetryService.updateState({ speakingRequests: telemetryService.getState().speakingRequests });
    sessionService.addTimelineEvent({
      title: `${member.name} Raised Hand to Speak`,
      description: `${member.name} (${member.seat_id}) seeks the floor and is awaiting recognition by the Chair.`,
      type: "SPEECH",
      member_id: member.member_id
    });
    res.status(201).json({ status: "HAND_RAISED", request });
  }

  async withdrawHand(req: Request, res: Response): Promise<void> {
    const memberId = req.user?.id;
    if (!memberId) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    const removed = telemetryService.withdrawRequest(memberId);
    telemetryService.updateState({ speakingRequests: telemetryService.getState().speakingRequests });
    res.json({ status: removed ? "HAND_WITHDRAWN" : "NO_PENDING_REQUEST" });
  }

  async rejectRequest(req: Request, res: Response): Promise<void> {
    const { member_id } = req.body;
    if (!member_id) {
      res.status(400).json({ error: "member_id is required" });
      return;
    }
    const removed = telemetryService.withdrawRequest(member_id);
    const member = await memberService.getById(member_id);
    if (member) {
      sessionService.addTimelineEvent({
        title: `Request Declined: ${member.name}`,
        description: `The Chair has declined the request of ${member.name} (${member.seat_id}) to take the floor.`,
        type: "SPEECH",
        member_id
      });
    }
    telemetryService.updateState({ speakingRequests: telemetryService.getState().speakingRequests });
    res.json({ status: removed ? "REQUEST_DECLINED" : "NO_PENDING_REQUEST" });
  }

  async releaseFloor(req: Request, res: Response): Promise<void> {
    telemetryService.updateState({ activeSpeakerId: "" });
    sessionService.addTimelineEvent({
      title: "Floor Released by Chair",
      description: "The presiding officer has released the floor. The chamber awaits the next speaker.",
      type: "SPEECH"
    });
    res.json({ status: "FLOOR_RELEASED" });
  }

  getRequests(req: Request, res: Response): void {
    res.json({ requests: telemetryService.getState().speakingRequests });
  }

  async setSpeaker(req: Request, res: Response): Promise<void> {
    const { member_id } = req.body;
    if (!member_id) {
      res.status(400).json({ error: "member_id is required" });
      return;
    }

    const member = await memberService.getById(member_id);
    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    // Recognizing a member also lowers their raised hand.
    telemetryService.withdrawRequest(member_id);
    telemetryService.updateState({
      activeSpeakerId: member_id,
      speakingRequests: telemetryService.getState().speakingRequests
    });

    sessionService.addTimelineEvent({
      title: `${member.name} Recognized on Floor`,
      description: `Floor yielded to ${member.name} (${member.seat_id}). Microphone enabled.`,
      type: "SPEECH",
      member_id
    });

    res.json({ status: "SPEAKER_UPDATED", active_speaker: member });
  }

  setBill(req: Request, res: Response): void {
    const { bill } = req.body;
    if (!bill) {
      res.status(400).json({ error: "bill title is required" });
      return;
    }

    sessionService.updateConfig({ current_topic: bill });
    telemetryService.updateState({ currentBill: bill });

    sessionService.addTimelineEvent({
      title: "Legislative Agenda Updated",
      description: `House consideration advanced to: ${bill}`,
      type: "TOPIC_CHANGE"
    });

    res.json({ status: "BILL_UPDATED", current_bill: bill });
  }

  async getReport(req: Request, res: Response): Promise<void> {
    const config = sessionService.getConfig();
    // Read-only snapshot — never persist a report while the session is running.
    const report = await scorecardRepository.generateSessionReport(config.session_id, config.current_topic, false);
    res.json(report);
  }

  async getCompleteSummary(req: Request, res: Response): Promise<void> {
    const config = sessionService.getConfig();
    const report = await scorecardRepository.generateSessionReport(config.session_id, config.current_topic, false);

    const members = await memberService.getAll();
    const memberSummaries = await Promise.all(members.map(async (m) => {
      const card = await memberService.getScorecard(m.member_id);
      const speakingSeconds = Number(card?.statistics?.speaking_time_seconds || 0);
      const speakingTurns = Number(card?.statistics?.speaking_turns || 0);
      return {
        member_id: m.member_id,
        name: m.name,
        seat_id: m.seat_id,
        mic_id: m.mic_id,
        role: m.role,
        party: m.party,
        presence: m.status === "ABSENT" || m.status === "INACTIVE" ? "Absent" : "Present",
        speaking_time_formatted: `${Math.floor(speakingSeconds / 60)}:${String(speakingSeconds % 60).padStart(2, "0")}`,
        speaking_time_seconds: speakingSeconds,
        speeches_count: speakingTurns,
        agenda_relevance_pct: Number(card?.agenda_relevance ?? card?.categories?.agenda_relevance ?? 0),
        violations_count: m.violations_count || 0,
        warnings_count: m.warnings_count || 0,
        seat_compliance_pct: Number(card?.categories?.seat_compliance ?? 0),
        behavior_emotion: "Constructive & Calm",
        final_score: card?.overall_score || 90,
        grade: card?.grade || "A (High Constructive Record)"
      };
    }));

    const alertsRes = await alertRepository.findAll({ sessionId: config.session_id });

    const statistics = report.session_statistics || {};
    const analytics = report.ai_analytics_summary || {};
    const violationLog = report.rule_violations_log || [];
    const totalSpeakingSeconds = memberSummaries.reduce((sum, m) => sum + m.speaking_time_seconds, 0);
    const totalSpeeches = memberSummaries.reduce((sum, m) => sum + m.speeches_count, 0);
    const dynamicStatistics = {
      ...statistics,
      total_members_registered: members.length,
      total_members_present: memberSummaries.filter((m) => m.presence === "Present").length,
      total_active_speakers: memberSummaries.filter((m) => m.speeches_count > 0).length,
      total_speaking_time_minutes: Math.round(totalSpeakingSeconds / 60),
      total_alerts_issued: alertsRes.total,
      critical_violations: alertsRes.alerts.filter((a) => a.severity === "CRITICAL").length,
      high_severity_alerts: alertsRes.alerts.filter((a) => a.severity === "HIGH").length,
      unauthorized_movement_incidents: alertsRes.alerts.filter((a) => a.rule_id === "RULE_7_UNAUTHORIZED_MOVEMENT").length
    };
    const scoredMembers = memberSummaries.filter((m) => m.agenda_relevance_pct > 0);
    const dynamicAnalytics = {
      ...analytics,
      average_agenda_relevance_percentage: scoredMembers.length
        ? Math.round(scoredMembers.reduce((sum, m) => sum + m.agenda_relevance_pct, 0) / scoredMembers.length * 10) / 10
        : 0,
      decorum_compliance_index: dynamicStatistics.total_alerts_issued
        ? Math.max(0, Math.round((1 - dynamicStatistics.total_alerts_issued / Math.max(1, members.length * 5)) * 1000) / 10)
        : 100
    };
    res.json({
      session_information: {
        session_id: config.session_id,
        date: config.session_date,
        start_time: report.session_information?.start_time || config.start_time,
        end_time: report.session_information?.end_time || config.scheduled_end_time,
        total_duration: report.session_information?.duration || "0m",
        session_type: config.session_type,
        house_chamber: config.house_chamber,
        number_of_members: members.length,
        number_of_topics: config.topics.length
      },
      session_activity: {
        total_speeches: totalSpeeches,
        total_speaking_time_formatted: `${dynamicStatistics.total_speaking_time_minutes}m`,
        total_speaking_time_seconds: totalSpeakingSeconds,
        average_speaking_time_formatted: `${Math.round(totalSpeakingSeconds / Math.max(1, totalSpeeches))}s`,
        number_of_active_members: dynamicStatistics.total_active_speakers,
        number_of_members_present: dynamicStatistics.total_members_present
      },
      report_id: report.report_id,
      session_statistics: dynamicStatistics,
      ai_analytics_summary: dynamicAnalytics,
      violation_summary: {
        total_violations: alertsRes.total,
        low_violations: violationLog.filter((a: any) => a.severity === "LOW").length,
        medium_violations: violationLog.filter((a: any) => a.severity === "MEDIUM").length,
        high_violations: statistics.high_severity_alerts || 0,
        critical_violations: statistics.critical_violations || 0,
        types_breakdown: {}
      },
      topic_wise_summary: config.topics,
      member_wise_summary: memberSummaries,
      member_scorecards: report.member_scorecards || [],
      timeline: sessionService.getTimeline(),
      generated_at: report.generated_at || new Date().toISOString()
    });
  }

  async getAnalytics(req: Request, res: Response): Promise<void> {
    const alertsRes = await alertRepository.findAll();
    res.json({
      chamber_occupancy: 0.95,
      decorum_compliance_rate: 0.92,
      average_relevance_score: 89.4,
      total_violations_today: alertsRes.total,
      average_speech_duration_seconds: 245
    });
  }

  getSeats(req: Request, res: Response): void {
    const state = telemetryService.getState();
    res.json(state.seatMovementStates);
  }
}

export const sessionController = new SessionController();
