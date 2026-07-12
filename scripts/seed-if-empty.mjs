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

  let categoryCount = 0;
  try {
    categoryCount = await prisma.category.count();
  } finally {
    await prisma.$disconnect();
  }

  if (!force && categoryCount > 0) {
    console.log(
      `Database already has ${categoryCount} categories — skipping seed.`,
    );
    return;
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
