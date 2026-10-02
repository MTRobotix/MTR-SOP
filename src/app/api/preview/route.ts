import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { renderMarkdown } from "@/lib/content/render";
import { isValidId } from "@/lib/content/repo";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "editor")) return NextResponse.json({ error: "Editors and admins only." }, { status: 403 });
  const { body = "", dept } = (await req.json().catch(() => ({}))) as { body?: string; dept?: string };
  const embedDept = dept && isValidId(dept) ? dept : undefined;
  return NextResponse.json({ html: await renderMarkdown(body.slice(0, 200_000), embedDept) });
}
