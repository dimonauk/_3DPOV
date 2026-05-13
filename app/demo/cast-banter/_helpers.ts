/**
 * app/demo/cast-banter/_helpers.ts — Pure helpers for the cast-banter demo client.
 *
 * # Purpose
 * Split off the deterministic logic (mode lookup, fallback synthesis,
 * constants) from the client component so the React file stays under
 * the 300-line cap. Leading-underscore filename signals "private to
 * this route" — nothing outside `/demo/cast-banter` should import it.
 *
 * # Why this shape
 * Headless TypeScript — no React, no JSX — keeps the testable bits
 * trivially testable and keeps the client's render tree readable.
 */

import type {
  BanterContext,
  BanterTurn,
} from "lib/capabilities/agent/banter";
import { bibles, type CastMemberId, type CharacterBible } from "lib/cast";
import type { ChronoModeSlug } from "lib/chrono-protocol";

export type FallbackTurn = BanterTurn & { source: "fallback" };
export type TranscriptTurn = BanterTurn | FallbackTurn;

export const CAST_ORDER: CastMemberId[] = [
  "aura",
  "marcel",
  "betsy",
  "trixie",
  "penny",
];

export const MODE_HEX: Record<ChronoModeSlug, string> = {
  amber: "#ffcc00",
  azure: "#0099ff",
  amethyst: "#9900ff",
  crimson: "#ff3344",
  veridian: "#00cc66",
};

export function modeForSpeaker(id: CastMemberId): ChronoModeSlug {
  const slug = bibles[id].defaultMode;
  return (slug in MODE_HEX ? slug : "azure") as ChronoModeSlug;
}

function pickCatchphrase(b: CharacterBible, seed: number): string {
  const phrases = b.catchphrases;
  if (phrases.length === 0) return "...";
  return phrases[seed % phrases.length] ?? phrases[0] ?? "...";
}

function emotionFor(
  mode: ChronoModeSlug,
  t: BanterContext["telemetry"],
): BanterTurn["emotion"] {
  if ((t.health ?? 100) < 25) return "fear";
  if ((t.speed ?? 0) > 1.5) return "excited";
  if (mode === "crimson") return "angry";
  if (mode === "amethyst" || mode === "amber") return "excited";
  return "neutral";
}

export function buildFallback(context: BanterContext): FallbackTurn[] {
  const ids = context.activeSpeakers.filter(
    (id): id is CastMemberId => id in bibles,
  );
  if (ids.length === 0) return [];
  const order = ids.length >= 3 ? ids.slice(0, 3) : ids;
  const seedBase = (context.lastEvent ?? "").length + ids.length;
  const out: FallbackTurn[] = [];
  order.forEach((speaker, i) => {
    const bible = bibles[speaker];
    const mode = modeForSpeaker(speaker);
    out.push({
      speaker,
      emotion: emotionFor(mode, context.telemetry),
      text: pickCatchphrase(bible, seedBase + i),
      source: "fallback",
    });
  });
  return out;
}
