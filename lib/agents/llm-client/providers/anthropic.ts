/**
 * lib/agents/llm-client/providers/anthropic.ts
 *
 * Anthropic native REST adapter (POST /v1/messages). Owns the
 * Anthropic-specific request envelope (system as a top-level field;
 * `anthropic-version` header) and the response-content parsing
 * (an array of typed content blocks, only `text` ones contribute).
 */

import "server-only";

import {
  readBodyText,
  safeErrorText,
  splitSystem,
  timeoutSignal,
} from "../shared";
import type { LLMMessage, LLMResponse } from "../types";

type AnthropicMessagesResponse = {
  content?: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
};

export type AnthropicCallOptions = {
  apiKey: string;
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
};

export async function callAnthropic(
  opts: AnthropicCallOptions,
): Promise<LLMResponse> {
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
