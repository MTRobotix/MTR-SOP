// Splits a doc body into `##` sections — the unit that search returns and links jump to.
// Heading ids use github-slugger over every heading in order, matching rehype-slug in render.ts.
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";
import { toString } from "mdast-util-to-string";
import type { Root, RootContent, Nodes } from "mdast";

export type Section = { id: string; heading: string; depth: number; text: string; subheadings: string[] };

const parser = unified().use(remarkParse).use(remarkGfm);

const SPACED = new Set(["list", "listItem", "table", "tableRow", "tableCell", "blockquote"]);

/** Plain text of a node; block containers are joined with spaces so words do not run together. */
function plain(node: Nodes): string {
  if (SPACED.has(node.type) && "children" in node) return (node.children as Nodes[]).map(plain).join(" ");
  return toString(node).replace(/\[!(NOTE|WARNING|TODO|TIP|IMPORTANT|CAUTION)\]\s*/g, "");
}

export function splitSections(body: string, docTitle: string): Section[] {
  const tree = parser.parse(body) as Root;
  const slugger = new GithubSlugger();
  const sections: Section[] = [];
  let current: Section = { id: "", heading: docTitle, depth: 1, text: "", subheadings: [] };
  const parts: string[] = [];

  const flush = () => {
    current.text = parts.join("\n").trim();
    parts.length = 0;
    if (current.text || current.depth === 2) sections.push(current);
  };

  for (const node of tree.children as RootContent[]) {
    if (node.type === "heading") {
      const text = toString(node);
      const id = slugger.slug(text);
      if (node.depth <= 2) {
        flush();
        current = { id, heading: text, depth: 2, text: "", subheadings: [] };
        continue;
      }
      current.subheadings.push(text);
      parts.push(text);
      continue;
    }
    if (node.type === "html") continue;
    parts.push(plain(node));
  }
  flush();
  return sections;
}

/** Headings for the "On this page" list. */
export function outline(sections: Section[]): { id: string; heading: string }[] {
  return sections.filter((s) => s.depth === 2).map((s) => ({ id: s.id, heading: s.heading }));
}
