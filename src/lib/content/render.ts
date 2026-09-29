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
import type { Root as MdRoot, Html, Text } from "mdast";
import type { Root as HRoot, Element, Text as HText } from "hast";
import { ALLOWED_HTML } from "./schema";

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
