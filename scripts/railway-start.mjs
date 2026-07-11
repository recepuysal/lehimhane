import { mkdirSync } from "fs";
import path from "path";
import { spawn } from "child_process";

const dataRoot = process.env.UPLOAD_ROOT
  ? path.dirname(process.env.UPLOAD_ROOT)
  : process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    (process.env.DATABASE_URL?.includes("file:/data/") ? "/data" : null);

function ensureDirs() {
  const uploadRoot = process.env.UPLOAD_ROOT
    ? process.env.UPLOAD_ROOT
    : dataRoot
      ? path.join(dataRoot, "uploads")
      : path.join(process.cwd(), "public", "uploads");

  for (const kind of ["avatar", "banner", "attachments", "projects"]) {
    mkdirSync(path.join(uploadRoot, kind), { recursive: true });
  }

  if (!process.env.UPLOAD_ROOT && dataRoot) {
    process.env.UPLOAD_ROOT = path.join(dataRoot, "uploads");
  }
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
      else reject(new Error(`${command} exited ${code}`));
    });
  });
}

async function main() {
  ensureDirs();
  console.log("Running prisma migrate deploy...");
  await run("npx", ["prisma", "migrate", "deploy"]);

  if (process.env.SEED_ON_BOOT === "1") {
    console.log("Seeding database...");
    await run("npx", ["tsx", "prisma/seed.ts"]);
  }

  const port = process.env.PORT || "3000";
  console.log(`Starting Next.js on 0.0.0.0:${port}`);
  await run("npx", ["next", "start", "-H", "0.0.0.0", "-p", String(port)]);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
