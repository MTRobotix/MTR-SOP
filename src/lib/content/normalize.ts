// The single serializer for SOP files. Every editor (app, VS Code via `npm run content:format`,
// agents) goes through this, so the same content always produces the same bytes.
// Rules: mtr-sop-content skill §5.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkStringify, { type Options as StringifyOptions } from "remark-stringify";
import YAML from "yaml";
import { DOC_KEYS, DEPT_KEYS } from "./schema";

export const STRINGIFY_OPTIONS: StringifyOptions = {
  bullet: "-",
  bulletOrdered: ".",
  emphasis: "_",
  strong: "*",
  fence: "`",
  fences: true,
  incrementListMarker: true,
  listItemIndent: "one",
  rule: "-",
  setext: false,
  closeAtx: false,
  tightDefinitions: true,
};

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const text = raw.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
  const m = FRONTMATTER_RE.exec(text);
  if (!m) return { data: {}, body: text };
  const parsed: unknown = YAML.parse(m[1]);
  const data = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  return { data, body: text.slice(m[0].length) };
}

function yamlScalar(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map((x) => yamlScalar(x)).join(", ")}]`;
  return YAML.stringify(v, { lineWidth: 0 }).trimEnd();
}

export function stringifyFrontmatter(data: Record<string, unknown>, kind: "doc" | "dept"): string {
  const keys: readonly string[] = kind === "doc" ? DOC_KEYS : DEPT_KEYS;
  // Known keys in fixed order first; unknown keys kept at the end so validation can report them.
  const ordered = [...keys.filter((k) => k in data), ...Object.keys(data).filter((k) => !keys.includes(k))];
  const lines = ordered.map((k) => `${k}: ${yamlScalar(data[k])}`);
  return `---\n${lines.join("\n")}\n---\n`;
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, STRINGIFY_OPTIONS);

export function normalizeBody(body: string): string {
  const text = body.replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  let out = String(processor.processSync(text));
  // remark escapes the "[" of GitHub alert markers; restore `> [!NOTE]` etc.
  out = out.replace(/^(>\s*)\\\[!(NOTE|WARNING|TODO|TIP|IMPORTANT|CAUTION)\]/gm, "$1[!$2]");
  return out.trimEnd() + "\n";
}

export function normalizeFile(raw: string, kind: "doc" | "dept"): string {
  const { data, body } = splitFrontmatter(raw);
  const fm = stringifyFrontmatter(data, kind);
  const nb = normalizeBody(body);
  return nb ? `${fm}\n${nb}` : fm;
}

export function kindForPath(relPath: string): "doc" | "dept" {
  return relPath.endsWith("/_department.md") || relPath === "_department.md" ? "dept" : "doc";
}
