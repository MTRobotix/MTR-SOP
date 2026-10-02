// Turns a paragraph that holds only an `attachments/<file>` link into an embedded preview card.
// Runs after sanitizing, so every node here is built from escaped text or re-sanitized HTML.
import fs from "node:fs/promises";
import path from "node:path";
import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize from "rehype-sanitize";
import { visit } from "unist-util-visit";
import mammoth from "mammoth";
import readExcelFile from "read-excel-file/node";
import type { Root, Element, ElementContent, Properties } from "hast";
import { EMBED_TYPES, attachmentUrl, parseAttachmentLink, type AttachmentRef } from "./attachments";

const MAX_ROWS = 100;
const MAX_COLS = 20;

const h = (tagName: string, properties: Properties, children: ElementContent[] = []): Element => ({
  type: "element",
  tagName,
  properties,
  children,
});
const t = (value: string): ElementContent => ({ type: "text", value });

function textOf(node: ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") return Number.isInteger(v) ? v.toLocaleString("en-US") : v.toLocaleString("en-US", { maximumFractionDigits: 4 });
  return String(v);
}

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/** Drops empty rows and trailing empty columns, then caps the size. */
function tidy(rows: string[][]): { rows: string[][]; total: number } {
  const kept = rows.filter((r) => r.some((c) => c.trim() !== ""));
  let cols = 0;
  for (const r of kept) {
    for (let i = r.length - 1; i >= 0; i--) {
      if (r[i].trim() !== "") {
        cols = Math.max(cols, i + 1);
        break;
      }
    }
  }
  cols = Math.min(cols, MAX_COLS);
  return { rows: kept.slice(0, MAX_ROWS).map((r) => Array.from({ length: cols }, (_, i) => r[i] ?? "")), total: kept.length };
}

function table(rows: string[][], header: boolean): Element {
  const cell = (tag: string, v: string) => h(tag, {}, [t(v)]);
  const [head, ...rest] = rows;
  const body = (header ? rest : rows).map((r) => h("tr", {}, r.map((v) => cell("td", v))));
  return h("table", {}, [
    ...(header && head ? [h("thead", {}, [h("tr", {}, head.map((v) => cell("th", v)))])] : []),
    h("tbody", {}, body),
  ]);
}

function truncNote(shown: number, total: number): ElementContent[] {
  return total > shown ? [h("p", { className: ["embed-note"] }, [t(`Showing ${shown} of ${total} rows. Download the file for the rest.`)])] : [];
}

const docxSanitizer = unified().use(rehypeParse, { fragment: true }).use(rehypeSanitize);

async function preview(file: string, ref: AttachmentRef, url: string, title: string): Promise<ElementContent[]> {
  switch (ref.kind) {
    case "pdf":
      return [h("iframe", { className: ["embed-pdf"], src: url, title, loading: "lazy" })];
    case "csv": {
      const { rows, total } = tidy(parseCsv(await fs.readFile(file, "utf8")));
      return [h("div", { className: ["embed-scroll"] }, [table(rows, true)]), ...truncNote(Math.max(rows.length - 1, 0), Math.max(total - 1, 0))];
    }
    case "xlsx": {
      const sheets = await readExcelFile(await fs.readFile(file));
      const out: ElementContent[] = [];
      for (const s of sheets) {
        const { rows, total } = tidy(s.data.map((r) => r.map(formatCell)));
        if (rows.length === 0) continue;
        if (sheets.length > 1) out.push(h("p", { className: ["embed-sheet"] }, [t(`Sheet: ${s.sheet}`)]));
        out.push(h("div", { className: ["embed-scroll"] }, [table(rows, false)]), ...truncNote(rows.length, total));
      }
      return out;
    }
    case "docx": {
      const { value } = await mammoth.convertToHtml({ buffer: await fs.readFile(file) });
      const clean = docxSanitizer.runSync(docxSanitizer.parse(value)) as Root;
      return [h("div", { className: ["embed-doc"] }, clean.children as ElementContent[])];
    }
  }
}

const cache = new Map<string, { mtime: number; nodes: ElementContent[] }>();

async function buildEmbed(contentDir: string, dept: string, ref: AttachmentRef, label: string): Promise<Element> {
  const file = path.join(contentDir, dept, "attachments", ref.file);
  const url = attachmentUrl(dept, ref.file);
  const kind = EMBED_TYPES[ref.kind].label;
  const title = label.trim() || ref.file;
  const stat = await fs.stat(file).catch(() => null);
  if (!stat) {
    return h("div", { className: ["embed", "embed-missing"] }, [h("p", {}, [t(`File not found: attachments/${ref.file}. Add it to content/${dept}/attachments/.`)])]);
  }

  let nodes = cache.get(file)?.mtime === stat.mtimeMs ? cache.get(file)!.nodes : null;
  if (!nodes) {
    try {
      nodes = await preview(file, ref, url, title);
    } catch {
      nodes = [h("p", { className: ["embed-note"] }, [t("Preview unavailable. Download the file to open it.")])];
    }
    cache.set(file, { mtime: stat.mtimeMs, nodes });
  }

  return h("figure", { className: ["embed", `embed-${ref.kind}`] }, [
    h("figcaption", { className: ["embed-head"] }, [
      h("span", { className: ["embed-kind"] }, [t(kind)]),
      h("span", { className: ["embed-title"] }, [t(title)]),
      h("span", { className: ["embed-meta"] }, [t(`${ref.file} · ${formatSize(stat.size)}`)]),
      h("span", { className: ["embed-actions"] }, [
        ...(ref.kind === "pdf" ? [h("a", { className: ["btn", "btn-sm"], href: url, target: "_blank", rel: ["noopener"] }, [t("Open")])] : []),
        h("a", { className: ["btn", "btn-sm"], href: `${url}?download=1`, download: ref.file }, [t("Download")]),
      ]),
    ]),
    h("div", { className: ["embed-body"] }, structuredClone(nodes)),
  ]);
}

export function rehypeEmbeds(options: { dept: string; contentDir: string }) {
  return async (tree: Root) => {
    const jobs: Promise<void>[] = [];
    visit(tree, "element", (node: Element, index, parent) => {
      if (node.tagName === "a") {
        const inline = parseAttachmentLink(String(node.properties?.href ?? ""));
        if (inline) node.properties = { ...node.properties, href: `${attachmentUrl(options.dept, inline.file)}?download=1` };
        return;
      }
      if (node.tagName !== "p" || !parent || index === undefined) return;
      const kids = node.children.filter((c) => !(c.type === "text" && c.value.trim() === ""));
      const link = kids[0];
      if (kids.length !== 1 || link.type !== "element" || link.tagName !== "a") return;
      const ref = parseAttachmentLink(String(link.properties?.href ?? ""));
      if (!ref) return;
      const slot = h("div", {});
      parent.children[index] = slot;
      jobs.push(buildEmbed(options.contentDir, options.dept, ref, textOf(link)).then((el) => void Object.assign(slot, el)));
    });
    await Promise.all(jobs);
  };
}
