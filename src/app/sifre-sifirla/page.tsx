import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ResetPasswordForm } from "@/components/reset-password-form";

function ResetInner({ token }: { token: string }) {
  return (
    <div className="auth-shell">
      <h1>Yeni şifre</h1>
      <ResetPasswordForm token={token} />
    </div>
  );
}

async function ResetPageBody({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/");
  const params = await searchParams;
  return <ResetInner token={params.token ?? ""} />;
}

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<div className="auth-shell"><p>Yükleniyor...</p></div>}>
      <ResetPageBody searchParams={searchParams} />
    </Suspense>
  );
}
