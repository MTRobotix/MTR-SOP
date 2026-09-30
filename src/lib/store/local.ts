// Development store: writes ./content directly (admin) and ./.drafts/*.json (editor proposals).
// Not a source of truth by itself — commit the resulting files with git.
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { blobSha } from "../content/sha";
import { isValidAttachmentPath } from "../content/attachments";
import { ConflictError, type ContentStore, type Proposal, type ProposalDetail, type SaveInput } from "./types";

const ROOT = process.cwd();
const DRAFTS = path.join(ROOT, ".drafts");

type Draft = Proposal & { content: string; baseSha: string | null };

const file = (dept: string, slug: string) => path.join(ROOT, "content", dept, `${slug}.md`);

async function readFile(p: string): Promise<string | null> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

async function writeChecked(dept: string, slug: string, content: string, baseSha: string | null) {
  const current = await readFile(file(dept, slug));
  if ((current === null ? null : blobSha(current)) !== baseSha) {
    throw new ConflictError(baseSha === null ? "A section with this name already exists." : undefined);
  }
  await fs.mkdir(path.dirname(file(dept, slug)), { recursive: true });
  await fs.writeFile(file(dept, slug), content);
}

async function loadDraft(id: string): Promise<Draft | null> {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  const raw = await readFile(path.join(DRAFTS, `${id}.json`));
  return raw ? (JSON.parse(raw) as Draft) : null;
}

export const localStore: ContentStore = {
  mode: "local",

  async read(dept, slug) {
    const content = await readFile(file(dept, slug));
    return content === null ? null : { content, sha: blobSha(content) };
  },

  async readBinary(relPath) {
    if (!isValidAttachmentPath(relPath)) return null;
    try {
      return await fs.readFile(path.join(ROOT, relPath));
    } catch {
      return null;
    }
  },

  async commit(input: SaveInput) {
    await writeChecked(input.dept, input.slug, input.content, input.baseSha);
  },

  async propose(input: SaveInput) {
    const id = randomUUID();
    const draft: Draft = {
      id,
      dept: input.dept,
      slug: input.slug,
      summary: input.message,
      author: `${input.user.name} <${input.user.email}>`,
      createdAt: new Date().toISOString(),
      content: input.content,
      baseSha: input.baseSha,
    };
    await fs.mkdir(DRAFTS, { recursive: true });
    await fs.writeFile(path.join(DRAFTS, `${id}.json`), JSON.stringify(draft, null, 2));
    return { id };
  },

  async remove(dept, slug, baseSha) {
    const current = await readFile(file(dept, slug));
    if (current === null || blobSha(current) !== baseSha) throw new ConflictError();
    await fs.unlink(file(dept, slug));
  },

  async listProposals() {
    const names = await fs.readdir(DRAFTS).catch(() => [] as string[]);
    const out: Proposal[] = [];
    for (const n of names) {
      const d = n.endsWith(".json") ? await loadDraft(n.slice(0, -5)) : null;
      if (d) out.push({ id: d.id, dept: d.dept, slug: d.slug, summary: d.summary, author: d.author, createdAt: d.createdAt });
    }
    return out.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  async getProposal(id): Promise<ProposalDetail | null> {
    const d = await loadDraft(id);
    if (!d) return null;
    return { ...d, current: await readFile(file(d.dept, d.slug)) };
  },

  async approve(id) {
    const d = await loadDraft(id);
    if (!d) throw new ConflictError("This proposal no longer exists.");
    await writeChecked(d.dept, d.slug, d.content, d.baseSha);
    await fs.unlink(path.join(DRAFTS, `${id}.json`));
  },

  async reject(id) {
    if (await loadDraft(id)) await fs.unlink(path.join(DRAFTS, `${id}.json`));
  },
};
