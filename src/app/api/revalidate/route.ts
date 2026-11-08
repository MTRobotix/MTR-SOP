// GitHub push webhook: a push to the content branch expires the cached content, so it is live at once.
// Signed with GITHUB_WEBHOOK_SECRET; the proxy lets it through without a session.
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { expireContent } from "@/lib/content/source";

export async function POST(req: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "GITHUB_WEBHOOK_SECRET is not set." }, { status: 500 });
  const body = await req.text();
  const got = Buffer.from(req.headers.get("x-hub-signature-256") ?? "");
  const want = Buffer.from(`sha256=${createHmac("sha256", secret).update(body).digest("hex")}`);
  if (got.length !== want.length || !timingSafeEqual(got, want)) return NextResponse.json({ error: "Bad signature." }, { status: 401 });

  const branch = process.env.GITHUB_BRANCH || "main";
  const event = JSON.parse(body) as { ref?: string; after?: string };
  const push = req.headers.get("x-github-event") === "push" && event.ref === `refs/heads/${branch}` && Boolean(event.after);
  if (push) await expireContent(event.after!);
  return NextResponse.json({ expired: push });
}
