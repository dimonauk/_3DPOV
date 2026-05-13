# `chrono-protocol.ts` — purpose twin

## Role

The shared state-bus for a *live* Chrono-Protocol run. While
`lib/chrono-protocol/state.ts` owns the typed `GameState` enum and
the cross-run save slot, this slice is the live frame-by-frame
state — what phase the runner is in, which zone is active, which
mode the wheel sits on, the current tunnel speed, the combo, the
health, the score. The game-loop runner (`components/chrono-
protocol/game-loop-runner.tsx`) writes here every frame; the HUD,
the wheel, and the dialogue overlay read from here.

## Public surface

- `useChronoProtocolStore` / `chronoProtocolStore`.
- Types: `ChronoProtocolState`, `ChronoProtocolActions`,
  `BanterPhase`.
- `toBanterPhase(GameState)` — pure helper that flattens the
  nine-state GameState into the four-value banter telemetry phase
  the `agent.banter` capability expects ("boot" | "hub" | "run" |
  "end").

## Internal

- `initial` — phase `boot`, no zone, mode `azure`, speed
  multiplier 1.0, full health (100), combo + score zero. Mirrors
  the prototype's per-run starting refs.
- `clampMultiplier` — bounds the speed multiplier to
  `[INITIAL_SPEED_MULTIPLIER..MAX_SPEED_MULTIPLIER]`. Pulled
  from the constants file so a tuning pass needs one edit.
- `stamp` — `new Date().toISOString()` once per write, so the
  slice surfaces a `lastEventAt` for the runner's diagnostics.

## Depends on

- `zustand`.
- `lib/chrono-protocol` — `ChronoModeSlug` type.
- `lib/chrono-protocol/constants` — speed bounds + initial health.
- `lib/chrono-protocol/state` — `GameState` enum (the slice
  *uses* the type; it does not own it).
- `lib/chrono-protocol/zones` — `ZoneSlug` type.

## Does not

- **Does not run the rAF loop.** That's the game-loop runner's
  job (`components/chrono-protocol/game-loop-runner.tsx`). The
  slice only holds state.
- **Does not persist across runs.** Cross-run state (best scores,
  unlocked zones, total runs) is `SaveSlot` in
  `lib/chrono-protocol/state.ts`, mirrored to localStorage.
- **Does not enforce phase transitions.** A capability layer
  (`lib/chrono-protocol/game-loop.ts`) owns the transition
  function; the slice will accept any valid `GameState`.
- **Does not write to the cast slice.** Banter writes are the
  runner's call; `cast.appendTurn` happens via the runner, not
  the slice.

## Bordering files

- `lib/chrono-protocol/state.ts` — the cross-run save slot + the
  one-shot telemetry helpers (`applyDamage`, `applyModeSwitch`,
  `applyComboTick`). Pure functions over a different shape.
- `lib/chrono-protocol/game-loop.ts` — the headless transition +
  tick functions the runner calls every frame.
- `lib/chrono-protocol/constants.ts` — the numeric canon
  (`TUNNEL_SPEED`, `MAX_SPEED_MULTIPLIER`, ramp + tick values).
- `components/chrono-protocol/game-loop-runner.tsx` — the rAF
  orchestrator that subscribes to the slice + writes back.
- `lib/capabilities/agent/banter.ts` — reads the slice indirectly
  through the runner; the runner shapes the `BanterTelemetry`
  payload from this slice's values.
