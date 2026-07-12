import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_EMAIL_VERIFY,
  appBaseUrl,
  issueAuthToken,
} from "@/lib/auth-tokens";
import { isMailConfigured, sendVerificationEmail } from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  try {
    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: "Mail servisi yapılandırılmamış" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçerli e-posta girin" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const ip = clientIp(request);
    const limited = rateLimit(`resend:${ip}:${email}`, 3, 15 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Çok fazla istek. ${limited.retryAfterSec} sn sonra tekrar dene.` },
        { status: 429 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Enumeration: her zaman aynı genel mesaj
    const okMessage = {
      ok: true,
      message: "Hesap doğrulanmamışsa yeni bağlantı gönderildi. Gelen kutunu kontrol et.",
    };

    if (!user) {
      return NextResponse.json(okMessage);
    }

    if (user.emailVerified) {
      return NextResponse.json({
        ok: true,
        message: "Bu hesap zaten doğrulanmış. Giriş yapabilirsin.",
      });
    }

    const raw = await issueAuthToken(
      user.id,
      TOKEN_EMAIL_VERIFY,
      1000 * 60 * 60 * 24,
    );
    const verifyUrl = `${appBaseUrl()}/dogrula?token=${raw}`;
    const mail = await sendVerificationEmail(email, verifyUrl);

    if (!mail.ok) {
      return NextResponse.json(
        {
          error: mail.message ?? "Doğrulama maili gönderilemedi",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      ok: true,
      mailSent: true,
      message: "Doğrulama maili gönderildi. Gelen kutunu ve spam klasörünü kontrol et.",
    });
  } catch {
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
