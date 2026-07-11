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
import { sendVerificationEmail } from "@/lib/mail";

const registerSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(50),
  email: z.string().trim().email("Geçerli bir e-posta girin"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı").max(100),
});

function mailFailMessage(mail: {
  skipped?: boolean;
  message?: string;
}) {
  if (mail.skipped) {
    return "Sunucuda RESEND_API_KEY tanımlı değil. Railway Variables'a ekle.";
  }

  const raw = (mail.message || "").toLowerCase();
  if (
    raw.includes("only send testing emails to your own") ||
    raw.includes("verify a domain") ||
    raw.includes("testing emails")
  ) {
    return "Resend ücretsiz test modunda: mail yalnızca Resend hesabındaki e-postaya gider. Kayıt için o adresi kullan veya spam klasörüne bak.";
  }

  return mail.message
    ? `Hesap oluştu ama mail gitmedi: ${mail.message}`
    : "Hesap oluştu ama doğrulama maili gönderilemedi.";
}

export async function POST(request: Request) {
  try {
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

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        emailVerified: null,
        postCount: 0,
        rank,
      },
      select: { id: true, name: true, email: true, rank: true },
    });

    const rawToken = await issueAuthToken(
      user.id,
      TOKEN_EMAIL_VERIFY,
      1000 * 60 * 60 * 24,
    );
    const verifyUrl = `${appBaseUrl()}/dogrula?token=${rawToken}`;
    const mail = await sendVerificationEmail(email, verifyUrl);

    if (!mail.ok) {
      console.warn("[register] verify url (mail failed):", verifyUrl);
      return NextResponse.json(
        {
          user,
          needsVerification: true,
          mailSent: false,
          error: mailFailMessage(mail),
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        user,
        needsVerification: true,
        mailSent: true,
        message:
          "Kayıt tamam. Giriş için e-postadaki doğrulama bağlantısını aç (spam klasörüne de bak).",
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
