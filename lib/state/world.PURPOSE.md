# `world.ts` — purpose twin

## Role

The shared state-bus for the 10-shell Russian-doll parallax
architecture. Tracks which shell the user is focused on, the
parallax offset per shell (head-pose-driven), and the set of
currently-visible shells.

## Public surface

- `useWorldStore` / `worldStore`.
- Types: `ShellIndex`, `WorldState`, `WorldActions`.
- `shellScale(n)` — pure helper that returns the 10% step per
  shell (shell 10 = 100%, shell 1 = 10%). Co-located with the
  slice because every consumer of the slice needs it.

## Internal

- `emptyParallax` — zero offsets for all ten shells, the
  default state.
- `initial` — focus shell 5, all shells visible.

## Depends on

- `zustand`. No other slice.

## Does not

- **Does not render shells.** The `components/world/parallax-shells.tsx`
  component (future) reads this slice and renders. The slice only
  holds state.
- **Does not compute parallax from head-pose.** The
  head-pose → parallax mapping is a capability
  (`input.headpose` writes to `state.input`, a
  capability reads it and writes here). The slice trusts what's
  written.
- **Does not determine shell *content*.** What lives in shell 9
  (the London caricature), shell 1 (Aura's body), etc., is
  determined by the components mounted into each shell.
- **Does not handle WebGPU TSL geometry.** When the v0.1 CSS-3D
  parallax is replaced by a WebGPU TSL render, this slice stays
  unchanged — the slice is renderer-agnostic.

## Bordering files

- `components/world/parallax-shells.tsx` (future) — the v0.1 CSS-3D
  renderer.
- `lib/state/input.ts` — head pose drives parallax offsets.
- `lib/state/vrm.ts` — VRMs distributed across shells (Shell 9
  London VRMs lean back when user leans).
- `docs/ARCHITECTURE.md` — substrate section describes how this
  slice underpins the WebGPU TSL world.
- `docs/BRICK_LANGUAGE.md` — the world is the play area; bricks
  live inside it.
