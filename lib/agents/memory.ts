"use client";

/**
 * lib/agents/memory.ts — client-side agent memory.
 *
 * Browser-only. Backs the per-agent chat surface (`app/api/agents/[slug]/`)
 * with three persistent stores in a single IndexedDB database:
 *
 *   facts      — keyed by (agentSlug, topic, value). Dedupe-aware:
 *                the same fact re-asserted updates `lastSeenAt` rather
 *                than creating a new row.
 *   messages   — rolling conversation log per agentSlug. Capped at
 *                MAX_MESSAGES (oldest pruned on add).
 *   summaries  — periodic compactions of message history, produced by
 *                `summarise()` so an agent has a short prelude when the
 *                rolling window has rotated past the original turns.
 *
 * The server companion at `lib/agents/memory.server.ts` exposes the
 * same surface backed by Firestore for operator-side persistence.
 * Same names, same shapes — swap the import path at the call site.
 *
 * No `idb-keyval` dep on this project, so we hold a single connection
 * and open it lazily. SSR-safe: every public fn returns an empty /
 * neutral value when `indexedDB` isn't on the global.
 */

const DB_NAME = "holoflow-agent-memory";
const DB_VERSION = 1;

const STORE_FACTS = "facts";
const STORE_MESSAGES = "messages";
const STORE_SUMMARIES = "summaries";

const MAX_MESSAGES = 50;

// ── Types ──────────────────────────────────────────────────────────────

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
  id: string; // `${agentSlug}::${topic}::${valueHash}`
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
  id: string; // monotonic: `${agentSlug}::${createdAt}::${rand}`
  agentSlug: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface SummaryRecord {
  id: string; // `${agentSlug}::${createdAt}`
  agentSlug: string;
  summary: string;
  messageCount: number;
  createdAt: string;
}

// ── DB connection ──────────────────────────────────────────────────────

let _dbPromise: Promise<IDBDatabase> | null = null;

function isClient(): boolean {
  return typeof globalThis !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FACTS)) {
        const s = db.createObjectStore(STORE_FACTS, { keyPath: "id" });
        s.createIndex("agentSlug", "agentSlug", { unique: false });
        s.createIndex("agent_topic", ["agentSlug", "topic"], { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_MESSAGES)) {
        const s = db.createObjectStore(STORE_MESSAGES, { keyPath: "id" });
        s.createIndex("agentSlug", "agentSlug", { unique: false });
        s.createIndex("agent_createdAt", ["agentSlug", "createdAt"], {
          unique: false,
        });
      }
      if (!db.objectStoreNames.contains(STORE_SUMMARIES)) {
        const s = db.createObjectStore(STORE_SUMMARIES, { keyPath: "id" });
        s.createIndex("agentSlug", "agentSlug", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb open failed"));
    req.onblocked = () => reject(new Error("idb open blocked"));
  });
  return _dbPromise;
}

function txStore(
  db: IDBDatabase,
  store: string,
  mode: IDBTransactionMode,
): IDBObjectStore {
  return db.transaction(store, mode).objectStore(store);
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb request failed"));
  });
}

function txToPromise(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("idb tx failed"));
    tx.onabort = () => reject(tx.error ?? new Error("idb tx aborted"));
  });
}

// ── Hashing for fact dedupe ────────────────────────────────────────────

/**
 * Short, stable digest of a string. Not cryptographic — we just want a
 * compact key for the (slug, topic, value) compound. Deterministic so
 * the same value re-asserted lands on the same row.
 */
function hashValue(input: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function factId(agentSlug: string, topic: string, value: string): string {
  return `${agentSlug}::${topic}::${hashValue(value)}`;
}

function newMessageId(agentSlug: string, createdAt: string): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `${agentSlug}::${createdAt}::${rand}`;
}

// ── Facts ──────────────────────────────────────────────────────────────

/**
 * Persist a fact. Same (agentSlug, topic, value) is treated as a
 * re-assertion — confidence is taken as the max of old and new, and
 * `lastSeenAt` is bumped. New rows otherwise.
 */
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

  if (!isClient()) return record;

  const db = await openDb();
  const store = txStore(db, STORE_FACTS, "readwrite");
  const existing = (await reqToPromise(store.get(record.id))) as
    | FactRecord
    | undefined;
  const merged: FactRecord = existing
    ? {
        ...existing,
        confidence: Math.max(existing.confidence, record.confidence),
        source: record.source,
        lastSeenAt: now,
      }
    : record;
  await reqToPromise(store.put(merged));
  await txToPromise(store.transaction);
  return merged;
}

/**
 * Read back facts for an agent, optionally narrowed by topic. Sorted
 * newest-`lastSeenAt`-first so the caller sees the most recently
 * re-asserted variants at the top.
 */
export async function recallFacts(
  query: RecallFactsQuery,
): Promise<FactRecord[]> {
  if (!isClient()) return [];
  const db = await openDb();
  const store = txStore(db, STORE_FACTS, "readonly");

  let rows: FactRecord[];
  if (query.topic !== undefined) {
    const idx = store.index("agent_topic");
    rows = (await reqToPromise(
      idx.getAll([query.agentSlug, query.topic]),
    )) as FactRecord[];
  } else {
    const idx = store.index("agentSlug");
    rows = (await reqToPromise(idx.getAll(query.agentSlug))) as FactRecord[];
  }

  rows.sort((a, b) => (a.lastSeenAt < b.lastSeenAt ? 1 : -1));
  return query.limit !== undefined ? rows.slice(0, query.limit) : rows;
}

// ── Messages ───────────────────────────────────────────────────────────

/**
 * Append a message to the rolling history for `agentSlug`. When the
 * agent's history would exceed MAX_MESSAGES, the oldest rows are
 * pruned in the same transaction.
 */
export async function addMessage(input: MessageInput): Promise<MessageRecord> {
  const createdAt = new Date().toISOString();
  const record: MessageRecord = {
    id: newMessageId(input.agentSlug, createdAt),
    agentSlug: input.agentSlug,
    role: input.role,
    content: input.content,
    createdAt,
  };

  if (!isClient()) return record;

  const db = await openDb();
  const tx = db.transaction(STORE_MESSAGES, "readwrite");
  const store = tx.objectStore(STORE_MESSAGES);
  await reqToPromise(store.put(record));

  // Prune oldest beyond cap. getAllKeys via the (agentSlug, createdAt)
  // composite index returns the keys in ascending order, so the first
  // (total - MAX_MESSAGES) primary keys are the ones to drop.
  const idx = store.index("agent_createdAt");
  const range = IDBKeyRange.bound(
    [input.agentSlug, ""],
    [input.agentSlug, "￿"],
  );
  const allKeys = (await reqToPromise(idx.getAllKeys(range))) as IDBValidKey[];
  if (allKeys.length > MAX_MESSAGES) {
    const drop = allKeys.length - MAX_MESSAGES;
    // We have primary keys via the index's getAllKeys — those are the
    // object-store keys, not the index keys. Delete directly.
    for (let i = 0; i < drop; i++) {
      const k = allKeys[i];
      if (k !== undefined) await reqToPromise(store.delete(k));
    }
  }

  await txToPromise(tx);
  return record;
}

/**
 * Recall the most recent `limit` messages for `agentSlug`, returned in
 * chronological (oldest-first) order so they can be fed straight into a
 * chat-completion call.
 */
export async function recallMessages(args: {
  agentSlug: string;
  limit?: number;
}): Promise<MessageRecord[]> {
  if (!isClient()) return [];
  const limit = args.limit ?? 20;
  const db = await openDb();
  const store = txStore(db, STORE_MESSAGES, "readonly");
  const idx = store.index("agent_createdAt");
  const range = IDBKeyRange.bound(
    [args.agentSlug, ""],
    [args.agentSlug, "￿"],
  );
  const all = (await reqToPromise(idx.getAll(range))) as MessageRecord[];
  // getAll on a composite index returns in index-key order, so already
  // oldest-first. Take the tail.
  return all.slice(-limit);
}

// ── Summaries ──────────────────────────────────────────────────────────

/**
 * Produce a summary of the current rolling history for `agentSlug`,
 * persist it, and prune the oldest half of the message log so the next
 * conversation cycle has room to grow.
 *
 * The summary itself is a flat textual catalogue of role:content lines.
 * Upstream callers that want an LLM-generated paraphrase can pass one
 * in via `opts.summary` — this fn only concerns itself with storage and
 * pruning. Honest stub when no upstream summariser is wired.
 */
export async function summarise(args: {
  agentSlug: string;
  /** Optional caller-supplied summary text. Defaults to a mechanical
   *  concat of the existing messages. */
  summary?: string;
}): Promise<SummaryRecord | null> {
  if (!isClient()) return null;

  const db = await openDb();

  // Read current messages to (a) build a default summary and (b) decide
  // what to prune.
  const readStore = txStore(db, STORE_MESSAGES, "readonly");
  const idx = readStore.index("agent_createdAt");
  const range = IDBKeyRange.bound(
    [args.agentSlug, ""],
    [args.agentSlug, "￿"],
  );
  const msgs = (await reqToPromise(idx.getAll(range))) as MessageRecord[];
  if (msgs.length === 0) return null;

  const summaryText =
    args.summary ??
    msgs
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n")
      .slice(0, 4000);

  const createdAt = new Date().toISOString();
  const record: SummaryRecord = {
    id: `${args.agentSlug}::${createdAt}`,
    agentSlug: args.agentSlug,
    summary: summaryText,
    messageCount: msgs.length,
    createdAt,
  };

  // Write the summary and prune the oldest half of the messages in one
  // multi-store transaction.
  const writeTx = db.transaction(
    [STORE_SUMMARIES, STORE_MESSAGES],
    "readwrite",
  );
  await reqToPromise(writeTx.objectStore(STORE_SUMMARIES).put(record));

  const msgStore = writeTx.objectStore(STORE_MESSAGES);
  const dropCount = Math.floor(msgs.length / 2);
  for (let i = 0; i < dropCount; i++) {
    const m = msgs[i];
    if (m !== undefined) await reqToPromise(msgStore.delete(m.id));
  }
  await txToPromise(writeTx);
  return record;
}

/** Read the most recent summary for an agent, if one exists. */
export async function recallLatestSummary(
  agentSlug: string,
): Promise<SummaryRecord | null> {
  if (!isClient()) return null;
  const db = await openDb();
  const store = txStore(db, STORE_SUMMARIES, "readonly");
  const idx = store.index("agentSlug");
  const rows = (await reqToPromise(
    idx.getAll(agentSlug),
  )) as SummaryRecord[];
  if (rows.length === 0) return null;
  rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return rows[0] ?? null;
}

// ── Maintenance helpers ────────────────────────────────────────────────

/**
 * Wipe every store for one agent. Useful for "clear this agent's
 * memory" buttons. Does not touch other agents.
 */
export async function forgetAgent(agentSlug: string): Promise<void> {
  if (!isClient()) return;
  const db = await openDb();
  const tx = db.transaction(
    [STORE_FACTS, STORE_MESSAGES, STORE_SUMMARIES],
    "readwrite",
  );
  for (const storeName of [STORE_FACTS, STORE_MESSAGES, STORE_SUMMARIES]) {
    const s = tx.objectStore(storeName);
    const idx = s.index("agentSlug");
    const keys = (await reqToPromise(
      idx.getAllKeys(agentSlug),
    )) as IDBValidKey[];
    for (const k of keys) {
      await reqToPromise(s.delete(k));
    }
  }
  await txToPromise(tx);
}

/**
 * Metadata about the IndexedDB layout, so debug surfaces (and the
 * mirror server module) can reference store names without re-typing
 * literals.
 */
export const agentMemoryStores = {
  dbName: DB_NAME,
  facts: STORE_FACTS,
  messages: STORE_MESSAGES,
  summaries: STORE_SUMMARIES,
  maxMessages: MAX_MESSAGES,
} as const;

// ── Utilities ──────────────────────────────────────────────────────────

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
