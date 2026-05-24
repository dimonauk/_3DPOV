/**
 * lib/agents/llm-client/providers/gemini.ts
 *
 * Google Gemini native REST adapter (generateContent endpoint). Owns
 * the Gemini-specific quirks: the API key lives in the URL, roles
 * are `user` / `model` not `assistant`, messages are wrapped in
 * `contents[].parts[]`, system is a separate `system_instruction`,
 * and tokens land in `usageMetadata`.
 */

import "server-only";

import {
  readBodyText,
  safeErrorText,
  splitSystem,
  timeoutSignal,
} from "../shared";
import type { LLMMessage, LLMResponse } from "../types";

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
};

export type GeminiCallOptions = {
  apiKey: string;
  model: string;
  messages: LLMMessage[];
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
};

export async function callGemini(opts: GeminiCallOptions): Promise<LLMResponse> {
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
    data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
    "";

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
