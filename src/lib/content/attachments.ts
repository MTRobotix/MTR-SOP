// Attachments embedded in SOP docs: files in content/<dept>/attachments/, linked as `attachments/<file>`.
// A paragraph that holds only such a link renders as an embedded preview (see embeds.ts).
// Rules: mtr-sop-content §5 "Attachments".

export const EMBED_TYPES = {
  pdf: { label: "PDF", mime: "application/pdf" },
  docx: { label: "Word", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xlsx: { label: "Excel", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
  csv: { label: "CSV", mime: "text/csv; charset=utf-8" },
} as const;

export type EmbedKind = keyof typeof EMBED_TYPES;
export type AttachmentRef = { file: string; kind: EmbedKind };

/** Lowercase file name, no folders; the extension picks the preview. */
const ATTACHMENT_RE = /^attachments\/([a-z0-9][a-z0-9._-]{0,99}\.(pdf|docx|xlsx|csv))$/;

export function parseAttachmentLink(url: string): AttachmentRef | null {
  const m = ATTACHMENT_RE.exec(url);
  return m ? { file: m[1], kind: m[2] as EmbedKind } : null;
}

export function attachmentRelPath(dept: string, file: string): string {
  return `content/${dept}/attachments/${file}`;
}

export function attachmentUrl(dept: string, file: string): string {
  return `/api/files/${dept}/${file}`;
}
