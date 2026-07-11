import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  TOKEN_EMAIL_VERIFY,
  appBaseUrl,
  issueAuthToken,
} from "@/lib/auth-tokens";
import { sendVerificationEmail } from "@/lib/mail";

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

    if (!user) {
      return NextResponse.json({
        ok: true,
        message: "Hesap varsa doğrulama bağlantısı hazırlandı.",
      });
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
      return NextResponse.json({
        ok: true,
        mailSent: false,
        verifyUrl,
        message:
          "Mail şu an gitmiyor (Resend limiti). Doğrulama için bu linke tıkla.",
      });
    }

    return NextResponse.json({
      ok: true,
      mailSent: true,
      verifyUrl,
      message: "Doğrulama maili gönderildi. Gelmezse alttaki linki kullan.",
    });
  } catch {
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
