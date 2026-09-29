import "server-only";
import { githubStore } from "./github";
import { localStore } from "./local";
import type { ContentStore } from "./types";

export function store(): ContentStore {
  if (process.env.GITHUB_TOKEN) return githubStore;
  if (process.env.VERCEL) throw new Error("GITHUB_TOKEN is required in deployment: the deployed filesystem is read-only.");
  return localStore;
}

export * from "./types";
