import { prisma } from "@/lib/prisma";
import { rankFromPostCount } from "@/lib/ranks";

/** Konu veya yanıt sonrası mesaj sayısını artırır ve rütbeyi günceller. */
export async function bumpUserActivity(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { postCount: true },
  });

  if (!user) {
    return null;
  }

  const postCount = user.postCount + 1;
  const rank = rankFromPostCount(postCount);

  return prisma.user.update({
    where: { id: userId },
    data: { postCount, rank },
    select: { id: true, postCount: true, rank: true },
  });
}
