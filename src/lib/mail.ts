import { Resend } from "resend";

const DEFAULT_FROM = "Lehimhane <onboarding@resend.dev>";
const resendApiKey = process.env.RESEND_API_KEY?.trim();

/** Railway'de tırnak/boşluk hatalarını temizle; geçersizse varsayılana düş. */
export function resolveEmailFrom(raw = process.env.EMAIL_FROM) {
  let value = (raw ?? "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  }
  // Tipik kopyala-yapıştır hataları
  value = value.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();

  const plainEmail = /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/;
  const namedEmail = /^[^<>]+<[^\s<>]+@[^\s<>]+\.[^\s<>]+>$/;

  if (plainEmail.test(value) || namedEmail.test(value)) {
    return value;
  }

  if (value) {
    console.warn(
      `[mail] EMAIL_FROM geçersiz ("${raw}") — varsayılan kullanılıyor: ${DEFAULT_FROM}`,
    );
  }

  return DEFAULT_FROM;
}

/** Resend API key tanımlıysa bulut mail hazır. */
export function isMailConfigured() {
  return Boolean(resendApiKey);
}

/**
 * LabStock tarzı yerel deneme: PC'de MAIL_DEV_MODE=1 veya development.
 * Mail gitmese bile doğrulama linki sayfada gösterilir; domain şart değil.
 */
export function isMailDevMode() {
  return (
    process.env.MAIL_DEV_MODE === "1" ||
    process.env.NODE_ENV === "development"
  );
}

/** Doğrulama zorunlu mu? (Resend veya yerel deneme modu) */
export function requiresEmailVerification() {
  return isMailConfigured() || isMailDevMode();
}

/** Kayıt yanıtında verifyUrl gösterilsin mi? */
export function shouldExposeVerifyUrl(mailCode?: string) {
  if (isMailDevMode()) return true;
  return mailCode === "DOMAIN_REQUIRED";
}

function getClient() {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

function brandedHtml(options: {
  title: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  footer: string;
}) {
  return `<!DOCTYPE html>
<html lang="tr">
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width" /></head>
<body style="margin:0;padding:0;background:#f3f6f4;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f3f6f4;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;border:1px solid #d7e0db;border-radius:16px;overflow:hidden;">
        <tr><td style="background:#0b6e4f;padding:20px 28px;">
          <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Lehimhane</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="margin:0 0 12px;font-size:22px;color:#14241c;">${options.title}</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55;color:#3a4a42;">${options.intro}</p>
          <p style="margin:0 0 24px;">
            <a href="${options.actionUrl}" style="display:inline-block;background:#0b6e4f;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-family:system-ui,sans-serif;font-size:15px;font-weight:600;">${options.actionLabel}</a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.5;color:#6a7a72;font-family:system-ui,sans-serif;">Bağlantı çalışmazsa şunu kopyala:<br /><a href="${options.actionUrl}" style="color:#0b6e4f;word-break:break-all;">${options.actionUrl}</a></p>
          <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6a7a72;font-family:system-ui,sans-serif;">${options.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
    from: resolveEmailFrom(),
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });

  if (result.error) {
    console.error("[mail] Resend error:", result.error);
    const raw =
      typeof result.error === "object" &&
      result.error &&
      "message" in result.error
        ? String((result.error as { message?: string }).message)
        : "Mail gönderilemedi";
    return {
      ok: false as const,
      skipped: false as const,
      error: result.error,
      message: humanizeMailError(raw),
      code: classifyMailError(raw),
    };
  }

  return { ok: true as const, id: result.data?.id };
}

function classifyMailError(raw: string) {
  const lower = raw.toLowerCase();
  if (
    lower.includes("only send testing emails") ||
    lower.includes("verify a domain")
  ) {
    return "DOMAIN_REQUIRED" as const;
  }
  if (lower.includes("invalid `from`") || lower.includes("invalid from")) {
    return "INVALID_FROM" as const;
  }
  return "UNKNOWN" as const;
}

function humanizeMailError(raw: string) {
  const code = classifyMailError(raw);
  if (code === "DOMAIN_REQUIRED") {
    return (
      "Resend henüz test modunda: yalnızca rcpuysl@icloud.com adresine mail gidebilir. " +
      "Başka e-postalara (Hotmail, Gmail vb.) göndermek için resend.com/domains üzerinden domain doğrula " +
      "ve EMAIL_FROM değerini o domain’e çevir (örn. Lehimhane <noreply@lehimhane.com>). " +
      "Şimdilik kendi iCloud adresinle kayıt olabilir veya aşağıdaki doğrulama linkini kullanabilirsin."
    );
  }
  if (code === "INVALID_FROM") {
    return (
      "EMAIL_FROM formatı hatalı. Railway’de tırnaksız şu değeri kullan: " +
      "Lehimhane <onboarding@resend.dev>"
    );
  }
  return raw;
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  return sendMail({
    to,
    subject: "Lehimhane — e-posta doğrulama",
    text: `Lehimhane hesabını doğrulamak için bu bağlantıyı aç (24 saat geçerli): ${verifyUrl}`,
    html: brandedHtml({
      title: "E-posta doğrulama",
      intro:
        "Hesabını etkinleştirmek için aşağıdaki düğmeye tıkla. Bu adımı tamamlamadan giriş yapamazsın.",
      actionLabel: "E-postamı doğrula",
      actionUrl: verifyUrl,
      footer: "Bu bağlantı 24 saat geçerlidir. Sen kayıt olmadıysan bu maili yok say.",
    }),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  return sendMail({
    to,
    subject: "Lehimhane — şifre sıfırlama",
    text: `Şifreni sıfırlamak için bu bağlantıyı aç (1 saat geçerli): ${resetUrl}`,
    html: brandedHtml({
      title: "Şifre sıfırlama",
      intro: "Şifre sıfırlama isteği aldık. Yeni şifre belirlemek için düğmeye tıkla.",
      actionLabel: "Şifremi sıfırla",
      actionUrl: resetUrl,
      footer:
        "Bu bağlantı 1 saat geçerlidir. Sen istemediysen bu maili yok say; şifren değişmez.",
    }),
  });
}
