/**
 * lib/agents/llm-client/shared.ts — Shared constants + small helpers
 * used by the provider adapters and the primary/fallback orchestrator.
 *
 * Everything in this file is pure (no I/O beyond reading process.env
 * for the Ollama base URL). The provider adapters import the helpers
 * they need; `index.ts` and `primary.ts` import the constants.
 */

import type { LLMMessage } from "./types";

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

export const APERTURE_BASE_URL = "https://ai.tail99b2a4.ts.net/v1";
export const OPENAI_BASE_URL = "https://api.openai.com/v1";
export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";
export const DEFAULT_TIMEOUT_MS = 30_000;
export const DEFAULT_MAX_TOKENS = 1024;
export const DEFAULT_TEMPERATURE = 0.7;
export const DEFAULT_OLLAMA_FALLBACK_MODEL = "qwen3:8b";

/** Resolve Ollama base URL from env (OLLAMA_BASE_URL) with a default. */
export function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? OLLAMA_DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );
}

// ---------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------

export function timeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

export async function readBodyText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------
// Message normalisation
// ---------------------------------------------------------------------

/**
 * Some providers (Anthropic, Gemini) take system separately from the
 * conversation; OpenAI-compatible endpoints take it inline. This
 * split lets each adapter pull what it needs.
 */
export function splitSystem(messages: LLMMessage[]): {
  system: string;
  rest: LLMMessage[];
} {
  const systemParts: string[] = [];
  const rest: LLMMessage[] = [];
  for (const m of messages) {
    if (m.role === "system") systemParts.push(m.content);
    else rest.push(m);
  }
  return { system: systemParts.join("\n\n"), rest };
}

// ---------------------------------------------------------------------
// Error classification + sanitisation
// ---------------------------------------------------------------------

export function safeErrorText(text: string): string {
  return text
    .replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/x-api-key[^,}\n]*/gi, "x-api-key: [redacted]")
    .slice(0, 1024);
}

/**
 * Classify an HTTP status so the fallback layer knows whether to
 * retry. Network errors (undefined status) and 5xx → fallback.
 * 4xx (other than auth) → don't fallback, it's a caller bug.
 */
export type FailKind = "network" | "auth" | "server" | "user" | "unknown";

export function classify(status: number | undefined): FailKind {
  if (status === undefined) return "network";
  if (status === 401 || status === 403) return "auth";
  if (status === 400 || status === 422) return "user";
  if (status >= 500) return "server";
  if (status >= 400) return "user";
  return "unknown";
}

export function shouldFallback(kind: FailKind): boolean {
  return kind === "network" || kind === "auth" || kind === "server";
}
