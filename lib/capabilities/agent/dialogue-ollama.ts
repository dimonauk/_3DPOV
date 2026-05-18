/**
 * lib/capabilities/agent/dialogue-ollama.ts — Capability `agent.dialogue-ollama`:
 * one LLM turn per call, running on the Hangar's local Ollama instance.
 *
 * One-line role: the third provider for Aura's dialogue, alongside
 * `agent.dialogue` (Gemini, server) and `agent.dialogue-webgpu`
 * (browser, MLC). Ollama runs on Sovereign-PC's RTX 3080 Ti (12GB
 * VRAM) and costs zero per call after the model is loaded.
 *
 * # Why three providers
 *
 * | Provider | Where | Cost per call | First-call latency | Strength |
 * |---|---|---|---|---|
 * | `agent.dialogue` (Gemini) | Google's GPU | $$ | instant | smartest, most cloud-locked |
 * | `agent.dialogue-webgpu` (MLC) | visitor's GPU | $0 | 1.5-2 GB download | privacy-best; works offline |
 * | `agent.dialogue-ollama` (this) | Hangar bench | $0 (electricity) | seconds (warm load) | local control; bigger models than browser |
 *
 * The site picks per-route. Heavy / private interactions route to
 * Ollama. Long sessions route to web-llm so each visitor pays their
 * own GPU cycles. Premium / commerce moments route to Gemini.
 *
 * # Default model
 *
 * Per the `ollama-local` Hangar skill: `qwen2.5-coder:14b` for code
 * tasks, `llama3.1:8b` or `qwen2.5:7b` for chat. The instance is bound
 * by 12 GB VRAM; staying ≤8B-parameter quantised keeps us under it.
 *
 * # The bench bridge
 *
 * Ollama lives at `http://localhost:11434` on Sovereign-PC. From the
 * Vercel-deployed site, reach it via Tailscale Funnel — set
 * `OLLAMA_SERVICE_URL` to the tailnet hostname and `OLLAMA_AUTH_TOKEN`
 * to a shared bearer per [[holoflow-bench-bridge]].
 *
 * # Posture
 *
 * Foundation phase: type surface + stub router. The server impl in
 * `dialogue-ollama.server.ts` is a thin POST to `/api/chat` (Ollama
 * native API) or `/v1/chat/completions` (OpenAI-compatible shim).
 */

import type { CharacterBible } from "lib/cast/aura";

export type OllamaModelId =
  | "llama3.1:8b"
  | "qwen2.5:7b"
  | "qwen2.5:14b"
  | "qwen2.5-coder:14b"
  | "phi-3:mini"
  | "gemma2:9b";

export const DEFAULT_OLLAMA_MODEL: OllamaModelId = "qwen2.5:7b";

export type OllamaDialogueInput = {
  /** The character bible to ground the turn. */
  bible: CharacterBible;
  /** Conversation history so far. */
  history: { role: "user" | "model"; text: string }[];
  /** User's message. */
  userText: string;
  /** Model to use. Default: `qwen2.5:7b`. */
  model?: OllamaModelId;
  /** Streaming callback. Called once per token chunk with the
   *  accumulated text so far. */
  onStream?: (chunk: string, full: string) => void;
};

export type OllamaDialogueResult = {
  text: string;
  intent: string | null;
  mode: string | null;
  /** Tokens generated (from the Ollama response stream). */
  tokens: number;
  /** Time-to-first-token in milliseconds, when reported. */
  ttftMs: number | null;
  /** Total generation time in milliseconds. */
  totalMs: number;
};

export type OllamaDialogueError = {
  code:
    | "service-unavailable"
    | "model-not-loaded"
    | "rate-limited"
    | "generation-failed";
  message: string;
};

/**
 * Public capability. Foundation-phase stub.
 *
 * Server implementation will:
 *   1. Compose the system prompt from the character bible.
 *   2. POST to `${OLLAMA_SERVICE_URL}/api/chat` with model + messages.
 *   3. Stream tokens via SSE-style chunked response.
 *   4. Parse the final response for `intent` / `mode` JSON suffix
 *      (the same protocol `agent.dialogue` uses for Gemini).
 *   5. Return the assembled `OllamaDialogueResult`.
 */
export async function dialogueOllama(
  _input: OllamaDialogueInput,
): Promise<OllamaDialogueResult> {
  const detail: OllamaDialogueError = {
    code: "service-unavailable",
    message:
      "agent.dialogue-ollama: server router not wired yet — call dialogueOllamaServer from a server context",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/**
 * Convenience predicate: is Ollama reachable from the current context?
 * Used by route handlers to pick between providers at request time.
 */
export async function probeOllamaAvailable(
  serviceUrl: string,
  timeoutMs = 1_500,
): Promise<boolean> {
  if (typeof fetch === "undefined") return false;
  const controller =
    typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer =
    controller && typeof setTimeout !== "undefined"
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null;
  try {
    const r = await fetch(`${serviceUrl}/api/tags`, {
      method: "GET",
      signal: controller?.signal,
    });
    return r.ok;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
