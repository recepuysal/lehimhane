"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [mailSent, setMailSent] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);

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

    if (!response.ok) {
      setLoading(false);
      setError(data.error ?? "Kayıt başarısız");
      return;
    }

    if (data.needsVerification) {
      setLoading(false);
      setPendingEmail(payload.email);
      setMailSent(Boolean(data.mailSent));
      setSuccess(data.message ?? "Doğrulama maili gönderildi.");
      if (!data.mailSent) {
        setError(data.message ?? "Doğrulama maili gönderilemedi.");
        setSuccess("");
      }
      return;
    }

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setSuccess("Kayıt oldu. Şimdi giriş sayfasından girebilirsin.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function resendVerification() {
    if (!pendingEmail) return;
    setResendBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Mail gönderilemedi");
        setMailSent(false);
      } else {
        setSuccess(data.message ?? "Doğrulama maili yeniden gönderildi.");
        setMailSent(true);
        setError("");
      }
    } finally {
      setResendBusy(false);
    }
  }

  if (pendingEmail) {
    return (
      <div className="auth-form">
        {success ? <p className="form-success">{success}</p> : null}
        {error ? <p className="form-error">{error}</p> : null}
        <p className="form-meta">
          {mailSent ? (
            <>
              <strong>{pendingEmail}</strong> adresine doğrulama maili
              gönderildi. Bağlantıya tıkladıktan sonra giriş yapabilirsin.
            </>
          ) : (
            <>
              Hesap oluşturuldu ama mail henüz gitmedi. Aşağıdan yeniden
              göndermeyi dene. Railway’de{" "}
              <code>EMAIL_FROM</code> değerinin tam olarak şöyle olduğundan emin
              ol: <code>Lehimhane &lt;onboarding@resend.dev&gt;</code>
            </>
          )}
        </p>
        <button
          className="btn btn-primary btn-block"
          type="button"
          disabled={resendBusy}
          onClick={() => void resendVerification()}
        >
          {resendBusy ? "Gönderiliyor..." : "Doğrulama mailini yeniden gönder"}
        </button>
        <p className="form-meta">
          <Link href="/giris">Giriş sayfasına git</Link>
        </p>
      </div>
    );
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
