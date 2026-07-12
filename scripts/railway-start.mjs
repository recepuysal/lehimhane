import { mkdirSync } from "fs";
import path from "path";
import { spawn } from "child_process";

function applyDefaults() {
  const volume =
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    (process.env.RAILWAY_ENVIRONMENT ? "/data" : null);

  if (volume) {
    mkdirSync(volume, { recursive: true });
    if (!process.env.DATABASE_URL) {
      process.env.DATABASE_URL = `file:${path.posix.join(volume, "prod.db")}`;
    }
    if (!process.env.UPLOAD_ROOT) {
      process.env.UPLOAD_ROOT = path.posix.join(volume, "uploads");
    }
  }

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "file:./prod.db";
  }

  if (!process.env.NEXTAUTH_SECRET) {
    console.warn(
      "NEXTAUTH_SECRET eksik — gecici secret uretildi. Railway Variables'a kalici bir deger ekle.",
    );
    process.env.NEXTAUTH_SECRET = `railway-temp-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}`;
  }

  if (!process.env.NEXTAUTH_URL && process.env.RAILWAY_PUBLIC_DOMAIN) {
    process.env.NEXTAUTH_URL = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
}

function ensureDirs() {
  const uploadRoot =
    process.env.UPLOAD_ROOT || path.join(process.cwd(), "public", "uploads");

  mkdirSync(uploadRoot, { recursive: true });
  for (const kind of ["avatar", "banner", "attachments", "projects"]) {
    mkdirSync(path.join(uploadRoot, kind), { recursive: true });
  }

  const dbUrl = process.env.DATABASE_URL || "";
  if (dbUrl.startsWith("file:")) {
    const dbPath = dbUrl.replace(/^file:/, "");
    const dbDir = path.dirname(dbPath);
    if (dbDir && dbDir !== ".") mkdirSync(dbDir, { recursive: true });
  }

  process.env.UPLOAD_ROOT = uploadRoot;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
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
  applyDefaults();
  ensureDirs();

  console.log("DATABASE_URL=", process.env.DATABASE_URL);
  console.log("UPLOAD_ROOT=", process.env.UPLOAD_ROOT);
  console.log("NEXTAUTH_URL=", process.env.NEXTAUTH_URL || "(unset)");

  console.log("Running prisma migrate deploy...");
  await run("npx", ["prisma", "migrate", "deploy"]);

  // Boş DB → otomatik demo içerik; SEED_ON_BOOT=1 → zorla yeniden seed
  try {
    await run("node", ["scripts/seed-if-empty.mjs"]);
  } catch (error) {
    console.error("Seed failed (continuing):", error);
  }

  const port = process.env.PORT || "3000";
  const nextBin = path.join(
    process.cwd(),
    "node_modules",
    "next",
    "dist",
    "bin",
    "next",
  );
  console.log(`Starting Next.js on 0.0.0.0:${port}`);
  await run(process.execPath, [nextBin, "start", "-H", "0.0.0.0", "-p", String(port)]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
