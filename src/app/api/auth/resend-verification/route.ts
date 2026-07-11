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

    const ok = {
      ok: true,
      message: "Doğrulama maili gönderildi (hesap varsa ve doğrulanmamışsa).",
    };

    if (!user || user.emailVerified) {
      return NextResponse.json(ok);
    }

    const raw = await issueAuthToken(
      user.id,
      TOKEN_EMAIL_VERIFY,
      1000 * 60 * 60 * 24,
    );
    await sendVerificationEmail(email, `${appBaseUrl()}/dogrula?token=${raw}`);

    return NextResponse.json(ok);
  } catch {
    return NextResponse.json({ error: "Gönderilemedi" }, { status: 500 });
  }
}
