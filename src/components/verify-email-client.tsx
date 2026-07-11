"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Doğrulanıyor...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Doğrulama bağlantısı eksik.");
      return;
    }

    let cancelled = false;

    (async () => {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      if (cancelled) return;

      if (!response.ok) {
        setStatus("error");
        setMessage(data.error ?? "Doğrulama başarısız");
        return;
      }

      setStatus("ok");
      setMessage("E-posta doğrulandı. Artık giriş yapabilirsin.");
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="auth-shell">
      <h1>E-posta doğrulama</h1>
      <p className={status === "error" ? "form-error" : "form-success"}>{message}</p>
      {status !== "loading" ? (
        <p className="form-meta">
          <Link href="/giris">Giriş sayfasına git</Link>
        </p>
      ) : null}
    </div>
  );
}
