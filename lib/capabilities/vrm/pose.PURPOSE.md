# `pose.ts` — purpose twin (capability `vrm.bones.pose`)

## Role

The pose-setter brick. Turns a `PoseVector` (named or supplied)
into a write to the `vrm` slice, which `VRMAvatar` picks up on the
next frame. Also ships the studio's named-pose library — including
Aura's hostess-superheroine-brat held default — as canonical
constants other capabilities consume.

## Public surface

- `setPose(id, pose)` — write a custom pose to the slice.
- `setNamedPose(id, name)` — apply a library pose by name.
- `nudgePose(id, partial)` — merge partial onto current pose.
- `getPose(id)` — read current pose for a handle.
- `POSES` — the named-pose library.
- `NamedPose` — string-literal union of pose names.

## Internal

- The `POSES` library entries use `satisfies Record<string,
  PoseVector>` so the type-level pose-name union is derived from
  the constant. Adding a new pose is one entry; the type updates
  automatically.

## Depends on

- `lib/state/vrm` — the slice this capability writes to.

## Does not

- **Does not animate.** Poses are *targets*. Tweening between
  poses is `motion.idle`, `motion.gesture`, or a future
  `motion.transition` capability's job.
- **Does not validate bone names.** The slice accepts any
  `Record<string, Euler>`. The applier (`VRMAvatar`) calls
  `getNormalizedBoneNode(name)` which silently fails on unknown
  names. Unknown bones surface visually, not as errors. This is
  intentional — VRMs from different rigs have different bone sets,
  and we'd rather degrade gracefully than throw.
- **Does not own facial expressions.** Aura's *posed face* (smirk,
  brow lift) lives in `vrm.expressions.blend` + the expression
  weights side of the slice.
- **Does not drive the lookAt target.** That's `vrm.lookAt`. Pose
  controls *the rig*, lookAt controls *where the eyes/head aim*
  on top of the rig.

## Where Aura's character lives in this file

`POSES.auraDefault` is the **canonical held stance** for Aura. The
nursery-language reading of "hostess with the mostess +
superheroine posing brat" maps onto the pose values:

- **Hostess** — chin up (head pitch back), inviting tilt.
- **Superheroine** — hand at hip (right arm bent inward), chest
  forward, weight planted.
- **Brat** — slight asymmetric hip roll, held longer than feels
  comfortable.

When `motion.idle` mounts on Aura's VRM, its baseline write is
`setNamedPose(auraId, "auraDefault")`. The idle layer modulates
*on top of* this baseline — slow breath, micro-shifts, blink — but
never lets her drift into a neutral A-pose.

## Bordering files

- `lib/state/vrm.ts` — slice we write to.
- `lib/capabilities/vrm/load.ts` — the brick this one composes
  with. `vrm.load` produces the handle; `vrm.bones.pose` poses it.
- `lib/capabilities/motion/idle.ts` (future) — calls
  `setNamedPose` on mount, then modulates per-frame on top.
- `lib/capabilities/motion/gesture.ts` (future) — triggers named
  poses transiently (welcomeWave, etc).
- `components/three/VRMAvatar.tsx` — the applier that reads the
  slice every frame.

## Plug surface

- **State plug:** `vrm` slice (`setPose`).
- **Type plugs:** input `(VRMHandleId, PoseVector | NamedPose)`;
  no return value (side-effect on slice).
- **Dependency plug:** `vrm.load` must have produced a handle
  first. Declared in the registry as `dependsOn: ["vrm.load"]`.
