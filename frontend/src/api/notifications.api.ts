import api from "./axiosClient";
import type {
  GetNotificationsParams,
  GetNotificationsResponse,
  MarkReadResponse,
  UnreadCountResponse,
} from "../types";

// ── API calls ──────────────────────────────────────────────────────────────────
export const notificationsApi = {
  /**
   * GET /notifications
   * Returns paginated list of notifications for the current user.
   */
  getNotifications: async (
    params: GetNotificationsParams = {}
  ): Promise<GetNotificationsResponse> => {
    const { data } = await api.get<GetNotificationsResponse>("/notifications", {
      params,
    });
    return data;
  },

  /**
   * GET /notifications/unread-count
   * Returns the number of unread notifications.
   * Used by NotificationBell to show the badge.
   */
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get<UnreadCountResponse>(
      "/notifications/unread-count"
    );
    return data.unreadCount;
  },

  /**
   * PATCH /notifications/:id/read
   * Marks a single notification as read.
   */
  markAsRead: async (id: string): Promise<MarkReadResponse> => {
    const { data } = await api.patch<MarkReadResponse>(
      `/notifications/${id}/read`
    );
    return data;
  },
};
