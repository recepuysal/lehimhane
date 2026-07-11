import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { getUploadRoot } from "@/lib/paths";

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const TEXT_TYPES = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "application/json",
]);

const TEXT_EXTENSIONS = new Set([".txt", ".md", ".csv", ".log", ".json"]);

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 3;

export type SavedAttachment = {
  fileName: string;
  url: string;
  mimeType: string;
  size: number;
  kind: "image" | "text";
};

function extensionOf(fileName: string) {
  const index = fileName.lastIndexOf(".");
  return index >= 0 ? fileName.slice(index).toLowerCase() : "";
}

function resolveKind(file: File): "image" | "text" | null {
  if (IMAGE_TYPES.has(file.type)) return "image";
  if (TEXT_TYPES.has(file.type)) return "text";
  if (TEXT_EXTENSIONS.has(extensionOf(file.name))) return "text";
  return null;
}

function safeFileName(name: string) {
  return name.replace(/[^\w.\- ()\[\]]+/g, "_").slice(0, 80) || "dosya";
}

function uploadDir(...parts: string[]) {
  return path.join(getUploadRoot(), ...parts);
}

export async function saveUploadedImage(
  file: File,
  kind: "avatar" | "banner",
): Promise<string> {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Sadece JPG, PNG, WEBP veya GIF yükleyebilirsiniz");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("Dosya boyutu en fazla 2 MB olabilir");
  }

  const ext =
    file.type === "image/jpeg"
      ? "jpg"
      : file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "gif";

  const dir = uploadDir(kind);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${kind}/${filename}`;
}

export async function saveAttachment(file: File): Promise<SavedAttachment> {
  const kind = resolveKind(file);
  if (!kind) {
    throw new Error(
      "Sadece resim (JPG/PNG/WEBP/GIF) veya metin (TXT/MD/CSV) ekleyebilirsiniz",
    );
  }

  if (file.size > MAX_BYTES) {
    throw new Error(`"${file.name}" 2 MB sınırını aşıyor`);
  }

  const original = safeFileName(file.name);
  const ext = extensionOf(original) || (kind === "image" ? ".jpg" : ".txt");
  const stored = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const dir = uploadDir("attachments");
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, stored), buffer);

  return {
    fileName: original,
    url: `/uploads/attachments/${stored}`,
    mimeType: file.type || (kind === "image" ? "image/jpeg" : "text/plain"),
    size: file.size,
    kind,
  };
}

export async function saveProjectImage(file: File) {
  if (!IMAGE_TYPES.has(file.type)) {
    throw new Error("Proje görseli sadece JPG/PNG/WEBP/GIF olabilir");
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`"${file.name}" 2 MB sınırını aşıyor`);
  }

  const original = safeFileName(file.name);
  const ext = extensionOf(original) || ".jpg";
  const stored = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
  const dir = uploadDir("projects");
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, stored),
    Buffer.from(await file.arrayBuffer()),
  );

  return {
    fileName: original,
    url: `/uploads/projects/${stored}`,
  };
}

export async function saveAttachments(files: File[]) {
  if (files.length > MAX_FILES) {
    throw new Error(`En fazla ${MAX_FILES} dosya ekleyebilirsiniz`);
  }

  const saved: SavedAttachment[] = [];
  for (const file of files) {
    if (file.size === 0) continue;
    saved.push(await saveAttachment(file));
  }
  return saved;
}

export function collectFormFiles(formData: FormData, field = "files") {
  return formData
    .getAll(field)
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
}

export async function deleteAttachmentFiles(urls: string[]) {
  const { unlink } = await import("fs/promises");
  for (const url of urls) {
    if (!url.startsWith("/uploads/attachments/")) continue;
    const name = path.basename(url);
    const fullPath = uploadDir("attachments", name);
    try {
      await unlink(fullPath);
    } catch {
      // dosya yoksa sessiz geç
    }
  }
}
