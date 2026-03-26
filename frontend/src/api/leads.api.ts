import api from "./axiosClient";
import type {
  DeleteLeadResponse,
  GetLeadsResponse,
  Lead,
  LeadBody,
  LeadFiltersParams,
  LeadMutationResponse,
  LeadSource,
  LeadStatus,
  LeadsSummary,
  SummaryParams,
} from "../types";

// ── API calls ─────────────────────────────────────────────────────────────────
export const leadsApi = {
  /**
   * GET /leads
   * Supports filtering, sorting, and pagination via query params.
   */
  getLeads: async (
    params: LeadFiltersParams = {},
  ): Promise<GetLeadsResponse> => {
    // Strip undefined so Axios doesn't serialize empty keys
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    );
    const { data } = await api.get<GetLeadsResponse>("/leads", {
      params: cleanParams,
    });
    return data;
  },

  /**
   * GET /leads/:id
   * Fetches a single lead by ID.
   */
  getLead: async (id: string): Promise<Lead> => {
    const { data } = await api.get<{ lead: Lead }>(`/leads/${id}`);
    return data.lead;
  },

  /**
   * POST /leads
   * Creates a new lead.
   */
  createLead: async (body: LeadBody): Promise<LeadMutationResponse> => {
    const { data } = await api.post<LeadMutationResponse>("/leads", body);
    return data;
  },

  /**
   * PATCH /leads/:id
   * Partially updates an existing lead.
   */
  updateLead: async (
    id: string,
    body: LeadBody,
  ): Promise<LeadMutationResponse> => {
    const { data } = await api.patch<LeadMutationResponse>(
      `/leads/${id}`,
      body,
    );
    return data;
  },

  /**
   * DELETE /leads/:id
   * Deletes a lead (admin only).
   */
  deleteLead: async (id: string): Promise<DeleteLeadResponse> => {
    const { data } = await api.delete<DeleteLeadResponse>(`/leads/${id}`);
    return data;
  },

  /**
   * GET /leads/stats/summary
   * Returns aggregate counts by status and source.
   */
  getSummary: async (params: SummaryParams = {}): Promise<LeadsSummary> => {
    const cleanParams = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== ""),
    );
    const { data } = await api.get<{
      totalLeads: number;
      byStatus: Record<LeadStatus, number>;
      bySource: Record<LeadSource, number>;
    }>("/leads/stats/summary", {
      params: cleanParams,
    });
    return {
      total: data.totalLeads,
      byStatus: data.byStatus,
      bySource: data.bySource,
    };
  },
};
