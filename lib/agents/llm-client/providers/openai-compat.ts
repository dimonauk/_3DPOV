/**
 * lib/agents/llm-client/providers/openai-compat.ts
 *
 * OpenAI chat-completions wire format. Powers three transports:
 *
 *   - Aperture gateway (Tailscale) — any provider, OpenAI-compat wire
 *   - OpenAI direct
 *   - Local Ollama
 *
 * Owns nothing but the wire format. Caller passes baseUrl + (optional)
 * apiKey + a `providerLabel` for logging. Returns the uniform
 * LLMResponse shape so the primary dispatcher doesn't care which
 * transport landed on this adapter.
 */

import "server-only";

import { readBodyText, safeErrorText, timeoutSignal } from "../shared";
import type { LLMMessage, LLMResponse } from "../types";

type OpenAIChatCompletion = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export type OpenAICompatOptions = {
  baseUrl: string;
  apiKey?: string;
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  /** Cosmetic label for logging / response (e.g. "openai", "ollama",
   *  "aperture:anthropic"). */
  providerLabel: string;
};

export async function callOpenAICompat(
  opts: OpenAICompatOptions,
): Promise<LLMResponse> {
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
    return { ok: false, error: `network: ${safeErrorText(message)}` };
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

  return {
    ok: true,
    text: data.choices?.[0]?.message?.content ?? "",
    usage: {
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
    },
    provider: opts.providerLabel,
    model: opts.model,
  };
}
