"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ComposerEditor } from "@/components/composer-editor";

export function ReplyEditForm({
  replyId,
  initialBody,
  onCancel,
}: {
  replyId: string;
  initialBody: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const body = String(formData.get("body") ?? "").trim();

    const response = await fetch(`/api/replies/${replyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Yanıt güncellenemedi");
      return;
    }

    onCancel();
    router.refresh();
  }

  return (
    <form className="reply-edit-form composer" onSubmit={onSave}>
      <ComposerEditor
        name="body"
        label="Yanıtı düzenle"
        defaultValue={initialBody}
        required
        minLength={2}
        rows={5}
      />
      {error ? <p className="form-error">{error}</p> : null}
      <div className="action-row">
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={loading}
          onClick={onCancel}
        >
          Vazgeç
        </button>
      </div>
    </form>
  );
}
