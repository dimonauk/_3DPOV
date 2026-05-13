# `env.ts` — purpose twin

## Role

The single place capabilities read environment variables from.
Typed key union catches typos at compile time; the present/absent
predicate lets the capability layer decide whether a provider is
available without scattering `process.env.X` reads across the
codebase.

## Public surface

- `envOrUndefined(key)` — read, returns `undefined` if missing.
- `envOrThrow(key)` — read, throws helpful error if missing.
- `isConfigured(key)` — boolean. The capability layer's
  primary check.
- Type `EnvKey` — union of the keys we read.

## Internal

- Treats empty string as "not set" — Vercel sometimes exposes
  unset vars as `""` rather than `undefined`; the helpers
  normalise so callers see one shape.

## Depends on

- `process.env` — Node.js / Next.js runtime. Works on both
  server and client (Next inlines `NEXT_PUBLIC_*` at build time).

## Does not

- **Does not validate semantically.** A truthy `ELEVENLABS_API_KEY`
  might be wrong; provider call will fail at runtime with the
  provider's own error.
- **Does not read at module-init.** Each call is a fresh
  `process.env` read, so dev `.env.local` reloads pick up.
- **Does not expose `NEXT_PUBLIC_*` keys on the server only.**
  Same accessor for both; rely on Next's build-time inlining for
  client visibility.
- **Does not cover Firebase / Shopify keys.** Those are read by
  their own clients (`lib/firebase/client.ts`,
  `lib/shopify/_internal.ts`); centralising would mean threading
  through clients that already work. Future cleanup may unify.

## Bordering files

- `.env.example` — the canonical list of keys (matches `EnvKey`).
- `lib/capabilities/audio/tts.ts` — will read `ELEVENLABS_API_KEY`
  to decide if ElevenLabs provider is available.
- `lib/capabilities/agent/dialogue.ts` (future) — will read
  `GOOGLE_AI_API_KEY`.
- `lib/capabilities/world/london-map.ts` (future) — will read
  `NEXT_PUBLIC_MAPLIBRE_TILES_URL`.
