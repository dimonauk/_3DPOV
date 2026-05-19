import "server-only";

/**
 * lib/agents/memory.server.ts — server-persistent agent memory.
 *
 * Mirror of `lib/agents/memory.ts` (which is IndexedDB-backed and runs
 * in the browser). This module exposes the same callable surface but
 * persists to Firestore via `firebase-admin`, so an operator can keep
 * site-wide agent state — e.g. what Aura "knows" about the studio
 * across visitors and sessions — without depending on a single
 * browser's IndexedDB.
 *
 * Posture:
 *   - When Firebase admin isn't configured, every function returns a
 *     neutral value (no throw). The site still builds and runs; the
 *     agent simply has no server-side recall.
 *   - All writes go under one Firestore root document, keyed by agent:
 *
 *       agentMemory/{agentSlug}/facts/{factId}
 *       agentMemory/{agentSlug}/messages/{messageId}
 *       agentMemory/{agentSlug}/summaries/{summaryId}
 *
 *   - Message cap matches the client (MAX_MESSAGES). On add, we prune
 *     in a batch when the count exceeds the cap.
 *   - Fact dedupe uses the same (slug, topic, value) compound id as
 *     the client, so the two layers stay parallel.
 */

import { createLogger } from "../log";
import { getFirebaseAdminDb } from "../firebase/admin";

const log = createLogger("agents.memory");

const ROOT_COLLECTION = "agentMemory";
const SUB_FACTS = "facts";
const SUB_MESSAGES = "messages";
const SUB_SUMMARIES = "summaries";

const MAX_MESSAGES = 50;

// ── Types (kept in sync with the client) ───────────────────────────────

export type FactSource =
  | "user-said"
  | "agent-inferred"
  | "system"
  | "operator";

export interface FactInput {
  agentSlug: string;
  topic: string;
  value: string;
  confidence?: number;
  source?: FactSource;
}

export interface FactRecord {
  id: string;
  agentSlug: string;
  topic: string;
  value: string;
  confidence: number;
  source: FactSource;
  addedAt: string;
  lastSeenAt: string;
}

export interface RecallFactsQuery {
  agentSlug: string;
  topic?: string;
  limit?: number;
}

export interface MessageInput {
  agentSlug: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export interface MessageRecord {
  id: string;
  agentSlug: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SummaryRecord {
  id: string;
  agentSlug: string;
  summary: string;
  messageCount: number;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────

function hashValue(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function factId(agentSlug: string, topic: string, value: string): string {
  return `${agentSlug}__${encodeFsKey(topic)}__${hashValue(value)}`;
}

/**
 * Firestore document ids cannot contain `/` and must not be empty.
 * Topic strings are operator-friendly (`user.name`, `studio/policy`)
 * so we URL-encode forward slashes and similar.
 */
function encodeFsKey(s: string): string {
  return s.replace(/\//g, "_").replace(/\s+/g, "-").slice(0, 256) || "x";
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function newMessageId(createdAt: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  // ISO timestamp sorts lexicographically — keeps Firestore reads
  // ordered without needing an index.
  return `${createdAt}__${rand}`;
}

// ── Facts ──────────────────────────────────────────────────────────────

export async function rememberFact(input: FactInput): Promise<FactRecord> {
  const now = new Date().toISOString();
  const record: FactRecord = {
    id: factId(input.agentSlug, input.topic, input.value),
    agentSlug: input.agentSlug,
    topic: input.topic,
    value: input.value,
    confidence: clamp01(input.confidence ?? 0.7),
    source: input.source ?? "user-said",
    addedAt: now,
    lastSeenAt: now,
  };

  const db = getFirebaseAdminDb();
  if (!db) {
    log.debug("rememberFact: no firebase admin; no-op", {
      agentSlug: input.agentSlug,
      topic: input.topic,
    });
    return record;
  }

  const ref = db
    .collection(ROOT_COLLECTION)
    .doc(input.agentSlug)
    .collection(SUB_FACTS)
    .doc(record.id);

  const snap = await ref.get();
  if (snap.exists) {
    const prev = snap.data() as FactRecord | undefined;
    const merged: FactRecord = {
      ...record,
      addedAt: prev?.addedAt ?? record.addedAt,
      confidence: Math.max(prev?.confidence ?? 0, record.confidence),
      lastSeenAt: now,
    };
    await ref.set(merged, { merge: true });
    return merged;
  }
  await ref.set(record);
  return record;
}

export async function recallFacts(
  query: RecallFactsQuery,
): Promise<FactRecord[]> {
  const db = getFirebaseAdminDb();
  if (!db) return [];

  let q: FirebaseFirestore.Query = db
    .collection(ROOT_COLLECTION)
    .doc(query.agentSlug)
    .collection(SUB_FACTS);

  if (query.topic !== undefined) {
    q = q.where("topic", "==", query.topic);
  }
  q = q.orderBy("lastSeenAt", "desc");
  if (query.limit !== undefined) q = q.limit(query.limit);

  const snap = await q.get();
  return snap.docs.map((d) => d.data() as FactRecord);
}

// ── Messages ───────────────────────────────────────────────────────────

export async function addMessage(input: MessageInput): Promise<MessageRecord> {
  const createdAt = new Date().toISOString();
  const record: MessageRecord = {
    id: newMessageId(createdAt),
    agentSlug: input.agentSlug,
    role: input.role,
    content: input.content,
    createdAt,
  };

  const db = getFirebaseAdminDb();
  if (!db) {
    log.debug("addMessage: no firebase admin; no-op", {
      agentSlug: input.agentSlug,
    });
    return record;
  }

  const col = db
    .collection(ROOT_COLLECTION)
    .doc(input.agentSlug)
    .collection(SUB_MESSAGES);
  await col.doc(record.id).set(record);

  // Prune oldest if over cap. Cheap on small N; if message volume
  // grows we'd switch to a periodic compaction worker.
  const all = await col.orderBy("createdAt", "asc").get();
  if (all.size > MAX_MESSAGES) {
    const drop = all.size - MAX_MESSAGES;
    const batch = db.batch();
    for (let i = 0; i < drop; i++) {
      const doc = all.docs[i];
      if (doc) batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return record;
}

export async function recallMessages(args: {
  agentSlug: string;
  limit?: number;
}): Promise<MessageRecord[]> {
  const db = getFirebaseAdminDb();
  if (!db) return [];
  const limit = args.limit ?? 20;
  const snap = await db
    .collection(ROOT_COLLECTION)
    .doc(args.agentSlug)
    .collection(SUB_MESSAGES)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  // We pulled newest-first to honour `limit`; flip back to chronological.
  return snap.docs
    .map((d) => d.data() as MessageRecord)
    .reverse();
}

// ── Summaries ──────────────────────────────────────────────────────────

export async function summarise(args: {
  agentSlug: string;
  summary?: string;
}): Promise<SummaryRecord | null> {
  const db = getFirebaseAdminDb();
  if (!db) {
    log.debug("summarise: no firebase admin; no-op", {
      agentSlug: args.agentSlug,
    });
    return null;
  }

  const msgCol = db
    .collection(ROOT_COLLECTION)
    .doc(args.agentSlug)
    .collection(SUB_MESSAGES);
  const msgsSnap = await msgCol.orderBy("createdAt", "asc").get();
  if (msgsSnap.empty) return null;
  const msgs = msgsSnap.docs.map((d) => d.data() as MessageRecord);

  const summaryText =
    args.summary ??
    msgs
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 4000);

  const createdAt = new Date().toISOString();
  const record: SummaryRecord = {
    id: createdAt,
    agentSlug: args.agentSlug,
    summary: summaryText,
    messageCount: msgs.length,
    createdAt,
  };

  const sumRef = db
    .collection(ROOT_COLLECTION)
    .doc(args.agentSlug)
    .collection(SUB_SUMMARIES)
    .doc(record.id);
  await sumRef.set(record);

  // Prune the oldest half of the message log.
  const dropCount = Math.floor(msgs.length / 2);
  if (dropCount > 0) {
    const batch = db.batch();
    for (let i = 0; i < dropCount; i++) {
      const doc = msgsSnap.docs[i];
      if (doc) batch.delete(doc.ref);
    }
    await batch.commit();
  }
  return record;
}

export async function recallLatestSummary(
  agentSlug: string,
): Promise<SummaryRecord | null> {
  const db = getFirebaseAdminDb();
  if (!db) return null;
  const snap = await db
    .collection(ROOT_COLLECTION)
    .doc(agentSlug)
    .collection(SUB_SUMMARIES)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const first = snap.docs[0];
  return first ? (first.data() as SummaryRecord) : null;
}

// ── Maintenance ────────────────────────────────────────────────────────

export async function forgetAgent(agentSlug: string): Promise<void> {
  const db = getFirebaseAdminDb();
  if (!db) return;
  const root = db.collection(ROOT_COLLECTION).doc(agentSlug);
  for (const sub of [SUB_FACTS, SUB_MESSAGES, SUB_SUMMARIES]) {
    const all = await root.collection(sub).get();
    if (all.empty) continue;
    const batch = db.batch();
    for (const d of all.docs) batch.delete(d.ref);
    await batch.commit();
  }
  log.info("forgetAgent: wiped", { agentSlug });
}

export const agentMemoryStores = {
  rootCollection: ROOT_COLLECTION,
  facts: SUB_FACTS,
  messages: SUB_MESSAGES,
  summaries: SUB_SUMMARIES,
  maxMessages: MAX_MESSAGES,
} as const;
