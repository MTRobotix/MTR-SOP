// Where an embedded (non-Markdown) file is allowed to live, and how its path is validated.
// One rule, used by both stores (readBinary) and the renderer (remarkEmbedXlsx), so a path that
// passes validation is guaranteed safe to read from disk or from the GitHub API.

import * as XLSX from "xlsx";
import { SLUG_RE } from "./schema";

const ATTACHMENT_NAME_RE = /^[a-z0-9]+(?:[._-][a-z0-9]+)*\.(xlsx|xls)$/;

/**
 * Only `content/<dept>/attachments/<file>.xlsx` (or `.xls`) is a valid embed target.
 * Rejects `..`, absolute paths, and anything outside a department's `attachments/` folder —
 * an embed can never read arbitrary repo files (secrets, source, other depts' drafts).
 */
export function isValidAttachmentPath(relPath: string): boolean {
  const m = /^content\/([^/]+)\/attachments\/([^/]+)$/.exec(relPath);
  if (!m) return false;
  const [, dept, name] = m;
  return SLUG_RE.test(dept) && ATTACHMENT_NAME_RE.test(name);
}

export type EmbedDirective = {
  path: string;
  sheet?: string;
  title?: string;
  skipRows: number;
  maxRows: number;
};

const MAX_ROWS_CEILING = 500;

/** Parses the plain `key: value` body of an ` ```embed-xlsx ` fenced block. Unknown/blank lines ignored. */
export function parseEmbedDirective(raw: string): EmbedDirective | { error: string } {
  const fields: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const m = /^([a-z_]+):\s*(.*)$/.exec(line.trim());
    if (m) fields[m[1]] = m[2].trim();
  }
  if (!fields.path) return { error: "missing `path:`" };
  if (!isValidAttachmentPath(fields.path)) {
    return { error: `path must look like content/<dept>/attachments/<file>.xlsx, got \`${fields.path}\`` };
  }
  const skipRows = Number.parseInt(fields.skip_rows ?? "0", 10);
  const maxRows = Number.parseInt(fields.max_rows ?? String(MAX_ROWS_CEILING), 10);
  if (!Number.isInteger(skipRows) || skipRows < 0) return { error: "skip_rows must be a non-negative integer" };
  if (!Number.isInteger(maxRows) || maxRows < 1) return { error: "max_rows must be a positive integer" };
  return {
    path: fields.path,
    sheet: fields.sheet || undefined,
    title: fields.title || undefined,
    skipRows,
    maxRows: Math.min(maxRows, MAX_ROWS_CEILING),
  };
}

export type SheetTable = { headerRow: string[]; bodyRows: string[][]; sheetNames: string[] };

/** Reads one sheet of a workbook into a rectangular grid of display strings (formulas evaluated). */
export function readSheetAsTable(buffer: Buffer, directive: EmbedDirective): SheetTable | { error: string } {
  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellText: true });
  } catch {
    return { error: "could not parse the file as an Excel workbook" };
  }
  const sheetName = directive.sheet ?? wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  if (!ws) return { error: `sheet \`${sheetName}\` not found (workbook has: ${wb.SheetNames.join(", ")})` };

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" });
  const sliced = rows.slice(directive.skipRows, directive.skipRows + directive.maxRows);
  if (sliced.length === 0) return { error: `skip_rows (${directive.skipRows}) skips past the end of the sheet` };

  const width = sliced.reduce((w, r) => Math.max(w, r.length), 0);
  const pad = (r: unknown[]): string[] => Array.from({ length: width }, (_, i) => (r[i] == null ? "" : String(r[i])));

  const [headerRow, ...bodyRows] = sliced.map(pad);
  return { headerRow, bodyRows, sheetNames: wb.SheetNames };
}

