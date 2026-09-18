import { Request, Response } from "express";
import { telemetryService } from "../services/telemetry.service";
import { memberService } from "../services/member.service";
import { alertRepository } from "../repositories/alert.repository";
import { auditRepository } from "../repositories/audit.repository";
import { transcriptRepository } from "../repositories/transcript.repository";
import { aiService } from "../services/ai.service";

export class AiController {
  getStatus(req: Request, res: Response): void {
    res.json({
      status: "HEALTHY",
      active_models: 8,
      subsystems: {
        speech_recognition: "ACTIVE",
        nlp_agenda_analysis: "ACTIVE",
        emotion_detection: "ACTIVE",
        offensive_detection: "ACTIVE",
        computer_vision: "ACTIVE",
        noise_analysis: "ACTIVE",
        rule_engine: "ACTIVE",
        database_storage: "ACTIVE"
      }
    });
  }

  async simulateEvent(req: Request, res: Response): Promise<void> {
    const { event_type } = req.body;
    telemetryService.updateState({ forcedEvent: event_type || null });
    await auditRepository.log("SIMULATION_EVENT_TRIGGERED", { event_type });
    res.json({ status: "SIMULATION_TRIGGERED", event_type });
  }

  async processAudio(req: Request, res: Response): Promise<void> {
    const { db_level, decibel, transcript_snippet, member_id } = req.body;
    const level = typeof db_level === "number" ? db_level : decibel;
    if (typeof level === "number" && level > 0) {
      telemetryService.updateState({
        audioNoiseDb: level,
        liveAudioLevel: Math.round((level / 100) * 100),
        lastRealAudioTime: Date.now()
      });
    }
    let transcript;
    if (typeof transcript_snippet === "string" && transcript_snippet.trim().length > 3) {
      const activeSpeakerId = telemetryService.getState().activeSpeakerId;
      const member = (member_id ? await memberService.getById(member_id) : null)
        || (activeSpeakerId ? await memberService.getById(activeSpeakerId) : null)
        || memberService.getCachedAll()[0];
      if (member) {
        transcript = await transcriptRepository.save({
          id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          session_id: telemetryService.getState().sessionId,
          member_id: member.member_id,
          seat_id: member.seat_id,
          text: transcript_snippet.trim(),
          confidence: 0.9,
          emotion: "Neutral",
          relevance: aiService.analyzeSpeechRelevance(transcript_snippet).score
        });
        telemetryService.broadcast();
      }
    }
    res.json({ status: "AUDIO_TELEMETRY_RECORDED", transcript });
  }

  async memberPresence(req: Request, res: Response): Promise<void> {
    const { member_id, violation_type, seat_id, confidence } = req.body;
    const member = await memberService.getById(member_id);

    const wrongSeat = Boolean(seat_id && seat_id !== member?.seat_id);
    if ((violation_type || wrongSeat) && member) {
      const effectiveViolation = wrongSeat ? "WRONG_SEAT_OCCUPANCY" : violation_type;
      telemetryService.updateSeatPresence(
        seat_id || member.seat_id,
        effectiveViolation !== "MEMBER_ABSENT",
        effectiveViolation === "MEMBER_ABSENT" ? "Absent" : effectiveViolation === "WRONG_SEAT_OCCUPANCY" ? "Wrong Seat" : "Unauthorized Movement"
      );
      await alertRepository.save({
        alert_id: `ALT-PRES-${member_id}-${Date.now()}`,
        session_id: telemetryService.getState().sessionId,
        member_id,
        seat_id: seat_id || member.seat_id,
        rule_id: "RULE_7_UNAUTHORIZED_MOVEMENT",
        type: effectiveViolation,
        severity: effectiveViolation === "MEMBER_ABSENT" || wrongSeat ? "HIGH" : "MEDIUM",
        alert_level: effectiveViolation === "MEMBER_ABSENT" || wrongSeat ? 3 : 2,
        title: effectiveViolation === "MEMBER_ABSENT" ? `Member Absent from Camera — ${member.name}` : wrongSeat ? `Wrong Seat Occupancy — ${member.name}` : `Significant Movement Detected — ${member.name}`,
        description: wrongSeat
          ? `${member.name} was detected at ${seat_id}; assigned seat is ${member.seat_id}.`
          : `Vision detected displacement for ${member.name} (Seat ${seat_id || member.seat_id}).`,
        member_audio_message: "Please remain in your assigned seat position.",
        suspension_recommended: false,
        source_module: "Member Presence Monitor",
        status: "ACTIVE"
      });

      telemetryService.broadcast();
    }

    res.json({ status: "PRESENCE_RECORDED", member_id, violation_type, seat_id });
  }
}

export const aiController = new AiController();
