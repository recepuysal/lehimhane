import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="auth-shell">
      <h1>Giriş yap</h1>
      <p className="muted">Demo: demo@lehimhane.local / demo1234</p>
      <LoginForm />
    </div>
  );
}
