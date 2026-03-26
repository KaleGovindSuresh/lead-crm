import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../../api/notifications.api";
import { getSocket } from "../../sockets/socket";
import { formatDateTime } from "../../utils/formatters";
import type { Notification } from "../../types";

export const NotificationBell = () => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [recent, setRecent] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count on mount
  useEffect(() => {
    notificationsApi
      .getUnreadCount()
      .then((count) => {
        setUnreadCount(count);
      })
      .catch(() => {});
  }, []);

  // Fetch recent notifications for dropdown preview
  useEffect(() => {
    if (open) {
      notificationsApi
        .getNotifications({ page: 1, limit: 5 })
        .then((result) => {
          setRecent((result.data ?? []).slice(0, 5));
        })
        .catch(() => {});
    }
  }, [open]);

  // Socket listener
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = (notification: Notification) => {
      setUnreadCount((c) => c + 1);
      setRecent((prev) => [notification, ...prev].slice(0, 5));
    };

    socket.on("notification", handler);
    return () => {
      socket.off("notification", handler);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead(id);
      setRecent((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#1e2d4d] bg-[#131c35] text-slate-400 transition-colors hover:border-blue-500/40 hover:text-blue-400"
        aria-label="Notifications"
      >
        <svg
          className="h-4.5 w-4.5 h-[18px] w-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="pulse-glow absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="animate-fade-in absolute right-0 top-11 z-50 w-80 rounded-xl border border-[#1e2d4d] bg-[#0f1629] shadow-2xl shadow-black/50">
          <div className="flex items-center justify-between border-b border-[#1e2d4d] px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Notifications
            </h3>
            <button
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              View all
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-sm text-slate-500">No notifications yet</p>
              </div>
            ) : (
              recent.map((n) => (
                <div
                  key={n._id}
                  className={`flex items-start gap-3 border-b border-[#1a2440] px-4 py-3 last:border-0 ${
                    !n.read ? "bg-blue-500/5" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${!n.read ? "bg-blue-500" : "bg-slate-700"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-600">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => handleMarkRead(n._id, e)}
                      className="shrink-0 text-[10px] text-blue-400 hover:text-blue-300"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
