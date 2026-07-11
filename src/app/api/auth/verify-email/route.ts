import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_EMAIL_VERIFY,
  consumeAuthToken,
} from "@/lib/auth-tokens";

const schema = z.object({
  token: z.string().min(20),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçersiz bağlantı" }, { status: 400 });
    }

    const row = await consumeAuthToken(parsed.data.token, TOKEN_EMAIL_VERIFY);
    if (!row) {
      return NextResponse.json(
        { error: "Bağlantı geçersiz veya süresi dolmuş" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: row.userId },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Doğrulama başarısız" }, { status: 500 });
  }
}
