import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().trim().min(2, "İsim en az 2 karakter olmalı").max(50),
  bio: z.string().trim().max(500, "Biyografi en fazla 500 karakter").default(""),
  location: z.string().trim().max(80).default(""),
  website: z
    .string()
    .trim()
    .max(120)
    .default("")
    .refine(
      (value) =>
        value === "" ||
        /^https?:\/\/.+/i.test(value) ||
        /^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(value),
      "Geçerli bir site adresi girin",
    ),
});

function normalizeWebsite(value: string) {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = profileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Geçersiz veri" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        bio: parsed.data.bio,
        location: parsed.data.location,
        website: normalizeWebsite(parsed.data.website),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        location: true,
        website: true,
        avatarUrl: true,
        bannerUrl: true,
        rank: true,
        postCount: true,
      },
    });

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "Profil güncellenirken bir hata oluştu" },
      { status: 500 },
    );
  }
}
