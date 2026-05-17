/**
 * lib/capabilities/agent/memory-vector.ts — Capability
 * `agent.memory-vector`: Firestore-backed vector memory for the Aura
 * cast.
 *
 * One-line role: persistent semantic memory keyed by Firebase uid;
 * recall the most-relevant prior turns for grounding the next LLM call.
 *
 * Full purpose in memory-vector.PURPOSE.md.
 *
 * # Companion to agent.memory
 * `agent.memory` is in-memory, per-session, scored by Jaccard token
 * overlap — fast, no infra, but evaporates the moment the tab closes.
 * `agent.memory-vector` is the durable sibling: each remembered turn
 * is embedded once with a small Gemini embedding model and written to
 * Firestore. Recall uses Firestore's native `findNearest` vector query
 * (cosine distance) against the query's embedding.
 *
 * # Why Firestore and not a dedicated vector DB
 * The site already uses Firestore for auth + cards + user history.
 * Adding a second store doubles the operator surface and the egress
 * cost for the same query shape — vector + small text + uid filter.
 * Firestore's vector field hits its sweet spot at < 100k vectors per
 * uid, which is roughly four years of daily Aura conversations.
 *
 * # Setup requirement
 * Firestore requires a composite vector index per collection-group
 * before `findNearest` returns results. Run once per project:
 *
 *   gcloud firestore indexes composite create \
 *     --collection-group=memory --query-scope=COLLECTION \
 *     --field-config=vector-config='{"dimension":"768","flat":"{}"}',field-path=embedding
 *
 * The dimension MUST match the embedding model dimensions
 * (text-embedding-004 = 768). When swapping models, drop the old
 * collection and re-embed.
 */

import type { DialogueTurn } from "lib/state/cast";

/** Memory record as stored in Firestore. Embedding omitted from the recall result. */
export type MemoryTurn = DialogueTurn & {
  /** Auto-generated Firestore doc id, returned by recall calls. */
  id: string;
};

export type RememberVectorInput = {
  /** Firebase uid the memory belongs to. */
  uid: string;
  /** The turn to embed and persist. */
  turn: DialogueTurn;
};

export type RememberVectorResult = {
  /** Firestore doc id of the freshly-written memory. */
  id: string;
};

export type RecallVectorInput = {
  /** Firebase uid whose memories to search. */
  uid: string;
  /** Query text — will be embedded and matched against stored embeddings. */
  query: string;
  /** Maximum turns to return. Default 6. */
  k?: number;
  /** Restrict to a single speaker side (user vs agent). */
  speakerFilter?: "user" | "agent" | "all";
};

export type RecallVectorResult = {
  /** Ordered most-similar-first. */
  turns: MemoryTurn[];
  /** Whether the service is configured + reachable. */
  provider: "firestore-vector";
};

export type MemoryVectorError = {
  code:
    | "admin-not-configured"
    | "embedding-failed"
    | "firestore-write-failed"
    | "firestore-query-failed"
    | "vector-index-missing";
  message: string;
};

/**
 * Client-side stub. Vector memory requires Firestore Admin + a Gemini
 * embedding call, both of which are server-only. Import the server
 * module from a route handler or server component.
 */
export async function rememberVector(
  _input: RememberVectorInput,
): Promise<RememberVectorResult> {
  const detail: MemoryVectorError = {
    code: "admin-not-configured",
    message:
      "agent.memory-vector: call rememberVectorServer from a server context — the client stub does not embed",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/** Client-side stub. See `rememberVector`. */
export async function recallVector(
  _input: RecallVectorInput,
): Promise<RecallVectorResult> {
  const detail: MemoryVectorError = {
    code: "admin-not-configured",
    message:
      "agent.memory-vector: call recallVectorServer from a server context",
  };
  throw Object.assign(new Error(detail.message), detail);
}

/** Default embedding model — Gemini's small text embedding (768 dims). */
export const DEFAULT_EMBED_MODEL = "text-embedding-004" as const;
export const DEFAULT_EMBED_DIMENSIONS = 768 as const;

/** Default recall depth — small enough to keep prompt budget tight. */
export const DEFAULT_RECALL_K = 6 as const;
