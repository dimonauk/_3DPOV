/**
 * Server-side LLM client for the Holoflow Studio site.
 *
 * Single entry point: `callLLM({ provider, model, via, messages, ... })`.
 *
 * `via` selects the transport:
 *  - "aperture" → Tailscale's Aperture gateway (https://ai.tail99b2a4.ts.net/v1),
 *                 OpenAI-compatible chat-completions wire format. The model
 *                 string is prefixed with the provider (e.g. "anthropic/…").
 *  - "direct"   → the provider's own REST API. Uses ANTHROPIC_API_KEY,
 *                 OPENAI_API_KEY, or GOOGLE_AI_API_KEY depending on `provider`.
 *  - "local"    → local Ollama (OpenAI-compatible). OLLAMA_BASE_URL overrides
 *                 the default of http://localhost:11434.
 *
 * Fallback: a primary call that fails with a network error, an auth error,
 * or a 5xx falls back to local Ollama when Ollama is reachable. User-error
 * 4xx (400 / 422) does not fall back — that's the caller's bug.
 *
 * Zero deps: uses native `fetch` + `AbortSignal.timeout`. No Anthropic /
 * OpenAI / Google SDKs. Aperture and Ollama both speak the OpenAI
 * chat-completions schema, which keeps the bulk of the code shared.
 */

import "server-only";

import { createLogger } from "lib/log";

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------

const log = createLogger("agents.llm-client");

const APERTURE_BASE_URL = "https://ai.tail99b2a4.ts.net/v1";
const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_TOKENS = 1024;
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_OLLAMA_FALLBACK_MODEL = "qwen3:8b";

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL ?? OLLAMA_DEFAULT_BASE_URL).replace(
    /\/$/,
    "",
  );
}

function timeoutSignal(timeoutMs: number): AbortSignal {
  return AbortSignal.timeout(timeoutMs);
}

/**
 * Build the system prompt + non-system messages split. Some providers
 * (Anthropic native, Gemini native) take system separately from the
 * conversation; OpenAI-compatible endpoints (Aperture, Ollama, OpenAI
 * direct) take it as a `role: "system"` entry in `messages`.
 */
function splitSystem(messages: LLMMessage[]): {
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

function safeErrorText(text: string): string {
  // Avoid leaking anything that looks like a bearer token / api-key.
  return text
    .replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-[redacted]")
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/x-api-key[^,}\n]*/gi, "x-api-key: [redacted]")
    .slice(0, 1024);
}

/**
 * Classify an error so the caller knows whether to fall back. Network
 * errors, timeouts, 401/403/5xx → fall back. 400/422 → do not.
 */
type FailKind = "network" | "auth" | "server" | "user" | "unknown";

function classify(status: number | undefined): FailKind {
  if (status === undefined) return "network";
  if (status === 401 || status === 403) return "auth";
  if (status === 400 || status === 422) return "user";
  if (status >= 500) return "server";
  if (status >= 400) return "user";
  return "unknown";
}

function shouldFallback(kind: FailKind): boolean {
  return kind === "network" || kind === "auth" || kind === "server";
}

async function readBodyText(res: Response): Promise<string> {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

// ---------------------------------------------------------------------
// OpenAI-compatible chat-completions adapter
// Used for: Aperture (any provider), OpenAI direct, Ollama local.
// ---------------------------------------------------------------------

type OpenAIChatCompletion = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

async function callOpenAICompat(opts: {
  baseUrl: string;
  apiKey?: string;
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  /** Cosmetic label for logging / response. */
  providerLabel: string;
}): Promise<LLMResponse> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/chat/completions`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.apiKey) headers["Authorization"] = `Bearer ${opts.apiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: opts.model,
        messages: opts.messages,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        stream: false,
      }),
      signal: timeoutSignal(opts.timeoutMs),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `network: ${safeErrorText(message)}`,
    };
  }

  if (!res.ok) {
    const body = await readBodyText(res);
    return {
      ok: false,
      error: `${opts.providerLabel} ${res.status}: ${safeErrorText(body)}`,
      status: res.status,
    };
  }

  let data: OpenAIChatCompletion;
  try {
    data = (await res.json()) as OpenAIChatCompletion;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `${opts.providerLabel}: invalid JSON (${safeErrorText(message)})`,
    };
  }

  const text = data.choices?.[0]?.message?.content ?? "";
  return {
    ok: true,
    text,
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
    provider: opts.providerLabel,
    model: opts.model,
  };
}

// ---------------------------------------------------------------------
// Anthropic native REST
// ---------------------------------------------------------------------

type AnthropicMessagesResponse = {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

async function callAnthropicDirect(opts: {
  apiKey: string;
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}): Promise<LLMResponse> {
  const { system, rest } = splitSystem(opts.messages);

  let res: Response;
  try {
    res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: opts.maxTokens,
        temperature: opts.temperature,
        system: system || undefined,
        messages: rest.map((m) => ({ role: m.role, content: m.content })),
      }),
      signal: timeoutSignal(opts.timeoutMs),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `network: ${safeErrorText(message)}` };
  }

  if (!res.ok) {
    const body = await readBodyText(res);
    return {
      ok: false,
      error: `anthropic ${res.status}: ${safeErrorText(body)}`,
      status: res.status,
    };
  }

  let data: AnthropicMessagesResponse;
  try {
    data = (await res.json()) as AnthropicMessagesResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `anthropic: invalid JSON (${safeErrorText(message)})`,
    };
  }

  const text = (data.content ?? [])
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");

  return {
    ok: true,
    text,
    usage: {
      inputTokens: data.usage?.input_tokens ?? 0,
      outputTokens: data.usage?.output_tokens ?? 0,
    },
    provider: "anthropic",
    model: opts.model,
  };
}

// ---------------------------------------------------------------------
// Google Gemini native REST
// ---------------------------------------------------------------------

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

async function callGeminiDirect(opts: {
  apiKey: string;
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
}): Promise<LLMResponse> {
  const { system, rest } = splitSystem(opts.messages);
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(opts.model)}:generateContent?key=${encodeURIComponent(opts.apiKey)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: rest.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        ...(system
          ? { system_instruction: { parts: [{ text: system }] } }
          : {}),
        generationConfig: {
          maxOutputTokens: opts.maxTokens,
          temperature: opts.temperature,
        },
      }),
      signal: timeoutSignal(opts.timeoutMs),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `network: ${safeErrorText(message)}` };
  }

  if (!res.ok) {
    const body = await readBodyText(res);
    return {
      ok: false,
      error: `google ${res.status}: ${safeErrorText(body)}`,
      status: res.status,
    };
  }

  let data: GeminiResponse;
  try {
    data = (await res.json()) as GeminiResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      error: `google: invalid JSON (${safeErrorText(message)})`,
    };
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? "")
      .join("") ?? "";

  return {
    ok: true,
    text,
    usage: {
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
    },
    provider: "google",
    model: opts.model,
  };
}

// ---------------------------------------------------------------------
// Local Ollama probe (used by the fallback path)
// ---------------------------------------------------------------------

async function pingOllama(baseUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(1500),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------
// Primary dispatch
// ---------------------------------------------------------------------

async function callPrimary(req: CallLLMRequest): Promise<LLMResponse> {
  const maxTokens = req.maxTokens ?? DEFAULT_MAX_TOKENS;
  const temperature = req.temperature ?? DEFAULT_TEMPERATURE;
  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  if (req.via === "aperture") {
    const apiKey = process.env.APERTURE_API_KEY;
    if (!apiKey) {
      return {
        ok: false,
        error: "aperture: APERTURE_API_KEY is not set",
        status: 401,
      };
    }
    // Aperture takes "provider/model" model strings, OpenAI-compat wire.
    const model = req.model.includes("/")
      ? req.model
      : `${req.provider}/${req.model}`;
    return callOpenAICompat({
      baseUrl: APERTURE_BASE_URL,
      apiKey,
      model,
      messages: req.messages,
      maxTokens,
      temperature,
      timeoutMs,
      providerLabel: `aperture:${req.provider}`,
    });
  }

  if (req.via === "local") {
    return callOpenAICompat({
      baseUrl: ollamaBaseUrl(),
      model: req.model,
      messages: req.messages,
      maxTokens,
      temperature,
      timeoutMs,
      providerLabel: "ollama",
    });
  }

  // via === "direct"
  switch (req.provider) {
    case "anthropic": {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return {
          ok: false,
          error: "anthropic: ANTHROPIC_API_KEY is not set",
          status: 401,
        };
      }
      return callAnthropicDirect({
        apiKey,
        model: req.model,
        messages: req.messages,
        maxTokens,
        temperature,
        timeoutMs,
      });
    }
    case "openai": {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return {
          ok: false,
          error: "openai: OPENAI_API_KEY is not set",
          status: 401,
        };
      }
      return callOpenAICompat({
        baseUrl: "https://api.openai.com/v1",
        apiKey,
        model: req.model,
        messages: req.messages,
        maxTokens,
        temperature,
        timeoutMs,
        providerLabel: "openai",
      });
    }
    case "google": {
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        return {
          ok: false,
          error: "google: GOOGLE_AI_API_KEY is not set",
          status: 401,
        };
      }
      return callGeminiDirect({
        apiKey,
        model: req.model,
        messages: req.messages,
        maxTokens,
        temperature,
        timeoutMs,
      });
    }
    case "ollama": {
      return callOpenAICompat({
        baseUrl: ollamaBaseUrl(),
        model: req.model,
        messages: req.messages,
        maxTokens,
        temperature,
        timeoutMs,
        providerLabel: "ollama",
      });
    }
    default: {
      // Exhaustiveness check; the type system forbids reaching this.
      const _exhaustive: never = req.provider;
      void _exhaustive;
      return {
        ok: false,
        error: `unknown provider`,
        status: 400,
      };
    }
  }
}

// ---------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------

/**
 * Call an LLM. Routes through Aperture, a direct provider, or local
 * Ollama based on `via`. On network / auth / 5xx failures, falls back
 * to local Ollama if it's reachable (unless `allowFallback: false`).
 */
export async function callLLM(req: CallLLMRequest): Promise<LLMResponse> {
  if (!req.messages || req.messages.length === 0) {
    return { ok: false, error: "no messages provided", status: 400 };
  }

  const primary = await callPrimary(req);
  if (primary.ok) {
    log.debug("primary ok", {
      via: req.via,
      provider: req.provider,
      model: req.model,
      inputTokens: primary.usage.inputTokens,
      outputTokens: primary.usage.outputTokens,
    });
    return primary;
  }

  // Primary failed. Decide whether to fall back.
  const allowFallback = req.allowFallback ?? true;
  const kind = classify(primary.status);

  log.warn("primary failed", {
    via: req.via,
    provider: req.provider,
    model: req.model,
    status: primary.status,
    kind,
    error: primary.error,
  });

  if (!allowFallback || !shouldFallback(kind)) {
    return primary;
  }

  // Don't bother falling back to ourselves.
  if (req.via === "local" || req.provider === "ollama") {
    return primary;
  }

  const ollamaUrl = ollamaBaseUrl();
  const reachable = await pingOllama(ollamaUrl);
  if (!reachable) {
    log.warn("fallback skipped: ollama unreachable", { ollamaUrl });
    return primary;
  }

  const fallbackModel = req.fallbackModel ?? DEFAULT_OLLAMA_FALLBACK_MODEL;
  log.info("falling back to ollama", {
    from: `${req.via}:${req.provider}:${req.model}`,
    to: `ollama:${fallbackModel}`,
  });

  const fallback = await callOpenAICompat({
    baseUrl: ollamaUrl,
    model: fallbackModel,
    messages: req.messages,
    maxTokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
    temperature: req.temperature ?? DEFAULT_TEMPERATURE,
    timeoutMs: req.timeoutMs ?? DEFAULT_TIMEOUT_MS,
    providerLabel: "ollama",
  });

  if (fallback.ok) {
    return { ...fallback, fallbackUsed: "ollama" };
  }
  return { ...fallback, fallbackUsed: "ollama" };
}
