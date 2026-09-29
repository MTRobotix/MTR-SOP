import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { search } from "@/lib/search";

export async function GET(req: Request) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const q = new URL(req.url).searchParams.get("q") ?? "";
  const hits = await search(q);
  return NextResponse.json({ hits: hits.map((h) => ({ ...h, text: undefined })) });
}
