/**
 * lib/agents/llm-client/types.ts — Public types for the LLM client.
 *
 * These are the shapes route handlers and capability surfaces import
 * via `from "lib/agents/llm-client"`. Provider adapters and internal
 * shared helpers do not live here.
 */

export type LLMProvider = "anthropic" | "openai" | "google" | "ollama";

export type LLMVia = "aperture" | "direct" | "local";

export type LLMRole = "system" | "user" | "assistant";

export type LLMMessage = {
  role: LLMRole;
  content: string;
};

export type CallLLMRequest = {
  provider: LLMProvider;
  model: string;
  via: LLMVia;
  messages: LLMMessage[];
  /** Maximum tokens to generate. Defaults to 1024. */
  maxTokens?: number;
  /** Sampling temperature. Defaults to 0.7. */
  temperature?: number;
  /** Per-call timeout in milliseconds. Defaults to 30_000. */
  timeoutMs?: number;
  /**
   * Allow falling back to local Ollama on network / auth / 5xx failures.
   * Defaults to `true`. Set `false` to surface the original error.
   */
  allowFallback?: boolean;
  /** Ollama model to fall back to (or to use when `via: "local"`). */
  fallbackModel?: string;
};

export type LLMResponse =
  | {
      ok: true;
      text: string;
      usage: { inputTokens: number; outputTokens: number };
      provider: string;
      model: string;
      fallbackUsed?: "ollama";
    }
  | {
      ok: false;
      error: string;
      fallbackUsed?: "ollama";
      status?: number;
    };
