// Fails (exit 1) if any SOP file breaks the rules in the mtr-sop-content skill.
import fs from "node:fs";
import { contentFiles } from "./content-files";
import { validateFile, lintConfig, type LinkTarget } from "../src/lib/content/validate";
import { splitFrontmatter } from "../src/lib/content/normalize";
import { MAX_FEATURED_PER_DEPT } from "../src/lib/content/schema";

const config = lintConfig();
const anchorsByDoc = new Map<string, string[]>();
const linksByFile = new Map<string, LinkTarget[]>();
const featured = new Map<string, number>();
const depts = new Set<string>();
let problems = 0;

const report = (file: string, line: number | undefined, msg: string) => {
  problems++;
  console.log(`${file}${line ? `:${line}` : ""}  ${msg}`);
};

for (const file of contentFiles()) {
  const content = fs.readFileSync(file, "utf8");
  const { issues, links, anchors } = validateFile(file, content, config);
  for (const i of issues) report(file, i.line, i.message);
  const [, dept, name] = file.split("/");
  const slug = name.slice(0, -3);
  if (slug === "_department") {
    depts.add(dept);
    continue;
  }
  anchorsByDoc.set(`${dept}/${slug}`, anchors);
  linksByFile.set(file, links);
  if (splitFrontmatter(content).data.featured === true) featured.set(dept, (featured.get(dept) ?? 0) + 1);
}

for (const [file, links] of linksByFile) {
  for (const l of links) {
    const anchors = anchorsByDoc.get(`${l.dept}/${l.slug}`);
    if (!anchors) report(file, l.line, `Broken link: /d/${l.dept}/${l.slug} does not exist.`);
    else if (l.anchor && !anchors.includes(l.anchor)) report(file, l.line, `Broken link: #${l.anchor} not found in /d/${l.dept}/${l.slug}.`);
  }
}
for (const [dept, n] of featured) {
  if (n > MAX_FEATURED_PER_DEPT) report(`content/${dept}`, undefined, `${n} featured docs; max ${MAX_FEATURED_PER_DEPT}.`);
}
for (const key of anchorsByDoc.keys()) {
  const dept = key.split("/")[0];
  if (!depts.has(dept)) report(`content/${dept}`, undefined, "Missing _department.md.");
}

console.log(problems ? `\n${problems} problem(s).` : `OK — ${anchorsByDoc.size} docs checked.`);
process.exit(problems ? 1 : 0);
