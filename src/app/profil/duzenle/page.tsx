import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfileEditForm } from "@/components/profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/giris");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      bio: true,
      location: true,
      website: true,
      avatarUrl: true,
      bannerUrl: true,
    },
  });

  if (!user) {
    redirect("/giris");
  }

  return (
    <div className="narrow profile-edit-shell">
      <h1>Profili düzenle</h1>
      <p className="muted">
        Fotoğrafını, arka planını ve bilgilerini güncelle. Dosya en fazla 2 MB.
      </p>
      <ProfileEditForm
        initial={{
          name: user.name,
          bio: user.bio,
          location: user.location,
          website: user.website,
          avatarUrl: user.avatarUrl,
          bannerUrl: user.bannerUrl,
        }}
      />
    </div>
  );
}
