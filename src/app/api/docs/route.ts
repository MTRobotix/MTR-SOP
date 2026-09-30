import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { isValidId, getDepartment } from "@/lib/content/repo";
import { prepareDoc } from "@/lib/content/save";
import { store, ConflictError } from "@/lib/store";
import { GitHubError } from "@/lib/store/github";

/** Turns a failed GitHub call into a message that says what to fix. */
function explain(e: unknown): string | null {
  if (e instanceof GitHubError) {
    const hint =
      e.status === 401
        ? "GITHUB_TOKEN is invalid or expired. Create a new one and update it in Vercel."
        : e.status === 403 || e.status === 404
          ? `GITHUB_TOKEN cannot write to ${process.env.GITHUB_REPO}. Give it Contents and Pull requests: Read and write.`
          : "Check the GitHub settings in Vercel.";
    return `GitHub refused the save (${e.status}: ${e.reason}). ${hint}`;
  }
  if (e instanceof Error && /GITHUB_(TOKEN|REPO)/.test(e.message)) return e.message;
  return null;
}

type Body = { dept?: string; slug?: string; content?: string; baseSha?: string | null; message?: string };

const MAX_BYTES = 200_000;

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!hasRole(user.role, "editor")) return NextResponse.json({ error: "Editors and admins only." }, { status: 403 });

  const b = (await req.json().catch(() => ({}))) as Body;
  const { dept = "", slug = "", content = "", baseSha = null } = b;
  const message = (b.message ?? "").trim().slice(0, 120);
  if (!isValidId(dept) || !isValidId(slug)) return NextResponse.json({ error: "Invalid department or slug." }, { status: 400 });
  if (!(await getDepartment(dept))) return NextResponse.json({ error: "Department does not exist." }, { status: 400 });
  if (content.length > MAX_BYTES) return NextResponse.json({ error: "Document too large (max 200 KB)." }, { status: 413 });
  if (!message) return NextResponse.json({ error: "Describe what changed." }, { status: 400 });
  if (baseSha === null && !hasRole(user.role, "admin")) return NextResponse.json({ error: "Only admins create new sections." }, { status: 403 });

  const prepared = await prepareDoc(dept, slug, content);
  if (prepared.issues.length) return NextResponse.json({ error: "Fix the issues before saving.", issues: prepared.issues }, { status: 422 });

  const input = { dept, slug, content: prepared.content, baseSha, user, message: `sop(${dept}/${slug}): ${message}` };
  try {
    const s = store();
    if (hasRole(user.role, "admin")) {
      await s.commit(input);
      return NextResponse.json({ kind: "committed", mode: s.mode });
    }
    const p = await s.propose(input);
    return NextResponse.json({ kind: "proposed", mode: s.mode, url: p.url });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message, conflict: true }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: explain(e) ?? "Save failed. Try again; if it repeats, tell an admin." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.role, "admin")) return NextResponse.json({ error: "Admins only." }, { status: 403 });
  const { dept = "", slug = "", baseSha = "" } = (await req.json().catch(() => ({}))) as Body;
  if (!isValidId(dept) || !isValidId(slug) || !baseSha) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  try {
    await store().remove(dept, slug, baseSha, user);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ConflictError) return NextResponse.json({ error: e.message, conflict: true }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: explain(e) ?? "Delete failed." }, { status: 500 });
  }
}
