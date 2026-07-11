import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { PROJECT_PLATFORMS, STATUS_LABEL } from "@/lib/projects";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ platform?: string }>;
};

export default async function ProjectsPage({ searchParams }: Props) {
  const { platform } = await searchParams;
  const selected =
    platform && (PROJECT_PLATFORMS as readonly string[]).includes(platform)
      ? platform
      : null;

  const projects = await prisma.project.findMany({
    where: selected ? { platform: selected } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true } },
      _count: { select: { steps: true } },
    },
  });

  return (
    <div className="stack">
      <section className="instructable-hero">
        <div>
          <p className="eyebrow">Adım adım elektronik</p>
          <h1>Projeler</h1>
          <p>
            Elektronik projelerini adım adım paylaş. Malzemeleri koy, adımları yaz,
            topluluğa ilham ver.
          </p>
          <div className="action-row">
            <Link href="/projeler/yeni" className="btn btn-primary">
              Proje yayınla
            </Link>
            <Link href="/" className="btn btn-ghost">
              Foruma dön
            </Link>
          </div>
        </div>
      </section>

      <div className="platform-filters">
        <Link
          href="/projeler"
          className={`filter-chip${!selected ? " filter-chip-active" : ""}`}
        >
          Tümü
        </Link>
        {PROJECT_PLATFORMS.map((item) => (
          <Link
            key={item}
            href={`/projeler?platform=${encodeURIComponent(item)}`}
            className={`filter-chip${selected === item ? " filter-chip-active" : ""}`}
          >
            {item}
          </Link>
        ))}
      </div>

      {projects.length === 0 ? (
        <section className="panel">
          <div className="thread-item muted">
            Bu kategoride henüz proje yok.{" "}
            <Link href="/projeler/yeni">İlk projeyi sen yaz</Link>
          </div>
        </section>
      ) : (
        <div className="instructable-grid">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projeler/${project.id}`}
              className="instructable-card"
            >
              <div
                className="instructable-card-cover"
                style={
                  project.coverUrl
                    ? { backgroundImage: `url(${project.coverUrl})` }
                    : undefined
                }
              />
              <div className="instructable-card-body">
                <div className="item-meta item-meta-row">
                  <span>{project.platform}</span>
                  <span>·</span>
                  <span>{STATUS_LABEL[project.status] ?? project.status}</span>
                </div>
                <h2>{project.title}</h2>
                <p>{project.summary}</p>
                <div className="instructable-card-meta">
                  <span>by {project.author.name}</span>
                  <span>
                    {project._count.steps} adım · {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
