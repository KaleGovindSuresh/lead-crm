import { Response, NextFunction } from 'express';
import { leadService } from '../services/lead.service';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export const leadController = {
  async createLead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const { name, phone, email, source, status, notes, assignedTo } = req.body as {
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

      res.status(201).json({ message: 'Lead created successfully', lead });
    } catch (err) {
      next(err);
    }
  },

  async getLeads(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const result = await leadService.listLeads({
        ...req.query as Record<string, string>,
        userId: user.id,
        role: user.role,
      });
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  },

  async getLeadById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const lead = await leadService.getLeadById(req.params['id']!, user.id, user.role);
      res.status(200).json({ lead });
    } catch (err) {
      next(err);
    }
  },

  async updateLead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      const lead = await leadService.updateLead(
        req.params['id']!,
        req.body as any,
        user.id,
        user.role
      );
      res.status(200).json({ message: 'Lead updated successfully', lead });
    } catch (err) {
      next(err);
    }
  },

  async deleteLead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = req.user!;
      await leadService.deleteLead(req.params['id']!, user.id, user.role);
      res.status(200).json({ message: 'Lead deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  async getStatsSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { createdFrom, createdTo } = req.query as {
        createdFrom?: string;
        createdTo?: string;
      };
      const stats = await leadService.getStatsSummary(createdFrom, createdTo);
      res.status(200).json(stats);
    } catch (err) {
      next(err);
    }
  },
};