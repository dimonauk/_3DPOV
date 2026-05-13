# `idle.ts` — purpose twin (capability `motion.idle`)

## Role

Keeps a VRM *alive* on top of its baseline pose. Aura's
`auraDefault` stance is held; this capability layers slow breath,
periodic blink, and micro hip-shift on top so the held stance
doesn't feel statuesque. Modulation amplitude + cycle rate scale
with Aura's current mood (`aura` slice).

The capability **never writes to `vrm.poses`** — it writes only to
`vrm.idleOffsets` (which `VRMAvatar` adds onto the baseline) and
`vrm.expressions` (for blink). The baseline stance set by
`vrm.bones.pose` stays the source of truth.

## Public surface

- `startIdle(id)` — kick off the rAF loop for a handle. Idempotent.
- `stopIdle(id)` — cancel the rAF loop, clear the idle offset.
- `isIdleRunning(id)` — predicate.

## Internal

- `loops: Map<VRMHandleId, LoopHandle>` — module-scope state
  tracking active rAF loops. Each entry holds the rAF id,
  start-time, and the next scheduled blink timestamp.
- `moodGain(mood)` — translates `AuraMood` to `{ amp, rate }`
  multipliers. Coarse mapping; can be re-tuned without changing
  callers.
- `computeBreathOffset(t, amp, rate)` — sinusoidal pitch
  modulation on chest / spine / neck. 4-second cycle at neutral
  rate.
- `computeMicroShift(t, amp)` — two-frequency sinusoid on hips
  yaw + roll. 9s + 13s periods for asymmetry.
- `scheduleNextBlink(now)` — random 3–8s delay until next blink.
- `setBlink(id, weight)` — writes to `vrm.expressions[id].blink`
  preserving other expression weights.

## Depends on

- `lib/state/vrm` — writes `idleOffsets` + `expressions`. Reads
  `expressions` to preserve other weights when toggling blink.
- `lib/state/aura` — reads `mood` for modulation gain.
- `window.requestAnimationFrame`, `window.setTimeout`,
  `performance.now` — runtime browser globals. The capability is
  client-only; calling `startIdle` on the server would throw.

## Does not

- **Does not change baseline pose.** Strictly additive over the
  pose set by `vrm.bones.pose`.
- **Does not blink eyes via bone rotation.** Eyelid bones aren't
  standard across VRMs; `blink` is the canonical VRM expression.
  If a VRM lacks a blink expression, the call silently no-ops.
- **Does not handle gaze.** Eye direction is `vrm.lookAt`'s job.
- **Does not modulate weight-shift onto the legs.** The hip
  micro-shift is the only lower-body modulation; foot planting
  + leg counter-balance are future `motion.weight-shift`.
- **Does not pause when off-screen.** Page-visibility / off-tab
  optimisation is a future concern; current rAF naturally throttles
  when the tab is hidden.

## Plug surface

- **State plugs (write):** `vrm.idleOffsets`, `vrm.expressions`.
- **State plugs (read):** `vrm.expressions` (blink preservation),
  `aura.mood`.
- **Type plugs:** input `VRMHandleId`; no return.
- **Dependency plugs:** `vrm.load` (must have produced a handle),
  `vrm.bones.pose` (the baseline this modulates). Both declared
  in registry.

## Bordering files

- `lib/state/vrm.ts` — slice + the `idleOffsets` field this
  capability owns.
- `lib/state/aura.ts` — mood read.
- `lib/capabilities/vrm/load.ts` — produces the handle.
- `lib/capabilities/vrm/pose.ts` — baseline this modulates.
- `components/three/VRMAvatar.tsx` — merges baseline + offset on
  every frame; the consumer of `idleOffsets`.
- Future `lib/capabilities/motion/gesture.ts` — transient gestures
  that should briefly suppress idle modulation (or layer cleanly
  over it).

## How Aura's character lands here

The held stance is data (vrm.bones.pose's `auraDefault`). This
capability makes the stance *alive* — but the character of the
aliveness still comes from data:

- **Mood `playful` / `delighted`** → amp 1.25–1.3, rate 1.0–1.1.
  Visible breath, frequent micro-shifts. She's *engaged*.
- **Mood `focused`** → amp 0.6, rate 0.8. Quiet. She's *paying
  attention to you, not herself*.
- **Mood `agitated`** → amp 1.5, rate 1.4. Big restless shifts.
  The brat about to do something.
- **Mood `tender`** → amp 0.75, rate 0.7. Slow, soft. The
  hostess actually listening.

Swap mood, the way she stands changes. No code change required.
