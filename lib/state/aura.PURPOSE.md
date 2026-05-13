# `aura.ts` — purpose twin

## Role

The shared state-bus for Aura's psychology — her slow-drift OCEAN
personality vector, her short-term mood reading, and the active
ChronoMode she's holding for the wheel. Pipeline Epsilon and
every "Aura looks/feels/sounds like X" composition reads here.

## Public surface

- `useAuraStore` — React hook.
- `auraStore` — headless alias.
- Types: `OceanVector`, `AuraMood`, `AuraState`, `AuraActions`.

## Internal

- `initial: AuraState` — Aura's starting personality baseline
  (high openness, mid-high conscientiousness, mid extraversion,
  high agreeableness, low-mid neuroticism). Mode defaults to
  `azure` (Aura's home construct slot).
- `clamp01` helper — keeps OCEAN values inside [0..1] after
  `nudgeOcean` deltas.

## Depends on

- `zustand`.
- `lib/chrono-protocol` for the `ChronoModeSlug` type. This is a
  type-only dependency; no runtime coupling.

## Does not

- **Does not run the OCEAN+FFT pipeline.** That's the audio-input
  +inference capability's job; the slice only holds the current
  reading.
- **Does not run the strange-attractor visualisation.** Pipeline
  Epsilon body lives in `viz.attractor` and reads here.
- **Does not enforce mode legality.** The capability layer enforces
  ChronoMode transitions per `lib/chrono-protocol/state.ts`; the
  slice will accept any valid slug.
- **Does not cap the ledger.** Callers prune externally if it
  grows.

## Bordering files

- `lib/capabilities/agent/dialogue.ts` — nudges OCEAN on
  conversational outcomes; reads mood + mode to colour responses.
- `lib/capabilities/viz/attractor.ts` — reads OCEAN to pick
  attractor engine + parameters (Pipeline Epsilon).
- `lib/capabilities/vrm/expression.ts` — reads mood to drive
  brow/eye expression weights (mood-face composition).
- `lib/capabilities/motion/idle.ts` — reads mode for Laban Effort
  modulation of idle motion.
- `lib/chrono-protocol/*` — the mode wheel canon.
