import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bumpUserActivity } from "@/lib/user-activity";
import { notifyThreadReply } from "@/lib/notifications";
import { collectFormFiles, saveAttachments } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const threadId = String(formData.get("threadId") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const quoteReplyId = String(formData.get("quoteReplyId") ?? "").trim();
    const quoteOriginal = String(formData.get("quoteOriginal") ?? "") === "1";
    const files = collectFormFiles(formData);

    if (!threadId) {
      return NextResponse.json({ error: "Konu gerekli" }, { status: 400 });
    }

    if (!body && files.length === 0) {
      return NextResponse.json(
        { error: "Yanıt yazın veya dosya ekleyin" },
        { status: 400 },
      );
    }

    if (body && body.length < 2 && files.length === 0) {
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

    const thread = await prisma.thread.findUnique({
      where: { id: threadId },
      select: {
        id: true,
        title: true,
        authorId: true,
        locked: true,
      },
    });

    if (!thread) {
      return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });
    }

    if (thread.locked) {
      return NextResponse.json(
        { error: "Bu konu kilitli; yeni yanıt eklenemez" },
        { status: 403 },
      );
    }

    let resolvedQuoteReplyId: string | null = null;
    let resolvedQuoteOriginal = false;

    if (quoteOriginal) {
      resolvedQuoteOriginal = true;
    } else if (quoteReplyId) {
      const quoted = await prisma.reply.findFirst({
        where: { id: quoteReplyId, threadId },
        select: { id: true },
      });
      if (!quoted) {
        return NextResponse.json(
          { error: "Alıntılanacak yanıt bulunamadı" },
          { status: 400 },
        );
      }
      resolvedQuoteReplyId = quoted.id;
    }

    const savedFiles = await saveAttachments(files);

    const reply = await prisma.reply.create({
      data: {
        body: body || "(Dosya eklendi)",
        threadId,
        authorId: session.user.id,
        quoteReplyId: resolvedQuoteReplyId,
        quoteOriginal: resolvedQuoteOriginal,
        attachments: {
          create: savedFiles.map((file) => ({
            fileName: file.fileName,
            url: file.url,
            mimeType: file.mimeType,
            size: file.size,
            kind: file.kind,
          })),
        },
      },
      include: { attachments: true },
    });

    await prisma.thread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    });

    await bumpUserActivity(session.user.id);

    await notifyThreadReply({
      threadId: thread.id,
      threadTitle: thread.title,
      threadAuthorId: thread.authorId,
      actorId: session.user.id,
      actorName: session.user.name ?? "Bir üye",
    });

    return NextResponse.json({ reply }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Yanıt eklenirken bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
