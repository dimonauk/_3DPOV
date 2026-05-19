/**
 * lib/agents/cast.ts — Cast bible registry for the studio's character agents.
 *
 * One-line role: source-of-truth for the deployable system prompts the
 * `/api/agents/[slug]/chat` route injects when a visitor talks to one of
 * the studio's named agents (Aura, Coco, Marcel, the Scribe, Penny).
 *
 * This is the AGENT side of the cast — system prompts, preferred models,
 * topic guardrails, VRM mapping. It is intentionally distinct from
 * `lib/cast/` (the typed character-data the /cast index page renders).
 * One is the bible for the chat surface; the other is the bible for the
 * cast cards. They share canon; they do not share fields.
 *
 * The model-router (`lib/agents/model-router.ts`) soft-imports this file
 * and calls `getAgentModelOverride(slug)`. That contract is honoured here:
 * each cast member's `preferredModel` becomes the override.
 *
 * JSON imports work natively under Next.js 15 + tsconfig
 * `resolveJsonModule: true`. No build-time glue required.
 */

import "server-only";

import auraJson from "data/agents/aura.json";
import cocoJson from "data/agents/coco.json";
import marcelJson from "data/agents/marcel.json";
import scribeJson from "data/agents/scribe.json";
import pennyJson from "data/agents/penny.json";

import type { ModelChoice, ModelProvider } from "./model-router";

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

/** The kingdom-palette this agent draws from. See `synthesis/17-the-28-gene-alphabet.md`. */
export type CastKingdom =
  | "choreographic"
  | "curvilinear"
  | "biomech"
  | "techno"
  | "assemblage"
  | "artistic"
  | "architectural"
  | "ritual";

/** Shape mirrors `data/agents/*.json` exactly. Any drift between this
 *  interface and the JSON files is a bug. */
export type CastMember = {
  /** URL slug. Matches the filename: `data/agents/<slug>.json`. */
  slug: string;
  /** Display name, e.g. "Aura", "The Scribe". */
  displayName: string;
  /** Kingdom-palette this character inhabits. */
  kingdom: CastKingdom;
  /** Short label for the voice register, e.g. "princess-warm-with-teeth". */
  voiceRegister: string;
  /** One-line bio for cast cards and meta tags. */
  oneLineBio: string;
  /** Multi-paragraph character description, voice-correct. */
  longBio: string;
  /** Preferred model — the router uses this verbatim as the override. */
  preferredModel: {
    provider: ModelProvider;
    model: string;
  };
  /** Full system prompt template, ready for the chat route to inject. */
  systemPrompt: string;
  /** Phrases and registers this agent must never produce. */
  doNotSay: string[];
  /** Topics this agent leans into. */
  speaksAbout: string[];
  /** Topics this agent must hand off or decline. */
  doesNotSpeakAbout: string[];
  /** Path to the avatar VRM under `/public`. */
  vrmFile: string;
  /** Soft kill-switch — `false` removes the agent from the visible cast. */
  active: boolean;
};

// ---------------------------------------------------------------------
// JSON → typed cast
// ---------------------------------------------------------------------

// The `as CastMember` casts are load-bearing only insofar as the JSON
// files are hand-curated and the schema is documented above. If you
// change the JSON shape, change `CastMember` in the same commit.

const aura = auraJson as CastMember;
const coco = cocoJson as CastMember;
const marcel = marcelJson as CastMember;
const scribe = scribeJson as CastMember;
const penny = pennyJson as CastMember;

export const cast: ReadonlyArray<CastMember> = [
  aura,
  coco,
  marcel,
  scribe,
  penny,
] as const;

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/** Look up a single cast member by slug. */
export function getCastMember(slug: string): CastMember | undefined {
  return cast.find((c) => c.slug === slug);
}

/** Enumerate every active cast member (the visible cast). */
export function listActiveCast(): ReadonlyArray<CastMember> {
  return cast.filter((c) => c.active);
}

/**
 * Model-router contract. Returns the agent's preferred model as a
 * `ModelChoice` — Aperture-routed by default. The router calls this
 * before it runs its signal-based decision; the override always wins.
 *
 * Returns `null` for unknown slugs (router falls through to signals).
 */
export function getAgentModelOverride(slug: string): ModelChoice | null {
  const member = getCastMember(slug);
  if (!member || !member.active) return null;
  return {
    provider: member.preferredModel.provider,
    model: member.preferredModel.model,
    reason: `cast-override:${member.slug}`,
    via: "aperture",
  };
}

export { aura, coco, marcel, scribe, penny };
