import api from "./axiosClient";
import type {
  LoginBody,
  RegisterBody,
  LoginResponse,
  RegisterResponse,
} from "../types";

// ── API calls ────────────────────────────────────────────────────────────────
export const authApi = {
  /**
   * POST /auth/login
   * Returns JWT token + user object on success.
   */
  login: async (body: LoginBody): Promise<LoginResponse> => {
    const { data } = await api.post<LoginResponse>("/auth/login", body);
    return data;
  },

  /**
   * POST /auth/register
   * Creates a new account. May return the user directly or a success message.
   */
  register: async (body: RegisterBody): Promise<RegisterResponse> => {
    const { data } = await api.post<RegisterResponse>("/auth/register", body);
    return data;
  },

  /**
   * POST /auth/logout
   * Invalidates the server-side session/token if the backend tracks it.
   * Safe to call even if the server returns 401 (token already gone).
   */
  logout: async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Swallow — client clears local state regardless
    }
  },
};
