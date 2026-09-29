import fs from "node:fs";
import path from "node:path";

/** All content/**\/*.md paths, relative to the repo root, sorted. */
export function contentFiles(root = process.cwd()): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".md")) out.push(path.relative(root, p).split(path.sep).join("/"));
    }
  };
  walk(path.join(root, "content"));
  return out.sort();
}
