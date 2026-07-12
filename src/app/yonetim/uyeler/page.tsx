import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { isModerator } from "@/lib/moderation";
import { RankBadge } from "@/components/rank-badge";

export const dynamic = "force-dynamic";

export default async function AdminMembersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/giris?callbackUrl=/yonetim/uyeler");
  }

  if (!isModerator(session.user.role)) {
    redirect("/");
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      rank: true,
      postCount: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const verifiedCount = users.filter((u) => u.emailVerified).length;

  return (
    <div className="stack">
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Üyeler</h2>
            <p className="muted" style={{ margin: "0.35rem 0 0" }}>
              {users.length} üye · {verifiedCount} doğrulanmış ·{" "}
              {users.length - verifiedCount} bekleyen
            </p>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>İsim</th>
                <th>E-posta</th>
                <th>Durum</th>
                <th>Rol</th>
                <th>Rütbe</th>
                <th>Mesaj</th>
                <th>Kayıt</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <Link href={`/profil/${user.id}`} className="author-link">
                      {user.name}
                    </Link>
                  </td>
                  <td>
                    <a href={`mailto:${user.email}`} className="admin-email">
                      {user.email}
                    </a>
                  </td>
                  <td>
                    {user.emailVerified ? (
                      <span className="status-chip">Doğrulandı</span>
                    ) : (
                      <span className="status-chip status-chip-warn">Bekliyor</span>
                    )}
                  </td>
                  <td>{user.role}</td>
                  <td>
                    <RankBadge rank={user.rank} compact />
                  </td>
                  <td>{user.postCount}</td>
                  <td className="muted">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
