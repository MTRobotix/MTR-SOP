// Live lint for the editor: same validator as save and CI, so what passes here passes everywhere.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { isValidId } from "@/lib/content/repo";
import { lintForEditor } from "@/lib/content/save";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "editor")) return NextResponse.json({ error: "Editors and admins only." }, { status: 403 });
  const { dept = "", slug = "", content = "" } = (await req.json().catch(() => ({}))) as { dept?: string; slug?: string; content?: string };
  if (!isValidId(dept) || !isValidId(slug)) return NextResponse.json({ issues: [{ message: "Slug: lowercase letters, digits and dashes only." }], bodyOffset: 0, hasHtml: false });
  return NextResponse.json(await lintForEditor(dept, slug, content.slice(0, 200_000)));
}
