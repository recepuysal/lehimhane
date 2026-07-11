"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  replyId: string;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
};

export function ReplyActionsMenu({
  replyId,
  canEdit,
  canDelete,
  onEdit,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (!canEdit && !canDelete) return null;

  async function onDelete() {
    setOpen(false);
    const confirmed = window.confirm("Bu yanıt silinsin mi?");
    if (!confirmed) return;

    setError("");
    setLoading(true);
    try {
      const response = await fetch(`/api/replies/${replyId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Yanıt silinemedi");
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reply-actions" ref={rootRef}>
      <button
        type="button"
        className="reply-menu-trigger"
        aria-label="Yanıt seçenekleri"
        aria-expanded={open}
        disabled={loading}
        onClick={() => setOpen((value) => !value)}
      >
        ⋯
      </button>
      {open ? (
        <div className="reply-menu" role="menu">
          {canEdit ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              Düzenle
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              role="menuitem"
              className="reply-menu-danger"
              onClick={() => void onDelete()}
            >
              Sil
            </button>
          ) : null}
        </div>
      ) : null}
      {error ? <span className="form-error">{error}</span> : null}
    </div>
  );
}
