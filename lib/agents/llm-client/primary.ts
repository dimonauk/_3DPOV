/**
 * lib/agents/llm-client/primary.ts — Adapter dispatch.
 *
 * Given a CallLLMRequest, picks the right provider adapter based on
 * (via, provider), reads the relevant env var for the API key, and
 * calls the adapter. Returns the adapter's LLMResponse unmodified.
 *
 * This is the POLICY layer — knowledge of which adapter handles
 * which transport lives here. The adapters themselves know only
 * about their own wire format.
 */

import "server-only";

import {
  APERTURE_BASE_URL,
  DEFAULT_MAX_TOKENS,
  DEFAULT_TEMPERATURE,
  DEFAULT_TIMEOUT_MS,
  OPENAI_BASE_URL,
  ollamaBaseUrl,
} from "./shared";
import { callAnthropic } from "./providers/anthropic";
import { callGemini } from "./providers/gemini";
import { callOpenAICompat } from "./providers/openai-compat";
import type { CallLLMRequest, LLMResponse } from "./types";

export async function callPrimary(req: CallLLMRequest): Promise<LLMResponse> {
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
        return missingKey("anthropic", "ANTHROPIC_API_KEY");
      }
      return callAnthropic({
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
        return missingKey("openai", "OPENAI_API_KEY");
      }
      return callOpenAICompat({
        baseUrl: OPENAI_BASE_URL,
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
        return missingKey("google", "GOOGLE_AI_API_KEY");
      }
      return callGemini({
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
      return { ok: false, error: `unknown provider`, status: 400 };
    }
  }
}

function missingKey(label: string, envName: string): LLMResponse {
  return { ok: false, error: `${label}: ${envName} is not set`, status: 401 };
}
