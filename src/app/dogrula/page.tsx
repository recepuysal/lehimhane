import { Suspense } from "react";
import { VerifyEmailClient } from "@/components/verify-email-client";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="auth-shell"><p>Yükleniyor...</p></div>}>
      <VerifyEmailClient />
    </Suspense>
  );
}
