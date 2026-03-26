export type Role = "admin" | "manager" | "sales";

export type Permission =
  | "user:read"
  | "user:write"
  | "lead:read"
  | "lead:write"
  | "lead:delete"
  | "dashboard:read"
  | "notification:read";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";
export type LeadSource = "website" | "referral" | "cold" | "other";
export type SortOption =
  | "name:asc"
  | "name:desc"
  | "createdAt:asc"
  | "createdAt:desc";

export interface LeadFiltersParams {
  q?: string;
  status?: LeadStatus | "";
  source?: LeadSource | "";
  assignedTo?: string;
  createdFrom?: string;
  createdTo?: string;
  sort?: SortOption | "";
  page?: number;
  limit?: number;
}

export interface LeadAssignee {
  _id: string;
  name: string;
  email: string;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  assignedTo?: LeadAssignee | null;
  createdAt: string;
  updatedAt: string;
}

export interface LeadBody {
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  status: LeadStatus;
  notes?: string;
  assignedTo?: string | null;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface GetLeadsResponse extends PaginatedResponse<Lead> {}

export interface LeadMutationResponse {
  message: string;
  lead: Lead;
}

export interface DeleteLeadResponse {
  message: string;
}

export interface SummaryParams {
  createdFrom?: string;
  createdTo?: string;
}

export interface LeadsSummary {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<LeadSource, number>;
}

export type LeadSummary = LeadsSummary;

export type NotificationType =
  | "lead_created"
  | "lead_assigned"
  | "lead_reassigned"
  | "lead_status_changed"
  | "lead_deleted";

export interface NotificationLead {
  _id: string;
  name: string;
  status: LeadStatus;
}

export interface Notification {
  _id: string;
  type: NotificationType;
  message: string;
  lead?: NotificationLead | null;
  read: boolean;
  createdAt: string;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

export type GetNotificationsResponse = PaginatedResponse<Notification>;

export interface MarkReadResponse {
  message: string;
  notification: Notification;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface GetUsersResponse {
  users: User[];
  total: number;
}

export interface UpdateRoleBody {
  role: Role;
}

export interface UpdateRoleResponse {
  message: string;
  user: User;
}
