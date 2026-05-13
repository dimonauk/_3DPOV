# `parallax-shells.tsx` — purpose twin

## Role

The 10-shell Russian-doll parallax substrate. The user sits outside
peering into 10 concentric layers; this component renders the
layers as stacked CSS 3D planes with per-shell scale (100%→10% in
10% steps) and head-pose-driven offsets.

v0.1 is CSS 3D — `translate3d` + `scale` per shell, `perspective`
on the container. The Wave D upgrade lifts this to WebGPU TSL
behind the same `shells` prop surface — render technology
changes; the affordance does not.

## Public surface

- `ParallaxShells({ shells, depthStep?, perspective?, className? })`
- Type `ParallaxShellsProps`.

## Internal

- `SHELL_INDICES: ShellIndex[]` — fixed 1..10 array for stable
  render order (innermost to outermost).
- Reads `world.parallax` + `world.visibleShells` from the slice.
- Per-shell transform: `translate3d(offset.x, offset.y,
  -(10-n)*depthStep) scale(n/10)`. Shell 10 sits at z=0 and scale
  1.0; shell 1 at z=-9*depthStep and scale 0.1.

## Depends on

- `react` — `ReactNode`, `CSSProperties`.
- `lib/state/world` — `useWorldStore`, `shellScale`, `ShellIndex`.

## Does not

- **Does not own head-pose.** Pairs with
  `useParallaxFromHeadPose` (sibling component-hook) that reads
  `input.headPose` and writes per-shell offsets to `world.parallax`.
  This component is pure rendering.
- **Does not handle shell-content lifecycle.** Each shell slot
  receives whatever ReactNode the caller passes; mounting / unmount
  / animation is the caller's concern.
- **Does not own the world clock.** No per-frame loop. Re-renders
  on slice change (which the parallax hook drives at the right
  cadence).
- **Does not enforce content sizing.** Each shell `<div>` is
  `absolute inset-0`. Inner content controls its own layout.
- **Does not WebGPU.** The v0.1 implementation is intentionally
  CSS 3D. Lift later behind the same prop surface.

## Plug surface

- **State plugs (read):** `world.parallax`, `world.visibleShells`.
- **Type plugs:** input ReactNode array of length 10; no return.
- **Dependency plugs:** none (entry-level component).

## Bordering files

- `lib/state/world.ts` — slice + `shellScale` helper.
- `components/world/use-parallax-from-headpose.ts` (sibling) —
  the hook that drives offsets from head pose.
- `lib/capabilities/input/headpose.ts` — source of the head-pose
  values the hook reads from the input slice.
- Future `app/demo/parallax-shells/page.tsx` — first user.
- Future `components/world/parallax-shells-tsl.tsx` (Wave D) —
  the WebGPU TSL replacement.

## How the studio's architecture lands here

The parallax shells are the *peer-into-the-castle* affordance.
Shell 9 is the condensed London caricature (CCTV markers + open
data). Shell 8 might be the Charming Academy. Shell 5 is the
workshop chrome. Shell 1 is Aura's body — Pipeline Epsilon
attractor + 50k particles. The user moves their head; the layers
shift; the studio's depth becomes legible without any explicit
navigation gesture.
