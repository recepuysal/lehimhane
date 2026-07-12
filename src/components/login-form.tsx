"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    searchParams.get("sifre") === "ok"
      ? "Şifren güncellendi. Yeni şifrenle giriş yapabilirsin."
      : "",
  );
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [emailForResend, setEmailForResend] = useState("");
  const [resendBusy, setResendBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInfo("");
    setNeedsVerification(false);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    const preflight = await fetch("/api/auth/login-preflight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const preflightData = await preflight.json();

    if (preflight.status === 403 && preflightData.needsVerification) {
      setLoading(false);
      setNeedsVerification(true);
      setEmailForResend(email);
      setError(preflightData.message ?? "E-posta doğrulanmamış.");
      return;
    }

    if (!preflight.ok) {
      setLoading(false);
      setError(
        preflight.status === 429
          ? "Çok fazla deneme. Biraz sonra tekrar dene."
          : "E-posta veya şifre hatalı.",
      );
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
    if (!emailForResend) return;
    setResendBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailForResend }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Mail gönderilemedi");
      } else {
        setInfo(data.message ?? "Doğrulama maili gönderildi.");
      }
    } finally {
      setResendBusy(false);
    }
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
          defaultValue={emailForResend}
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
      {info ? <p className="form-success">{info}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      {needsVerification ? (
        <button
          className="btn btn-ghost btn-block"
          type="button"
          disabled={resendBusy}
          onClick={() => void resendVerification()}
        >
          {resendBusy ? "Gönderiliyor..." : "Doğrulama mailini yeniden gönder"}
        </button>
      ) : null}
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Giriş yapılıyor..." : "Giriş yap"}
      </button>
      <p className="form-meta">
        <Link href="/sifremi-unuttum">Şifremi unuttum</Link>
        {" · "}
        Hesabın yok mu? <Link href="/kayit">Kayıt ol</Link>
      </p>
    </form>
  );
}
