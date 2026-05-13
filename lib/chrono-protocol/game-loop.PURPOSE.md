# `game-loop.ts` — purpose twin

## Role

The headless state machine for the Chrono-Protocol runtime.
Pure functions over a typed `GameLoopContext`: an event-driven
`advancePhase` for discrete transitions and a time-driven
`tickTunnel` for the per-frame speed ramp + score awards + banter
cadence accumulation. No React, no DOM, no slice reads. The
game-loop runner (`components/chrono-protocol/game-loop-runner.tsx`)
calls these functions every frame and writes results into
`lib/state/chrono-protocol.ts`.

## Public surface

- `GameLoopContext` — the headless mirror of the slice's runtime
  fields plus two book-keeping accumulators
  (`msSinceBanter`, `msSinceScoreTick`).
- `GameLoopEvent` — tagged union covering every discrete
  transition the prototype's state machine handles
  (`boot-complete`, `start-run`, `enter-creative`,
  `open-briefing`, `enter-encounter`, `win`, `lose`,
  `abort-to-hub`, `game-over`, `mode-switch`).
- `advancePhase(ctx, event)` — pure transition. Unrecognised
  transitions are no-ops.
- `tickTunnel(ctx, deltaMs)` — pure time-step. Returns the next
  context plus a `shouldBanter` flag and `scoreDelta` for the
  runner to act on.
- `TunnelTickResult` — the return shape.
- `makeInitialContext()` — fresh starting context.
- `isLoopActive(phase)` — gate for the rAF body: only ticks
  while in `"run"` or `"encounter"`.

## Internal

- The score-tick loop uses a `while` so a long frame catches up
  rather than skipping ticks. Matches the prototype's
  setInterval-driven monotonic ramp.

## Depends on

- `../chrono-protocol` — `ChronoModeSlug` type only.
- `./constants` — every numeric the machine reads.
- `./state` — `GameState` enum type only.
- `./zones` — `ZoneSlug` type only.

## Does not

- **Does not own state.** Returns new contexts; never mutates.
  The runner owns the persistence loop.
- **Does not call the LLM.** `tickTunnel` returns a
  `shouldBanter` flag; the runner decides whether to dispatch.
- **Does not validate transitions.** Returns the context
  unchanged for unrecognised events. Callers respect the
  canonical flow.
- **Does not own scoring canon.** Score-events go through
  `scoring.ts` for combat outcomes; this file only awards the
  100ms tick score.

## Bordering files

- `./constants.ts` — the numeric canon imported wholesale.
- `./state.ts` — the typed `GameState` enum.
- `./zones.ts` — `ZoneSlug` typing.
- `./scoring.ts` — the canon score-event table.
- `lib/state/chrono-protocol.ts` — the slice the runner writes
  into. The slice mirrors `GameLoopContext` minus the
  bookkeeping accumulators.
- `components/chrono-protocol/game-loop-runner.tsx` — the rAF
  consumer.
