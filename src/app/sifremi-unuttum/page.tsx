import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default async function ForgotPasswordPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/");

  return (
    <div className="auth-shell">
      <h1>Şifremi unuttum</h1>
      <p className="muted">
        Kayıtlı e-postana sıfırlama bağlantısı gönderilir.
      </p>
      <ForgotPasswordForm />
    </div>
  );
}
