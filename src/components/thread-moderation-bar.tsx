"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ThreadModerationBar({
  threadId,
  pinned,
  locked,
  canPin,
  canLock,
}: {
  threadId: string;
  pinned: boolean;
  locked: boolean;
  canPin: boolean;
  canLock: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!canPin && !canLock) return null;

  async function toggle(field: "pinned" | "locked", value: boolean) {
    setError("");
    setLoading(true);
    const response = await fetch(`/api/threads/${threadId}/moderation`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(data.error ?? "İşlem başarısız");
      return;
    }
    router.refresh();
  }

  return (
    <div className="thread-mod-bar">
      {canPin ? (
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={() => toggle("pinned", !pinned)}
        >
          {pinned ? "Sabitlemeyi kaldır" : "Sabitle"}
        </button>
      ) : null}
      {canLock ? (
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={() => toggle("locked", !locked)}
        >
          {locked ? "Kilidi aç" : "Kilitle"}
        </button>
      ) : null}
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}
