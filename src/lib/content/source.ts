// Where SOP content is read from. With GITHUB_TOKEN (production): the branch on GitHub, fetched in one
// GraphQL call and kept in Next's data cache under CONTENT_TAG until a save or the push webhook expires it.
// So a change on main is live within seconds, with no redeploy. Without it (local dev): ./content on disk.
import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { revalidateTag, unstable_cache } from "next/cache";

export const CONTENT_TAG = "content";

/** Keys are repo paths: `content/<dept>/<file>.md` and `content/<dept>/attachments/<file>`. */
export type Snapshot = {
  version: string;
  docs: Record<string, string>;
  attachments: Record<string, { size: number; sha: string }>;
};

const github = () => Boolean(process.env.GITHUB_TOKEN);

/** Previews show their own commit; production follows the branch. */
const ref = () => (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_GIT_COMMIT_SHA) || process.env.GITHUB_BRANCH || "main";

function repo() {
  const [owner, name] = (process.env.GITHUB_REPO ?? "").split("/");
  if (!owner || !name) throw new Error("GITHUB_REPO must look like owner/name.");
  return { owner, name };
}

const headers = () => ({ Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, "X-GitHub-Api-Version": "2022-11-28" });

type Entry = { name: string; type: string; object: { text?: string | null; oid?: string; byteSize?: number; entries?: Entry[] } | null };

// content/ → <dept>/ → <file>.md or attachments/ → <file>. Text only for files directly in a department.
const QUERY = `query($owner: String!, $name: String!, $ref: String!) {
  repository(owner: $owner, name: $name) {
    object(expression: $ref) {
      ... on Commit {
        oid
        file(path: "content") { object { ... on Tree { entries { name type object { ... on Tree { entries { name type object {
          ... on Blob { text }
          ... on Tree { entries { name type object { ... on Blob { oid byteSize } } } }
        } } } } } } } }
      }
    }
  }
}`;

async function fromGitHub(at: string): Promise<Snapshot> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { ...repo(), ref: at } }),
    cache: "no-store",
  });
  const j = (await res.json()) as { data?: { repository: { object: { oid: string; file: { object: { entries: Entry[] } } | null } | null } }; errors?: unknown };
  const commit = j.data?.repository.object;
  if (!res.ok || j.errors || !commit?.file) throw new Error(`GitHub content read failed (${res.status}): ${JSON.stringify(j.errors ?? j).slice(0, 300)}`);
  const snap: Snapshot = { version: commit.oid, docs: {}, attachments: {} };
  for (const dept of commit.file.object.entries) {
    for (const f of (dept.type === "tree" && dept.object?.entries) || []) {
      const p = `content/${dept.name}/${f.name}`;
      if (f.type === "blob" && f.name.endsWith(".md") && typeof f.object?.text === "string") snap.docs[p] = f.object.text;
      if (f.type === "tree" && f.name === "attachments") {
        for (const a of f.object?.entries ?? []) if (a.type === "blob" && a.object?.oid) snap.attachments[`${p}/${a.name}`] = { size: a.object.byteSize ?? 0, sha: a.object.oid };
      }
    }
  }
  return snap;
}

async function fromDisk(): Promise<Snapshot> {
  const snap: Snapshot = { version: "", docs: {}, attachments: {} };
  const stamps: string[] = [];
  const list = (dir: string) => fs.readdir(path.join(/*turbopackIgnore: true*/ process.cwd(), dir), { withFileTypes: true }).catch(() => []);
  for (const dept of await list("content")) {
    if (!dept.isDirectory()) continue;
    for (const f of await list(`content/${dept.name}`)) {
      const p = `content/${dept.name}/${f.name}`;
      if (f.isFile() && f.name.endsWith(".md")) {
        const file = path.join(/*turbopackIgnore: true*/ process.cwd(), p);
        const st = await fs.stat(file);
        snap.docs[p] = await fs.readFile(file, "utf8");
        stamps.push(`${p}:${st.mtimeMs}:${st.size}`);
      }
      if (f.isDirectory() && f.name === "attachments") {
        for (const a of await list(p)) {
          if (!a.isFile()) continue;
          const st = await fs.stat(path.join(/*turbopackIgnore: true*/ process.cwd(), p, a.name));
          snap.attachments[`${p}/${a.name}`] = { size: st.size, sha: `${st.mtimeMs}:${st.size}` };
        }
      }
    }
  }
  snap.version = stamps.sort().join("|");
  return snap;
}

const cached = unstable_cache((at: string) => fromGitHub(at), ["sop-content"], { tags: [CONTENT_TAG] });

export function snapshot(): Promise<Snapshot> {
  return github() ? cached(ref()) : fromDisk();
}

// GitHub's GraphQL API can lag a REST write by up to about a second; expiring before it shows the new
// commit would cache the old content again. Wait for it, up to this long.
const CONSISTENT_MS = 5000;

/** After commit `sha` landed on the branch: the next read fetches it, on every server instance. */
export async function expireContent(sha: string): Promise<void> {
  if (!github()) return;
  const query = `query($owner: String!, $name: String!, $ref: String!) { repository(owner: $owner, name: $name) { object(expression: $ref) { oid } } }`;
  for (const end = Date.now() + CONSISTENT_MS; Date.now() < end; await new Promise((r) => setTimeout(r, 200))) {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { ...repo(), ref: ref() } }),
      cache: "no-store",
    });
    const j = (await res.json()) as { data?: { repository: { object: { oid: string } | null } } };
    if (j.data?.repository.object?.oid === sha) break;
  }
  revalidateTag(CONTENT_TAG, { expire: 0 });
}

const bytes = new Map<string, Buffer>();

/** File bytes of an attachment, by its repo path; null when it does not exist. Cached per blob SHA. */
export async function attachmentBytes(rel: string): Promise<Buffer | null> {
  const a = (await snapshot()).attachments[rel];
  if (!a) return null;
  if (!github()) return fs.readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), rel)).catch(() => null);
  const hit = bytes.get(a.sha);
  if (hit) return hit;
  const { owner, name } = repo();
  const res = await fetch(`https://api.github.com/repos/${owner}/${name}/git/blobs/${a.sha}`, {
    headers: { ...headers(), Accept: "application/vnd.github.raw+json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`GitHub attachment read failed (${res.status}) for ${rel}`);
  const buf = Buffer.from(await res.arrayBuffer());
  bytes.set(a.sha, buf);
  return buf;
}
