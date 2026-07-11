import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { InstructableProjectForm } from "@/components/instructable-project-form";

export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/giris");

  return (
    <div className="instructable-shell">
      <h1>Yeni proje</h1>
      <p className="muted">
        Kapak, malzemeler ve adım adım anlatım ile projeni yayınla.
      </p>
      <InstructableProjectForm mode="create" />
    </div>
  );
}
