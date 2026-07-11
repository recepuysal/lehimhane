import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom =
  process.env.EMAIL_FROM || "Lehimhane <onboarding@resend.dev>";

function getClient() {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

export async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const client = getClient();

  if (!client) {
    console.warn("[mail] RESEND_API_KEY yok — mail gönderilmedi:");
    console.warn(options.subject, options.to);
    console.warn(options.text);
    return { ok: false as const, skipped: true as const };
  }

  const result = await client.emails.send({
    from: emailFrom,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (result.error) {
    console.error("[mail] Resend error:", result.error);
    const message =
      typeof result.error === "object" &&
      result.error &&
      "message" in result.error
        ? String((result.error as { message?: string }).message)
        : "Mail gönderilemedi";
    return {
      ok: false as const,
      skipped: false as const,
      error: result.error,
      message,
    };
  }

  return { ok: true as const, id: result.data?.id };
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  return sendMail({
    to,
    subject: "Lehimhane — e-posta doğrulama",
    text: `Hesabını doğrulamak için bu bağlantıyı aç: ${verifyUrl}`,
    html: `
      <p>Merhaba,</p>
      <p>Lehimhane hesabını doğrulamak için aşağıdaki bağlantıya tıkla:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Bu bağlantı 24 saat geçerlidir.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendMail({
    to,
    subject: "Lehimhane — şifre sıfırlama",
    text: `Şifreni sıfırlamak için bu bağlantıyı aç: ${resetUrl}`,
    html: `
      <p>Merhaba,</p>
      <p>Şifre sıfırlama isteği aldık. Bağlantı:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Bu bağlantı 1 saat geçerlidir. Sen istemediysen bu maili yok say.</p>
    `,
  });
}
