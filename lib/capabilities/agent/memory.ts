/**
 * lib/capabilities/agent/memory.ts — Capability `agent.memory`: simple history retrieval per cast member.
 *
 * One-line role: pull the K most-recent / most-relevant turns from a cast member's history for grounding the next LLM call.
 * Full purpose in memory.PURPOSE.md.
 *
 * v0.1 is keyword-overlap scoring on raw text (no embeddings). v0.2 adds
 * embedding-based retrieval behind the same `recallRelevant()` surface.
 */

import { castStore, type DialogueTurn, type CastMemberId } from "lib/state/cast";

export type RecallOptions = {
  /** How many turns to return. Default 6. */
  k?: number;
  /** Restrict to turns where the speaker matches. */
  speakerFilter?: "user" | "agent" | "all";
};

/** Most-recent K turns from the speaker's history. */
export function recallRecent(
  speakerId: CastMemberId,
  options: RecallOptions = {},
): DialogueTurn[] {
  const k = options.k ?? 6;
  const filter = options.speakerFilter ?? "all";
  const history = castStore.getState().history[speakerId] ?? [];
  const filtered =
    filter === "all"
      ? history
      : history.filter((t) =>
          filter === "user" ? t.speaker === "user" : t.speaker !== "user",
        );
  return filtered.slice(-k);
}

/** Tokenise text into lower-case word stems for cheap overlap scoring. */
function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

/** Jaccard similarity over tokenised text. */
function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

/**
 * Most-relevant K turns from the speaker's history given a query.
 * v0.1: Jaccard similarity over tokenised text. Returns turns ordered
 * by score (highest first). Falls back to recent if all scores are 0.
 */
export function recallRelevant(
  speakerId: CastMemberId,
  query: string,
  options: RecallOptions = {},
): DialogueTurn[] {
  const k = options.k ?? 6;
  const history = castStore.getState().history[speakerId] ?? [];
  if (history.length === 0) return [];

  const queryTokens = tokenise(query);
  const scored = history.map((turn) => ({
    turn,
    score: jaccard(queryTokens, tokenise(turn.text)),
  }));

  const anyMatch = scored.some((s) => s.score > 0);
  if (!anyMatch) return recallRecent(speakerId, options);

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.turn);
}

/**
 * Convenience: format recalled turns into a string the dialogue layer
 * can paste into the LLM prompt.
 */
export function formatForPrompt(turns: DialogueTurn[]): string {
  if (turns.length === 0) return "(no prior history)";
  return turns
    .map((t) => {
      const who = t.speaker === "user" ? "USER" : "AGENT";
      return `${who} (${t.at}): ${t.text}`;
    })
    .join("\n");
}
