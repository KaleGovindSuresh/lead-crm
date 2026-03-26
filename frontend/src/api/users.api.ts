import api from "./axiosClient";
import type {
  GetUsersResponse,
  Role,
  UpdateRoleBody,
  UpdateRoleResponse,
} from "../types";

// ── API calls ────────────────────────────────────────────────────────────────
export const usersApi = {
  /**
   * GET /users
   * Returns all users (admin/manager only on the backend).
   * Used to populate the `assignedTo` dropdown in LeadForm.
   */
  getUsers: async (): Promise<GetUsersResponse> => {
    const { data } = await api.get<GetUsersResponse>("/users");
    return data;
  },

  /**
   * PATCH /users/:id/role
   * Updates the role of a specific user (admin only).
   */
  updateUserRole: async (
    id: string,
    role: Role,
  ): Promise<UpdateRoleResponse> => {
    const body: UpdateRoleBody = { role };
    const { data } = await api.patch<UpdateRoleResponse>(
      `/users/${id}/role`,
      body,
    );
    return data;
  },
};
