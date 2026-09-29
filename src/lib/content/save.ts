import "server-only";
import { normalizeFile, splitFrontmatter, stringifyFrontmatter, normalizeBody } from "./normalize";
import { today } from "./schema";
import { validateFile, lintConfig, hasRawHtml, type Issue } from "./validate";
import { getDoc } from "./repo";

/** Normalize + stamp `updated` + validate. The only path by which app edits become file content. */
export async function prepareDoc(dept: string, slug: string, raw: string, stampDate = true) {
  const { data, body } = splitFrontmatter(raw);
  if (stampDate) data.updated = today();
  const nb = normalizeBody(body);
  const content = normalizeFile(`${stringifyFrontmatter(data, "doc")}\n${nb}`, "doc");
  const path = `content/${dept}/${slug}.md`;
  const { issues, links, anchors: ownAnchors } = validateFile(path, content, lintConfig());

  for (const l of links) {
    if (l.dept === dept && l.slug === slug) {
      if (l.anchor && !ownAnchors.includes(l.anchor)) issues.push({ line: l.line, message: `Broken link: #${l.anchor} is not a heading in this doc.` });
      continue;
    }
    const target = await getDoc(l.dept, l.slug);
    if (!target) {
      issues.push({ line: l.line, message: `Broken link: /d/${l.dept}/${l.slug} does not exist.` });
      continue;
    }
    const anchors = validateFile(`content/${l.dept}/${l.slug}.md`, target.raw, lintConfig()).anchors;
    if (l.anchor && !anchors.includes(l.anchor)) issues.push({ line: l.line, message: `Broken link: #${l.anchor} not found in /d/${l.dept}/${l.slug}.` });
  }

  return { content, issues: issues as Issue[], hasHtml: hasRawHtml(nb), rawBody: body };
}

/**
 * Issues for the live editor, with line numbers in the editor's own text.
 * Which issues exist comes from the normalized file (what will be saved); each issue's line
 * comes from the same issue found in the un-normalized text, when it exists there.
 */
export async function lintForEditor(dept: string, slug: string, raw: string) {
  const prepared = await prepareDoc(dept, slug, raw);
  const rawIssues = validateFile(`content/${dept}/${slug}.md`, raw.replace(/\r\n?/g, "\n"), lintConfig()).issues;
  const used = new Set<number>();
  const issues = prepared.issues.map((i) => {
    const k = rawIssues.findIndex((r, n) => !used.has(n) && r.message === i.message);
    if (k < 0) return { message: i.message, line: i.line !== undefined && i.line <= 1 ? 1 : undefined };
    used.add(k);
    return { message: i.message, line: rawIssues[k].line };
  });
  // Lines before the body in the raw text; editor line = file line - bodyOffset.
  const text = raw.replace(/\r\n?/g, "\n");
  const bodyOffset = text.split("\n").length - prepared.rawBody.split("\n").length;
  return { issues, bodyOffset, hasHtml: prepared.hasHtml };
}
