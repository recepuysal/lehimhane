import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canDeleteReply, canEditReply } from "@/lib/moderation";
import { dropUserActivity } from "@/lib/user-activity";
import { deleteAttachmentFiles } from "@/lib/upload";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const payload = await request.json();
    const body = String(payload?.body ?? "").trim();

    if (body.length < 2) {
      return NextResponse.json(
        { error: "Yanıt en az 2 karakter olmalı" },
        { status: 400 },
      );
    }

    if (body.length > 5000) {
      return NextResponse.json(
        { error: "Yanıt en fazla 5000 karakter olabilir" },
        { status: 400 },
      );
    }

    const reply = await prisma.reply.findUnique({
      where: { id },
      select: {
        id: true,
        authorId: true,
        threadId: true,
        thread: { select: { locked: true } },
      },
    });

    if (!reply) {
      return NextResponse.json({ error: "Yanıt bulunamadı" }, { status: 404 });
    }

    if (
      !canEditReply({
        userId: session.user.id,
        authorId: reply.authorId,
      })
    ) {
      return NextResponse.json(
        { error: "Bu yanıtı düzenleme yetkin yok" },
        { status: 403 },
      );
    }

    if (reply.thread.locked) {
      return NextResponse.json(
        { error: "Kilitli konuda yanıt düzenlenemez" },
        { status: 403 },
      );
    }

    const updated = await prisma.reply.update({
      where: { id: reply.id },
      data: { body },
      select: { id: true, body: true },
    });

    await prisma.thread.update({
      where: { id: reply.threadId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ reply: updated });
  } catch {
    return NextResponse.json(
      { error: "Yanıt güncellenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  const { id } = await params;

  const reply = await prisma.reply.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      threadId: true,
      attachments: { select: { url: true } },
    },
  });

  if (!reply) {
    return NextResponse.json({ error: "Yanıt bulunamadı" }, { status: 404 });
  }

  if (
    !canDeleteReply({
      role: session.user.role,
      userId: session.user.id,
      authorId: reply.authorId,
    })
  ) {
    return NextResponse.json(
      { error: "Bu yanıtı silme yetkin yok" },
      { status: 403 },
    );
  }

  const urls = reply.attachments.map((item) => item.url);

  await prisma.reply.delete({ where: { id: reply.id } });
  await dropUserActivity(reply.authorId);
  await deleteAttachmentFiles(urls);

  await prisma.thread.update({
    where: { id: reply.threadId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
