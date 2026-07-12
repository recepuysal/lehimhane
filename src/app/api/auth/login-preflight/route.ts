import { NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isMailConfigured } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(`login-preflight:${clientIp(request)}`, 30, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "INVALID" }, { status: 401 });
    }

    const valid = await compare(parsed.data.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "INVALID" }, { status: 401 });
    }

    if (isMailConfigured() && !user.emailVerified) {
      return NextResponse.json(
        {
          error: "UNVERIFIED",
          needsVerification: true,
          message:
            "E-posta henüz doğrulanmamış. Gelen kutunu kontrol et veya doğrulama mailini yeniden gönder.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "INVALID" }, { status: 500 });
  }
}
