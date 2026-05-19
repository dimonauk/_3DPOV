/**
 * lib/agents/model-router.ts — Server-side LLM routing decision.
 *
 * Pure function. Takes an agent slug, the user prompt, and a local-bias
 * flag, returns a `ModelChoice` naming the provider + model the caller
 * should use. Does NOT perform any I/O — no env reads, no fetches, no
 * provider clients. The caller wires the choice into the OpenAI SDK or
 * AI SDK v6 (Aperture gateway baseURL, direct provider baseURL, or a
 * local Ollama baseURL — keyed by `choice.via`).
 *
 * Ported from `DollyOS/src/services/agent/llmRouter.ts` and adapted to:
 *  - the Aperture-gateway pattern (single `via` enum, no provider cascade)
 *  - per-agent overrides via an optional `lib/agents/cast.ts` stub
 *  - Holoflow's `createLogger` from `lib/log`
 *  - the route signal table in the porting brief (code-heavy / vision /
 *    creative-prose / quick-lookup / default)
 *
 * Routes (the gateway URL is for caller context — this file just picks):
 *   anthropic/claude-opus-4-7    → code-heavy
 *   google/gemini-2.5-flash      → vision (data URL or vision phrase)
 *   ollama/dolphin-mistral       → creative-prose AND preferLocal
 *   anthropic/claude-sonnet-4-6  → creative-prose (no local) | default
 *   openai/gpt-5.4-nano          → quick-lookup (<50 chars, no code)
 */

import "server-only";

import { createLogger } from "lib/log";

const log = createLogger("agents.model-router");

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ModelProvider = "anthropic" | "openai" | "google" | "ollama";

/** Where the caller should send the request. `aperture` → Aperture LLM
 *  Gateway (`https://ai.tail99b2a4.ts.net/v1`). `direct` → the provider's
 *  own API (used as an escape hatch). `local` → Ollama on the visitor's
 *  machine or the studio bench. */
export type ModelVia = "aperture" | "direct" | "local";

export type ModelChoice = {
  provider: ModelProvider;
  /** Bare model name — e.g. "claude-opus-4-7", not "anthropic/claude-opus-4-7". */
  model: string;
  /** Short, human-readable. e.g. "code-heavy", "vision", "creative-prose:ollama-available". */
  reason: string;
  via: ModelVia;
};

export type RouteInput = {
  agentSlug: string;
  prompt: string;
  /** When true, biases creative-prose toward local Ollama. */
  preferLocal?: boolean;
};

// ---------------------------------------------------------------------
// Per-agent overrides (cast.ts is optional — soft-import)
// ---------------------------------------------------------------------

/** Shape the optional `lib/agents/cast.ts` is expected to export. */
type CastModule = {
  getAgentModelOverride?: (slug: string) => ModelChoice | null | undefined;
};

let cachedCast: CastModule | null | undefined;

function loadCast(): CastModule | null {
  if (cachedCast !== undefined) return cachedCast;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("./cast") as CastModule;
    cachedCast = mod ?? null;
  } catch {
    // Stub doesn't exist yet — that's fine, we route by signal only.
    cachedCast = null;
  }
  return cachedCast ?? null;
}

function castOverride(slug: string): ModelChoice | null {
  const cast = loadCast();
  if (!cast || typeof cast.getAgentModelOverride !== "function") return null;
  try {
    const choice = cast.getAgentModelOverride(slug);
    return choice ?? null;
  } catch (err) {
    log.warn("cast override threw", {
      slug,
      err: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

// ---------------------------------------------------------------------
// Signal patterns
// ---------------------------------------------------------------------

const CODE_HEAVY_PATTERN =
  /\b(typescript|python|rust|function|interface|import|export|const|class)\b/gi;
const CREATIVE_PROSE_PATTERN =
  /\b(story|verse|poem|character|narrative|prose|dialogue)\b/gi;

// Vision: data URL OR known vision phrases.
const VISION_DATA_URL = /data:image\/[a-z+]+;base64,/i;
const VISION_PHRASES = [
  /describe\s+this\s+image/i,
  /what(?:'?s|\s+is)\s+in\s+this\s+picture/i,
  /what(?:'?s|\s+is)\s+in\s+this\s+image/i,
];

function countMatches(text: string, pattern: RegExp): number {
  // Reset lastIndex because the patterns use /g.
  pattern.lastIndex = 0;
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function hasVisionSignal(text: string): boolean {
  if (VISION_DATA_URL.test(text)) return true;
  return VISION_PHRASES.some((p) => p.test(text));
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Decide which provider + model to use for a given agent + prompt.
 * Pure: same input → same output. No I/O.
 */
export function routeModel(input: RouteInput): ModelChoice {
  const { agentSlug, prompt, preferLocal = false } = input;

  // 1. Per-agent override wins outright (e.g. Aura is always claude-sonnet).
  const override = castOverride(agentSlug);
  if (override) {
    log.debug("override", { agentSlug, provider: override.provider, model: override.model });
    return override;
  }

  // 2. Signal counts.
  const codeHits = countMatches(prompt, CODE_HEAVY_PATTERN);
  const proseHits = countMatches(prompt, CREATIVE_PROSE_PATTERN);
  const vision = hasVisionSignal(prompt);
  const promptLen = prompt.trim().length;

  // 3. Decide. Order: vision → code → creative-prose → quick-lookup → default.
  let choice: ModelChoice;
  if (vision) {
    choice = {
      provider: "google",
      model: "gemini-2.5-flash",
      reason: "vision",
      via: "aperture",
    };
  } else if (codeHits > 3) {
    choice = {
      provider: "anthropic",
      model: "claude-opus-4-7",
      reason: "code-heavy",
      via: "aperture",
    };
  } else if (proseHits > 2) {
    if (preferLocal) {
      choice = {
        provider: "ollama",
        model: "dolphin-mistral",
        reason: "creative-prose:ollama-available",
        via: "local",
      };
    } else {
      choice = {
        provider: "anthropic",
        model: "claude-sonnet-4-6",
        reason: "creative-prose:cloud",
        via: "aperture",
      };
    }
  } else if (promptLen < 50 && codeHits === 0) {
    choice = {
      provider: "openai",
      model: "gpt-5.4-nano",
      reason: "quick-lookup",
      via: "aperture",
    };
  } else {
    choice = {
      provider: "anthropic",
      model: "claude-sonnet-4-6",
      reason: "default",
      via: "aperture",
    };
  }

  log.debug("routed", {
    agentSlug,
    provider: choice.provider,
    model: choice.model,
    reason: choice.reason,
    via: choice.via,
    codeHits,
    proseHits,
    vision,
    promptLen,
    preferLocal,
  });

  return choice;
}
