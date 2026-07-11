"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
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

  return (
    <form className="auth-form" onSubmit={onSubmit}>
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
          autoComplete="current-password"
        />
      </label>
      {error ? <p className="form-error">{error}</p> : null}
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
