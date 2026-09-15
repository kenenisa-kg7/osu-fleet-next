"use client";

import { useEffect, useRef, useState } from "react";
import {
  getNotifications,
  markNotificationRead,
  type Notification,
} from "../lib/api";

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");
      const result = await getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // This effect intentionally loads notifications and starts polling.
// eslint-disable-next-line react-hooks/set-state-in-effect
void loadNotifications();
    const interval = setInterval(() => void loadNotifications(), 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleMarkRead(notificationId: string) {
    try {
      await markNotificationRead(notificationId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        )
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update notification");
    }
  }

  return (
    <div ref={containerRef} className="relative">
        <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Notifications"
        className="relative rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-50)] p-2.5 text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-100)] hover:text-[var(--color-text-primary)]"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-0)] shadow-[var(--shadow-card-hover)]">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</p>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-[var(--color-primary-700)]">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <p className="p-4 text-sm text-[var(--color-text-muted)]">Loading...</p>
            )}

            {error && (
              <p role="alert" className="p-4 text-sm text-[var(--color-danger)]">
                {error}
              </p>
            )}

            {!loading && notifications.length === 0 && (
              <p className="p-4 text-sm text-[var(--color-text-muted)]">No notifications yet.</p>
            )}

            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                className={`block w-full border-b border-[var(--color-border)] p-4 text-left last:border-b-0 transition hover:bg-[var(--color-surface-50)] ${
                  notification.is_read ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {notification.title}
                  </p>
                  {!notification.is_read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary-600)]" />
                  )}
                </div>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {notification.message}
                </p>
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}