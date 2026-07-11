import { createHash, randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const TOKEN_EMAIL_VERIFY = "EMAIL_VERIFY";
export const TOKEN_PASSWORD_RESET = "PASSWORD_RESET";

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createRawToken() {
  return randomBytes(32).toString("hex");
}

export async function issueAuthToken(
  userId: string,
  type: string,
  expiresInMs: number,
) {
  await prisma.authToken.deleteMany({ where: { userId, type } });

  const raw = createRawToken();
  await prisma.authToken.create({
    data: {
      userId,
      type,
      tokenHash: hashToken(raw),
      expiresAt: new Date(Date.now() + expiresInMs),
    },
  });

  return raw;
}

export async function consumeAuthToken(rawToken: string, type: string) {
  const tokenHash = hashToken(rawToken);
  const row = await prisma.authToken.findUnique({ where: { tokenHash } });

  if (!row || row.type !== type) {
    return null;
  }

  if (row.expiresAt.getTime() < Date.now()) {
    await prisma.authToken.delete({ where: { id: row.id } }).catch(() => null);
    return null;
  }

  await prisma.authToken.delete({ where: { id: row.id } });
  return row;
}

export function appBaseUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  return "http://localhost:3000";
}
