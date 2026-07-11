import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_EMAIL_VERIFY,
  TOKEN_PASSWORD_RESET,
  appBaseUrl,
  issueAuthToken,
} from "@/lib/auth-tokens";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/mail";

const schema = z.object({
  email: z.string().trim().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Geçerli e-posta girin" }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email } });

    // Enumeration koruması: her zaman aynı mesaj
    const okMessage = {
      ok: true,
      message: "E-posta kayıtlıysa bağlantı gönderildi.",
    };

    if (!user?.passwordHash) {
      return NextResponse.json(okMessage);
    }

    if (!user.emailVerified) {
      const raw = await issueAuthToken(
        user.id,
        TOKEN_EMAIL_VERIFY,
        1000 * 60 * 60 * 24,
      );
      await sendVerificationEmail(email, `${appBaseUrl()}/dogrula?token=${raw}`);
      return NextResponse.json({
        ok: true,
        message:
          "Bu hesap henüz doğrulanmamış. Yeni doğrulama maili gönderildi (kayıtlıysa).",
      });
    }

    const raw = await issueAuthToken(
      user.id,
      TOKEN_PASSWORD_RESET,
      1000 * 60 * 60,
    );
    await sendPasswordResetEmail(
      email,
      `${appBaseUrl()}/sifre-sifirla?token=${raw}`,
    );

    return NextResponse.json(okMessage);
  } catch {
    return NextResponse.json({ error: "İşlem başarısız" }, { status: 500 });
  }
}
