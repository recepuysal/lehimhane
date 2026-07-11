import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_PASSWORD_RESET,
  consumeAuthToken,
} from "@/lib/auth-tokens";

const schema = z.object({
  token: z.string().min(20),
  password: z.string().min(6).max(100),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const row = await consumeAuthToken(
      parsed.data.token,
      TOKEN_PASSWORD_RESET,
    );
    if (!row) {
      return NextResponse.json(
        { error: "Bağlantı geçersiz veya süresi dolmuş" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: row.userId },
      data: {
        passwordHash: await hash(parsed.data.password, 10),
        emailVerified: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Şifre güncellenemedi" }, { status: 500 });
  }
}
