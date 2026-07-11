"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function NotificationBell() {
  const { status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/notifications/unread-count");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled) {
          setUnreadCount(Number(data.unreadCount) || 0);
        }
      } catch {
        // sessiz geç
      }
    }

    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [status]);

  if (status !== "authenticated") {
    return null;
  }

  return (
    <Link href="/bildirimler" className="notif-bell" aria-label="Bildirimler">
      <span className="notif-bell-icon" aria-hidden>
        ●
      </span>
      <span>Bildirimler</span>
      {unreadCount > 0 ? (
        <span className="notif-count">{unreadCount > 99 ? "99+" : unreadCount}</span>
      ) : null}
    </Link>
  );
}
