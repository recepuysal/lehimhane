import { mkdir, writeFile, access, copyFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "demo");

/**
 * Demo görseller `public/demo/` altında tutulur.
 * Bu script eksik dosya varsa uyarı verir; görseller AI ile üretildi.
 */
const required = [
  "arduino.jpg",
  "stm32.jpg",
  "raspberry-pi.jpg",
  "pcb.jpg",
  "lab-bench.jpg",
  "genel.jpg",
  "proje-vitrini.jpg",
  "duyurular.jpg",
  "alim-satim.jpg",
];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  let missing = 0;
  for (const file of required) {
    const dest = path.join(outDir, file);
    if (await exists(dest)) {
      console.log("ok", file);
    } else {
      console.warn("missing", file);
      missing += 1;
    }
  }
  await writeFile(
    path.join(outDir, "CREDITS.txt"),
    "Demo görseller — AI ile üretildi (Lehimhane demo içerik).\nDosyalar: arduino, stm32, raspberry-pi, pcb, lab-bench, genel, proje-vitrini, duyurular, alim-satim.\nYalnızca yerel demo/seed kullanımı içindir.\n",
    "utf8",
  );
  if (missing) {
    console.warn(`${missing} dosya eksik. Agent ile yeniden üretilebilir.`);
    process.exitCode = 1;
  } else {
    console.log("done → public/demo/");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
