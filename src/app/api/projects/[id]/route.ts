import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  parseProjectMeta,
  parseStepsJson,
  parseSuppliesJson,
} from "@/lib/projects";
import { saveProjectImage } from "@/lib/upload";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: "Bu projeyi düzenleyemezsiniz" }, { status: 403 });
    }

    const formData = await request.formData();
    const meta = parseProjectMeta(formData);
    if ("error" in meta) {
      return NextResponse.json({ error: meta.error }, { status: 400 });
    }

    const steps = parseStepsJson(formData.get("stepsJson"));
    if ("error" in steps) {
      return NextResponse.json({ error: steps.error }, { status: 400 });
    }

    const supplies = parseSuppliesJson(formData.get("suppliesJson"));
    if ("error" in supplies) {
      return NextResponse.json({ error: supplies.error }, { status: 400 });
    }

    let coverUrl = existing.coverUrl;
    const cover = formData.get("cover");
    if (cover instanceof File && cover.size > 0) {
      coverUrl = (await saveProjectImage(cover)).url;
    }

    const stepImageUrls: Array<string | null> = [];
    for (let index = 0; index < steps.length; index += 1) {
      const file = formData.get(`stepImage_${index}`);
      if (file instanceof File && file.size > 0) {
        stepImageUrls.push((await saveProjectImage(file)).url);
      } else {
        stepImageUrls.push(steps[index].existingImageUrl ?? null);
      }
    }

    if (!coverUrl) {
      coverUrl = stepImageUrls.find(Boolean) ?? null;
    }

    await prisma.$transaction(async (tx) => {
      await tx.projectStep.deleteMany({ where: { projectId: id } });
      await tx.projectSupply.deleteMany({ where: { projectId: id } });

      await tx.project.update({
        where: { id },
        data: {
          title: meta.title,
          summary: meta.summary,
          body: meta.body,
          platform: meta.platform,
          status: meta.status,
          coverUrl,
          steps: {
            create: steps.map((step, index) => ({
              order: index + 1,
              title: step.title,
              body: step.body,
              imageUrl: stepImageUrls[index],
            })),
          },
          supplies: {
            create: supplies.map((item, index) => ({
              order: index + 1,
              name: item.name,
              quantity: item.quantity,
              note: item.note,
              link: item.link,
            })),
          },
        },
      });
    });

    return NextResponse.json({ project: { id } });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Proje güncellenemedi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
