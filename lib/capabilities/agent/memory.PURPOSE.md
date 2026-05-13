# `memory.ts` — purpose twin (capability `agent.memory`)

## Role

The retrieval layer over `cast.history`. The dialogue capability
calls into this to ground the next LLM turn with relevant prior
context — not the raw entire history, but K turns that matter.

v0.1 is intentionally simple: Jaccard similarity over tokenised
text, fall-back to most-recent when there's no overlap. v0.2 lands
embedding-based retrieval (likely Gemini's `text-embedding-004`)
behind the same `recallRelevant()` surface — the dialogue
capability never changes.

## Public surface

- `recallRecent(speakerId, options?)` — most-recent K turns.
- `recallRelevant(speakerId, query, options?)` — most-relevant K
  by overlap score; falls back to recent if no overlap.
- `formatForPrompt(turns)` — render to a prompt-ready string.
- Types: `RecallOptions`.

## Internal

- `tokenise(text)` — lowercase, strip punctuation, drop short
  tokens (≤2 chars). Returns a `Set<string>`.
- `jaccard(a, b)` — intersection / union over token sets.

## Depends on

- `lib/state/cast` — reads `history`. Writes nothing.

## Does not

- **Does not embed.** v0.1 is keyword-overlap. Embedding retrieval
  is v0.2; same public surface, different internals.
- **Does not write to the slice.** Pure retrieval. Conversation
  history is owned by `agent.dialogue` (which appends turns).
- **Does not cross cast members.** Each speaker's history is its
  own corpus. Cross-cast memory (e.g., Aura knows what Penny
  said earlier) would need a different slice key.
- **Does not implement summarisation.** Long histories get
  truncated by `recallRelevant`'s K. Real summarisation (LLM
  compressing the prior 50 turns into a few sentences) is
  future work.
- **Does not handle persistence.** History lives in zustand,
  which is in-memory and dies on page reload. Persisting to
  Firestore / SQLite is a future wrapping concern.

## Plug surface

- **State plugs (read):** `cast.history`.
- **Type plugs:** input `(CastMemberId, query?, options?)`,
  output `DialogueTurn[]` or formatted string.
- **Dependency plugs:** none.

## Bordering files

- `lib/state/cast.ts` — source slice.
- `lib/capabilities/agent/dialogue.ts` — primary consumer. The
  dialogue layer can already work with raw history (v0.1
  fetches it directly); this capability is an enrichment.
  Dialogue will switch to `recallRelevant()` when retrieval
  starts mattering (after ~20 turns).
- Future `lib/capabilities/agent/embed.ts` — embedding provider
  for v0.2.

## Why this is its own capability

It could be a private helper inside `dialogue.ts`. It isn't,
because retrieval is genuinely independent of LLM call routing —
a future "recall turns from when Aura was in AMBER mode" feature
sits on top of memory without touching dialogue. Separable
because the rest of the substrate is separable; the cost of one
extra file is paid back the moment a second consumer arrives.
