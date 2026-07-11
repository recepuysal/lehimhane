"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function ForgotPasswordForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(form.get("email") ?? "") }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "İstek başarısız");
      return;
    }

    setSuccess(data.message ?? "Bağlantı gönderildi.");
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        E-posta
        <input name="email" type="email" required autoComplete="email" />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Gönderiliyor..." : "Sıfırlama bağlantısı gönder"}
      </button>
      <p className="form-meta">
        <Link href="/giris">Girişe dön</Link>
      </p>
    </form>
  );
}
