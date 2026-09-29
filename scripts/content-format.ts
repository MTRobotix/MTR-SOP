// Rewrites every SOP file into canonical form. Same serializer the app uses on save.
import fs from "node:fs";
import { contentFiles } from "./content-files";
import { normalizeFile, kindForPath } from "../src/lib/content/normalize";

let changed = 0;
for (const file of contentFiles()) {
  const raw = fs.readFileSync(file, "utf8");
  const out = normalizeFile(raw, kindForPath(file));
  if (out !== raw) {
    fs.writeFileSync(file, out);
    changed++;
    console.log(`formatted ${file}`);
  }
}
console.log(`${changed} file(s) changed.`);
