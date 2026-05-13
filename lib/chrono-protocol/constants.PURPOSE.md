# `constants.ts` — purpose twin

## Role

Numeric canon for the Chrono-Protocol runtime — the values the
Hangar prototype runs on, ported verbatim so the site-side
runtime and the prototype tick on identical arithmetic. One file,
one job; tuning passes touch this and only this.

## Public surface

- `TUNNEL_SPEED` — 12 world-units-per-second. Verbatim from
  `World.tsx` in the prototype.
- `INITIAL_SPEED_MULTIPLIER` — 1.0. Verbatim from `App.tsx`.
- `MAX_SPEED_MULTIPLIER` — 2.5. The prototype's cap.
- `SCORE_TICK_MS` — 100. The prototype's score-tick interval.
- `SCORE_TICK_VALUE` — 10. The prototype's score per tick.
- `SPEED_RAMP_PER_TICK` — 0.001. The prototype's per-tick ramp.
- `BANTER_TICK_MS` — 12_000. The Hangar canon cadence shared with
  `lib/capabilities/agent/banter.ts → DEFAULT_TICK_MS`.
- `BANTER_TRIGGER_THRESHOLD` — 0.6. The `Math.random() > 0.6`
  random-event gate.
- `INITIAL_HEALTH_INT` — 5. The prototype's 0..5 scale.
- `INITIAL_HEALTH` — 100. The site's 0..100 scale, mirrored from
  `lib/chrono-protocol/state.ts`.
- `BOOT_LINE_MIN_MS` / `BOOT_LINE_MAX_MS` / `BOOT_FINAL_DELAY_MS`
  — boot-sequence stagger values verbatim from `Hub.tsx`.
- `comboToScoreMultiplier(combo)` — the same formula scoring.ts
  uses internally, re-exposed here so the game-loop arithmetic
  reads from one place. Scoring.ts owns the canonical
  combo-score table; this is the live tick's multiplier.

## Internal

- Nothing; the file is a flat constant table plus one helper.

## Depends on

- `./zones` — re-uses `BASE_TUNNEL_SPEED` so the per-zone
  multiplier and the runtime read the same number.

## Does not

- **Does not invent values.** Every exported constant traces to a
  line in the prototype. Slots that the prototype leaves implicit
  (combo-decay, mode-switch cooldown, phase durations) are named
  as commented TODOs rather than guessed.
- **Does not export a class or singleton.** A single module of
  numeric constants and one helper.
- **Does not own scoring.** `scoring.ts` is the canon for the
  full score-event surface; this file only exports the multiplier
  helper so the runner can compute mid-frame.

## Bordering files

- `./zones.ts` — `BASE_TUNNEL_SPEED` source; per-zone speed
  multiplier reader.
- `./scoring.ts` — full score-event canon. This file mirrors the
  combo-multiplier formula for runtime use.
- `./state.ts` — the typed `GameState` enum + the persisted
  `SaveSlot` shape.
- `./game-loop.ts` — the headless state machine that imports
  these constants to drive `tickTunnel`.
- `lib/state/chrono-protocol.ts` — the live slice that reads
  `TUNNEL_SPEED` + `INITIAL_SPEED_MULTIPLIER` for its initial
  state.
