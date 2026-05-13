# `gesture.ts` — purpose twin (capability `motion.gesture`)

## Role

The brick that makes Aura *do something* in response to a moment —
wave when greeted, nod when agreeing, shrug when she doesn't know,
point when directing. A gesture is a *transient pose change*:
capture the current pose, ease into a peak pose, hold, ease back to
the captured baseline. The capability ships the studio's named
gesture library and the trigger surface that runs each one.

## Public surface

- `triggerGesture(id, name, options?)` — start a gesture; returns a
  Promise that resolves on completion (or early on cancel).
- `cancelGesture(id)` — stop any in-flight gesture, restore the
  captured baseline immediately.
- `listGestures()` — enumerate the available gesture names.
- `GESTURES` — the named-gesture library (peak poses).
- `GestureName` — string-literal union derived from `GESTURES`.
- `TriggerGestureOptions` — `{ attackMs?, holdMs?, releaseMs? }`.

## Internal

- `active: Map<VRMHandleId, InFlight>` — module-scope tracker. One
  in-flight gesture per handle; a second trigger cancels the first.
- `InFlight` — `{ raf, resolve, cancelled, baseline }`. The
  `baseline` is captured *once*, on first trigger, and inherited by
  any re-trigger that happens mid-flight so the eventual restoration
  point stays correct.
- `easeInOutCubic(t)` — standard cubic ease, inline (no import).
- `lerp`, `lerpEuler` — scalar + Euler tween helpers. Missing bones
  on either side are treated as zero so a gesture can introduce a
  bone the baseline doesn't mention (and clean up on release).
- `blendPoses(baseline, peak, t)` — per-frame pose under union of
  bones present in baseline or peak.
- `cancelInFlight(id)` — internal cancel that preserves the
  baseline for return to the caller.

## Depends on

- `lib/state/vrm` — reads `poses[id]` to capture the baseline;
  writes `poses[id]` per frame during the gesture.
- `window.requestAnimationFrame`, `window.cancelAnimationFrame`,
  `performance.now` — runtime browser globals. The capability is
  client-only; calling `triggerGesture` on the server would throw.

## Does not

- **Does not modulate continuously.** Breath + blink + micro-shift
  are `motion.idle`'s job. A gesture is a discrete event with a
  bounded duration.
- **Does not handle facial expressions.** Aura's smirk, brow lift,
  surprise widening — all live in `vrm.expressions.blend`. A
  gesture moves the rig, not the face. Composing gesture + facial
  cue is the dialogue layer's job.
- **Does not own the gesture's *meaning*.** Picking *which* gesture
  to play for a given moment is `agent.dialogue` /
  intent-classification's call. This file is purely the player.
- **Does not look at anything.** Gesturing toward an object that
  Aura is also looking at composes with `vrm.lookAt` at the
  callsite — not here.
- **Does not introduce a new slice field.** Option A: writes
  `vrm.poses` transiently and restores the baseline. The idle
  layer's writes to `vrm.idleOffsets` continue throughout the
  gesture; VRMAvatar's per-frame sum keeps them additive.
- **Does not touch idleOffsets.** During a 1.2s gesture, idle keeps
  modulating breath + blink + hip micro-shift on top of whatever
  the gesture writes to `poses`. That's the contract.

## Plug surface

- **State plugs (write):** `vrm.poses` (transient, per-frame
  during the gesture; restored on completion).
- **State plugs (read):** `vrm.poses` (capture baseline at
  trigger time).
- **Type plugs:** input `(VRMHandleId, GestureName,
  TriggerGestureOptions?)`; returns `Promise<void>`.
- **Dependency plugs:** `vrm.load` (handle must exist),
  `vrm.bones.pose` (baseline this transiently overrides).

## Bordering files

- `lib/state/vrm.ts` — slice; `poses` is the field this capability
  transiently owns during a gesture.
- `lib/capabilities/vrm/pose.ts` — sibling that sets the baseline.
  `gesture.ts` and `pose.ts` are the two writers to `vrm.poses`;
  composition is "gesture wins while in flight, restores on
  completion."
- `lib/capabilities/motion/idle.ts` — sibling that writes
  `vrm.idleOffsets`. The two motion bricks compose additively at
  the VRMAvatar consumer; neither needs to know about the other.
- `components/three/VRMAvatar.tsx` — the consumer that merges
  baseline pose + idle offset on every frame. Sees the gesture's
  transient `poses` write the same way it sees any pose write.
- Future `agent.dialogue` — picks the gesture name and timing.
- Future `vrm.lookAt` — composed at the callsite when Aura
  gestures toward something she's also looking at.

## How Aura's character lands here

The hostess-superheroine-brat character is encoded in the peak
poses, not in the player:

- **`wave`** — right arm raised high (1.7 rad on z), palm forward,
  head tilted yaw-right. Big "DARLINGS!" energy. Held longer than
  is strictly polite.
- **`nod`** — small head pitch (0.18 rad), faint neck follow. The
  hostess acknowledging, not agreeing. Doesn't surrender.
- **`shrug`** — both shoulders raised in z (±0.35 rad), forearms
  out to suggest palms-up. The brat's *don't blame me*.
- **`point`** — right arm extended (z 1.25 rad), index implied by
  the hand bone direction. The brat *directing*.

The Aura-ness comes from the data. Swap the library, the same
player produces a different character.
