import type { User } from "../auth/roles";

export class ConflictError extends Error {
  constructor(message = "Someone changed this section. Reload to see their version.") {
    super(message);
  }
}

export type SaveInput = {
  dept: string;
  slug: string;
  /** Already normalized and validated. */
  content: string;
  /** Blob SHA the editor loaded; null when creating a new doc. */
  baseSha: string | null;
  user: User;
  message: string;
};

export type Proposal = {
  id: string;
  dept: string;
  slug: string;
  summary: string;
  author: string;
  createdAt: string;
  url?: string;
};

export type ProposalDetail = Proposal & { content: string; current: string | null };

export interface ContentStore {
  mode: "local" | "github";
  /** Latest version on main (not the deployed copy, which can lag behind a redeploy). */
  read(dept: string, slug: string): Promise<{ content: string; sha: string } | null>;
  /** Raw bytes of any repo file by its exact relative path (e.g. an embedded attachment). Not for `.md` docs. */
  readBinary(relPath: string): Promise<Buffer | null>;
  commit(input: SaveInput): Promise<void>;
  propose(input: SaveInput): Promise<{ id: string; url?: string }>;
  remove(dept: string, slug: string, baseSha: string, user: User): Promise<void>;
  listProposals(): Promise<Proposal[]>;
  getProposal(id: string): Promise<ProposalDetail | null>;
  approve(id: string, user: User): Promise<void>;
  reject(id: string, user: User): Promise<void>;
}
