/**
 * components/aura/aura-launcher/chat-api.ts — Server-side chat
 * endpoint callers for the Aura launcher.
 *
 * Two paths:
 *  - /api/aura/chat — plain text reply (Gemini fallback when WebGPU
 *    isn't viable). Returns the full text in one shot.
 *  - /api/aura/agent — streaming endpoint with tool use. Yields raw
 *    AuraStreamEvents via parseAuraStream; caller drives UI updates.
 *
 * Extracted from aura-launcher.tsx per ARCHITECTURE.md Rule 1.
 */

import { parseAuraStream } from "lib/aura/parse-ui-stream";

import { MAX_HISTORY, type Turn } from "./types";

export async function callServerSideChat(
  history: Turn[],
  userText: string,
  context: string | undefined,
  idToken: string | null,
): Promise<string> {
  const res = await fetch("/api/aura/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({
      history: history.slice(-MAX_HISTORY),
      userText,
      context: context ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`server chat ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = (await res.json()) as { text?: string };
  return typeof json.text === "string" ? json.text : "";
}

/**
 * Call /api/aura/agent — the streaming endpoint with tool use. Yields
 * raw AuraStreamEvents via the parser; caller drives UI updates.
 *
 * History shape difference: the agent endpoint expects OpenAI-style
 * messages with role "user" | "assistant". Local Turn type uses
 * "user" | "model". We map at the boundary.
 */
export async function* callAuraAgent(
  history: Turn[],
  userText: string,
  pathname: string,
  idToken: string | null,
) {
  const messages = [...history, { role: "user", text: userText } as Turn].map(
    (t) => ({
      role: t.role === "user" ? ("user" as const) : ("assistant" as const),
      content: t.text,
    }),
  );
  const res = await fetch("/api/aura/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ messages, pathname }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`agent ${res.status}: ${body.slice(0, 200)}`);
  }
  if (!res.body) throw new Error("agent: no response body");
  yield* parseAuraStream(res.body);
}
