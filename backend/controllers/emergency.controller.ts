import { Request, Response } from "express";
import { emergencyRepository } from "../repositories/emergency.repository";
import { telemetryService } from "../services/telemetry.service";
import { memberService } from "../services/member.service";
import { auditRepository } from "../repositories/audit.repository";
import { alertRepository } from "../repositories/alert.repository";
import { notificationRepository } from "../repositories/notification.repository";

export class EmergencyController {
  async triggerEmergency(req: Request, res: Response): Promise<void> {
    const { source } = req.body;
    telemetryService.updateState({
      emergencyActive: true,
      emergencySource: source || "Manual Physical Button"
    });

    await auditRepository.log("EMERGENCY_TRIGGERED", { source: source || "Manual Physical Button" });
    res.json({ status: "EMERGENCY_ACTIVATED", emergency: true });
  }

  async resetEmergency(req: Request, res: Response): Promise<void> {
    telemetryService.updateState({
      emergencyActive: false,
      emergencySource: undefined
    });

    await auditRepository.log("EMERGENCY_RESET", { reset_by: "Speaker" });
    res.json({ status: "EMERGENCY_CLEARED", emergency: false });
  }

  async getRequests(req: Request, res: Response): Promise<void> {
    const requests = await emergencyRepository.findAll();
    res.json({ requests, total_count: requests.length });
  }

  async createRequest(req: Request, res: Response): Promise<void> {
    const { member_id, reason } = req.body;
    if (!member_id || !reason) {
      res.status(400).json({ error: "member_id and reason are required" });
      return;
    }

    const member = await memberService.getById(member_id);
    if (!member) {
      res.status(404).json({ error: "Member not found" });
      return;
    }

    const created = await emergencyRepository.create({
      session_id: telemetryService.getState().sessionId,
      member_id,
      reason
    });

    await auditRepository.log("EMERGENCY_EXIT_REQUESTED", { member_id, reason });
    telemetryService.broadcast();
    res.status(201).json(created);
  }

  async decideRequest(req: Request, res: Response): Promise<void> {
    let { status, approved, decided_by } = req.body;
    if (!status && typeof approved === "boolean") {
      status = approved ? "APPROVED" : "REJECTED";
    }
    if (status === "DENIED") {
      status = "REJECTED";
    }
    if (status !== "APPROVED" && status !== "REJECTED") {
      res.status(400).json({ error: "Status must be APPROVED or REJECTED" });
      return;
    }

    const allRequests = await emergencyRepository.findAll();
    const reqEntity = allRequests.find((r) => r.id === req.params.id);

    const decided = await emergencyRepository.decide(req.params.id, status, decided_by || "Hon. Speaker");
    if (!decided) {
      res.status(404).json({ error: "Emergency request not found" });
      return;
    }

    const memberId = reqEntity?.member_id;
    const member = memberId ? await memberService.getById(memberId) : null;
    const seatId = reqEntity?.seat_id || member?.seat_id || "S001";
    const memberName = reqEntity?.member_name || member?.name || "Hon. Member";

    if (memberId) {
      const alertId = `ALT-EMG-DEC-${Date.now()}`;
      await alertRepository.save({
        alert_id: alertId,
        session_id: telemetryService.getState().sessionId,
        member_id: memberId,
        seat_id: seatId,
        rule_id: "RULE_8_EMERGENCY_BUTTON",
        type: status === "APPROVED" ? "EMERGENCY_EXIT_APPROVED" : "EMERGENCY_EXIT_REJECTED",
        severity: status === "APPROVED" ? "HIGH" : "MEDIUM",
        alert_level: status === "APPROVED" ? 3 : 2,
        title: status === "APPROVED" ? `Emergency Exit Approved — ${memberName}` : `Emergency Exit Declined — ${memberName}`,
        description: status === "APPROVED"
          ? `Hon. Speaker has APPROVED the emergency exit request (${reqEntity?.reason || "Emergency"}). ${memberName} is authorized to exit the chamber.`
          : `Hon. Speaker has DECLINED the emergency exit request. ${memberName} is requested to remain at desk.`,
        member_audio_message: status === "APPROVED"
          ? "Your emergency exit request has been granted by the Honourable Speaker. You may safely exit the chamber."
          : "Your emergency exit request was declined by the Honourable Speaker. Please remain in your seat.",
        suspension_recommended: false,
        source_module: "Speaker Console",
        status: "ACTIVE"
      });

      await notificationRepository.create({
        member_id: memberId,
        title: status === "APPROVED" ? "🚑 Emergency Exit Approved" : "⛔ Emergency Exit Declined",
        description: status === "APPROVED"
          ? "The Speaker has approved your emergency exit request. You may proceed to exit the chamber."
          : "The Speaker has declined your emergency exit request. Please remain in your seat.",
        type: status === "APPROVED" ? "ALERT" : "WARNING",
        member_audio_message: status === "APPROVED"
          ? "Your emergency exit request has been granted by the Honourable Speaker. You may safely exit the chamber."
          : "Your emergency exit request was declined by the Honourable Speaker. Please remain in your seat."
      });
    }

    await auditRepository.log("EMERGENCY_EXIT_DECIDED", {
      request_id: req.params.id,
      status,
      decided_by: decided_by || "Hon. Speaker"
    });

    telemetryService.broadcast();
    res.json(decided);
  }
}

export const emergencyController = new EmergencyController();

