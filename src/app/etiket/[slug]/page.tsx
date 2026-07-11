import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RankBadge } from "@/components/rank-badge";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TagPage({ params }: Props) {
  const { slug } = await params;

  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      threads: {
        include: {
          thread: {
            include: {
              author: { select: { name: true, rank: true } },
              category: { select: { name: true } },
              _count: { select: { replies: true } },
            },
          },
        },
        orderBy: {
          thread: { updatedAt: "desc" },
        },
      },
    },
  });

  if (!tag) {
    notFound();
  }

  return (
    <div className="stack">
      <div className="breadcrumb">
        <Link href="/">Forum</Link>
        <span>/</span>
        <span>#{tag.name}</span>
      </div>

      <section className="hero">
        <h1>#{tag.name}</h1>
        <p>Bu etiketle açılmış konular.</p>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Konular</h2>
          <Link href="/yeni-konu" className="btn btn-primary">
            Yeni konu
          </Link>
        </div>
        <ul className="thread-list">
          {tag.threads.length === 0 ? (
            <li className="thread-item muted">Bu etikette henüz konu yok.</li>
          ) : (
            tag.threads.map(({ thread }) => (
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
                    <span>{thread.category.name}</span>
                    <span>·</span>
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
