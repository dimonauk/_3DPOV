# `VRMAvatar.tsx` — purpose twin

## Role

The single component bridge between the headless `vrm` state slice
and a live R3F scene. It owns the *load + unload lifecycle* for one
VRM handle and the *per-frame application* of that handle's pose,
expression weights, and look-at target onto the actual rig.

Aura's body, in particular, will mount as one `<VRMAvatar
url={nannyVrm} />` inside the workshop's scene. The
hostess-with-the-mostess + superheroine-posing-brat character is
expressed downstream of this component — through the data it pulls
from the `vrm` slice (which `motion.idle`, `vrm.expressions.blend`,
`vrm.lookAt` will write into).

## Public surface

- `VRMAvatar({ url, id? })` — a React component. Must be mounted
  inside an `@react-three/fiber` `<Canvas>` because it uses
  `useFrame`.
- Type: `VRMAvatarProps`.

## Internal

- `handleId: VRMHandleId | null` state — tracks the ID that
  `loadVRM` returned. Drives both the slice subscription and the
  render path.
- `lookAtTarget: Object3D` — a stable, memoised target object the
  VRM's lookAt module reads. Re-used across frames; only its
  `.position` is mutated when the slice's look-target updates.
- `useEffect` — fires `loadVRM` on mount, returns a cleanup that
  fires `unloadVRM`. Cancels mid-load if the component unmounts
  before the promise resolves.
- `useFrame` — reads the slice synchronously via
  `vrmStore.getState()` (no subscription) and applies pose +
  expressions + look-at + the VRM update tick.

## Depends on

- `@react-three/fiber` — for `useFrame` and the `<primitive>`
  bridge.
- `@pixiv/three-vrm` — for the `VRM` + `VRMHumanBoneName` types.
- `three` — for `Object3D`.
- `lib/state/vrm` — the slice we read from each frame.
- `lib/capabilities/vrm/load` — the capability that produces the
  handle.

## Does not

- **Does not own a Canvas.** Must be mounted inside one provided by
  the caller. Multiple VRMAvatars share one canvas.
- **Does not animate.** Pose / expression / lookAt come from the
  slice. Animation is `motion.idle`, `motion.gesture`,
  `audio.visemes` → `vrm.expressions.blend`, and so on. The avatar
  is a *display*, not a *driver*.
- **Does not handle camera or lighting.** Those are scene-level
  concerns owned by the parent component.
- **Does not cache between mounts.** Each mount fires a fresh
  `loadVRM`. Multiple instances of the same URL parse the file
  multiple times (acceptable; cache wrapper can layer on top).
- **Does not re-render on slice changes.** Pose/expression updates
  flow through `useFrame`, not React state. The component only
  re-renders when its `handleId` is set (once, on load completion).

## Plug surface

- **State plug:** `vrm` slice (read-only inside `useFrame`).
- **Type plug:** input `VRMAvatarProps` (URL + optional ID).
- **Dependency plug:** the `vrm.load` capability is invoked
  internally. Composes one VRM handle into the scene.

## Bordering files

- `lib/state/vrm.ts` — the slice the component reads from.
- `lib/capabilities/vrm/load.ts` — the capability the component
  invokes on mount.
- `lib/capabilities/vrm/pose.ts` (future) — writes pose targets to
  the slice; this component reads them.
- `lib/capabilities/vrm/expression.ts` (future) — same for
  expression weights.
- `lib/capabilities/vrm/look-at.ts` (future) — same for look-at.
- `lib/capabilities/motion/idle.ts` (future) — provides the
  *baseline pose* that gives Aura her superheroine-posing-brat
  default stance. Reads `aura` slice for mode/mood modulation.

## How Aura's character lands here

The hostess-with-the-mostess + held-pose + sass character isn't in
this file. It lives in:

1. The default values `motion.idle` writes to `vrm.poses[auraId]`
   on mount — a stance, not neutral.
2. The default `vrm.expressionManager` weights `motion.idle`
   leaves on — slight smirk, eyes up, brow lift.
3. The dialogue capability's intent + mood → expression mapping.

The avatar component is just the *channel*. Character flows
through it from the slices.
