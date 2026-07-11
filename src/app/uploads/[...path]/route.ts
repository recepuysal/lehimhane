import { createReadStream, existsSync, statSync } from "fs";
import path from "path";
import { Readable } from "stream";
import { getUploadRoot } from "@/lib/paths";

type Props = {
  params: Promise<{ path: string[] }>;
};

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".json": "application/json",
  ".log": "text/plain; charset=utf-8",
};

export async function GET(_request: Request, { params }: Props) {
  const parts = (await params).path ?? [];
  if (parts.length === 0 || parts.some((p) => p.includes("..") || p.includes("\\") || p.includes("/"))) {
    return new Response("Not found", { status: 404 });
  }

  const root = getUploadRoot();
  const filePath = path.join(root, ...parts);

  // public/uploads fallback (local / demo)
  const candidates = [
    filePath,
    path.join(process.cwd(), "public", "uploads", ...parts),
  ];

  const existing = candidates.find((candidate) => existsSync(candidate));
  if (!existing) {
    return new Response("Not found", { status: 404 });
  }

  const stat = statSync(existing);
  if (!stat.isFile()) {
    return new Response("Not found", { status: 404 });
  }

  const ext = path.extname(existing).toLowerCase();
  const type = MIME[ext] ?? "application/octet-stream";
  const stream = createReadStream(existing);
  const webStream = Readable.toWeb(stream) as unknown as ReadableStream;

  return new Response(webStream, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(stat.size),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
