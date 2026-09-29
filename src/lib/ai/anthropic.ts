import Anthropic from "@anthropic-ai/sdk";
import type { AnswerProvider } from "./index";
import { SYSTEM_PROMPT, buildUserMessage, type Source } from "./prompt";

// Haiku 4.5: fast and cheap for a short grounded answer. Change here only.
const MODEL = "claude-haiku-4-5";

let client: Anthropic | null = null;

export const anthropicProvider: AnswerProvider = {
  name: "Claude Haiku 4.5",

  available() {
    return !!process.env.ANTHROPIC_API_KEY;
  },

  async *streamAnswer(question: string, sources: Source[], signal: AbortSignal) {
    client ??= new Anthropic();
    const stream = client.messages.stream(
      {
        model: MODEL,
        max_tokens: 700,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserMessage(question, sources) }],
      },
      { signal },
    );
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
  },
};
