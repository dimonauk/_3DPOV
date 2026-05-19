import "server-only";

/**
 * lib/agents/research/store.server.ts — Firestore-backed CRUD for the
 * specialist research log.
 *
 * One-line role: read-and-write surface for `ResearchEntry`. Sits one
 * layer above `lib/firebase/admin.ts` and one layer above
 * `lib/agents/memory.server.ts` in posture: when admin isn't
 * configured, every call returns a neutral value (no throw) and logs
 * a single warn — the site still builds, the specialist simply has no
 * server-side memory of what they've read.
 *
 * Firestore layout:
 *
 *     agentResearch/{agentSlug}/entries/{id}
 *
 * One subcollection per specialist keeps reads cheap (no cross-agent
 * predicate) and dedupes the per-specialist topic-histogram query.
 *
 * Composite indexes — needs operator action, NOT edited from here:
 *   - (topic ASC, collectedAt DESC) — for topic-narrow + chronological
 *   - (tags array-contains, importance DESC) — for tag-narrow + ranked
 *
 * Add these to `firestore.indexes.json` by hand; the indexer route's
 * response flags this so the operator knows when a re-deploy is due.
 *
 * Idempotent writes: `recordResearch` dedupes by (agentSlug, source).
 * The indexer relies on this — re-running it bumps `lastConsultedAt`
 * on every entry without producing duplicates.
 */

import { createLogger } from "../../log";
import { getFirebaseAdminDb } from "../../firebase/admin";
import type {
  ResearchEntry,
  ResearchQuery,
  SpecialistKnowledgeSummary,
} from "./types";

const log = createLogger("agents.research");

const ROOT_COLLECTION = "agentResearch";
const SUB_ENTRIES = "entries";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 500;

// ── Helpers ────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Hash a string to a short, stable, base-36 token. Same algorithm as
 * memory.server.ts so the two layers feel parallel. Used to build the
 * dedupe doc-id from (agentSlug, source).
 */
function hashString(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * Deterministic doc id for an (agentSlug, source) pair. Used by the
 * indexer for idempotent writes: re-indexing the same source for the
 * same specialist overwrites the existing entry instead of
 * duplicating. The shape includes a `src-` prefix so we can tell at
 * a glance which entries came from the indexer vs. chat-driven
 * (which use raw UUIDs).
 */
export function deterministicEntryId(agentSlug: string, source: string): string {
  return `src-${hashString(`${agentSlug}::${source}`)}`;
}

function normaliseTags(tags: readonly string[] | undefined): string[] {
  if (!tags || tags.length === 0) return [];
  // Lowercase + de-dupe + cap at 32. Tag explosion is a real risk
  // when frontmatter is mass-edited; the cap protects the index size.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.trim().toLowerCase();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 32) break;
  }
  return out;
}

// ── recordResearch ─────────────────────────────────────────────────────

/**
 * Record a new piece of research for a specialist. Idempotent in
 * (agentSlug, source) — re-recording the same source overwrites the
 * existing entry (and bumps `lastConsultedAt`) instead of producing a
 * duplicate. The original `collectedAt` is preserved.
 */
export async function recordResearch(
  entry: Omit<ResearchEntry, "id" | "collectedAt" | "lastConsultedAt">,
): Promise<ResearchEntry> {
  const now = nowIso();
  const id = deterministicEntryId(entry.agentSlug, entry.source);
  const record: ResearchEntry = {
    id,
    agentSlug: entry.agentSlug,
    title: entry.title,
    source: entry.source,
    topic: entry.topic,
    summary: entry.summary,
    ...(entry.content !== undefined ? { content: entry.content } : {}),
    tags: normaliseTags(entry.tags),
    importance: clamp01(entry.importance),
    citations: entry.citations ?? [],
    collectedAt: now,
    lastConsultedAt: null,
  };

  const db = getFirebaseAdminDb();
  if (!db) {
    log.warn("recordResearch: no firebase admin; no-op", {
      agentSlug: entry.agentSlug,
      source: entry.source,
    });
    return record;
  }

  const ref = db
    .collection(ROOT_COLLECTION)
    .doc(entry.agentSlug)
    .collection(SUB_ENTRIES)
    .doc(id);

  const snap = await ref.get();
  if (snap.exists) {
    const prev = snap.data() as ResearchEntry | undefined;
    const merged: ResearchEntry = {
      ...record,
      // Preserve original collectedAt — the entry hasn't been
      // "re-collected", it's been re-consulted.
      collectedAt: prev?.collectedAt ?? record.collectedAt,
      lastConsultedAt: now,
    };
    await ref.set(merged, { merge: true });
    return merged;
  }
  await ref.set(record);
  return record;
}

// ── queryResearch ──────────────────────────────────────────────────────

/**
 * Query research entries. When `agentSlug` is provided we read from
 * that specialist's subcollection only; when omitted we use a
 * collectionGroup over every specialist's entries.
 *
 * Firestore narrows we can push down (cheap): `agentSlug` subcoll,
 * `topic` equality, `collectedAt` >= cutoff. Tag AND-match and free
 * substring match are done in-memory on the narrowed snapshot —
 * Firestore can't AND-array-contains and free text is out of scope
 * for the admin SDK without a search add-on.
 */
export async function queryResearch(
  query: ResearchQuery,
): Promise<ResearchEntry[]> {
  const db = getFirebaseAdminDb();
  if (!db) return [];

  const limit = Math.min(
    Math.max(1, query.limit ?? DEFAULT_LIMIT),
    MAX_LIMIT,
  );

  let q: FirebaseFirestore.Query = query.agentSlug
    ? db
        .collection(ROOT_COLLECTION)
        .doc(query.agentSlug)
        .collection(SUB_ENTRIES)
    : db.collectionGroup(SUB_ENTRIES);

  if (query.topic !== undefined) {
    q = q.where("topic", "==", query.topic);
  }
  if (typeof query.sinceDays === "number" && query.sinceDays > 0) {
    const cutoff = new Date(
      Date.now() - query.sinceDays * 86_400_000,
    ).toISOString();
    q = q.where("collectedAt", ">=", cutoff);
  }
  q = q.orderBy("collectedAt", "desc");
  // Over-fetch when we'll filter in-memory; the limit is still a
  // cap on what we return but Firestore's `.limit` is the only
  // server-side reduction we get.
  q = q.limit(
    query.tags?.length || query.textMatch ? Math.min(limit * 4, MAX_LIMIT) : limit,
  );

  const snap = await q.get();
  let rows = snap.docs.map((d) => d.data() as ResearchEntry);

  if (query.tags && query.tags.length > 0) {
    const wanted = query.tags.map((t) => t.toLowerCase());
    rows = rows.filter((r) => {
      const have = new Set(r.tags.map((t) => t.toLowerCase()));
      return wanted.every((w) => have.has(w));
    });
  }

  if (query.textMatch) {
    const needle = query.textMatch.toLowerCase();
    rows = rows.filter((r) => {
      if (r.title.toLowerCase().includes(needle)) return true;
      if (r.summary.toLowerCase().includes(needle)) return true;
      if (r.content && r.content.toLowerCase().includes(needle)) return true;
      return false;
    });
  }

  return rows.slice(0, limit);
}

// ── consultResearch ────────────────────────────────────────────────────

/**
 * Read a single entry by id and stamp `lastConsultedAt` with now.
 * Used by chat surfaces (the specialist reaches for a known doc) and
 * by the operator surface's expand-row action.
 *
 * Returns `null` when admin isn't configured, when the entry doesn't
 * exist, or when the id format is malformed. The two-step lookup
 * (collectionGroup → known parent → doc.get) keeps the API
 * id-only without leaking the agentSlug requirement to callers.
 */
export async function consultResearch(id: string): Promise<ResearchEntry | null> {
  const db = getFirebaseAdminDb();
  if (!db) return null;

  // collectionGroup query by `id` field — the doc id is stored as
  // `id` inside the doc too (recordResearch writes both), so the
  // narrow is cheap.
  const snap = await db
    .collectionGroup(SUB_ENTRIES)
    .where("id", "==", id)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const first = snap.docs[0];
  if (!first) return null;

  const now = nowIso();
  await first.ref.set({ lastConsultedAt: now }, { merge: true });
  return { ...(first.data() as ResearchEntry), lastConsultedAt: now };
}

// ── forgetResearch ─────────────────────────────────────────────────────

/**
 * Delete one or more entries for a specialist. Returns the number of
 * entries actually deleted (matches existed and were removed).
 *
 * Scoped to a single specialist so the operator can prune Aura's
 * obsolete patreon-research without touching Marcel's. Cross-
 * specialist wipes go through repeated calls — no batch op.
 */
export async function forgetResearch(
  agentSlug: string,
  ids: string[],
): Promise<number> {
  const db = getFirebaseAdminDb();
  if (!db) {
    log.warn("forgetResearch: no firebase admin; no-op", { agentSlug });
    return 0;
  }
  if (ids.length === 0) return 0;

  const col = db
    .collection(ROOT_COLLECTION)
    .doc(agentSlug)
    .collection(SUB_ENTRIES);

  // Resolve each id to a ref + presence check, then batch-delete.
  let deleted = 0;
  const batch = db.batch();
  for (const id of ids) {
    const ref = col.doc(id);
    const snap = await ref.get();
    if (!snap.exists) continue;
    batch.delete(ref);
    deleted += 1;
  }
  if (deleted > 0) await batch.commit();
  log.info("forgetResearch", { agentSlug, requested: ids.length, deleted });
  return deleted;
}

// ── listSpecialistKnowledge ────────────────────────────────────────────

/**
 * One read for the operator surface's per-specialist tab:
 *   - topic histogram (topic → count)
 *   - up to 20 most-recent entries
 *   - total entry count
 *
 * The histogram is computed in-memory because Firestore can't GROUP
 * BY at admin-SDK level; for the entry counts we're looking at
 * (tens to low hundreds per specialist) the linear pass is fine.
 */
export async function listSpecialistKnowledge(
  agentSlug: string,
): Promise<SpecialistKnowledgeSummary> {
  const db = getFirebaseAdminDb();
  if (!db) {
    return { topics: {}, recentEntries: [], totalCount: 0 };
  }

  const col = db
    .collection(ROOT_COLLECTION)
    .doc(agentSlug)
    .collection(SUB_ENTRIES);

  // Pull everything for the topic histogram + total count. If a
  // specialist accumulates thousands of entries this becomes a
  // periodic compaction concern — for now it's bounded by the
  // indexer's universe (tens of docs).
  const allSnap = await col.orderBy("collectedAt", "desc").get();
  const all = allSnap.docs.map((d) => d.data() as ResearchEntry);

  const topics: Record<string, number> = {};
  for (const e of all) {
    topics[e.topic] = (topics[e.topic] ?? 0) + 1;
  }

  return {
    topics,
    recentEntries: all.slice(0, 20),
    totalCount: all.length,
  };
}

// ── Maintenance / introspection ────────────────────────────────────────

export const agentResearchStore = {
  rootCollection: ROOT_COLLECTION,
  subEntries: SUB_ENTRIES,
  defaultLimit: DEFAULT_LIMIT,
  maxLimit: MAX_LIMIT,
} as const;
