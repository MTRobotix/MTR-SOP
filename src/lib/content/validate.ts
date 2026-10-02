// One validator for every write path: app saves, `npm run content:check`, CI.
// Rules: mtr-sop-content skill §3–§5.
import fs from "node:fs";
import path from "node:path";
import { lint } from "markdownlint/sync";
import type { Configuration } from "markdownlint";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import { visit } from "unist-util-visit";
import type { Root, Heading, Link, Html } from "mdast";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import { normalizeFile, splitFrontmatter, kindForPath } from "./normalize";
import { validateDocMeta, validateDeptMeta, SLUG_RE } from "./schema";
import { disallowedTags } from "./render";
import { attachmentRelPath, parseAttachmentLink } from "./attachments";

export type Issue = { line?: number; message: string };

let cachedConfig: Configuration | null = null;

/** Parses `.markdownlint.jsonc` (the single lint config, also read by the VS Code extension). */
export function lintConfig(root = process.cwd()): Configuration {
  if (cachedConfig) return cachedConfig;
  const text = fs.readFileSync(path.join(root, ".markdownlint.jsonc"), "utf8");
  cachedConfig = JSON.parse(text.replace(/^\s*\/\/.*$/gm, "")) as Configuration;
  return cachedConfig;
}

export function lintMarkdown(content: string, config: Configuration): Issue[] {
  const res = lint({ strings: { doc: content }, config });
  return (res.doc ?? []).map((e) => ({
    line: e.lineNumber,
    message: `${e.ruleNames[0]} ${e.ruleDescription}${e.errorDetail ? ` (${e.errorDetail})` : ""}`,
  }));
}

const parser = unified().use(remarkParse).use(remarkGfm);

export type LinkTarget = { dept: string; slug: string; anchor: string | null; line?: number };

/** Structural checks on one file. `relPath` is like `content/software/foo.md`. */
export function validateFile(relPath: string, content: string, config: Configuration): { issues: Issue[]; links: LinkTarget[]; anchors: string[] } {
  const issues: Issue[] = [];
  const links: LinkTarget[] = [];
  const anchors: string[] = [];
  const m = /^content\/([^/]+)\/([^/]+)\.md$/.exec(relPath);
  if (!m || !SLUG_RE.test(m[1]) || (m[2] !== "_department" && !SLUG_RE.test(m[2]))) {
    issues.push({ message: `Bad path "${relPath}". Use content/<dept>/<slug>.md with lowercase kebab-case names.` });
    return { issues, links, anchors };
  }
  const kind = kindForPath(relPath);
  const { data, body } = splitFrontmatter(content);
  const meta = kind === "doc" ? validateDocMeta(data) : validateDeptMeta(data);
  if (!meta.ok) issues.push(...meta.errors.map((message) => ({ line: 1, message: `Frontmatter ${message}` })));

  if (normalizeFile(content, kind) !== content.replace(/\r\n?/g, "\n")) {
    issues.push({ message: "Not in canonical format. Run `npm run content:format` (the app does this on save)." });
  }
  if (kind === "dept") return { issues, links, anchors };

  const fmLines = content.split("\n").length - body.split("\n").length;
  const tree = parser.parse(body) as Root;
  const slugger = new GithubSlugger();
  const seen = new Map<string, number>();
  visit(tree, "heading", (h: Heading) => {
    const text = toString(h);
    const line = (h.position?.start.line ?? 0) + fmLines;
    anchors.push(slugger.slug(text));
    if (h.depth === 1) issues.push({ line, message: "No # H1 in the body. The title comes from frontmatter; start at ##." });
    if (h.depth > 4) issues.push({ line, message: "Heading deeper than ####." });
    if (seen.has(text)) issues.push({ line, message: `Duplicate heading "${text}" (first on line ${seen.get(text)}).` });
    else seen.set(text, line);
  });
  visit(tree, "html", (n: Html) => {
    const bad = disallowedTags(n.value);
    if (bad.length) issues.push({ line: (n.position?.start.line ?? 0) + fmLines, message: `HTML not allowed: <${bad.join(">, <")}>.` });
  });
  visit(tree, "link", (l: Link) => {
    const line = (l.position?.start.line ?? 0) + fmLines;
    if (l.url.startsWith("attachments/")) {
      const ref = parseAttachmentLink(l.url);
      if (!ref) issues.push({ line, message: `Attachment "${l.url}": use a lowercase file name ending in .pdf, .docx, .xlsx or .csv.` });
      else if (!fs.existsSync(path.join(process.cwd(), attachmentRelPath(m[1], ref.file)))) {
        issues.push({ line, message: `Attachment not found: ${attachmentRelPath(m[1], ref.file)}.` });
      }
      return;
    }
    const lm = /^\/d\/([^/#?]+)\/([^/#?]+)(?:#(.+))?$/.exec(l.url);
    if (lm) links.push({ dept: lm[1], slug: lm[2], anchor: lm[3] ?? null, line: (l.position?.start.line ?? 0) + fmLines });
    else if (l.url.startsWith("/") && !l.url.startsWith("/d/")) {
      issues.push({ line: (l.position?.start.line ?? 0) + fmLines, message: `Internal link "${l.url}" must look like /d/<dept>/<slug>#<heading-id>.` });
    }
  });
  for (const i of lintMarkdown(content, config)) {
    // MD033 duplicates the allowlist check above with a less helpful message.
    if (!i.message.startsWith("MD033")) issues.push(i);
  }
  return { issues, links, anchors };
}

export function hasRawHtml(body: string): boolean {
  let found = false;
  visit(parser.parse(body) as Root, "html", () => {
    found = true;
  });
  return found;
}
