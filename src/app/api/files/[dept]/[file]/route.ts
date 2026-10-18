// Serves SOP attachments (content/<dept>/attachments/<file>) to signed-in users.
import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { isValidId } from "@/lib/content/repo";
import { EMBED_TYPES, attachmentRelPath, parseAttachmentLink } from "@/lib/content/attachments";

type P = { params: Promise<{ dept: string; file: string }> };

export async function GET(req: Request, { params }: P) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { dept, file } = await params;
  const ref = isValidId(dept) ? parseAttachmentLink(`attachments/${file}`) : null;
  const data = ref ? await fs.readFile(path.join(process.cwd(), attachmentRelPath(dept, ref.file))).catch(() => null) : null;
  if (!ref || !data) return NextResponse.json({ error: "File not found." }, { status: 404 });

  const download = new URL(req.url).searchParams.has("download");
  const headers: Record<string, string> = {
    "Content-Type": EMBED_TYPES[ref.kind].mime,
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ref.file}"`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=300",
    "X-Content-Type-Options": "nosniff",
    // An SVG opened on its own runs as a page on this origin: sandbox it so it can never run script.
    ...(ref.kind === "svg" ? { "Content-Security-Policy": "sandbox; default-src 'none'; style-src 'unsafe-inline'; img-src data:" } : {}),
  };

  // Video players (Safari always) ask for byte ranges; answer with 206 so seeking works.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    const size = data.length;
    const start = range[1] ? Number(range[1]) : Math.max(size - Number(range[2]), 0);
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) {
      return new NextResponse(null, { status: 416, headers: { ...headers, "Content-Range": `bytes */${size}` } });
    }
    return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new NextResponse(new Uint8Array(data), { headers: { ...headers, "Content-Length": String(data.length) } });
}
