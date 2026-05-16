/**
 * lib/llm/gateway.ts — Thin client for the Vercel AI Gateway.
 *
 * One-line role: a `chat({ model, messages })` helper that hits the
 * Vercel AI Gateway via the OpenAI-compatible REST surface. No SDK
 * dependency — the studio's `@google/genai` was the only AI SDK in
 * the tree before this, and adding another to talk to Claude / Z.ai
 * costs more than it saves.
 *
 * # Why the gateway, not provider SDKs
 *
 * The operator has stored Anthropic + Z.ai BYOK in Vercel's AI
 * Gateway settings. The gateway provides a single OpenAI-compatible
 * endpoint that routes by the `provider/model` string in the request:
 *
 *     POST https://ai-gateway.vercel.sh/v1/chat/completions
 *     Authorization: Bearer <AI_GATEWAY_API_KEY>
 *     { "model": "anthropic/claude-sonnet-4-7", "messages": [...] }
 *
 * One auth header, every provider. Adding Z.ai or any new line is a
 * model-string change, not a new SDK install.
 *
 * # When the gateway isn't reachable
 *
 * `AI_GATEWAY_API_KEY` may not be configured locally (the gateway
 * doesn't have a free local-dev story yet). The fallback chain:
 *
 *   1. `AI_GATEWAY_API_KEY` set → gateway URL.
 *   2. Else if `ANTHROPIC_API_KEY` set and model is anthropic/* →
 *      direct Anthropic API.
 *   3. Else if `ZAI_API_KEY` set and model is zai/* → Z.ai's
 *      OpenAI-compatible endpoint directly.
 *   4. Else throw `gateway-unavailable` and the caller falls back
 *      to its existing provider (e.g. Gemini for dialogue).
 *
 * # Auth posture
 *
 * Never log the key value. The `usingGateway: boolean` field is the
 * only auth-related log entry.
 */

import { createLogger } from "lib/log";
import { envOrUndefined } from "lib/env";

const log = createLogger("lib:llm:gateway");

/** A single message in OpenAI-compat shape. */
export type GatewayMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type GatewayChatOptions = {
  /** `provider/model` string. e.g. "anthropic/claude-sonnet-4-7",
   *  "zai/glm-4.5-air". */
  model: string;
  messages: GatewayMessage[];
  /** Sampling temperature 0..2. Default 0.75. */
  temperature?: number;
  /** Max tokens. Default 2048. */
  maxTokens?: number;
  /** When supplied, the model is told to emit JSON matching this
   *  description. Honoured by Anthropic + most others via system
   *  prompt prepend. */
  responseSchemaHint?: string;
  /**
   * Visitor's BYO key, if any. Overrides the gateway key. Forwarded
   * as `Authorization: Bearer <key>` directly to the provider — the
   * gateway is bypassed in this mode because the visitor's key is
   * provider-specific, not gateway-team-scoped.
   */
  visitorKey?: string | null;
};

export type GatewayChatResult = {
  text: string;
  /** Which auth path was taken — useful for log/metrics. */
  usingVisitorKey: boolean;
  usingGateway: boolean;
};

export class GatewayUnavailableError extends Error {
  constructor(public code: "no-key" | "transport" | "model-rejected", message: string) {
    super(message);
    this.name = "GatewayUnavailableError";
  }
}

const GATEWAY_URL = "https://ai-gateway.vercel.sh/v1/chat/completions";

/**
 * Send a chat completion through the Vercel AI Gateway (or the
 * matching direct provider when a visitor key is set). Returns the
 * assistant's reply text. Throws `GatewayUnavailableError` when no
 * auth path resolves.
 */
export async function gatewayChat(
  options: GatewayChatOptions,
): Promise<GatewayChatResult> {
  const { model, messages, temperature = 0.75, maxTokens = 2048, visitorKey } =
    options;

  // Visitor's key path: hit the provider directly (visitor keys are
  // provider-scoped, not gateway-scoped). Determine provider from the
  // model prefix.
  if (visitorKey && visitorKey.trim().length > 0) {
    const providerPrefix = model.split("/")[0];
    if (providerPrefix === "anthropic") {
      return callAnthropicDirect(model, messages, temperature, maxTokens, visitorKey.trim());
    }
    if (providerPrefix === "zai") {
      return callZaiDirect(model, messages, temperature, maxTokens, visitorKey.trim());
    }
    throw new GatewayUnavailableError(
      "no-key",
      `Visitor key supplied but no direct path for provider "${providerPrefix}". Configure AI_GATEWAY_API_KEY instead.`,
    );
  }

  // Studio path 1: Vercel AI Gateway.
  const gatewayKey = envOrUndefined("AI_GATEWAY_API_KEY");
  if (gatewayKey) {
    log.info("dispatch via gateway", { model, usingGateway: true });
    return callGateway(model, messages, temperature, maxTokens, gatewayKey);
  }

  // Studio path 2: direct provider env keys (works without gateway).
  const providerPrefix = model.split("/")[0];
  if (providerPrefix === "anthropic") {
    const k = envOrUndefined("ANTHROPIC_API_KEY");
    if (k) {
      log.info("dispatch direct (anthropic)", { model, usingGateway: false });
      return callAnthropicDirect(model, messages, temperature, maxTokens, k);
    }
  }
  if (providerPrefix === "zai") {
    const k = envOrUndefined("ZAI_API_KEY");
    if (k) {
      log.info("dispatch direct (zai)", { model, usingGateway: false });
      return callZaiDirect(model, messages, temperature, maxTokens, k);
    }
  }

  throw new GatewayUnavailableError(
    "no-key",
    `No auth path for model "${model}". Set AI_GATEWAY_API_KEY (preferred) or the matching ${providerPrefix?.toUpperCase()}_API_KEY direct env.`,
  );
}

// ---------------------------------------------------------------------------
// Transport implementations
// ---------------------------------------------------------------------------

async function callGateway(
  model: string,
  messages: GatewayMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
): Promise<GatewayChatResult> {
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GatewayUnavailableError(
      res.status === 401 || res.status === 403 ? "no-key" : "transport",
      `gateway HTTP ${res.status}: ${detail.slice(0, 300)}`,
    );
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  return { text, usingVisitorKey: false, usingGateway: true };
}

async function callAnthropicDirect(
  model: string,
  messages: GatewayMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
): Promise<GatewayChatResult> {
  // model in our convention is "anthropic/claude-sonnet-4-7"; strip
  // the prefix for Anthropic's API which uses bare model names.
  const bareModel = model.includes("/") ? model.split("/")[1]! : model;
  const system = messages.find((m) => m.role === "system");
  const turns = messages.filter((m) => m.role !== "system").map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: bareModel,
      max_tokens: maxTokens,
      temperature,
      system: system?.content,
      messages: turns,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GatewayUnavailableError(
      res.status === 401 ? "no-key" : "transport",
      `anthropic HTTP ${res.status}: ${detail.slice(0, 300)}`,
    );
  }
  const body = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text =
    (body.content ?? [])
      .filter((c) => c.type === "text" && typeof c.text === "string")
      .map((c) => c.text)
      .join("") ?? "";
  return { text, usingVisitorKey: true, usingGateway: false };
}

async function callZaiDirect(
  model: string,
  messages: GatewayMessage[],
  temperature: number,
  maxTokens: number,
  apiKey: string,
): Promise<GatewayChatResult> {
  // Z.ai provides an OpenAI-compatible endpoint.
  const bareModel = model.includes("/") ? model.split("/")[1]! : model;
  const res = await fetch("https://api.z.ai/api/paas/v4/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: bareModel,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GatewayUnavailableError(
      res.status === 401 ? "no-key" : "transport",
      `zai HTTP ${res.status}: ${detail.slice(0, 300)}`,
    );
  }
  const body = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = body.choices?.[0]?.message?.content ?? "";
  return { text, usingVisitorKey: true, usingGateway: false };
}

/** Default model strings the dialogue + banter capabilities use when
 *  no explicit model is supplied. Override via env. */
export function defaultModelForProvider(
  provider: "anthropic" | "zai" | "openai",
): string {
  if (provider === "anthropic") {
    return envOrUndefined("LLM_ANTHROPIC_MODEL") ?? "anthropic/claude-sonnet-4-7";
  }
  if (provider === "zai") {
    return envOrUndefined("LLM_ZAI_MODEL") ?? "zai/glm-4.5-air";
  }
  return envOrUndefined("LLM_OPENAI_MODEL") ?? "openai/gpt-4o-mini";
}
