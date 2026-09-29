// Frontmatter schema for SOP files. Rules: mtr-sop-content skill §3–§4.

export const DOC_KEYS = ["title", "summary", "tags", "owner", "featured", "order", "updated"] as const;
export const DEPT_KEYS = ["title", "summary", "order"] as const;

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const MAX_FEATURED_PER_DEPT = 5;
export const ALLOWED_HTML = ["details", "summary", "kbd", "sub", "sup", "mark", "br"] as const;

export type DocMeta = {
  title: string;
  summary: string;
  tags: string[];
  owner: string;
  featured: boolean;
  order: number;
  updated: string;
};

export type DeptMeta = {
  title: string;
  summary: string;
  order: number;
};

type Result<T> = { ok: true; value: T } | { ok: false; errors: string[] };

function isStr(v: unknown, max = 200): v is string {
  return typeof v === "string" && v.trim().length > 0 && v.length <= max;
}

export function validateDocMeta(raw: Record<string, unknown>): Result<DocMeta> {
  const errors: string[] = [];
  const unknown = Object.keys(raw).filter((k) => !(DOC_KEYS as readonly string[]).includes(k));
  if (unknown.length) errors.push(`Unknown frontmatter keys: ${unknown.join(", ")}`);
  if (!isStr(raw.title, 120)) errors.push("title: required text, max 120 characters");
  if (!isStr(raw.summary, 160)) errors.push("summary: required text, max 160 characters");
  const tags = raw.tags;
  if (!Array.isArray(tags) || tags.length < 1 || tags.length > 8 || !tags.every((t) => typeof t === "string" && SLUG_RE.test(t))) {
    errors.push("tags: 1–8 lowercase kebab-case tags");
  }
  if (!isStr(raw.owner, 80)) errors.push('owner: a real person or "TODO"');
  if (typeof raw.featured !== "boolean") errors.push("featured: true or false");
  if (typeof raw.order !== "number" || !Number.isInteger(raw.order)) errors.push("order: integer");
  const updated = raw.updated instanceof Date ? raw.updated.toISOString().slice(0, 10) : raw.updated;
  if (typeof updated !== "string" || !DATE_RE.test(updated)) errors.push("updated: YYYY-MM-DD");
  if (errors.length) return { ok: false, errors };
  return {
    ok: true,
    value: {
      title: (raw.title as string).trim(),
      summary: (raw.summary as string).trim(),
      tags: tags as string[],
      owner: (raw.owner as string).trim(),
      featured: raw.featured as boolean,
      order: raw.order as number,
      updated: updated as string,
    },
  };
}

export function validateDeptMeta(raw: Record<string, unknown>): Result<DeptMeta> {
  const errors: string[] = [];
  const unknown = Object.keys(raw).filter((k) => !(DEPT_KEYS as readonly string[]).includes(k));
  if (unknown.length) errors.push(`Unknown frontmatter keys: ${unknown.join(", ")}`);
  if (!isStr(raw.title, 60)) errors.push("title: required text, max 60 characters");
  if (!isStr(raw.summary, 160)) errors.push("summary: required text, max 160 characters");
  if (typeof raw.order !== "number" || !Number.isInteger(raw.order)) errors.push("order: integer");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { title: raw.title as string, summary: raw.summary as string, order: raw.order as number } };
}

/** Local calendar date (en-CA formats as YYYY-MM-DD). */
export function today(): string {
  return new Date().toLocaleDateString("en-CA");
}
