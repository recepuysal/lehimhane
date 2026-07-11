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

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş yapmalısınız" }, { status: 401 });
  }

  try {
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

    const cover = formData.get("cover");
    let coverUrl: string | null = null;
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

    const project = await prisma.project.create({
      data: {
        title: meta.title,
        summary: meta.summary,
        body: meta.body,
        platform: meta.platform,
        status: meta.status,
        coverUrl,
        authorId: session.user.id,
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

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Proje kaydedilemedi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
