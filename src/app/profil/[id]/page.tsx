import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { RankBadge } from "@/components/rank-badge";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProfilePage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      location: true,
      website: true,
      avatarUrl: true,
      bannerUrl: true,
      rank: true,
      postCount: true,
      createdAt: true,
      threads: {
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          category: { select: { name: true, slug: true } },
          _count: { select: { replies: true } },
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isOwner = session?.user?.id === user.id;

  return (
    <div className="stack">
      <section className="panel profile-card">
        <div
          className="profile-banner"
          style={
            user.bannerUrl
              ? { backgroundImage: `url(${user.bannerUrl})` }
              : undefined
          }
        />
        <div className="profile-body">
          <div className="profile-avatar-row">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} className="profile-avatar" />
            ) : (
              <div className="profile-avatar profile-avatar-fallback">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            {isOwner ? (
              <Link href="/profil/duzenle" className="btn btn-primary">
                Profili düzenle
              </Link>
            ) : null}
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <div className="item-meta item-meta-row">
              <RankBadge rank={user.rank} />
              <span>·</span>
              <span>{user.postCount} mesaj</span>
              <span>·</span>
              <span>Üye: {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {user.bio ? <p className="profile-bio">{user.bio}</p> : (
            <p className="muted">Henüz biyografi eklenmemiş.</p>
          )}

          <div className="profile-facts">
            {user.location ? (
              <span>
                <strong>Konum:</strong> {user.location}
              </span>
            ) : null}
            {user.website ? (
              <a href={user.website} target="_blank" rel="noopener noreferrer">
                <strong>Web:</strong> {user.website.replace(/^https?:\/\//i, "")}
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Son konular</h2>
        </div>
        <ul className="thread-list">
          {user.threads.length === 0 ? (
            <li className="thread-item muted">Henüz konu açmamış.</li>
          ) : (
            user.threads.map((thread) => (
              <li key={thread.id}>
                <Link href={`/konu/${thread.id}`} className="thread-item">
                  <div className="item-title">{thread.title}</div>
                  <div className="item-meta">
                    {thread.category.name} · {formatDate(thread.updatedAt)} ·{" "}
                    {thread._count.replies} yanıt
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
