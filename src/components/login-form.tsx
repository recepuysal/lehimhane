"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    setEmailForResend(email);

    const preflight = await fetch("/api/auth/login-preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const pre = await preflight.json();

    if (!preflight.ok) {
      setLoading(false);
      if (pre.error === "EMAIL_NOT_VERIFIED") {
        setError("E-posta henüz doğrulanmamış.");
        return;
      }
      setError("E-posta veya şifre hatalı.");
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-posta veya şifre hatalı.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function resendVerification() {
    if (!emailForResend) {
      setError("Önce e-posta adresini yazıp giriş dene.");
      return;
    }
    setInfo("");
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailForResend }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Mail gönderilemedi");
      return;
    }
    setInfo(data.message ?? "Doğrulama maili gönderildi.");
  }

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      <label>
        E-posta
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          onChange={(e) => setEmailForResend(e.target.value)}
        />
      </label>
      <label>
        Şifre
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
      {info ? <p className="form-success">{info}</p> : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
      {error.includes("doğrulanmamış") ? (
        <button
          className="btn btn-ghost btn-block"
          type="button"
          onClick={resendVerification}
        >
          Doğrulama mailini tekrar gönder
        </button>
      ) : null}
      <p className="form-meta">
        <Link href="/sifremi-unuttum">Şifremi unuttum</Link>
        {" · "}
        Hesabın yok mu? <Link href="/kayit">Kayıt ol</Link>
      </p>
    </form>
  );
}
