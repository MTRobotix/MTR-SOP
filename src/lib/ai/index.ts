// Provider-agnostic AI answer. Switch providers by adding a file here and a case below;
// nothing else in the app knows which model runs.
import "server-only";
import { anthropicProvider } from "./anthropic";

import type { Source } from "./prompt";

export type { Source } from "./prompt";

export interface AnswerProvider {
  name: string;
  available(): boolean;
  streamAnswer(question: string, sources: Source[], signal: AbortSignal): AsyncIterable<string>;
}

export function provider(): AnswerProvider | null {
  const p = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  const chosen = p === "anthropic" ? anthropicProvider : null;
  return chosen?.available() ? chosen : null;
}
