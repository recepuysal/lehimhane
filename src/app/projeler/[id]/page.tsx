import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { countLikes } from "@/lib/votes";
import { RankBadge } from "@/components/rank-badge";
import { RichText } from "@/components/rich-text";
import { LikeButton } from "@/components/like-button";
import { ProjectCommentForm } from "@/components/project-comment-form";
import { STATUS_LABEL } from "@/lib/projects";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, rank: true } },
      steps: { orderBy: { order: "asc" } },
      supplies: { orderBy: { order: "asc" } },
      votes: { select: { value: true, userId: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, rank: true } },
        },
      },
    },
  });

  if (!project) notFound();

  await prisma.project.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const steps =
    project.steps.length > 0
      ? project.steps
      : [
          {
            id: "legacy",
            order: 1,
            title: "Anlatım",
            body: project.body || project.summary,
            imageUrl: project.coverUrl,
          },
        ];

  const likeCount = countLikes(project.votes);
  const liked =
    userId != null &&
    project.votes.some((vote) => vote.userId === userId && vote.value === 1);

  return (
    <div className="stack instructable-detail">
      <div className="breadcrumb">
        <Link href="/">Forum</Link>
        <span>/</span>
        <Link href="/projeler">Projeler</Link>
        <span>/</span>
        <span>{project.title}</span>
      </div>

      <section className="instructable-detail-hero panel">
        <div className="instructable-detail-cover">
          {project.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={project.coverUrl} alt={project.title} />
          ) : null}
        </div>
        <div className="instructable-detail-intro">
          <div className="item-meta item-meta-row">
            <span className="tag-chip">{project.platform}</span>
            <span className="tag-chip">
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
            <span className="tag-chip">{project.viewCount + 1} görüntülenme</span>
          </div>
          <h1>{project.title}</h1>
          <p className="project-summary">{project.summary}</p>
          <p className="item-meta item-meta-row">
            <Link href={`/profil/${project.author.id}`} className="author-link">
              {project.author.name}
            </Link>
            <RankBadge rank={project.author.rank} compact />
            <span>·</span>
            <span>{formatDate(project.createdAt)}</span>
            <span>·</span>
            <span>{steps.length} adım</span>
            <span>·</span>
            <span>{project.comments.length} yorum</span>
          </p>
          <div className="action-row">
            <LikeButton
              target="project"
              targetId={project.id}
              initialCount={likeCount}
              initiallyLiked={liked}
              isAuthenticated={Boolean(userId)}
            />
            {session?.user?.id === project.authorId ? (
              <Link
                href={`/projeler/${project.id}/duzenle`}
                className="btn btn-primary"
              >
                Düzenle
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {project.body ? (
        <section className="panel instructable-block">
          <h2>Giriş</h2>
          <RichText content={project.body} />
        </section>
      ) : null}

      {project.supplies.length > 0 ? (
        <section className="panel instructable-block">
          <h2>Malzemeler</h2>
          <ul className="supply-display-list">
            {project.supplies.map((item) => (
              <li key={item.id}>
                <div className="supply-display-main">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="supply-link-name"
                    >
                      {item.name}
                    </a>
                  ) : (
                    <strong>{item.name}</strong>
                  )}
                  {item.note ? <span className="supply-note">{item.note}</span> : null}
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="supply-buy-link"
                    >
                      Satın al / Kaynak →
                    </a>
                  ) : null}
                </div>
                {item.quantity ? <span>{item.quantity}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="stack">
        {steps.map((step) => (
          <article key={step.id} className="panel instructable-step">
            <div className="instructable-step-head">
              <span className="step-number">Adım {step.order}</span>
              <h2>{step.title}</h2>
            </div>
            {step.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={step.imageUrl}
                alt={step.title}
                className={`instructable-step-image${
                  step.imageUrl.endsWith(".svg") ? " instructable-step-image-diagram" : ""
                }`}
              />
            ) : null}
            <div className="thread-body">
              <RichText content={step.body} />
            </div>
          </article>
        ))}
      </section>

      <section className="panel instructable-block">
        <div className="panel-head">
          <h2>Yorumlar ({project.comments.length})</h2>
        </div>
        <ul className="reply-list">
          {project.comments.length === 0 ? (
            <li className="reply-item muted">Henüz yorum yok. İlk yorumu sen yaz.</li>
          ) : (
            project.comments.map((comment) => (
              <li key={comment.id} className="reply-item">
                <div className="item-meta item-meta-row">
                  <Link
                    href={`/profil/${comment.author.id}`}
                    className="author-link"
                  >
                    {comment.author.name}
                  </Link>
                  <RankBadge rank={comment.author.rank} compact />
                  <span>·</span>
                  <span>{formatDate(comment.createdAt)}</span>
                </div>
                <div className="reply-body">
                  <RichText content={comment.body} />
                </div>
              </li>
            ))
          )}
        </ul>
        <div style={{ marginTop: "1rem" }}>
          <ProjectCommentForm
            projectId={project.id}
            isAuthenticated={Boolean(userId)}
          />
        </div>
      </section>
    </div>
  );
}
