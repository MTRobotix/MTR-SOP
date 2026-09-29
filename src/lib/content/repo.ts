// Reads SOP files from ./content (the deployed copy of `main`). Server-only.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { splitFrontmatter } from "./normalize";
import { validateDeptMeta, validateDocMeta, SLUG_RE, type DeptMeta, type DocMeta } from "./schema";
import { splitSections, type Section } from "./sections";
import { blobSha } from "./sha";

export const CONTENT_DIR = path.join(process.cwd(), "content");

export type Department = { id: string; meta: DeptMeta };
export type DocSummary = { dept: string; slug: string; meta: DocMeta };
export type Doc = DocSummary & { raw: string; body: string; sha: string; sections: Section[] };

export function docPath(dept: string, slug: string): string {
  return `content/${dept}/${slug}.md`;
}

export function isValidId(id: string): boolean {
  return SLUG_RE.test(id) && id.length <= 60;
}

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

export async function listDepartments(): Promise<Department[]> {
  const entries = await fs.readdir(CONTENT_DIR, { withFileTypes: true }).catch(() => []);
  const depts: Department[] = [];
  for (const e of entries) {
    if (!e.isDirectory() || !isValidId(e.name)) continue;
    const raw = await readIfExists(path.join(CONTENT_DIR, e.name, "_department.md"));
    if (raw === null) continue;
    const v = validateDeptMeta(splitFrontmatter(raw).data);
    if (v.ok) depts.push({ id: e.name, meta: v.value });
  }
  return depts.sort((a, b) => a.meta.order - b.meta.order);
}

export async function getDepartment(id: string): Promise<Department | null> {
  if (!isValidId(id)) return null;
  return (await listDepartments()).find((d) => d.id === id) ?? null;
}

export async function listDocs(dept: string): Promise<DocSummary[]> {
  if (!isValidId(dept)) return [];
  const dir = path.join(CONTENT_DIR, dept);
  const files = await fs.readdir(dir).catch(() => [] as string[]);
  const docs: DocSummary[] = [];
  for (const f of files) {
    if (!f.endsWith(".md") || f.startsWith("_")) continue;
    const slug = f.slice(0, -3);
    if (!isValidId(slug)) continue;
    const raw = await fs.readFile(path.join(dir, f), "utf8");
    const v = validateDocMeta(splitFrontmatter(raw).data);
    if (v.ok) docs.push({ dept, slug, meta: v.value });
  }
  return docs.sort((a, b) => a.meta.order - b.meta.order || a.meta.title.localeCompare(b.meta.title));
}

export async function getDoc(dept: string, slug: string): Promise<Doc | null> {
  if (!isValidId(dept) || !isValidId(slug)) return null;
  const raw = await readIfExists(path.join(CONTENT_DIR, dept, `${slug}.md`));
  if (raw === null) return null;
  const { data, body } = splitFrontmatter(raw);
  const v = validateDocMeta(data);
  if (!v.ok) return null;
  return { dept, slug, meta: v.value, raw, body, sha: blobSha(raw), sections: splitSections(body, v.value.title) };
}

export async function allDocs(): Promise<Doc[]> {
  const out: Doc[] = [];
  for (const d of await listDepartments()) {
    for (const s of await listDocs(d.id)) {
      const doc = await getDoc(d.id, s.slug);
      if (doc) out.push(doc);
    }
  }
  return out;
}

/** Changes whenever any content file changes; used to rebuild the search index. */
export async function contentVersion(): Promise<string> {
  const parts: string[] = [];
  async function walk(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else if (e.name.endsWith(".md")) {
        const st = await fs.stat(p);
        parts.push(`${p}:${st.mtimeMs}:${st.size}`);
      }
    }
  }
  await walk(CONTENT_DIR);
  return parts.sort().join("|");
}
