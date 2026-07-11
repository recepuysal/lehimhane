import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploadedImage } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const kindRaw = String(formData.get("kind") ?? "");
    const file = formData.get("file");

    if (kindRaw !== "avatar" && kindRaw !== "banner") {
      return NextResponse.json({ error: "Geçersiz yükleme türü" }, { status: 400 });
    }

    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Dosya seçilmedi" }, { status: 400 });
    }

    const url = await saveUploadedImage(file, kindRaw);

    const data =
      kindRaw === "avatar" ? { avatarUrl: url } : { bannerUrl: url };

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true,
        avatarUrl: true,
        bannerUrl: true,
      },
    });

    return NextResponse.json({ user, url });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Yükleme sırasında hata oluştu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
