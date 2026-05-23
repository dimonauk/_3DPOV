# `glitch.ts` — purpose twin

## Role

The shared state-bus for the site's glitch event language. Every
meaningful thing that happens on the Hangar fires a token. Tokens
compound into chains (genre-scoped, decay over time) and accumulate
into the visitor's permanent signature. The TSL post effect reads
this slice to drive `lib/tsl-post/effects/glitch-composite.ts`; the
`/api/glitch/event` route writes into it from server-side push paths.

## Public surface

- `useGlitchStore` / `glitchStore`.
- Re-exports from `lib/glitch/taxonomy`: `GlitchGenre`, `GlitchFamily`,
  and the `GlitchToken` / `GlitchChain` / `GlitchSignature` types.
- Types: `GlitchState`, `GlitchActions`.

## Internal

- `EMPTY_SIGNATURE` / `initial` — defaults for a first-time visitor.
- `CHAIN_TTL_MS` (12 s) — how long a chain stays hot before
  `tickDecay()` evicts it.
- `SESSION_RING` (120) — session-only token ring; does not affect the
  persisted signature.
- `advanceSignature` — pure helper that increments tokenCounts /
  genreCounts / totals.
- `persistSignature` — fire-and-forget Firestore write; degrades to
  in-memory when Firebase isn't configured (returns early on null
  `getFirebaseDb()` so local dev without `.env.local` still works).

## Depends on

- `zustand`.
- `uuid` (v4) for stable token ids — used for dedupe across the
  server-push path so an event that lands twice doesn't double-fire.
- `lib/glitch/taxonomy` for the closed taxonomy + the `resolveChain`
  and `signatureWeight` pure helpers.
- `firebase/firestore` + `lib/firebase/client` (dynamic imports —
  keeps Firebase out of non-browser bundles and out of the cold path
  on first paint).

## Does not

- **Does not render anything.** The TSL post effect reads
  `activeChains` and `signatureWeight` and composes the glitch look;
  the slice only holds state.
- **Does not bind anonymous auth.** A consumer wires Firebase
  Anonymous Auth and calls `restoreSignature(sig, uid)` once the uid
  is known. The slice writes signatures to Firestore but never
  signs anyone in.
- **Does not validate events.** Callers pass a closed-enum
  `GlitchFamily`; the type system enforces the taxonomy. The route
  handler validates body shape at the network boundary.
- **Does not run the decay timer.** A consumer (typically the
  glitch-composite effect's `useFrame` loop, or a top-level RAF in
  `app/layout.tsx`) calls `tickDecay()` on every tick. Keeps the
  slice synchronous and free of timers / side-effects.
- **Does not retry persistence.** `persistSignature` is
  fire-and-forget. A failed write means the next successful event
  carries the missed counts forward; we never block the UI on
  Firestore round-trips.

## Bordering files

- `lib/glitch/taxonomy.ts` — the closed enum + pure helpers; data,
  not state.
- `lib/tsl-post/effects/glitch-composite.ts` — the consumer that
  reads `activeChains` and `signatureWeight` to drive the visual.
- `app/api/glitch/event/route.ts` — the server-push entry point;
  calls `fireEvent` on the per-request store after validating the
  family + bearer.
- `lib/firebase/client.ts` — provides `getFirebaseDb()` (lazy, may
  return null on missing env). Glitch persistence degrades silently.
- `components/glitch/GlitchProvider.tsx` — (planned) wires anonymous
  auth + initial signature restore + the decay RAF loop.
