import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { bumpUserActivity } from "@/lib/user-activity";
import { normalizeTags, parseTagTokens } from "@/lib/tags";
import { collectFormFiles, saveAttachments } from "@/lib/upload";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const title = String(formData.get("title") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const tagsRaw = String(formData.get("tags") ?? "");
    const files = collectFormFiles(formData);

    if (title.length < 3 || title.length > 120) {
      return NextResponse.json(
        { error: "Başlık 3–120 karakter olmalı" },
        { status: 400 },
      );
    }

    if (!categoryId) {
      return NextResponse.json({ error: "Kategori seçilmeli" }, { status: 400 });
    }

    if ((!body || body.length < 10) && files.length === 0) {
      return NextResponse.json(
        { error: "İçerik yazın veya dosya ekleyin" },
        { status: 400 },
      );
    }

    if (body.length > 10000) {
      return NextResponse.json(
        { error: "İçerik en fazla 10000 karakter olabilir" },
        { status: 400 },
      );
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json({ error: "Kategori bulunamadı" }, { status: 404 });
    }

    const tagTokens = parseTagTokens(
      normalizeTags(tagsRaw.split(/[,\s]+/).filter(Boolean)),
    );
    const savedFiles = await saveAttachments(files);

    const thread = await prisma.$transaction(async (tx) => {
      const created = await tx.thread.create({
        data: {
          title,
          body: body || "(Dosya eklendi)",
          categoryId,
          authorId: session.user.id,
          attachments: {
            create: savedFiles.map((file) => ({
              fileName: file.fileName,
              url: file.url,
              mimeType: file.mimeType,
              size: file.size,
              kind: file.kind,
            })),
          },
        },
      });

      for (const tag of tagTokens) {
        const saved = await tx.tag.upsert({
          where: { slug: tag.slug },
          update: { name: tag.name },
          create: { slug: tag.slug, name: tag.name },
        });

        await tx.threadTag.create({
          data: {
            threadId: created.id,
            tagId: saved.id,
          },
        });
      }

      return created;
    });

    await bumpUserActivity(session.user.id);

    return NextResponse.json({ thread }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Konu oluşturulurken bir hata oluştu";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
