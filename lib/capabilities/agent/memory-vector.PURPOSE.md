# memory-vector.PURPOSE.md

## Role

The durable, semantic sibling of `agent.memory`. Embeds turns once with
Gemini's small text-embedding model and persists them in Firestore;
recall walks the native Firestore vector index (cosine distance) for
the most-relevant K turns to ground the next LLM call.

## Public surface

- `rememberVector(input)` — client stub, throws (work is server-only)
- `recallVector(input)` — client stub, throws
- `rememberVectorServer(input)` — embed + persist
- `recallVectorServer(input)` — embed query + nearest-neighbour search
- Types: `MemoryTurn`, `RememberVectorInput/Result`,
  `RecallVectorInput/Result`, `MemoryVectorError`
- Constants: `DEFAULT_EMBED_MODEL`, `DEFAULT_EMBED_DIMENSIONS`,
  `DEFAULT_RECALL_K`

## Internal

- `getGenai()` — lazy GoogleGenAI client; returns null when API key
  missing, embed() then raises a typed error.
- `embed(text)` — single text → number[] (768 dims).
- `requireDb()` — wraps `getFirebaseAdminDb()` with a typed throw when
  admin isn't configured.

## Depends on

- `lib/firebase/admin.ts` for the Firestore Admin client.
- `lib/state/cast.ts` for the `DialogueTurn` shape.
- `@google/genai` (^2.2.0) for the embedding call.
- `firebase-admin/firestore` `FieldValue.vector()` + `findNearest()`.

## Does not

- **Does not auto-call `rememberVector` on every turn.** That decision
  belongs to the caller (e.g. the Aura history sync, which should
  remember the turn AFTER it lands in Firestore, not before — keep the
  failure modes independent).
- **Does not paginate.** `findNearest` returns at most `limit` results
  in one call; if more are needed, change the strategy (HNSW + filters
  + re-rank) rather than paginating a vector query.
- **Does not own the Firestore vector index.** The operator must run
  the `gcloud firestore indexes composite create` command once per
  project. Without it, recall raises `vector-index-missing` with the
  exact command to run.
- **Does not own a UI surface.** Headless. The launcher decides when
  to call remember + recall.

## Bordering files

- `agent/memory.ts` — the in-memory Jaccard sibling. Surface code can
  switch between them (or combine: recent K from memory.ts + relevant
  K from memory-vector.ts).
- `agent/dialogue.ts` — the consumer. Calls `recallVectorServer(uid,
  query, k)` before building the prompt, prepends formatted turns to
  the LLM context.
- `lib/state/cast.ts` — defines `DialogueTurn`, the shared shape.
- `lib/firebase/admin.ts` — the credential plumbing both this file and
  the rest of the admin-side codebase share.

## Setup

Once per Firebase project:

```sh
gcloud firestore indexes composite create \
  --collection-group=memory --query-scope=COLLECTION \
  --field-config=vector-config='{"dimension":"768","flat":"{}"}',field-path=embedding
```

Env vars (already documented in `.env.example`):

- `GOOGLE_AI_API_KEY` — Gemini key for the embedding call.
- `FIREBASE_ADMIN_SERVICE_ACCOUNT` *or* `GOOGLE_APPLICATION_CREDENTIALS`
  — Firestore Admin credentials.
