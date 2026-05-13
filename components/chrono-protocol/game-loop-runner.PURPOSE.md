# `game-loop-runner.tsx` — purpose twin

## Role

The headless rAF orchestrator for the Chrono-Protocol runtime.
Owns the per-frame call into `tickTunnel` from
`lib/chrono-protocol/game-loop.ts`, writes the result into the
`chrono-protocol` slice, and polls `agent.banter` on the 12-second
Hangar canon cadence. Renders nothing — every UI surface (HUD,
mode-wheel, tunnel, dialogue-overlay) subscribes to the slice it
needs and re-renders independently.

## Public surface

- `GameLoopRunner` — a `"use client"` component that returns
  `null`. Props:
  - `activeSpeakers?: CastMemberId[]` — defaults to `["aura",
    "yow", "purp"]`, filtered against available bibles.
  - `bibles?: Record<CastMemberId, CharacterBible>` — override
    for the cast registry (tests, Storybook).
  - `onBanterTurn?: (turn) => void` — fires per successful banter
    turn so a parent can surface it through `DialogueOverlay`.

## Internal

- `resolveSpeakers` — filters the requested speaker list against
  the bibles map. Today the production map only carries Aura, so
  the default `["aura", "yow", "purp"]` collapses to `["aura"]`.
- `rafRef` / `lastTickRef` / `msSinceBanterRef` — refs that hold
  the per-frame timing state outside the slice. The slice
  surfaces values consumers care about (speed, score, combo); the
  runner keeps the bookkeeping refs private.
- `banterInFlightRef` — gates the Gemini call so one round-trip
  cannot stack onto another if the network is slow.
- `fireBanter(carryMs)` — assembles the `BanterTelemetry`
  snapshot from the slice and dispatches one tick. Returned turns
  are appended to `cast.history` per-speaker and forwarded
  through `onBanterTurn` if supplied.

## Depends on

- `react` — `useEffect`, `useRef`.
- `lib/capabilities/agent/banter` — `respondBanter`,
  `isAvailable`, `BanterTelemetry`, `BanterTurn`.
- `lib/cast` — `bibles` registry + `CastMemberId`.
- `lib/chrono-protocol/game-loop` — `tickTunnel`, `isLoopActive`.
- `lib/state/chrono-protocol` — slice + `toBanterPhase` helper.
- `lib/state/cast` — `castStore.appendTurn`.

## Does not

- **Does not render.** Returns `null`. The UI sits in siblings.
- **Does not own phase transitions.** Phase changes (boot → hub
  → run → victory / defeat / game_over) are the route's job;
  the runner only reads the current phase to decide whether to
  tick.
- **Does not own input.** Pointer / touch / gamepad input lives
  in `components/chrono-protocol/poi-controls.tsx` and writes
  through the input slice; the runner reads the slice only.
- **Does not gate on `GOOGLE_AI_API_KEY`.** Calls
  `isAvailable()` from the banter capability so the rAF loop
  still ticks the tunnel even when the key is missing.
- **Does not retry failed banter calls.** A console.error lands
  on failure and the cadence resumes on the next tick.

## Bordering files

- `lib/chrono-protocol/game-loop.ts` — the pure transition + tick
  functions the runner calls.
- `lib/state/chrono-protocol.ts` — the live slice the runner
  reads + writes.
- `lib/state/cast.ts` — the slice the runner appends banter
  turns into.
- `lib/capabilities/agent/banter.ts` — the Gemini-backed banter
  capability the runner schedules.
- `app/chrono-protocol/run/page.tsx` — the route that mounts the
  runner once the canvas + zone are decided.
- `components/chrono-protocol/game-canvas.tsx` — the canvas
  shell the runner is embedded into.
