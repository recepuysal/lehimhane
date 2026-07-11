"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export function RegisterForm() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    };

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok && response.status !== 201) {
      setError(data.error ?? "Kayıt başarısız");
      return;
    }

    if (data.mailSent === false || data.error) {
      setError(data.error ?? "Mail gönderilemedi");
      if (data.needsVerification) {
        setSuccess(
          "Hesap oluştu. Girişte «Doğrulama mailini tekrar gönder» ile dene; Resend hesabındaki e-postayı kullan.",
        );
      }
      return;
    }

    if (data.needsVerification) {
      setSuccess(
        data.message ??
          "Kayıt tamam. E-postandaki doğrulama bağlantısını aç, sonra giriş yap.",
      );
      event.currentTarget.reset();
      return;
    }

    setSuccess("Kayıt tamam. Giriş yapabilirsin.");
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        İsim
        <input name="name" type="text" required minLength={2} autoComplete="name" />
      </label>
      <label>
        E-posta
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        Şifre
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {success ? <p className="form-success">{success}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Kayıt ol"}
      </button>
      <p className="form-meta">
        Zaten hesabın var mı? <Link href="/giris">Giriş yap</Link>
      </p>
    </form>
  );
}
