# `input.ts` — purpose twin

## Role

The shared state-bus for everything that enters from the user's
body — head pose, gesture events, hand/XR controllers. The
priority chain WebXR > MediaPipe > Mouse > Touch > Neutral is
expressed here as the `HeadPoseSource` label on each update.

## Public surface

- `useInputStore` / `inputStore`.
- Types: `HeadPose`, `HeadPoseSource`, `GestureEvent`,
  `GestureName`, `ControllerHandle`, `InputState`, `InputActions`.

## Internal

- `initial` — pose at zero, source `neutral`.
- Gesture history is capped at 20 entries via `slice(-19)` inside
  `pushGesture`. Internal cap; callers don't manage it.

## Depends on

- `zustand`. No other slice.

## Does not

- **Does not run any tracker.** WebXR / MediaPipe / mouse / touch
  capture all live in capabilities under `lib/capabilities/input/`.
  The slice holds the *current value* and the *source label*.
- **Does not resolve precedence.** When multiple trackers are
  active, the capability layer picks the winner per the priority
  chain. The slice trusts what's written.
- **Does not interpret gestures.** Gesture *recognition* is the
  capability's job; the slice records named events.

## Bordering files

- `lib/capabilities/input/headpose.ts` — writes pose + source per
  active tracker.
- `lib/capabilities/input/gestures.ts` (future) — pushes gesture
  events from MediaPipe / Leap Motion.
- `lib/state/vrm.ts` — head-pose composition with `vrm.lookAt`
  (NPC looks back when user looks at them).
- `lib/state/world.ts` — parallax-shells composition reads head
  pose for layered scaling and offset.
- `components/three/xr-controllers.tsx` (future) — renders the
  controllers from this slice.
