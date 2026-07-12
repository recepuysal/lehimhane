/**
 * Boş veritabanında (kategori yoksa) veya SEED_ON_BOOT=1 iken seed çalıştırır.
 * Dolu DB'de gerçek kullanıcı verisine dokunmaz.
 */
import { PrismaClient } from "@prisma/client";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: process.platform === "win32",
      env: process.env,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve(undefined);
      else reject(new Error(`${command} ${args.join(" ")} exited ${code}`));
    });
  });
}

async function main() {
  const force = process.env.SEED_ON_BOOT === "1";
  const prisma = new PrismaClient();

  try {
    // Eski SVG placeholder yollarını orijinal JPG'lere çevir
    const withSvg = await prisma.project.findMany({
      where: { coverUrl: { endsWith: ".svg" } },
      select: { id: true, coverUrl: true },
    });
    for (const project of withSvg) {
      const nextUrl = project.coverUrl.replace(/\.svg$/i, ".jpg");
      await prisma.project.update({
        where: { id: project.id },
        data: { coverUrl: nextUrl },
      });
    }
    if (withSvg.length > 0) {
      console.log(`Updated ${withSvg.length} project cover URL(s) .svg → .jpg`);
    }

    const stepsWithSvg = await prisma.projectStep.findMany({
      where: { imageUrl: { endsWith: ".svg" } },
      select: { id: true, imageUrl: true },
    });
    for (const step of stepsWithSvg) {
      if (!step.imageUrl) continue;
      await prisma.projectStep.update({
        where: { id: step.id },
        data: { imageUrl: step.imageUrl.replace(/\.svg$/i, ".jpg") },
      });
    }
    if (stepsWithSvg.length > 0) {
      console.log(`Updated ${stepsWithSvg.length} step image URL(s) .svg → .jpg`);
    }

    const categoryCount = await prisma.category.count();

    if (!force && categoryCount > 0) {
      console.log(
        `Database already has ${categoryCount} categories — skipping seed.`,
      );
      return;
    }
  } finally {
    await prisma.$disconnect();
  }

  if (force) {
    console.log("SEED_ON_BOOT=1 — running full seed (destructive).");
  } else {
    console.log("Empty database detected — running initial seed.");
  }

  await run("npx", ["tsx", "prisma/seed.ts"]);
  console.log("Seed completed.");
}

main().catch((error) => {
  console.error("seed-if-empty failed:", error);
  process.exit(1);
});
