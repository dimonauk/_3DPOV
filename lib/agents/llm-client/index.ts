/**
 * lib/agents/llm-client/index.ts — Public entry point.
 *
 * Single export: `callLLM(req)`. Routes through `primary.ts` to pick
 * the right adapter; on network / auth / 5xx failures, falls back to
 * local Ollama when reachable.
 *
 * Re-exports the public types so callers say:
 *
 *   import { callLLM, type LLMMessage } from "lib/agents/llm-client";
 *
 * and don't need to know about the internal directory layout.
 */

import "server-only";

import { createLogger } from "lib/log";

import { callPrimary } from "./primary";
import { callOpenAICompat } from "./providers/openai-compat";
import { pingOllama } from "./providers/ollama-ping";
import {
  classify,
  DEFAULT_MAX_TOKENS,
  DEFAULT_OLLAMA_FALLBACK_MODEL,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  ollamaBaseUrl,
  shouldFallback,
} from "./shared";
import type { CallLLMRequest, LLMResponse } from "./types";

export type {
  CallLLMRequest,
  LLMMessage,
  LLMProvider,
  LLMResponse,
  LLMRole,
  LLMVia,
} from "./types";

const log = createLogger("agents.llm-client");

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

  // Don't fall back to ourselves.
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

  return { ...fallback, fallbackUsed: "ollama" };
}
