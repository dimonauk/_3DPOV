import "server-only";

/**
 * lib/agents/research/types.ts — Persistent research log types.
 *
 * One-line role: the typed shape of `ResearchEntry` and `ResearchQuery`
 * shared by the Firestore-backed store, the one-shot internal-docs
 * indexer, the admin route and the operator surface.
 *
 * Research is the next layer up from facts/messages/summaries in
 * `lib/agents/memory.server.ts`. Where memory is dialogue-shaped
 * (per-turn, recent, ephemeral by design), research is library-shaped:
 * what a specialist has read, decided, learned, with timestamps and
 * citations, queryable by topic/tag, accumulated over months. A
 * specialist consults their research; they live in their memory.
 *
 * Schema is intentionally flat — Firestore documents land 1:1 onto
 * these fields. No nested arrays-of-objects, no Map types, so the
 * admin SDK serialises without a custom converter.
 */

/** Source-of-truth tag for a single piece of research. */
export type ResearchEntry = {
  /** Stable id — UUID v4. Used as the Firestore doc id. */
  id: string;
  /** Owner specialist's slug — e.g. "aura", "marcel". One entry =
   *  one specialist's view of the source; the same .md indexed for
   *  Aura and the Scribe produces two entries with the same `source`. */
  agentSlug: string;
  /** Short title — what was researched. Pulled from frontmatter, the
   *  first heading or the filename when nothing better exists. */
  title: string;
  /** Provenance — a URL, an absolute file path, or one of:
   *    - `internal:<absolute-path>` — file on disk in this repo
   *    - `internal:synthesis/<filename>` — synthesis doc
   *    - `external:web` — looked up from the public web
   *    - `external:chat` — derived from a chat the specialist had
   *  The indexer uses the `internal:` form so re-runs dedupe cleanly. */
  source: string;
  /** Canonical topic tag — kebab-case. Examples: "patreon-integration",
   *  "holoflow-voice", "splat-licence", "ar-cards". One topic per
   *  entry; many entries can share a topic. The histogram on the
   *  operator surface counts entries per topic. */
  topic: string;
  /** 1-3 sentence summary in the specialist's voice. Aura's summaries
   *  read princess-warm-with-teeth; Marcel's read engineering-runbook.
   *  The indexer falls back to the source doc's first paragraph when
   *  it can't synthesise in-voice. */
  summary: string;
  /** Full extracted text — optional. Heavy entries (synthesis docs,
   *  whole articles) carry the source body here so a specialist can
   *  later re-read without another file-system hop. Skip-and-lazy-
   *  load by reading the doc by `id` then conditionally pulling
   *  `content` via `consultResearch`. */
  content?: string;
  /** Free-form secondary tags. AND-matched in `queryResearch`. The
   *  indexer pulls from frontmatter `tags`, the doc's heading text,
   *  and a small keyword vocabulary. */
  tags: string[];
  /** 0..1 — used to break ties on retrieval. Heuristic baseline:
   *    - 0.8 for synthesis docs (fact-anchored canon)
   *    - 0.6 for runbooks / capability docs / architecture docs
   *    - 0.4 for articles, journal, tutorials (slower-changing, lower
   *      operational weight) */
  importance: number;
  /** URLs or file paths referenced inside the source. Optional —
   *  empty array is fine. The indexer leaves this empty; the
   *  specialist fills it during a chat. */
  citations: string[];
  /** When the research was first recorded. ISO-8601. */
  collectedAt: string;
  /** When the entry was last consulted. Null until first read. Bumped
   *  by `consultResearch`. Used by the operator surface to surface
   *  "active" research vs. dormant. */
  lastConsultedAt: string | null;
};

/** Query shape for `queryResearch`. Every field is optional; omitting
 *  all of them returns the most recent entries across the cast. */
export type ResearchQuery = {
  /** Omit for cross-specialist search. */
  agentSlug?: string;
  /** Exact-match on the canonical topic tag. */
  topic?: string;
  /** AND-match — every tag must appear in the entry's `tags`. */
  tags?: string[];
  /** Substring of title / summary / content (case-insensitive). The
   *  store does this in-memory after the Firestore narrow so we don't
   *  need a full-text index. */
  textMatch?: string;
  /** Cap on result count. Default 50. Max 500. */
  limit?: number;
  /** Only return entries collected in the last N days. */
  sinceDays?: number;
};

/** Summary shape returned by `listSpecialistKnowledge` — used by the
 *  operator surface's per-specialist tab. */
export type SpecialistKnowledgeSummary = {
  /** Topic → count of entries on that topic for this specialist. */
  topics: Record<string, number>;
  /** Up to 20 most-recent entries, ordered newest-first. */
  recentEntries: ResearchEntry[];
  /** Total entry count across all topics for this specialist. */
  totalCount: number;
};
