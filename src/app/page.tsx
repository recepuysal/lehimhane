import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RankBadge } from "@/components/rank-badge";
import { categoryDemoImage } from "@/lib/demo-images";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { threads: true } },
    },
  });

  const recentThreads = await prisma.thread.findMany({
    take: 8,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      author: { select: { name: true, rank: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { name: true, slug: true } } } },
      _count: { select: { replies: true } },
    },
  });

  const recentProjects = await prisma.project.findMany({
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
    },
  });

  return (
    <div className="stack">
      <section className="hero">
        <div className="hero-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/lehimhane-logo.png"
            alt=""
            className="hero-logo"
            width={96}
            height={96}
          />
          <div className="hero-copy">
            <h1>Lehimhane</h1>
            <p>
              Arduino, Raspberry Pi, STM32, PCB ve hobi elektronik. Konu aç,
              proje paylaş, rütbeni yükselt.
            </p>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Kategoriler</h2>
          <Link href="/yeni-konu" className="btn btn-primary">
            Yeni konu
          </Link>
        </div>
        <ul className="category-list">
          {categories.map((category) => (
            <li key={category.id}>
              <Link href={`/kategori/${category.slug}`} className="category-item">
                <div
                  className="category-thumb"
                  style={{
                    backgroundImage: `url(${categoryDemoImage(category.slug)})`,
                  }}
                  aria-hidden
                />
                <div>
                  <div className="item-title">{category.name}</div>
                  <div className="item-meta">{category.description}</div>
                </div>
                <div className="count-badge">{category._count.threads}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Proje galerisi</h2>
          <Link href="/projeler" className="btn btn-ghost">
            Tümü
          </Link>
        </div>
        <ul className="thread-list">
          {recentProjects.length === 0 ? (
            <li className="thread-item muted">
              Henüz proje yok.{" "}
              <Link href="/projeler/yeni">İlk projeyi ekle</Link>
            </li>
          ) : (
            recentProjects.map((project) => (
              <li key={project.id}>
                <Link href={`/projeler/${project.id}`} className="thread-item project-home-item">
                  {project.coverUrl ? (
                    <div
                      className="category-thumb"
                      style={{
                        backgroundImage: `url("${project.coverUrl}")`,
                      }}
                      aria-hidden
                    />
                  ) : null}
                  <div>
                    <div className="item-title">{project.title}</div>
                    <div className="item-meta item-meta-row">
                      <span>{project.platform}</span>
                      <span>·</span>
                      <span>{project.author.name}</span>
                      <span>·</span>
                      <span>{project.summary}</span>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Son konular</h2>
          <span className="muted">En son güncellenenler</span>
        </div>
        <ul className="thread-list">
          {recentThreads.length === 0 ? (
            <li className="thread-item muted">Henüz konu yok. İlk lehim senin olsun.</li>
          ) : (
            recentThreads.map((thread) => (
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
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
