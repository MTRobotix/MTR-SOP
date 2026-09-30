// Markdown → safe HTML for doc pages.
// Raw HTML outside the allowlist (mtr-sop-content §5) is shown as literal text, then everything is sanitized.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize, { defaultSchema, type Options as SanitizeSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Root as MdRoot, Html, Text, Code, RootContent, Table, TableRow, TableCell, Paragraph } from "mdast";
import type { Root as HRoot, Element, Text as HText } from "hast";
import { ALLOWED_HTML } from "./schema";
import { parseEmbedDirective, readSheetAsTable } from "./attachments";

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9-]*)/g;

export function disallowedTags(html: string): string[] {
  const bad = new Set<string>();
  for (const m of html.matchAll(TAG_RE)) {
    const tag = m[1].toLowerCase();
    if (!(ALLOWED_HTML as readonly string[]).includes(tag)) bad.add(tag);
  }
  return [...bad];
}

function remarkGuardHtml() {
  return (tree: MdRoot) => {
    visit(tree, "html", (node: Html, index, parent) => {
      if (!parent || index === undefined) return;
      if (disallowedTags(node.value).length === 0) return;
      const text: Text = { type: "text", value: node.value };
      parent.children.splice(index, 1, text as never);
    });
  };
}

function textParagraph(value: string, emphasis = false): Paragraph {
  return {
    type: "paragraph",
    children: [emphasis ? { type: "emphasis", children: [{ type: "text", value }] } : { type: "text", value }],
  };
}

function cell(value: string): TableCell {
  return { type: "tableCell", children: [{ type: "text", value }] };
}

/** Turns a parsed sheet into mdast table nodes — the same node shape a hand-written `| a | b |` produces. */
function embedNodes(path: string, headerRow: string[], bodyRows: string[][]): RootContent[] {
  const row = (cells: string[]): TableRow => ({ type: "tableRow", children: cells.map(cell) });
  const table: Table = {
    type: "table",
    align: headerRow.map(() => null),
    children: [row(headerRow), ...bodyRows.map(row)],
  };
  return [table, textParagraph(`Embedded from \`${path}\` — open the file directly for the live version.`, true)];
}

/**
 * Finds ` ```embed-xlsx ` code blocks and replaces each with the sheet it names, rendered as a
 * normal table. Runs before remarkGfm's table nodes reach remark-rehype, so the result is styled
 * and sanitized exactly like a hand-written table — no new entry in the HTML allowlist needed.
 * Content skill §5 documents the block's syntax.
 */
function remarkEmbedXlsx() {
  return async (tree: MdRoot) => {
    async function walk(nodes: RootContent[]): Promise<void> {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.type === "code" && (node as Code).lang === "embed-xlsx") {
          const code = node as Code;
          const directive = parseEmbedDirective(code.value);
          if ("error" in directive) {
            nodes.splice(i, 1, textParagraph(`\u26a0 Could not embed: ${directive.error}`, true));
            continue;
          }
          // Lazy: keeps `server-only` (pulled in by ../store) out of any module graph that
          // never actually renders an embed — e.g. `content-check.ts`, a plain CLI script that
          // imports `disallowedTags` from this file but never calls `renderMarkdown`.
          const { store } = await import("../store");
          const bytes = await store().readBinary(directive.path);
          if (!bytes) {
            nodes.splice(i, 1, textParagraph(`\u26a0 Could not embed \`${directive.path}\`: file not found.`, true));
            continue;
          }
          const sheet = readSheetAsTable(bytes, directive);
          if ("error" in sheet) {
            nodes.splice(i, 1, textParagraph(`\u26a0 Could not embed \`${directive.path}\`: ${sheet.error}`, true));
            continue;
          }
          const replacement: RootContent[] = [
            ...(directive.title ? [textParagraph(directive.title)] : []),
            ...embedNodes(directive.path, sheet.headerRow, sheet.bodyRows),
          ];
          nodes.splice(i, 1, ...replacement);
          i += replacement.length - 1;
          continue;
        }
        if ("children" in node && Array.isArray(node.children)) {
          await walk(node.children as RootContent[]);
        }
      }
    }
    await walk(tree.children);
  };
}

const CALLOUT_RE = /^\[!(NOTE|WARNING|TODO|TIP|IMPORTANT|CAUTION)\]\s*/;

function rehypeCallouts() {
  return (tree: HRoot) => {
    visit(tree, "element", (node: Element) => {
      if (node.tagName !== "blockquote") return;
      const p = node.children.find((c): c is Element => c.type === "element" && c.tagName === "p");
      const first = p?.children[0];
      if (!p || !first || first.type !== "text") return;
      const m = CALLOUT_RE.exec((first as HText).value);
      if (!m) return;
      const kind = m[1].toLowerCase();
      (first as HText).value = (first as HText).value.slice(m[0].length);
      node.properties = { ...node.properties, className: ["callout", `callout-${kind}`] };
      const label: Element = {
        type: "element",
        tagName: "p",
        properties: { className: ["callout-label"] },
        children: [{ type: "text", value: kind === "todo" ? "To do" : kind[0].toUpperCase() + kind.slice(1) }],
      };
      node.children.unshift(label);
    });
  };
}

const schema: SanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "mark"],
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className", /^language-/] as [string, RegExp]],
  },
};

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkGuardHtml)
  .use(remarkEmbedXlsx)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeSanitize, schema)
  .use(rehypeSlug)
  .use(rehypeCallouts)
  .use(rehypeHighlight, { detect: false, ignoreMissing: true } as never)
  .use(rehypeStringify);

export async function renderMarkdown(body: string): Promise<string> {
  return String(await processor.process(body));
}
