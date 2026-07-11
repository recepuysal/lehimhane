import path from "path";

/** Railway volume: /data/uploads — local: public/uploads */
export function getUploadRoot() {
  if (process.env.UPLOAD_ROOT) {
    return process.env.UPLOAD_ROOT;
  }
  if (process.env.RAILWAY_VOLUME_MOUNT_PATH) {
    return path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH, "uploads");
  }
  return path.join(process.cwd(), "public", "uploads");
}
