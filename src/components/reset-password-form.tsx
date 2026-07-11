"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const password2 = String(form.get("password2") ?? "");

    if (password !== password2) {
      setLoading(false);
      setError("Şifreler eşleşmiyor.");
      return;
    }

    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.error ?? "Şifre güncellenemedi");
      return;
    }

    router.push("/giris?sifre=ok");
    router.refresh();
  }

  if (!token) {
    return (
      <p className="form-error">
        Geçersiz bağlantı. <Link href="/sifremi-unuttum">Yeniden iste</Link>
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        Yeni şifre
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </label>
      <label>
        Yeni şifre (tekrar)
        <input
          name="password2"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Şifreyi güncelle"}
      </button>
    </form>
  );
}
