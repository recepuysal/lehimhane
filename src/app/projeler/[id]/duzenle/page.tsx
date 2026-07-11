import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InstructableProjectForm } from "@/components/instructable-project-form";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/giris");

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" } },
      supplies: { orderBy: { order: "asc" } },
    },
  });

  if (!project) notFound();
  if (project.authorId !== session.user.id) redirect(`/projeler/${id}`);

  const steps =
    project.steps.length > 0
      ? project.steps.map((step) => ({
          title: step.title,
          body: step.body,
          imageUrl: step.imageUrl,
        }))
      : [
          {
            title: "Adım 1",
            body: project.body || "Bu projeyi adımlara bölebilirsin.",
            imageUrl: project.coverUrl,
          },
        ];

  return (
    <div className="instructable-shell">
      <div className="breadcrumb">
        <Link href="/projeler">Projeler</Link>
        <span>/</span>
        <Link href={`/projeler/${project.id}`}>{project.title}</Link>
        <span>/</span>
        <span>Düzenle</span>
      </div>
      <h1>Proje düzenle</h1>
      <p className="muted">Adımları, malzemeleri ve kapağı güncelle.</p>
      <InstructableProjectForm
        mode="edit"
        projectId={project.id}
        initial={{
          title: project.title,
          summary: project.summary,
          body: project.body,
          platform: project.platform,
          status: project.status,
          coverUrl: project.coverUrl,
          steps,
          supplies: project.supplies.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            note: item.note,
            link: item.link,
          })),
        }}
      />
    </div>
  );
}
