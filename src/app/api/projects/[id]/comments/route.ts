import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyProjectComment } from "@/lib/notifications";
import { bumpUserActivity } from "@/lib/user-activity";

type Props = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!project) {
    return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
  }

  const comments = await prisma.projectComment.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, name: true, rank: true } },
    },
  });

  return NextResponse.json({ comments });
}

export async function POST(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const text = String(body?.body ?? "").trim();

    if (text.length < 2) {
      return NextResponse.json(
        { error: "Yorum en az 2 karakter olmalı" },
        { status: 400 },
      );
    }

    if (text.length > 2000) {
      return NextResponse.json(
        { error: "Yorum en fazla 2000 karakter olabilir" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: { id },
      select: { id: true, title: true, authorId: true },
    });

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }

    const comment = await prisma.projectComment.create({
      data: {
        body: text,
        projectId: project.id,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, rank: true } },
      },
    });

    await bumpUserActivity(session.user.id);

    await notifyProjectComment({
      projectId: project.id,
      projectTitle: project.title,
      projectAuthorId: project.authorId,
      actorId: session.user.id,
      actorName: session.user.name ?? "Bir üye",
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Yorum eklenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
