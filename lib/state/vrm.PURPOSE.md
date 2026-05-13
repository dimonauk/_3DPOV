# `vrm.ts` — purpose twin

## Role

The shared state-bus for every VRM-related capability — loaded
character handles, current pose targets, current expression
weights, current look-at targets. Anything that needs to read or
write a VRM's runtime state goes through this slice.

## Public surface

- `useVRMStore` — React hook for components that render VRM data.
- `vrmStore` — same store, named for headless callers
  (`vrmStore.getState()` / `.setState()` outside React).
- Types: `VRMHandle`, `VRMHandleId`, `PoseVector`,
  `ExpressionWeights`, `Vec3`, `Euler`, `VRMState`, `VRMActions`.

## Internal

- `initial: VRMState` — the empty-default state constant. Not
  exported; consumed only by the store factory.

## Depends on

- `zustand` (npm dependency).
- No other slice. Cross-slice composition is the capability's job.

## Does not

- **Does not import `@pixiv/three-vrm`.** The `vrm` field on a
  `VRMHandle` is typed `unknown` so the slice has no three.js
  dependency and stays framework-agnostic. Capabilities that need
  the concrete VRM cast it back when they pull it out.
- **Does not run animation.** Pose/expression interpolation lives
  in `motion.idle`, `motion.gesture`, `vrm.expressions.blend`, etc.
  This slice only holds the *target* values; capabilities are
  responsible for tweening to them.
- **Does not own scene mounting.** The R3F `<Canvas>` and scene
  graph are owned by components. This slice tracks logical handles
  by ID; the visual mount is rendered downstream.

## Bordering files

- `lib/capabilities/vrm/*` — capabilities that read/write this
  slice (`load`, `pose`, `expression`, `look-at`).
- `lib/state/aura.ts` — the mood vector that modulates
  `expressions`. Composition lives in `vrm.expressions.blend`.
- `lib/state/audio.ts` — viseme stream that drives mouth
  expressions. Composition lives in `audio.visemes` →
  `vrm.expressions.blend`.
- `components/three/*` — the rendering layer that subscribes to
  this slice and renders VRMs into the scene.
