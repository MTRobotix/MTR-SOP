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
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": EMBED_TYPES[ref.kind].mime,
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ref.file}"`,
      "Content-Length": String(data.length),
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
