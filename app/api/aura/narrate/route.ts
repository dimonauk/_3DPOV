/**
 * app/api/aura/narrate/route.ts — Aura's short-form narration endpoint.
 *
 * Used by the floating <NarrationPlate /> component on atelier
 * chambers (sculpture-gallery, breeding-floor, triposr/trellis) to
 * fetch a tight 1-2 sentence note in Aura's voice that mirrors what
 * the operator is doing in the chamber.
 *
 * # Auth posture
 * Open. Visitor-facing — no Firebase token required. The studio
 * absorbs the per-call cost the same way `/api/aura/chat` does.
 *
 * # Length contract
 * The system prompt pins the response to one or two sentences. We
 * pass it as an explicit `contextSuffix` so the bible itself stays
 * generic; chamber surfaces ask for terse, the lobby chat doesn't.
 *
 * # Body shape
 *   {
 *     "context": string,
 *     "length"?: "one-sentence" | "two-sentence"   // default: two-sentence
 *   }
 *
 * # Response shape
 *   { "text": string, "intent": string | null, "mode": string | null }
 *
 * # Graceful offline
 * When no LLM key is configured the `agent.dialogue` capability
 * returns its typed `offlineResult()` already. We re-shape that into
 * an Aura-voiced one-liner the client can render verbatim ("Aura is
 * offline. Try again in a moment.") instead of leaking the engineer
 * copy about env vars.
 */

import { NextResponse } from "next/server";

import { aura } from "lib/cast/aura";
import {
  isProviderAvailable,
  respond,
  type AgentProvider,
} from "lib/capabilities/agent/dialogue";
import { createLogger } from "lib/log";
import { createFixedWindowLimiter } from "lib/rate-limit/fixed-window";

const log = createLogger("api:aura/narrate");

export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Atelier chambers can fire narration on tab switches and panel
// updates; 60/hour/IP comfortably covers an active session while
// capping a misbehaving client. Auto-upgrades to Upstash Redis.
const HOURLY_CAP = 60;
const limiter = createFixedWindowLimiter({
  scope: "api.aura.narrate",
  limit: HOURLY_CAP,
  windowMs: 60 * 60 * 1000,
});

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

type LengthHint = "one-sentence" | "two-sentence";

function isLengthHint(v: unknown): v is LengthHint {
  return v === "one-sentence" || v === "two-sentence";
}

function lengthInstruction(hint: LengthHint): string {
  return hint === "one-sentence"
    ? "Respond in exactly ONE sentence. No preamble, no sign-off. Plain English. In Aura's voice."
    : "Respond in ONE OR TWO sentences. No preamble, no sign-off. Plain English. In Aura's voice.";
}

function pickProvider(): AgentProvider {
  // Prefer Gemini when its key is wired (cheapest + the project's default).
  // Fall through to the gateway providers in order if Gemini isn't there.
  const order: AgentProvider[] = ["gemini", "anthropic", "zai", "openai"];
  for (const p of order) {
    if (isProviderAvailable(p)) return p;
  }
  return "gemini"; // still returned so the offline branch fires consistently.
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  const slot = await limiter.consume(`ip:${ip}`);
  if (!slot.ok) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((slot.resetAt - Date.now()) / 1000),
    );
    log.warn("rate_limited", { ip, retryAfterSec, backend: limiter.backend });
    return NextResponse.json(
      {
        error: "rate_limited",
        message: `Narration cap: ${HOURLY_CAP}/hour/visitor.`,
        retryAfterSec,
      },
      { status: 429, headers: { "Retry-After": String(retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected application/json body" },
      { status: 400 },
    );
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json(
      { error: "body must be a JSON object" },
      { status: 400 },
    );
  }
  const obj = body as Record<string, unknown>;
  const context = typeof obj["context"] === "string" ? obj["context"].trim() : "";
  if (!context) {
    return NextResponse.json(
      { error: "context is required" },
      { status: 400 },
    );
  }
  const length: LengthHint = isLengthHint(obj["length"])
    ? obj["length"]
    : "two-sentence";

  const provider = pickProvider();
  const available = isProviderAvailable(provider);
  if (!available) {
    log.info("offline narrate (no provider configured)", { provider });
    return NextResponse.json({
      text: "Aura is offline. Try again in a moment.",
      intent: null,
      mode: null,
      offline: true,
    });
  }

  // The chamber narration prompt: chamber state in, terse note out.
  // We frame the "user" turn as the chamber's situation report so the
  // LLM has something to react to; the length constraint rides as the
  // contextSuffix so the bible stays the canonical voice source.
  const contextSuffix = `${lengthInstruction(length)} You are narrating what is happening on the atelier chamber the visitor is looking at right now. Stay terse — the chamber gets a small note from you, not a monologue. No emoji, no markdown.`;

  const userText = `Chamber state: ${context}`;

  try {
    const result = await respond({
      // Sentinel speaker id — don't pollute the canonical "aura" cast
      // history with these short narration turns, the way /aura/chat
      // uses "aura.web-chat".
      speakerId: "aura.narration-plate",
      bible: aura,
      userText,
      provider,
      contextSuffix,
    });
    const raw =
      typeof result.text === "string" ? result.text.trim() : "";

    // The agent.dialogue capability returns a typed offlineResult()
    // when its provider call fails mid-flight (gateway unavailable,
    // key set but rejected, etc.). The text it returns is the
    // engineer copy "(Aura's brain is offline — set GOOGLE_AI_API_KEY
    // in your env to enable replies.)" which we DO NOT want to leak
    // to visitors. Re-shape to the visitor-safe copy.
    const looksOffline =
      raw.length === 0 ||
      raw.toLowerCase().includes("aura's brain is offline") ||
      raw.toLowerCase().includes("set google_ai_api_key");

    if (looksOffline) {
      log.info("narrate fell through to offline result", { provider });
      return NextResponse.json({
        text: "Aura is offline. Try again in a moment.",
        intent: null,
        mode: null,
        offline: true,
      });
    }

    return NextResponse.json({
      text: raw,
      intent: result.intent,
      mode: result.mode,
      offline: false,
    });
  } catch (err) {
    log.error("narrate failed", { err, provider });
    // Don't surface raw errors to visitors; the plate copy is fixed.
    return NextResponse.json({
      text: "Aura is offline. Try again in a moment.",
      intent: null,
      mode: null,
      offline: true,
    });
  }
}
