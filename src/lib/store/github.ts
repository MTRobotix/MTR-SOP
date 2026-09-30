// Production store: every admin save is a commit on main; every editor save is a pull request.
// Uses the GitHub REST API with a fine-grained token scoped to this repo (Contents + Pull requests RW).
import { ConflictError, type ContentStore, type Proposal, type ProposalDetail, type SaveInput } from "./types";

const API = "https://api.github.com";
const META_RE = /<!-- sop-meta (\{.*?\}) -->/;

type Meta = { dept: string; slug: string; author: string };

function cfg() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  if (!token || !repo) throw new Error("GITHUB_TOKEN and GITHUB_REPO are required for the GitHub store.");
  return { token, repo, branch: process.env.GITHUB_BRANCH || "main" };
}

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
    /** GitHub's own short reason, safe to show to admins (never contains the token). */
    public reason = "",
  ) {
    super(message);
  }
}

async function gh<T>(method: string, route: string, body?: unknown): Promise<T> {
  const { token, repo } = cfg();
  const res = await fetch(`${API}/repos/${repo}${route}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    let reason = text.slice(0, 200);
    try {
      reason = (JSON.parse(text) as { message?: string }).message ?? reason;
    } catch {
      /* not JSON: keep raw text */
    }
    throw new GitHubError(res.status, `GitHub ${method} ${route} failed: ${res.status} ${text}`, reason);
  }
  return (res.status === 204 ? undefined : await res.json()) as T;
}

const filePath = (dept: string, slug: string) => `content/${dept}/${slug}.md`;
const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const unb64 = (s: string) => Buffer.from(s, "base64").toString("utf8");

async function readAt(path: string, ref: string): Promise<{ content: string; sha: string } | null> {
  try {
    const r = await gh<{ content: string; sha: string }>("GET", `/contents/${path}?ref=${encodeURIComponent(ref)}`);
    return { content: unb64(r.content), sha: r.sha };
  } catch (e) {
    if (e instanceof GitHubError && e.status === 404) return null;
    throw e;
  }
}

async function putFile(input: SaveInput, branch: string): Promise<void> {
  try {
    await gh("PUT", `/contents/${filePath(input.dept, input.slug)}`, {
      message: input.message,
      content: b64(input.content),
      branch,
      ...(input.baseSha ? { sha: input.baseSha } : {}),
      author: { name: input.user.name, email: input.user.email },
    });
  } catch (e) {
    // 409: file changed since baseSha. 422: file exists but no sha given (create over existing).
    if (e instanceof GitHubError && (e.status === 409 || e.status === 422)) {
      throw new ConflictError(input.baseSha ? undefined : "A section with this name already exists.");
    }
    throw e;
  }
}

function branchName(input: SaveInput): string {
  const who = input.user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return `sop/${who}/${input.dept}-${input.slug}-${Date.now()}`;
}

type Pull = { number: number; title: string; body: string | null; html_url: string; created_at: string; head: { ref: string } };

function toProposal(p: Pull): Proposal | null {
  const m = META_RE.exec(p.body ?? "");
  if (!m || !p.head.ref.startsWith("sop/")) return null;
  const meta = JSON.parse(m[1]) as Meta;
  return { id: String(p.number), dept: meta.dept, slug: meta.slug, summary: p.title, author: meta.author, createdAt: p.created_at, url: p.html_url };
}

export const githubStore: ContentStore = {
  mode: "github",

  async read(dept, slug) {
    return readAt(filePath(dept, slug), cfg().branch);
  },

  async commit(input) {
    const current = await readAt(filePath(input.dept, input.slug), cfg().branch);
    if ((current?.sha ?? null) !== input.baseSha) {
      throw new ConflictError(input.baseSha === null ? "A section with this name already exists." : undefined);
    }
    await putFile(input, cfg().branch);
  },

  async propose(input) {
    const { branch } = cfg();
    const current = await readAt(filePath(input.dept, input.slug), branch);
    if ((current?.sha ?? null) !== input.baseSha) throw new ConflictError();
    const head = await gh<{ object: { sha: string } }>("GET", `/git/ref/heads/${branch}`);
    const name = branchName(input);
    await gh("POST", "/git/refs", { ref: `refs/heads/${name}`, sha: head.object.sha });
    await putFile(input, name);
    const meta: Meta = { dept: input.dept, slug: input.slug, author: `${input.user.name} <${input.user.email}>` };
    const pr = await gh<Pull>("POST", "/pulls", {
      title: input.message,
      head: name,
      base: branch,
      body: `SOP edit from the app by ${meta.author}.\n\nFile: \`${filePath(input.dept, input.slug)}\`\n\n<!-- sop-meta ${JSON.stringify(meta)} -->`,
    });
    return { id: String(pr.number), url: pr.html_url };
  },

  async remove(dept, slug, baseSha, user) {
    try {
      await gh("DELETE", `/contents/${filePath(dept, slug)}`, {
        message: `sop(${dept}/${slug}): delete`,
        sha: baseSha,
        branch: cfg().branch,
        author: { name: user.name, email: user.email },
      });
    } catch (e) {
      if (e instanceof GitHubError && (e.status === 409 || e.status === 404)) throw new ConflictError();
      throw e;
    }
  },

  async listProposals() {
    const pulls = await gh<Pull[]>("GET", `/pulls?state=open&base=${cfg().branch}&per_page=100`);
    return pulls.map(toProposal).filter((p): p is Proposal => p !== null);
  },

  async getProposal(id): Promise<ProposalDetail | null> {
    if (!/^\d+$/.test(id)) return null;
    const pull = await gh<Pull>("GET", `/pulls/${id}`).catch(() => null);
    const p = pull && toProposal(pull);
    if (!pull || !p) return null;
    const proposed = await readAt(filePath(p.dept, p.slug), pull.head.ref);
    const current = await readAt(filePath(p.dept, p.slug), cfg().branch);
    return { ...p, content: proposed?.content ?? "", current: current?.content ?? null };
  },

  async approve(id) {
    const pull = await gh<Pull>("GET", `/pulls/${id}`);
    try {
      await gh("PUT", `/pulls/${id}/merge`, { merge_method: "squash", commit_title: `${pull.title} (#${id})` });
    } catch (e) {
      if (e instanceof GitHubError && (e.status === 405 || e.status === 409)) {
        throw new ConflictError("This proposal conflicts with newer changes. Reject it and ask the editor to redo the edit.");
      }
      throw e;
    }
    await gh("DELETE", `/git/refs/heads/${pull.head.ref}`).catch(() => undefined);
  },

  async reject(id) {
    const pull = await gh<Pull>("PATCH", `/pulls/${id}`, { state: "closed" });
    await gh("DELETE", `/git/refs/heads/${pull.head.ref}`).catch(() => undefined);
  },
};

