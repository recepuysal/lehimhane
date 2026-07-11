import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ThreadViewClient } from "@/components/thread-view-client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const thread = await prisma.thread.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, rank: true, postCount: true } },
      category: { select: { name: true, slug: true } },
      votes: { select: { value: true, userId: true } },
      tags: {
        include: { tag: { select: { name: true, slug: true } } },
      },
      attachments: true,
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, rank: true, postCount: true },
          },
          votes: { select: { value: true, userId: true } },
          attachments: true,
          quoteReply: {
            select: {
              id: true,
              body: true,
              author: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!thread) {
    notFound();
  }

  return (
    <ThreadViewClient
      thread={JSON.parse(JSON.stringify(thread))}
      userId={userId}
      userRole={session?.user?.role}
      isAuthenticated={Boolean(session?.user)}
    />
  );
}
