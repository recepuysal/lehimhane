import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canLockThread, canPinThread, isModerator } from "@/lib/moderation";

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    pinned?: boolean;
    locked?: boolean;
  };

  const thread = await prisma.thread.findUnique({
    where: { id },
    select: { id: true, authorId: true, pinned: true, locked: true },
  });

  if (!thread) {
    return NextResponse.json({ error: "Konu bulunamadı" }, { status: 404 });
  }

  const role = session.user.role ?? "USER";
  const data: { pinned?: boolean; locked?: boolean } = {};

  if (typeof body.pinned === "boolean") {
    if (!canPinThread(role)) {
      return NextResponse.json(
        { error: "Konu sabitlemek için moderatör olmalısın" },
        { status: 403 },
      );
    }
    data.pinned = body.pinned;
  }

  if (typeof body.locked === "boolean") {
    if (
      !canLockThread({
        role,
        userId: session.user.id,
        authorId: thread.authorId,
      })
    ) {
      return NextResponse.json(
        { error: "Bu konuyu kilitleme yetkin yok" },
        { status: 403 },
      );
    }
    data.locked = body.locked;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan yok" }, { status: 400 });
  }

  // Non-mods cannot touch pinned even via locked-only path — already gated.
  if (!isModerator(role) && "pinned" in data) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const updated = await prisma.thread.update({
    where: { id },
    data,
    select: { id: true, pinned: true, locked: true },
  });

  return NextResponse.json({ thread: updated });
}
