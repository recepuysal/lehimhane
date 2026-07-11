import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { countLikes } from "@/lib/votes";
import {
  notifyProjectLike,
  notifyThreadUpvote,
} from "@/lib/notifications";

const likeSchema = z.object({
  target: z.enum(["thread", "reply", "project"]),
  id: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = likeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const { target, id } = parsed.data;
    const userId = session.user.id;

    if (target === "thread") {
      const thread = await prisma.thread.findUnique({
        where: { id },
        select: { id: true, title: true, authorId: true },
      });

      if (!thread) {
        return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });
      }

      const existing = await prisma.threadVote.findUnique({
        where: { userId_threadId: { userId, threadId: id } },
      });

      let liked = false;

      if (existing?.value === 1) {
        await prisma.threadVote.delete({ where: { id: existing.id } });
      } else if (existing) {
        await prisma.threadVote.update({
          where: { id: existing.id },
          data: { value: 1 },
        });
        liked = true;
      } else {
        await prisma.threadVote.create({
          data: { userId, threadId: id, value: 1 },
        });
        liked = true;
        await notifyThreadUpvote({
          threadId: thread.id,
          threadTitle: thread.title,
          threadAuthorId: thread.authorId,
          actorId: userId,
          actorName: session.user.name ?? "Bir üye",
        });
      }

      const votes = await prisma.threadVote.findMany({
        where: { threadId: id, value: 1 },
        select: { value: true },
      });

      return NextResponse.json({
        likeCount: countLikes(votes),
        liked,
      });
    }

    if (target === "project") {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { id: true, title: true, authorId: true },
      });

      if (!project) {
        return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
      }

      const existing = await prisma.projectVote.findUnique({
        where: { userId_projectId: { userId, projectId: id } },
      });

      let liked = false;

      if (existing?.value === 1) {
        await prisma.projectVote.delete({ where: { id: existing.id } });
      } else if (existing) {
        await prisma.projectVote.update({
          where: { id: existing.id },
          data: { value: 1 },
        });
        liked = true;
      } else {
        await prisma.projectVote.create({
          data: { userId, projectId: id, value: 1 },
        });
        liked = true;
        await notifyProjectLike({
          projectId: project.id,
          projectTitle: project.title,
          projectAuthorId: project.authorId,
          actorId: userId,
          actorName: session.user.name ?? "Bir üye",
        });
      }

      const votes = await prisma.projectVote.findMany({
        where: { projectId: id, value: 1 },
        select: { value: true },
      });

      return NextResponse.json({
        likeCount: countLikes(votes),
        liked,
      });
    }

    const reply = await prisma.reply.findUnique({
      where: { id },
      include: {
        thread: { select: { id: true, title: true } },
        author: { select: { id: true } },
      },
    });

    if (!reply) {
      return NextResponse.json({ error: "Yanıt bulunamadı" }, { status: 404 });
    }

    const existing = await prisma.replyVote.findUnique({
      where: { userId_replyId: { userId, replyId: id } },
    });

    let liked = false;

    if (existing?.value === 1) {
      await prisma.replyVote.delete({ where: { id: existing.id } });
    } else if (existing) {
      await prisma.replyVote.update({
        where: { id: existing.id },
        data: { value: 1 },
      });
      liked = true;
    } else {
      await prisma.replyVote.create({
        data: { userId, replyId: id, value: 1 },
      });
      liked = true;

      if (reply.author.id !== userId) {
        await prisma.notification.create({
          data: {
            type: "reply_like",
            message: `${session.user.name ?? "Bir üye"}, yanıtını beğendi.`,
            userId: reply.author.id,
            actorId: userId,
            threadId: reply.thread.id,
          },
        });
      }
    }

    const votes = await prisma.replyVote.findMany({
      where: { replyId: id, value: 1 },
      select: { value: true },
    });

    return NextResponse.json({
      likeCount: countLikes(votes),
      liked,
    });
  } catch {
    return NextResponse.json(
      { error: "Beğeni kaydedilirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
