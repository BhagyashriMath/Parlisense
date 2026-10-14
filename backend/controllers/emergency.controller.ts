import { Request, Response } from "express";
import { emergencyRepository } from "../repositories/emergency.repository";
import { telemetryService } from "../services/telemetry.service";
import { memberService } from "../services/member.service";
import { auditRepository } from "../repositories/audit.repository";

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

    const decided = await emergencyRepository.decide(req.params.id, status, decided_by || "Hon. Speaker");
    if (!decided) {
      res.status(404).json({ error: "Emergency request not found" });
      return;
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

