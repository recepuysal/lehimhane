import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RankBadge } from "@/components/rank-badge";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      threads: {
        orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
        include: {
          author: { select: { name: true, rank: true } },
          _count: { select: { replies: true } },
        },
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="breadcrumb">
        <Link href="/">Forum</Link>
        <span>/</span>
        <span>{category.name}</span>
      </div>

      <section className="hero">
        <h1>{category.name}</h1>
        <p>{category.description}</p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Konular</h2>
          <Link href="/yeni-konu" className="btn btn-primary">
            Yeni konu
          </Link>
        </div>
        <ul className="thread-list">
          {category.threads.length === 0 ? (
            <li className="thread-item muted">Bu kategoride henüz konu yok.</li>
          ) : (
            category.threads.map((thread) => (
              <li key={thread.id}>
                <Link href={`/konu/${thread.id}`} className="thread-item">
                  <div className="item-title">
                    {thread.pinned ? (
                      <span className="status-chip status-chip-inline">Sabit</span>
                    ) : null}
                    {thread.locked ? (
                      <span className="status-chip status-chip-inline">Kilitli</span>
                    ) : null}
                    {thread.title}
                  </div>
                  <div className="item-meta item-meta-row">
                    <span>{thread.author.name}</span>
                    <RankBadge rank={thread.author.rank} compact />
                    <span>·</span>
                    <span>{formatDate(thread.updatedAt)}</span>
                    <span>·</span>
                    <span>{thread._count.replies} yanıt</span>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
