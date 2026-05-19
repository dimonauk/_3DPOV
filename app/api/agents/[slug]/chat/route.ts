/**
 * POST /api/agents/[slug]/chat — Per-person agent chat endpoint.
 *
 * Skeleton wire-up:
 *  - Resolves the public Profile via `lib/people/registry`.
 *  - Builds the agent system prompt (PUBLIC OUTPUT ONLY).
 *  - Streams a reply from a local Ollama runtime using the
 *    `ai-sdk-ollama` provider + `streamText` from `ai@^6`.
 *
 * Env:
 *  - OLLAMA_BASE_URL  — defaults to http://localhost:11434
 *  - OLLAMA_MODEL     — defaults to qwen3:8b
 *
 * Privacy posture: the model runs on the visitor's local Ollama (or
 * the studio's bench, when the studio is hosting). Nothing routes
 * through Vercel function memory beyond the message bounce.
 *
 * Responses:
 *  - 200 text/event-stream — AI SDK v6 UI message stream
 *  - 400 — malformed body
 *  - 404 — unknown slug
 *  - 503 — Ollama unreachable (friendly JSON; the UI surfaces it)
 *  - 502 — stream blew up mid-flight
 */

import { NextResponse, type NextRequest } from "next/server";
import { streamText, type ModelMessage } from "ai";
import { createOllama } from "ai-sdk-ollama";

import { buildAgentSystemPrompt } from "lib/agents/system-prompt";
import { getProfile } from "lib/people/registry";

// streamText needs Node — no edge runtime.
export const runtime = "nodejs";
// 60s ceiling matches the existing /api/aura/agent route.
export const maxDuration = 60;
// Don't let Next try to statically analyse this.
export const dynamic = "force-dynamic";

const DEFAULT_MODEL = "qwen3:8b";
const DEFAULT_BASE_URL = "http://localhost:11434";

const MAX_HISTORY_MESSAGES = 40;
const MAX_INPUT_CHARS = 2000;
const MAX_OUTPUT_TOKENS = 800;

type ChatMessage = { role: "user" | "assistant"; content: string };

function normaliseMessages(raw: unknown): ModelMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        typeof m === "object" &&
        ((m as ChatMessage).role === "user" ||
          (m as ChatMessage).role === "assistant") &&
        typeof (m as ChatMessage).content === "string",
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_INPUT_CHARS),
    })) as ModelMessage[];
}

async function pingOllama(baseUrl: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 1500);
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/api/tags`, {
      method: "GET",
      signal: ctrl.signal,
    });
    clearTimeout(t);
    return res.ok;
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const profile = getProfile(slug);
  if (!profile) {
    return NextResponse.json(
      { error: "unknown_agent", message: `No public profile for "${slug}".` },
      { status: 404 },
    );
  }

  let body: { messages?: unknown; mode?: "conversation" | "interview" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const messages = normaliseMessages(body?.messages);
  if (messages.length === 0) {
    return NextResponse.json({ error: "empty_messages" }, { status: 400 });
  }

  const baseURL = process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;
  const modelName = process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;

  // Skeleton-friendly behaviour: probe Ollama first and 503 cleanly
  // when it isn't there. The client renders a polite "you need a
  // local Ollama running" hint instead of a spinning broken stream.
  const reachable = await pingOllama(baseURL);
  if (!reachable) {
    return NextResponse.json(
      {
        error: "ollama_unreachable",
        message:
          `Couldn't reach Ollama at ${baseURL}. ` +
          `Start it locally with "ollama serve" and pull ${modelName} ` +
          `("ollama pull ${modelName}"), then try again.`,
        baseURL,
        model: modelName,
      },
      { status: 503 },
    );
  }

  const ollama = createOllama({ baseURL });
  const systemPrompt = buildAgentSystemPrompt(profile, {
    mode: body?.mode === "interview" ? "interview" : "conversation",
  });

  try {
    const result = streamText({
      model: ollama(modelName),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
    });
    return result.toUIMessageStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "stream_failed", message },
      { status: 502 },
    );
  }
}
