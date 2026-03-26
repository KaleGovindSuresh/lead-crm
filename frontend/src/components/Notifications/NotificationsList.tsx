import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { notificationsApi } from "../../api/notifications.api";
import { formatDateTime } from "../../utils/formatters";
import { useToast } from "../../context/ToastContext";
import { EmptyState, ErrorState } from "../UI/States";
import { PageLoader } from "../UI/Spinner";
import type { Notification, Pagination } from "../../types";

export const NotificationsList = () => {
  const showToast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (pageToLoad = 1) => {
    setError(null);
    setIsLoading(true);
    try {
      const result = await notificationsApi.getNotifications({
        page: pageToLoad,
        limit: 12,
      });
      setNotifications(result.data);
      setPagination(result.pagination);
    } catch {
      setError("Failed to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(page);
  }, [fetchNotifications, page]);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification,
        ),
      );
      showToast("Notification marked as read", "success");
    } catch {
      showToast("Could not mark notification", "error");
    } finally {
      setMarkingId(null);
    }
  };

  if (isLoading) return <PageLoader />;
  if (error)
    return (
      <ErrorState message={error} onRetry={() => fetchNotifications(page)} />
    );

  const canPrev = page > 1;
  const canNext = pagination ? page < pagination.totalPages : false;

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <EmptyState title="No notifications yet" />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`rounded-xl border px-4 py-3 ${
                notification.read
                  ? "border-[#1e2d4d] bg-[#0d1120]"
                  : "border-blue-500/40 bg-blue-500/10"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-100">{notification.message}</p>
                <button
                  onClick={() => handleMarkRead(notification._id)}
                  disabled={notification.read || markingId === notification._id}
                  className="text-xs font-semibold uppercase tracking-wider text-blue-400 disabled:opacity-50"
                >
                  {notification.read ? "Read" : "Mark read"}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                <span>{formatDateTime(notification.createdAt)}</span>
                {notification.lead && (
                  <Link
                    to={`/leads/${notification.lead._id}/edit`}
                    className="text-blue-300 hover:text-blue-200"
                  >
                    View lead
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!canPrev}
            className="btn-secondary text-xs px-3 py-1 disabled:opacity-40"
          >
            Prev
          </button>
          <span>
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => (canNext ? p + 1 : p))}
            disabled={!canNext}
            className="btn-secondary text-xs px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
