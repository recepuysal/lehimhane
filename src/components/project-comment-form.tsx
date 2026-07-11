"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ProjectCommentForm({
  projectId,
  isAuthenticated,
}: {
  projectId: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="reply-gate">
        Yorum yazmak için <Link href="/giris">giriş yapın</Link>.
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch(`/api/projects/${projectId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Yorum eklenemedi");
      return;
    }

    setBody("");
    router.refresh();
  }

  return (
    <form className="composer" onSubmit={onSubmit}>
      <label>
        Yorumun
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          maxLength={2000}
          required
          minLength={2}
          placeholder="Projeyle ilgili soru veya geri bildirim yaz..."
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Gönderiliyor..." : "Yorumu gönder"}
      </button>
    </form>
  );
}
