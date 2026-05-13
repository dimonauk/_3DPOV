# `headpose.ts` — purpose twin (capability `input.headpose`)

## Role

Head-pose tracker entry-point. Writes `{ yaw, pitch, roll }` (radians)
to the `input` slice along with a `HeadPoseSource` label so downstream
capabilities (parallax shells, VRM lookAt counter-gaze) can react.

The canonical priority chain is
**WebXR > MediaPipe > Mouse > Touch > Neutral.** The caller chooses
the active source explicitly — this capability does not resolve
precedence. **v0.1 implements only the `"mouse"` source**; the other
branches exist in the switch (so the chain is visible in code) but
throw `"not implemented"` when called.

The mouse branch maps cursor position relative to the viewport centre
into a bounded yaw/pitch (`MAX_YAW = 0.6` rad ≈ 35°,
`MAX_PITCH = 0.4` rad ≈ 23°). Roll is always 0 from the mouse.

## Public surface

- `startHeadpose(options?)` — attach the chosen tracker. Idempotent —
  calling twice cancels the previous attach. Default source `"mouse"`.
- `stopHeadpose()` — detach any active listener. No-op when idle.
- `isRunning()` — predicate, true while a listener is attached.
- Types: `HeadposeSource`, `StartHeadposeOptions`.

## Internal

- `activeListener: ((e: MouseEvent) => void) | null` — module-scope
  slot tracking the currently attached `mousemove` listener.
  Single-source by design: only one tracker may be live at a time.
- `MAX_YAW`, `MAX_PITCH` — radian bounds for the mouse fallback.
- `hasWindow()` — SSR guard. Returns false during server render so
  no listener is attached and no DOM API is called.
- `writeNeutral()` — writes a zero pose with source `"neutral"`.
- `attachMouseListener()` / `detachMouseListener()` — pure side-effect
  helpers used by the `startHeadpose` switch.

## Depends on

- `lib/state/input` — writes `headPose` and `headPoseSource` via
  `setHeadPose(pose, source)`. No reads.
- Browser globals: `window`, `MouseEvent`, `window.innerWidth`,
  `window.innerHeight`. Capability is client-only at runtime; SSR
  calls are guarded by `hasWindow()` and degrade to no-op.

## Does not

- **Does not own the MediaPipe loader.** Face-landmark tracking will
  arrive as a sibling capability under `lib/capabilities/input/`
  (e.g. `headpose-mediapipe.ts`). This file just declares the source
  in its switch so the chain is visible.
- **Does not handle gestures.** Pinch / grab / point / thumbs_up live
  on the `recentGestures` slice key and will be owned by a separate
  `lib/capabilities/input/gestures.ts`.
- **Does not interpolate between sources.** Hand-off smoothing
  (e.g. blending the last mouse pose into the first WebXR pose) is
  out of scope; switching sources is hard cut.
- **Does not implement the priority resolution.** The caller picks
  the active source. A future router capability may consult the
  WebXR / MediaPipe availability and call `startHeadpose` with the
  winner, but the routing is not this file's job.

## Plug surface

- **State plugs (write):** `input.headPose`, `input.headPoseSource`.
- **State plugs (read):** none.
- **Type plugs:** input `StartHeadposeOptions`; no return.
- **Dependency plugs:** none — entry-point capability. Composable
  with everything that reads `input.headPose`.

## Bordering files

- `lib/state/input.ts` — the slice this writes. Owns `HeadPose` /
  `HeadPoseSource` types that line up with `HeadposeSource` here.
- `lib/capabilities/input/headpose-mediapipe.ts` (future) — the
  MediaPipe source, will share this entry-point's contract.
- `lib/capabilities/input/headpose-webxr.ts` (future) — the WebXR
  source.
- `lib/capabilities/input/gestures.ts` (future) — sibling capability
  on the same slice, different key (`recentGestures`).
- `lib/capabilities/index.ts` — registry stub (flipped separately
  when the brick is registered).
- Downstream consumers of `input.headPose`: `lib/state/world.ts`
  (parallax shells), `vrm.lookAt` composition (counter-gaze).
