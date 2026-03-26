import { Router } from 'express';
import { leadController } from '../controllers/lead.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requirePermissions } from '../rbac/rbac.middleware';
import {
  validate,
  createLeadSchema,
  updateLeadSchema,
} from '../middlewares/validate.middleware';

const router = Router();

// All lead routes require authentication
router.use(authMiddleware);

// GET /api/leads/stats/summary  — must be BEFORE /:id route
router.get(
  '/stats/summary',
  requirePermissions('dashboard:read'),
  leadController.getStatsSummary
);

// GET /api/leads
router.get('/', requirePermissions('lead:read'), leadController.getLeads);

// POST /api/leads
router.post(
  '/',
  requirePermissions('lead:write'),
  validate(createLeadSchema),
  leadController.createLead
);

// GET /api/leads/:id
router.get('/:id', requirePermissions('lead:read'), leadController.getLeadById);

// PATCH /api/leads/:id
router.patch(
  '/:id',
  requirePermissions('lead:write'),
  validate(updateLeadSchema),
  leadController.updateLead
);

// DELETE /api/leads/:id
router.delete('/:id', requirePermissions('lead:delete'), leadController.deleteLead);

export default router;