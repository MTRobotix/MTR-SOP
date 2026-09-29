// Word lists for search. Edit freely: no code change needed elsewhere.

/** Filler words ignored in queries and in the index, so "how to launch the robot" searches "launch robot". */
export const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "can", "do", "does", "for", "from", "get", "how", "i",
  "if", "in", "into", "is", "it", "its", "me", "my", "of", "on", "or", "our", "should", "so", "that", "the",
  "then", "this", "to", "up", "we", "what", "when", "where", "which", "who", "why", "with", "you", "your",
]);

/**
 * Words people use for the same thing. Every word in a group finds sections that use any other word
 * in the group. Lowercase, single words only.
 */
export const SYNONYM_GROUPS: string[][] = [
  ["launch", "start", "run", "bringup"],
  ["stop", "shutdown", "kill"],
  ["robot", "sensq", "amr"],
  ["arm", "manipulator"],
  ["install", "setup", "dependencies"],
  ["error", "errors", "fix", "fails", "failed", "problem", "troubleshooting", "broken"],
  ["quote", "quotes", "quoting", "pricing", "price", "cost"],
  ["lead", "leads", "customer", "prospect", "client"],
  ["website", "site", "web"],
  ["database", "db", "postgres", "postgresql", "sqlite"],
  ["map", "maps", "mapping", "slam"],
  ["dock", "docking", "charge", "charging"],
  ["bolteye", "inspection"],
  ["edit", "editing", "change", "update"],
];

const SYNONYMS = new Map<string, string[]>();
for (const group of SYNONYM_GROUPS) for (const w of group) SYNONYMS.set(w, group);

export function synonymsOf(word: string): string[] {
  return SYNONYMS.get(word) ?? [word];
}
