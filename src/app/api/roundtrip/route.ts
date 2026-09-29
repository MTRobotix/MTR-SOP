// Guards the visual editor: it may only edit a doc it can reproduce exactly.
// The client sends the original body and the visual editor's untouched Markdown output.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { normalizeBody } from "@/lib/content/normalize";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "editor")) return NextResponse.json({ error: "Editors and admins only." }, { status: 403 });
  const { original = "", visual = "" } = (await req.json().catch(() => ({}))) as { original?: string; visual?: string };
  return NextResponse.json({ same: normalizeBody(original.slice(0, 200_000)) === normalizeBody(visual.slice(0, 200_000)) });
}
