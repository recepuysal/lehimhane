import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RankBadge } from "@/components/rank-badge";
import { HeaderSearch } from "@/components/header-search";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q: raw } = await searchParams;
  const q = String(raw ?? "").trim();

  const threads =
    q.length >= 2
      ? await prisma.thread.findMany({
          where: {
            OR: [
              { title: { contains: q } },
              { body: { contains: q } },
              { author: { name: { contains: q } } },
              {
                tags: {
                  some: {
                    tag: { name: { contains: q } },
                  },
                },
              },
            ],
          },
          orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
          take: 40,
          include: {
            author: { select: { name: true, rank: true } },
            category: { select: { name: true, slug: true } },
            tags: { include: { tag: { select: { name: true, slug: true } } } },
            _count: { select: { replies: true } },
          },
        })
      : [];

  return (
    <div className="stack">
      <section className="hero">
        <h1>Konu ara</h1>
        <p>Başlık, içerik, yazar veya etiket ile ara.</p>
        <div className="search-page-form">
          <HeaderSearch />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>
            {q.length < 2
              ? "Sonuçlar"
              : `"${q}" için ${threads.length} sonuç`}
          </h2>
        </div>
        {q.length > 0 && q.length < 2 ? (
          <p className="muted" style={{ padding: "0.85rem 1rem" }}>
            En az 2 karakter yaz.
          </p>
        ) : null}
        <ul className="thread-list">
          {q.length >= 2 && threads.length === 0 ? (
            <li className="thread-item muted">Eşleşen konu bulunamadı.</li>
          ) : null}
          {threads.map((thread) => (
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
                  {thread.tags.length > 0 ? (
                    <>
                      <span>·</span>
                      <span>
                        {thread.tags.map((item) => `#${item.tag.name}`).join(" ")}
                      </span>
                    </>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
