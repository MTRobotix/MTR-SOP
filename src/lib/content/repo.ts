// Reads SOP docs from the content snapshot (source.ts): GitHub in production, ./content locally. Server-only.
import "server-only";
import { splitFrontmatter } from "./normalize";
import { validateDeptMeta, validateDocMeta, SLUG_RE, type DeptMeta, type DocMeta } from "./schema";
import { splitSections, type Section } from "./sections";
import { blobSha } from "./sha";
import { snapshot } from "./source";

export type Department = { id: string; meta: DeptMeta };
export type DocSummary = { dept: string; slug: string; meta: DocMeta };
export type Doc = DocSummary & { raw: string; body: string; sha: string; sections: Section[] };

export function docPath(dept: string, slug: string): string {
  return `content/${dept}/${slug}.md`;
}

export function isValidId(id: string): boolean {
  return SLUG_RE.test(id) && id.length <= 60;
}

export async function listDepartments(): Promise<Department[]> {
  const { docs } = await snapshot();
  const depts: Department[] = [];
  for (const [p, raw] of Object.entries(docs)) {
    const [, id, file] = p.split("/");
    if (file !== "_department.md" || !isValidId(id)) continue;
    const v = validateDeptMeta(splitFrontmatter(raw).data);
    if (v.ok) depts.push({ id, meta: v.value });
  }
  return depts.sort((a, b) => a.meta.order - b.meta.order);
}

export async function getDepartment(id: string): Promise<Department | null> {
  if (!isValidId(id)) return null;
  return (await listDepartments()).find((d) => d.id === id) ?? null;
}

export async function listDocs(dept: string): Promise<DocSummary[]> {
  if (!isValidId(dept)) return [];
  const { docs } = await snapshot();
  const out: DocSummary[] = [];
  for (const [p, raw] of Object.entries(docs)) {
    const [, d, file] = p.split("/");
    const slug = file.slice(0, -3);
    if (d !== dept || file.startsWith("_") || !isValidId(slug)) continue;
    const v = validateDocMeta(splitFrontmatter(raw).data);
    if (v.ok) out.push({ dept, slug, meta: v.value });
  }
  return out.sort((a, b) => a.meta.order - b.meta.order || a.meta.title.localeCompare(b.meta.title));
}

export async function getDoc(dept: string, slug: string): Promise<Doc | null> {
  if (!isValidId(dept) || !isValidId(slug)) return null;
  const raw = (await snapshot()).docs[docPath(dept, slug)];
  if (raw === undefined) return null;
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
  return (await snapshot()).version;
}
