import { Response, NextFunction } from "express";
import { leadService } from "../services/lead.service";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ValidationError } from "../utils/error";

function toSingleString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (let i = value.length - 1; i >= 0; i -= 1) {
      const next = toSingleString(value[i]);
      if (next) return next;
    }
  }
  return undefined;
}

export const leadController = {
  async createLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const { name, phone, email, source, status, notes, assignedTo } =
        req.body as {
          name: string;
          phone: string;
          email?: string;
          source: string;
          status?: string;
          notes?: string;
          assignedTo?: string;
        };

      const lead = await leadService.createLead({
        name,
        phone,
        email,
        source: source as any,
        status: status as any,
        notes,
        assignedTo,
        createdBy: user.id,
        requestingUserRole: user.role,
      });

      res.status(201).json({ message: "Lead created successfully", lead });
    } catch (err) {
      next(err);
    }
  },

  async getLeads(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const result = await leadService.listLeads({
        q: toSingleString(req.query["q"]),
        status: toSingleString(req.query["status"]),
        source: toSingleString(req.query["source"]),
        assignedTo: toSingleString(req.query["assignedTo"]),
        createdFrom: toSingleString(req.query["createdFrom"]),
        createdTo: toSingleString(req.query["createdTo"]),
        sort: toSingleString(req.query["sort"]),
        page: toSingleString(req.query["page"]),
        limit: toSingleString(req.query["limit"]),
        userId: user.id,
        role: user.role,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getLeadById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const leadId = toSingleString(req.params["id"]);
      if (!leadId) throw new ValidationError("Lead ID is required");
      const lead = await leadService.getLeadById(leadId, user.id, user.role);
      res.status(200).json({ lead });
    } catch (err) {
      next(err);
    }
  },

  async updateLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const leadId = toSingleString(req.params["id"]);
      if (!leadId) throw new ValidationError("Lead ID is required");
      const lead = await leadService.updateLead(
        leadId,
        req.body as any,
        user.id,
        user.role,
      );
      res.status(200).json({ message: "Lead updated successfully", lead });
    } catch (err) {
      next(err);
    }
  },

  async deleteLead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const user = req.user!;
      const leadId = toSingleString(req.params["id"]);
      if (!leadId) throw new ValidationError("Lead ID is required");
      await leadService.deleteLead(leadId, user.id, user.role);
      res.status(200).json({ message: "Lead deleted successfully" });
    } catch (err) {
      next(err);
    }
  },

  async getStatsSummary(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const createdFrom = toSingleString(req.query["createdFrom"]);
      const createdTo = toSingleString(req.query["createdTo"]);
      const stats = await leadService.getStatsSummary(createdFrom, createdTo);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  },
};
