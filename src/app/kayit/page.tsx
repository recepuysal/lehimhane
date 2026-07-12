import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { RegisterForm } from "@/components/register-form";

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="auth-shell">
      <h1>Kayıt ol</h1>
      <p className="muted">
        Hesap oluştur, Acemi Pin olarak başla; yazdıkça rütben yükselir.
        Kayıttan sonra e-posta doğrulaması gerekir.
      </p>
      <RegisterForm />
    </div>
  );
}
