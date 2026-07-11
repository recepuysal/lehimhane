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

    // Resend domain yokken mail doğrulaması zorunlu değil; hesap hemen aktif.
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email,
        passwordHash,
        emailVerified: new Date(),
        postCount: 0,
        rank,
      },
      select: { id: true, name: true, email: true, rank: true },
    });

    // İleride domain bağlanınca mail çalışsın diye arka planda dene (başarısız olsa sorun değil).
    try {
      const rawToken = await issueAuthToken(
        user.id,
        TOKEN_EMAIL_VERIFY,
        1000 * 60 * 60 * 24,
      );
      const verifyUrl = `${appBaseUrl()}/dogrula?token=${rawToken}`;
      await sendVerificationEmail(email, verifyUrl);
    } catch (error) {
      console.warn("[register] optional mail skipped:", error);
    }

    return NextResponse.json(
      {
        user,
        needsVerification: false,
        message: "Kayıt tamam. Giriş yapabilirsin.",
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
