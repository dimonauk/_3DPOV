/**
 * lib/capabilities/agent/dialogue-ollama.server.ts — Server-side wiring
 * for the `agent.dialogue-ollama` capability.
 *
 * One-line role: implements `dialogueOllamaServer` by POSTing to
 * Ollama's `/api/chat` endpoint, streaming the newline-delimited JSON
 * response back through the caller's `onStream` hook, and parsing the
 * final completion into the same `text + intent + mode` shape the
 * Gemini provider produces.
 *
 * # The bench bridge
 * On the Hangar, Ollama lives at `http://localhost:11434` (Sovereign-PC
 * RTX 3080 Ti, 12 GB VRAM). From the Vercel-deployed site, reach it via
 * Tailscale Funnel — set `OLLAMA_SERVICE_URL` to the tailnet hostname
 * and `OLLAMA_AUTH_TOKEN` to a shared bearer per [[holoflow-bench-bridge]].
 * Empty token = no auth (only safe for bench-local dev with Funnel off).
 *
 * # The streaming protocol
 * Ollama's `/api/chat` returns newline-delimited JSON when `stream:true`.
 * Each line is a `{ message: { content }, done }` object. The final
 * line has `done:true` and includes total/duration metrics. We decode
 * the body via `Response.body.getReader()` + `TextDecoder` and parse
 * each line as it arrives so `onStream` fires once per token batch
 * rather than once per turn.
 *
 * # The intent/mode trailer
 * We append a strict system instruction asking the model to emit a JSON
 * envelope as its whole reply — same protocol as `dialogue.ts` (Gemini).
 * Smaller local models honour this less reliably than Gemini, so we
 * also accept a plain-text reply with no envelope and fall back to
 * `intent:null, mode:bible.defaultMode` in that case. The streaming
 * `onStream` callback receives the raw model output regardless — the
 * envelope parsing happens after the stream completes.
 */

import "server-only";

import type { CharacterBible } from "lib/cast/aura";

import {
  DEFAULT_OLLAMA_MODEL,
  type OllamaDialogueError,
  type OllamaDialogueInput,
  type OllamaDialogueResult,
} from "./dialogue-ollama";

const DEFAULT_SERVICE_URL =
  process.env["OLLAMA_SERVICE_URL"] ?? "http://localhost:11434";

const SERVICE_AUTH_TOKEN = process.env["OLLAMA_AUTH_TOKEN"] ?? "";

/** Default sampling temperature — same as the Gemini path. */
const DEFAULT_TEMPERATURE = 0.75;

function authHeaders(): Record<string, string> {
  return SERVICE_AUTH_TOKEN
    ? { Authorization: `Bearer ${SERVICE_AUTH_TOKEN}` }
    : {};
}

function asError(
  code: OllamaDialogueError["code"],
  message: string,
): Error {
  const detail: OllamaDialogueError = { code, message };
  return Object.assign(new Error(message), detail);
}

/**
 * Compose the system prompt from the character bible. Mirrors the
 * Gemini provider's `buildSystemPrompt` (lib/capabilities/agent/dialogue.ts)
 * so the same bible produces structurally equivalent prompts across
 * providers — only the JSON-envelope instruction at the bottom changes
 * to match Ollama's plain-text capability (no native JSON schema mode).
 */
function buildSystemPrompt(bible: CharacterBible): string {
  const draws = bible.draws.map((d) => `  - ${d}`).join("\n");
  const refusals = bible.refusals.map((r) => `  - ${r}`).join("\n");
  const forbidden = bible.forbidden.map((p) => `  - "${p}"`).join("\n");
  const catchphrases = bible.catchphrases.map((p) => `  - "${p}"`).join("\n");

  return `You are ${bible.name}. ${bible.role}

VOICE: ${bible.voice}

POSTURE: ${bible.posture}

DRAWS (topics you lean into):
${draws}

REFUSALS (hard no, never compromise):
${refusals}

CATCHPHRASES (you do say these):
${catchphrases}

FORBIDDEN PHRASES (never say these):
${forbidden}

Output a single JSON object as your entire reply — nothing before, nothing after, no markdown fences:
  {"text": "...your spoken reply, in your voice...",
   "intent": "greet|answer|redirect|refuse|tease|reflect|invite",
   "mode":   "amber|azure|amethyst|crimson|veridian"}
Default the mode to "${bible.defaultMode}" unless the user's intent calls for a different register.`;
}

type OllamaMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type OllamaChatChunk = {
  message?: { role?: string; content?: string };
  done?: boolean;
  /** Present on the final chunk. Cumulative count of tokens generated. */
  eval_count?: number;
  /** Present on the final chunk. Nanoseconds. */
  total_duration?: number;
  error?: string;
};

/**
 * Map the capability's `{role: 'user' | 'model'}` history into Ollama's
 * `{role: 'user' | 'assistant'}` shape. Same mapping the web-llm
 * provider uses.
 */
function mapHistory(
  history: OllamaDialogueInput["history"],
): OllamaMessage[] {
  return history.map((h) => ({
    role: h.role === "model" ? "assistant" : "user",
    content: h.text,
  }));
}

/**
 * Parse the final accumulated text for a JSON envelope. Tolerates
 * markdown fences and leading/trailing chatter — small local models
 * frequently wrap the envelope in ``` despite the instruction. Falls
 * back to plain-text + default mode when no envelope can be found.
 */
function parseEnvelope(
  raw: string,
  bible: CharacterBible,
): { text: string; intent: string | null; mode: string | null } {
  const trimmed = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  // Find the first '{' and last '}' to tolerate any leading prose.
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    return { text: raw.trim(), intent: null, mode: bible.defaultMode };
  }
  const slice = trimmed.slice(first, last + 1);
  try {
    const parsed = JSON.parse(slice) as {
      text?: unknown;
      intent?: unknown;
      mode?: unknown;
    };
    return {
      text:
        typeof parsed.text === "string" && parsed.text.length > 0
          ? parsed.text
          : raw.trim(),
      intent: typeof parsed.intent === "string" ? parsed.intent : null,
      mode:
        typeof parsed.mode === "string" ? parsed.mode : bible.defaultMode,
    };
  } catch {
    return { text: raw.trim(), intent: null, mode: bible.defaultMode };
  }
}

/**
 * Translate an HTTP response from Ollama into a typed
 * `OllamaDialogueError`. The service distinguishes "model not loaded"
 * via a 404 with `model '...' not found` text; we surface that as the
 * dedicated code so callers can prompt the operator to `ollama pull`.
 */
async function errorFromResponse(res: Response): Promise<Error> {
  let body = "";
  try {
    body = await res.text();
  } catch {
    // Body read can fail if the upstream socket closed early — ignore
    // and fall back to the status line.
  }
  if (res.status === 404 && /model/i.test(body)) {
    return asError(
      "model-not-loaded",
      `Ollama rejected the request — model not present: ${body || res.statusText}`,
    );
  }
  if (res.status === 429) {
    return asError(
      "rate-limited",
      `Ollama rate-limited: ${body || res.statusText}`,
    );
  }
  if (res.status >= 500) {
    return asError(
      "service-unavailable",
      `Ollama service error ${res.status}: ${body || res.statusText}`,
    );
  }
  return asError(
    "generation-failed",
    `Ollama rejected the chat request ${res.status}: ${body || res.statusText}`,
  );
}

/**
 * The server-side router for `agent.dialogue-ollama`.
 *
 * Composes a system prompt from the bible, POSTs to Ollama's `/api/chat`
 * with `stream:true`, drains the newline-delimited JSON body chunk by
 * chunk while calling `onStream` for each token batch, parses the
 * final accumulated text for a `{text,intent,mode}` envelope, and
 * returns the typed `OllamaDialogueResult` with timing metadata.
 *
 * Throws a typed `OllamaDialogueError` for service / model / rate /
 * generation failures so route handlers can pick the correct fallback.
 */
export async function dialogueOllamaServer(
  input: OllamaDialogueInput,
  _ctx: { uid: string },
): Promise<OllamaDialogueResult> {
  const model = input.model ?? DEFAULT_OLLAMA_MODEL;
  const serviceUrl = DEFAULT_SERVICE_URL;
  const systemPrompt = buildSystemPrompt(input.bible);

  const messages: OllamaMessage[] = [
    { role: "system", content: systemPrompt },
    ...mapHistory(input.history),
    { role: "user", content: input.userText },
  ];

  const body = JSON.stringify({
    model,
    messages,
    stream: true,
    options: { temperature: DEFAULT_TEMPERATURE },
  });

  const startedAt = Date.now();
  let res: Response;
  try {
    res = await fetch(`${serviceUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body,
    });
  } catch (err) {
    throw asError(
      "service-unavailable",
      `Ollama unreachable at ${serviceUrl}: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!res.ok) {
    throw await errorFromResponse(res);
  }
  if (!res.body) {
    throw asError(
      "service-unavailable",
      "Ollama returned no response body — stream cannot be read",
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  let full = "";
  let ttftMs: number | null = null;
  let tokens = 0;
  let serverDurationNs: number | null = null;

  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Ollama emits one JSON object per line. Drain complete lines.
      let nl = buffer.indexOf("\n");
      while (nl !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        nl = buffer.indexOf("\n");
        if (line.length === 0) continue;

        let chunk: OllamaChatChunk;
        try {
          chunk = JSON.parse(line) as OllamaChatChunk;
        } catch {
          // A malformed line shouldn't kill the stream — log and
          // continue. Ollama has been seen to flush partial lines on
          // some platforms; the next iteration's decode will append
          // the remainder.
          continue;
        }

        if (typeof chunk.error === "string" && chunk.error.length > 0) {
          throw asError(
            "generation-failed",
            `Ollama stream error: ${chunk.error}`,
          );
        }

        const delta = chunk.message?.content ?? "";
        if (delta.length > 0) {
          if (ttftMs === null) ttftMs = Date.now() - startedAt;
          full += delta;
          input.onStream?.(delta, full);
        }

        if (chunk.done) {
          if (typeof chunk.eval_count === "number") {
            tokens = chunk.eval_count;
          }
          if (typeof chunk.total_duration === "number") {
            serverDurationNs = chunk.total_duration;
          }
        }
      }
    }
  } finally {
    // Always release the reader so the underlying socket can close.
    reader.releaseLock();
  }

  const totalMs =
    serverDurationNs !== null
      ? Math.round(serverDurationNs / 1_000_000)
      : Date.now() - startedAt;

  const envelope = parseEnvelope(full, input.bible);

  return {
    text: envelope.text,
    intent: envelope.intent,
    mode: envelope.mode,
    tokens,
    ttftMs,
    totalMs,
  };
}
