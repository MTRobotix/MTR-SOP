import { createHash } from "node:crypto";

/** Git blob SHA-1 — identical to what GitHub reports for the file, so local and GitHub stores compare the same way. */
export function blobSha(content: string): string {
  const buf = Buffer.from(content, "utf8");
  return createHash("sha1").update(`blob ${buf.length}\0`).update(buf).digest("hex");
}
