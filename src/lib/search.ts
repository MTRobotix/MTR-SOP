import "server-only";
import MiniSearch, { type Query } from "minisearch";
import { STOP_WORDS, synonymsOf } from "./search-words";
import { allDocs, contentVersion, listDepartments } from "./content/repo";

export type Hit = {
  id: string;
  dept: string;
  deptTitle: string;
  slug: string;
  anchor: string;
  docTitle: string;
  heading: string;
  snippet: string;
  text: string;
  href: string;
  score: number;
};

type IndexDoc = Omit<Hit, "score" | "snippet"> & { tags: string; summary: string };

let cache: { version: string; index: MiniSearch<IndexDoc> } | null = null;

async function getIndex(): Promise<MiniSearch<IndexDoc>> {
  const version = await contentVersion();
  if (cache?.version === version) return cache.index;
  const deptTitles = new Map((await listDepartments()).map((d) => [d.id, d.meta.title]));
  const index = new MiniSearch<IndexDoc>({
    fields: ["heading", "docTitle", "summary", "tags", "text"],
    storeFields: ["dept", "deptTitle", "slug", "anchor", "docTitle", "heading", "text", "href"],
    // Split on spaces and punctuation but keep "_", so identifiers like SENSQ_ROBOT_LAUNCH_FILE stay one
    // token and do not count as the words "robot" and "launch".
    tokenize: (text) => text.split(/[^\p{L}\p{N}_]+/u),
    // Filler words are dropped from the index too, so they never decide a ranking.
    processTerm: (term) => {
      const t = term.toLowerCase();
      return STOP_WORDS.has(t) ? null : t;
    },
    searchOptions: {
      boost: { heading: 6, docTitle: 4, summary: 2, tags: 3 },
      // Prefix/typo matching only on longer words; on short words it matches noise.
      prefix: (term) => term.length >= 4,
      fuzzy: (term) => (term.length >= 5 ? 0.2 : false),
      // Whole-word matches count far more than partial ones ("sensq" vs "SENSQ_ROBOT_LAUNCH_FILE").
      weights: { prefix: 0.15, fuzzy: 0.3 },
    },
  });
  const docs: IndexDoc[] = [];
  for (const d of await allDocs()) {
    for (const s of d.sections) {
      docs.push({
        id: `${d.dept}/${d.slug}#${s.id}`,
        dept: d.dept,
        deptTitle: deptTitles.get(d.dept) ?? d.dept,
        slug: d.slug,
        anchor: s.id,
        docTitle: d.meta.title,
        heading: s.heading,
        tags: d.meta.tags.join(" "),
        summary: d.meta.summary,
        text: s.text,
        href: `/d/${d.dept}/${d.slug}${s.id ? `#${s.id}` : ""}`,
      });
    }
  }
  index.addAll(docs);
  cache = { version, index };
  return index;
}

function snippet(text: string, terms: string[], len = 180): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const lower = flat.toLowerCase();
  const at = terms.map((t) => lower.indexOf(t.toLowerCase())).filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? 0;
  const start = Math.max(0, at - 40);
  return (start > 0 ? "…" : "") + flat.slice(start, start + len) + (start + len < flat.length ? "…" : "");
}

/** Query words without filler, e.g. "how to launch the robot" → ["launch", "robot"]. */
function queryWords(q: string): string[] {
  return (q.toLowerCase().match(/[\p{L}\p{N}_.\-/]+/gu) ?? []).map((w) => w.replace(/^[.\-/]+|[.\-/]+$/g, "")).filter((w) => w && !STOP_WORDS.has(w));
}

export async function search(q: string, limit = 12): Promise<Hit[]> {
  const words = queryWords(q.trim().slice(0, 200));
  if (words.length === 0) return [];
  const index = await getIndex();
  // Each word matches itself or a synonym; all words must match. Exact word ranks above a synonym.
  const typed = new Set(words);
  const groups = words.map((w) => synonymsOf(w));
  const query: Query = { combineWith: "OR", queries: groups.map((g) => ({ combineWith: "OR", queries: g })) };
  const boostTerm = (term: string) => (typed.has(term) ? 1 : 0.6);
  // Rank by how many of the typed words (or their synonyms) a section covers, then by score.
  // Partial matches still show, below sections that cover everything.
  const ranked = index
    .search(query, { boostTerm })
    .map((r) => {
      const covered = groups.filter((g) => g.some((w) => r.queryTerms.includes(w))).length;
      return { r, score: r.score * (covered / groups.length) ** 2 };
    })
    .sort((a, b) => b.score - a.score);
  return ranked.slice(0, limit).map(({ r, score }) => ({
    id: r.id as string,
    dept: r.dept,
    deptTitle: r.deptTitle,
    slug: r.slug,
    anchor: r.anchor,
    docTitle: r.docTitle,
    heading: r.heading,
    text: r.text,
    href: r.href,
    snippet: snippet(r.text as string, r.terms),
    score,
  }));
}

/** Title-only suggestions for the popup under the search bar. */
export async function suggest(q: string, limit = 6): Promise<Pick<Hit, "id" | "heading" | "docTitle" | "deptTitle" | "href">[]> {
  const hits = await search(q, limit);
  return hits.map(({ id, heading, docTitle, deptTitle, href }) => ({ id, heading, docTitle, deptTitle, href }));
}
