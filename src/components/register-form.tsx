"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
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

    const result = await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Kayıt oldu, ancak giriş yapılamadı. Lütfen giriş sayfasını deneyin.");
      return;
    }

    router.push("/");
    router.refresh();
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
      <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
        {loading ? "Kaydediliyor..." : "Kayıt ol"}
      </button>
      <p className="form-meta">
        Zaten hesabın var mı? <Link href="/giris">Giriş yap</Link>
      </p>
    </form>
  );
}
