"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";

type NotificationItem = {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  thread: { id: string; title: string } | null;
  project: { id: string; title: string } | null;
  actor: { id: string; name: string } | null;
};

export function NotificationsList() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Bildirimler yüklenemedi");
        setItems([]);
        return;
      }
      setItems(data.notifications ?? []);
    } catch {
      setError("Bildirimler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function markAllRead() {
    setMarking(true);
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setMarking(false);
    await load();
    router.refresh();
  }

  async function openNotification(item: NotificationItem) {
    if (!item.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [item.id] }),
      });
    }

    if (item.thread?.id) {
      router.push(`/konu/${item.thread.id}`);
      router.refresh();
      return;
    }

    if (item.project?.id) {
      router.push(`/projeler/${item.project.id}`);
      router.refresh();
      return;
    }

    await load();
  }

  if (loading) {
    return <p className="muted">Bildirimler yükleniyor...</p>;
  }

  if (error) {
    return <p className="form-error">{error}</p>;
  }

  return (
    <div className="stack">
      <div className="panel-head" style={{ padding: 0, border: "none" }}>
        <h2 style={{ margin: 0, fontFamily: "var(--font-display), Georgia, serif" }}>
          Bildirimler
        </h2>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => void markAllRead()}
          disabled={marking || items.every((item) => item.read)}
        >
          {marking ? "İşaretleniyor..." : "Tümünü okundu yap"}
        </button>
      </div>

      <section className="panel">
        <ul className="notif-list">
          {items.length === 0 ? (
            <li className="notif-item muted">Henüz bildirimin yok.</li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={`notif-item${item.read ? "" : " notif-unread"}`}
                  onClick={() => void openNotification(item)}
                >
                  <div className="item-title">{item.message}</div>
                  <div className="item-meta item-meta-row">
                    {item.actor ? (
                      <Link
                        href={`/profil/${item.actor.id}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        {item.actor.name}
                      </Link>
                    ) : null}
                    <span>·</span>
                    <span>{formatDate(item.createdAt)}</span>
                    {!item.read ? <span className="notif-new">Yeni</span> : null}
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
