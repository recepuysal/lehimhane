import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationsList } from "@/components/notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/giris");
  }

  return (
    <div className="stack">
      <section className="hero">
        <h1>Bildirimler</h1>
        <p>Konularına gelen yanıtları buradan takip et.</p>
      </section>
      <NotificationsList />
    </div>
  );
}
