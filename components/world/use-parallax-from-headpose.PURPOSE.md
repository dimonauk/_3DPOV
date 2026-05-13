# `use-parallax-from-headpose.ts` — purpose twin

## Role

The bridge between `input.headPose` and `world.parallax`. Reads
the user's head yaw + pitch from the input slice, scales each
shell's offset by `shellScale(n)` (so closer shells move more,
deeper shells move less — classic multiplane parallax), and
writes the per-shell offset to the world slice. `ParallaxShells`
picks it up and re-renders.

The composition pattern in action: two capabilities + two slices +
one hook = the layered motion the user sees. Neither slice
imports the other; the hook is the wire.

## Public surface

- `useParallaxFromHeadpose(options?)` — React hook. Returns void.
- Type `UseParallaxFromHeadposeOptions`.

## Internal

- `SHELL_INDICES` — fixed 1..10 iteration order.
- `useEffect` depends on the live `headPose` value; runs every
  time the input slice updates. Each run writes ten parallax
  offsets (one per shell).

## Depends on

- `react` — `useEffect`.
- `lib/state/input` — head-pose read.
- `lib/state/world` — parallax write + `shellScale`.

## Does not

- **Does not start the head-pose tracker.** The capability
  `input.headpose` is the tracker; a parent component or page
  calls `useHeadPose()` (from `components/hooks/useHeadPose.ts`)
  to start it. This hook *only* writes parallax from whatever's
  in the input slice.
- **Does not animate easing.** Each `headPose` change is mirrored
  immediately. If smoothing is wanted, layer a damping pass
  between this hook and the slice write (future enhancement).
- **Does not flip orientation per shell.** Same direction across
  all shells; classic parallax. A future "counter-parallax"
  effect (inner shells moving opposite to outer) could ship as
  another hook variant.

## Bordering files

- `components/world/parallax-shells.tsx` — consumer of the offsets
  this hook writes.
- `lib/state/input.ts` — read.
- `lib/state/world.ts` — write.
- `components/hooks/useHeadPose.ts` — starts the input.headpose
  tracker. Use both hooks together in a page that wants live
  parallax.
- `lib/capabilities/input/headpose.ts` — the capability that
  feeds the input slice.
