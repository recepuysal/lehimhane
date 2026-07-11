import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: {
        actor: { select: { id: true, name: true } },
        thread: { select: { id: true, title: true } },
        project: { select: { id: true, title: true } },
      },
    }),
    prisma.notification.count({
      where: { userId: session.user.id, read: false },
    }),
  ]);

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const markAll = body?.markAll === true;
    const ids = Array.isArray(body?.ids)
      ? body.ids.filter((id: unknown) => typeof id === "string")
      : [];

    if (markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      });
    } else if (ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          id: { in: ids },
        },
        data: { read: true },
      });
    } else {
      return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
    }

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    });

    return NextResponse.json({ ok: true, unreadCount });
  } catch {
    return NextResponse.json(
      { error: "Bildirimler güncellenemedi" },
      { status: 500 },
    );
  }
}
