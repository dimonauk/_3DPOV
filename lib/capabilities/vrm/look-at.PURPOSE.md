# `look-at.ts` — purpose twin (capability `vrm.lookAt`)

## Role

The head/eye-direction brick. Drives where a VRM is looking by
writing a world-space target into the `vrm` slice's `lookTargets`
field, which `VRMAvatar` reads each frame and feeds into the VRM's
internal lookAt module. The capability that makes Aura look at *you*
when you look at her, and makes the cast turn toward each other when
speaking. Composes with `input.headpose` (the user's gaze direction
in world space, future) and with sibling VRM handles for cast-to-
cast eye contact.

## Public surface

- `setLookTarget(id, target)` — write a world-space `Vec3` (or
  `null` to clear) to the vrm slice.
- `clearLookTarget(id)` — sugar for `setLookTarget(id, null)`.
- `lookAtPoint(id, x, y, z)` — sugar that takes separate
  coordinates instead of a tuple.
- `lookAtHandle(sourceId, targetId)` — composition. Reads the
  target VRM's head world-position from the slice and writes it as
  the source's look-target. No-op if the target handle isn't
  loaded yet.
- `getLookTarget(id)` — read the current target for a handle.

## Internal

- The `lookAtHandle` head-position read is wrapped in `try/catch`
  so transient errors (handle removed mid-call, disposed VRM, bone
  graph not yet wired) collapse to a silent no-op rather than
  surfacing as a crash from a UI event.

## Depends on

- `lib/state/vrm` — the slice this capability writes to (and reads
  handles from for `lookAtHandle`).
- `three` — `Vector3` for the world-position read.
- `@pixiv/three-vrm` — the `VRM` type for casting the opaque
  handle in `lookAtHandle`.

## Does not

- **Does not animate the look-at transition.** The VRM's internal
  lookAt module owns easing on the VRM side; the slice just records
  the target. Smoothing curves, saccade timing, and gaze-aversion
  jitter are separate capabilities that may modulate the target
  over time.
- **Does not handle gaze-to-mouse-cursor.** Converting a screen
  cursor to a world-space point is a composition layer on top,
  reading `input.headPose` + camera transform — owned by the
  future `lib/capabilities/input/headpose-to-world.ts`.
- **Does not own eye blendshape weights.** Squint, wink, and other
  eye-region expressions are `vrm.expressions.blend`'s job. This
  capability only moves the gaze vector.
- **Does not validate the handle exists.** `setLookTarget`,
  `clearLookTarget`, and `lookAtPoint` all write unconditionally —
  if the handle hasn't loaded yet, the value sits in the slice and
  applies when `VRMAvatar` mounts. Only `lookAtHandle` reads the
  target handle (and bails silently if absent), because it needs
  the head bone's world-position.

## Plug surface

- **State plugs:** writes `vrm.lookTargets`; reads `vrm.handles`
  for `lookAtHandle`.
- **Type plugs:** input `(VRMHandleId, Vec3 | null)` or sibling
  `(VRMHandleId, VRMHandleId)` for `lookAtHandle`; output `void`
  for setters, `Vec3 | null | undefined` for `getLookTarget`.
- **Dependency plug:** `vrm.load` must have produced the source
  handle (for the target to take effect) and the target handle
  (for `lookAtHandle` to find a head bone).

## Bordering files

- `lib/state/vrm.ts` — slice we write to (and read the head-bone
  source from in `lookAtHandle`).
- `components/three/VRMAvatar.tsx` — the applier that reads
  `lookTargets` each frame and feeds the VRM's internal lookAt
  module.
- `lib/capabilities/vrm/load.ts` — produces the handles this
  capability targets.
- `lib/capabilities/vrm/pose.ts` — sibling brick. Pose controls
  the rig; lookAt controls where the eyes/head aim on top of the
  rig.
- `lib/capabilities/input/headpose-to-world.ts` (future) — the
  composition layer that converts cursor / head-tracker input into
  a world-space `Vec3`, then calls `setLookTarget` here.
