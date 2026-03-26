import { HydratedDocument, Types } from 'mongoose';
import { LeadModel, LeadSource, LeadStatus, ILead } from '../models/lead.model';
import { UserModel } from '../models/user.model';
import { notificationService } from './notification.service.js';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '../utils/error';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status?: LeadStatus;
  notes?: string;
  assignedTo?: string;
  createdBy: string;
  requestingUserRole: string;
}

export interface UpdateLeadInput {
  name?: string;
  phone?: string;
  email?: string;
  source?: LeadSource;
  status?: LeadStatus;
  notes?: string;
  assignedTo?: string | null;
}

export interface LeadListQuery {
  q?: string;
  status?: string;
  source?: string;
  assignedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: string;
  page?: string | number;
  limit?: string | number;
  userId: string;
  role: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildOwnershipFilter(userId: string, role: string): Record<string, unknown> {
  if (role === 'sales') {
    return {
      $or: [
        { createdBy: new Types.ObjectId(userId) },
        { assignedTo: new Types.ObjectId(userId) },
      ],
    };
  }
  return {};
}

const ALLOWED_SORT_FIELDS = ['name', 'status', 'source', 'createdAt', 'updatedAt'];
const ALLOWED_SORT_ORDERS = ['asc', 'desc'];

function parseSortParam(sort?: string): Record<string, 1 | -1> {
  const defaultSort: Record<string, 1 | -1> = { createdAt: -1, _id: -1 };
  if (!sort) return defaultSort;

  const [field, order] = sort.split(':');
  if (
    !field ||
    !order ||
    !ALLOWED_SORT_FIELDS.includes(field) ||
    !ALLOWED_SORT_ORDERS.includes(order)
  ) {
    return defaultSort;
  }

  return { [field]: order === 'asc' ? 1 : -1, _id: -1 };
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const leadService = {
  async createLead(input: CreateLeadInput) {
    const { requestingUserRole, createdBy, assignedTo, ...rest } = input;

    // Only manager/admin can assign on create
    if (assignedTo && requestingUserRole === 'sales') {
      throw new ForbiddenError('Sales users cannot assign leads during creation');
    }

    // Validate assignedTo user exists if provided
    if (assignedTo) {
      const assignee = await UserModel.findById(assignedTo);
      if (!assignee) throw new ValidationError('Assigned user does not exist');
    }

    const createdById = new Types.ObjectId(createdBy);
    const assignedToId = assignedTo ? new Types.ObjectId(assignedTo) : null;

    const lead = (await LeadModel.create({
      ...rest,
      createdBy: createdById,
      assignedTo: assignedToId,
    })) as HydratedDocument<ILead>;

    // Trigger notifications
    const managersAdmins = await UserModel.find({ role: { $in: ['admin', 'manager'] } }).select('_id');
    const notifyIds = new Set(managersAdmins.map((u) => u._id.toString()));
    if (assignedTo) notifyIds.add(assignedTo);

    await notificationService.createAndDispatch({
      userIds: Array.from(notifyIds),
      type: 'lead_created',
      message: `New lead "${lead.name}" was created`,
      leadId: lead._id.toString(),
    });

    return lead;
  },

  async getLeadById(leadId: string, userId: string, role: string) {
    const lead = await LeadModel.findById(leadId)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!lead) throw new NotFoundError('Lead');

    if (role === 'sales') {
      const isOwner =
        lead.createdBy._id.toString() === userId ||
        (lead.assignedTo && lead.assignedTo._id.toString() === userId);
      if (!isOwner) throw new ForbiddenError('Access denied to this lead');
    }

    return lead;
  },

  async updateLead(
    leadId: string,
    input: UpdateLeadInput,
    userId: string,
    role: string
  ) {
    const lead = await LeadModel.findById(leadId);
    if (!lead) throw new NotFoundError('Lead');

    // Ownership check for sales
    if (role === 'sales') {
      const isOwner =
        lead.createdBy.toString() === userId ||
        (lead.assignedTo && lead.assignedTo.toString() === userId);
      if (!isOwner) throw new ForbiddenError('Access denied to this lead');
    }

    // Sales cannot change assignedTo
    if ('assignedTo' in input && role === 'sales') {
      throw new ForbiddenError('Sales users cannot reassign leads');
    }

    // Validate new assignee
    if (input.assignedTo) {
      const assignee = await UserModel.findById(input.assignedTo);
      if (!assignee) throw new ValidationError('Assigned user does not exist');
    }

    const prevStatus = lead.status;
    const prevAssignedTo = lead.assignedTo?.toString();
    const newAssignedTo = input.assignedTo;

    const updatePayload: Partial<ILead> = {};
    if (input.name !== undefined) updatePayload.name = input.name;
    if (input.phone !== undefined) updatePayload.phone = input.phone;
    if (input.email !== undefined) updatePayload.email = input.email;
    if (input.source !== undefined) updatePayload.source = input.source;
    if (input.status !== undefined) updatePayload.status = input.status;
    if (input.notes !== undefined) updatePayload.notes = input.notes;
    if ('assignedTo' in input) {
      updatePayload.assignedTo = input.assignedTo
        ? new Types.ObjectId(input.assignedTo)
        : null;
    }

    Object.assign(lead, updatePayload);
    await lead.save();

    // ── Notification triggers ───────────────────────────────────────────────

    // Status changed
    if (input.status && input.status !== prevStatus) {
      const recipients = await UserModel.find({ role: { $in: ['admin', 'manager'] } }).select('_id');
      const notifyIds = new Set(recipients.map((u) => u._id.toString()));
      if (lead.assignedTo) notifyIds.add(lead.assignedTo.toString());

      await notificationService.createAndDispatch({
        userIds: Array.from(notifyIds),
        type: 'lead_status_changed',
        message: `Lead "${lead.name}" status changed from ${prevStatus} to ${input.status}`,
        leadId: lead._id.toString(),
      });
    }

    // Newly assigned
    if (newAssignedTo && !prevAssignedTo) {
      await notificationService.createAndDispatch({
        userIds: [newAssignedTo],
        type: 'lead_assigned',
        message: `Lead "${lead.name}" has been assigned to you`,
        leadId: lead._id.toString(),
      });
    }

    // Reassigned to a different person
    if (newAssignedTo && prevAssignedTo && newAssignedTo !== prevAssignedTo) {
      await notificationService.createAndDispatch({
        userIds: [newAssignedTo],
        type: 'lead_reassigned',
        message: `Lead "${lead.name}" has been reassigned to you`,
        leadId: lead._id.toString(),
      });
    }

    return lead.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' },
    ]);
  },

  async deleteLead(leadId: string, userId: string, role: string) {
    const lead = await LeadModel.findById(leadId);
    if (!lead) throw new NotFoundError('Lead');

    // Ownership check for sales
    if (role === 'sales') {
      const isOwner =
        lead.createdBy.toString() === userId ||
        (lead.assignedTo && lead.assignedTo.toString() === userId);
      if (!isOwner) throw new ForbiddenError('Access denied to this lead');
    }

    const leadName = lead.name;
    const leadId_ = lead._id.toString();

    await lead.deleteOne();

    // Notify managers/admins
    await notificationService.notifyManagersAndAdmins(
      'lead_deleted',
      `Lead "${leadName}" was deleted`,
      leadId_
    );
  },

  async listLeads(query: LeadListQuery) {
    const {
      q,
      status,
      source,
      assignedTo,
      createdFrom,
      createdTo,
      sort,
      userId,
      role,
    } = query;

    const page = Math.max(1, parseInt(String(query.page ?? 1), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 10), 10)));
    const skip = (page - 1) * limit;

    // Base filter — ownership for sales
    const matchFilter: Record<string, unknown> = buildOwnershipFilter(userId, role);

    // Search
    if (q) {
      matchFilter['$or'] = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
      ];
    }

    if (status) matchFilter['status'] = status;
    if (source) matchFilter['source'] = source;

    // assignedTo filter — manager/admin only
    const assignedToId = typeof assignedTo === 'string' ? assignedTo : undefined;
    if (assignedToId && role !== 'sales') {
      matchFilter['assignedTo'] = new Types.ObjectId(assignedToId);
    }

    // Date range
    if (createdFrom || createdTo) {
      const dateFilter: Record<string, Date> = {};
      if (createdFrom) {
        const d = new Date(createdFrom);
        if (!isNaN(d.getTime())) dateFilter['$gte'] = d;
      }
      if (createdTo) {
        const d = new Date(createdTo);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          dateFilter['$lte'] = d;
        }
      }
      if (Object.keys(dateFilter).length) matchFilter['createdAt'] = dateFilter;
    }

    const sortObj = parseSortParam(sort);

    const results = await LeadModel.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          data: [
            { $sort: sortObj },
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'users',
                localField: 'createdBy',
                foreignField: '_id',
                as: 'createdBy',
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            {
              $lookup: {
                from: 'users',
                localField: 'assignedTo',
                foreignField: '_id',
                as: 'assignedTo',
                pipeline: [{ $project: { name: 1, email: 1 } }],
              },
            },
            {
              $addFields: {
                createdBy: { $arrayElemAt: ['$createdBy', 0] },
                assignedTo: { $arrayElemAt: ['$assignedTo', 0] },
              },
            },
          ],
          total: [{ $count: 'count' }],
        },
      },
    ]);

    const data = results[0]?.data ?? [];
    const total = results[0]?.total[0]?.count ?? 0;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async getStatsSummary(createdFrom?: string, createdTo?: string) {
    const matchFilter: Record<string, unknown> = {};

    if (createdFrom || createdTo) {
      const dateFilter: Record<string, Date> = {};
      if (createdFrom) {
        const d = new Date(createdFrom);
        if (!isNaN(d.getTime())) dateFilter['$gte'] = d;
      }
      if (createdTo) {
        const d = new Date(createdTo);
        if (!isNaN(d.getTime())) {
          d.setHours(23, 59, 59, 999);
          dateFilter['$lte'] = d;
        }
      }
      if (Object.keys(dateFilter).length) matchFilter['createdAt'] = dateFilter;
    }

    const results = await LeadModel.aggregate([
      { $match: matchFilter },
      {
        $facet: {
          totalLeads: [{ $count: 'count' }],
          byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
          bySource: [{ $group: { _id: '$source', count: { $sum: 1 } } }],
        },
      },
    ]);

    const raw = results[0];
    const totalLeads = raw?.totalLeads[0]?.count ?? 0;

    // Normalize — ensure all enum values present
    const statusEnums: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];
    const sourceEnums: LeadSource[] = ['website', 'referral', 'cold', 'other'];

    const byStatus: Record<string, number> = Object.fromEntries(
      statusEnums.map((s) => [s, 0])
    );
    for (const item of raw?.byStatus ?? []) {
      if (item._id in byStatus) byStatus[item._id] = item.count;
    }

    const bySource: Record<string, number> = Object.fromEntries(
      sourceEnums.map((s) => [s, 0])
    );
    for (const item of raw?.bySource ?? []) {
      if (item._id in bySource) bySource[item._id] = item.count;
    }

    return { totalLeads, byStatus, bySource };
  },
};
