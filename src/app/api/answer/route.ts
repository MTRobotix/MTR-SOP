// Streams a short AI answer grounded in the top search hits. Sources go in the X-Sources header.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { search } from "@/lib/search";
import { provider } from "@/lib/ai";
import type { Source } from "@/lib/ai/prompt";

const MAX_SOURCES = 6;
const MAX_SOURCE_CHARS = 3000;

export async function POST(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { q = "" } = (await req.json().catch(() => ({}))) as { q?: string };
  const question = q.trim().slice(0, 300);
  if (!question) return NextResponse.json({ error: "Empty question." }, { status: 400 });

  const p = provider();
  if (!p) return NextResponse.json({ error: "AI answers are not configured." }, { status: 503 });

  const hits = await search(question, MAX_SOURCES);
  const sources: Source[] = hits.map((h, i) => ({
    n: i + 1,
    title: `${h.docTitle} — ${h.heading}`,
    href: h.href,
    text: h.text.slice(0, MAX_SOURCE_CHARS),
  }));
  const header = Buffer.from(JSON.stringify(sources.map(({ n, title, href }) => ({ n, title, href })))).toString("base64");

  if (sources.length === 0) {
    return new Response("The SOP does not cover this.", { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Sources": header } });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of p.streamAnswer(question, sources, req.signal)) controller.enqueue(encoder.encode(chunk));
      } catch (e) {
        if (!req.signal.aborted) {
          console.error(e);
          controller.enqueue(encoder.encode("\n\nAI answer failed. Use the sections below."));
        }
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Sources": header },
  });
}
