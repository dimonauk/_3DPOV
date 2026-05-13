# `useHeadPose.ts` — purpose twin

## Role

The React hook side of the `input.headpose` capability. Subscribes
a component to the live head-pose vector from the `input` slice
and (by default) auto-starts the tracker on mount + stops on
unmount.

## Public surface

- `useHeadPose(options?)` — returns `{ pose, source }`.
- Types: `UseHeadPoseOptions`, `UseHeadPoseResult`.

## Internal

- Uses `useInputStore` selectors to subscribe only to `headPose`
  + `headPoseSource` (not the gesture or controller slots).
- `useEffect` lifecycle: starts the capability with the requested
  source, stops on cleanup. Catches startup errors and warns
  rather than throwing — a missing webcam or WebXR shouldn't
  crash the page.

## Depends on

- `react` — `useEffect`.
- `lib/state/input` — slice subscription.
- `lib/capabilities/input/headpose` — start/stop control.

## Does not

- **Does not own the priority chain.** The capability decides
  which tracker to run; this hook just asks. Multiple components
  asking for different sources would conflict — the last
  `startHeadpose()` wins.
- **Does not resolve gesture or controller state.** Same slice
  has those, but they're separate concerns. A future
  `useGestures()` hook will subscribe to those slots.
- **Does not interpolate.** Returns whatever's in the slice this
  frame. Components can layer easing if they want.

## Bordering files

- `lib/state/input.ts` — slice.
- `lib/capabilities/input/headpose.ts` — capability the hook
  drives.
- `components/three/VRMAvatar.tsx` (future composition target) —
  could feed head-pose into `vrm.lookAt` so Aura tracks the
  cursor.
- `app/sphere/page.tsx` + future 10-shell parallax — primary
  user of `headPose.yaw` + `pitch` for layered offsets.

## Why a hook and not a component

Capabilities are headless. The hook is the bridge for components
that want to react to slice state without owning the capability
lifecycle. A `<HeadPoseProvider>` component would over-engineer
something three lines of `useEffect` solve cleanly.
