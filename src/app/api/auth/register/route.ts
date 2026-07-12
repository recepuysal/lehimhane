import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rankFromPostCount } from "@/lib/ranks";
import {
  TOKEN_EMAIL_VERIFY,
  appBaseUrl,
  issueAuthToken,
} from "@/lib/auth-tokens";
import {
  isMailConfigured,
  isMailDevMode,
  requiresEmailVerification,
  sendVerificationEmail,
} from "@/lib/mail";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(50),
  email: z.string().trim().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(100),
});

export async function POST(request: Request) {
  try {
    const limited = rateLimit(`register:${clientIp(request)}`, 8, 60 * 60 * 1000);
    if (!limited.ok) {
      return NextResponse.json(
        { error: `Çok fazla deneme. ${limited.retryAfterSec} sn sonra tekrar dene.` },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta zaten kayıtlı" },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 10);
    const rank = rankFromPostCount(0);
    const requireVerify = requiresEmailVerification();

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        emailVerified: requireVerify ? null : new Date(),
        postCount: 0,
        rank,
      },
      select: { id: true, name: true, email: true, rank: true },
    });

    if (!requireVerify) {
      return NextResponse.json(
        {
          user,
          needsVerification: false,
          message: "Kayıt tamam. Giriş yapabilirsin.",
        },
        { status: 201 },
      );
    }

    const rawToken = await issueAuthToken(
      user.id,
      TOKEN_EMAIL_VERIFY,
      1000 * 60 * 60 * 24,
    );
    const verifyUrl = `${appBaseUrl()}/dogrula?token=${rawToken}`;

    let mailSent = false;
    let mailMessage =
      "Kayıt tamam. Aşağıdaki doğrulama linkine tıkla, sonra giriş yap.";

    if (isMailConfigured()) {
      const mail = await sendVerificationEmail(email, verifyUrl);
      mailSent = mail.ok;
      if (mail.ok) {
        mailMessage = isMailDevMode()
          ? "Doğrulama maili gönderildi (mümkünse). Yerel denemede linki de aşağıda görüyorsun."
          : "Kayıt tamam. Giriş yapmadan önce e-postandaki doğrulama bağlantısına tıkla.";
      } else if (!mail.skipped && "message" in mail) {
        mailMessage = mail.message ?? mailMessage;
      }
    } else if (isMailDevMode()) {
      console.warn("[register] MAIL_DEV_MODE — mail yok, verifyUrl sayfada:");
      console.warn(verifyUrl);
      mailMessage =
        "Yerel deneme modu: mail servisi yok. Aşağıdaki linke tıklayarak hesabını doğrula.";
    }

    const exposeLink = isMailDevMode() || !mailSent;

    return NextResponse.json(
      {
        user,
        needsVerification: true,
        mailSent,
        ...(exposeLink ? { verifyUrl } : {}),
        message: mailMessage,
        devMode: isMailDevMode(),
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu" },
      { status: 500 },
    );
  }
}
