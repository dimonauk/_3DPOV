# `loop-status.tsx` — purpose twin

## Role

A label-only live read-out from the `chrono-protocol` slice. The
splat-library page at `/play/neo-london` surfaces the runner's
live values (phase / zone / mode / speed) inside its existing
layout without any gameplay. The widget is a single subscriber to
four slice keys; it has no rAF, no input, no side-effects.

## Public surface

- `LoopStatus` — a `"use client"` component, no props.

## Internal

- Four `useChronoProtocolStore` selectors, one per displayed key.
  Selector-based subscriptions keep re-renders cheap when other
  slice keys move.

## Depends on

- `lib/state/chrono-protocol` — the slice.

## Does not

- **Does not render gameplay.** No canvas, no scene; an HTML pill.
- **Does not write to the slice.** Read-only.
- **Does not mount the runner.** The widget can render even when
  `<GameLoopRunner />` is unmounted — values reflect the last
  state the slice held.

## Bordering files

- `lib/state/chrono-protocol.ts` — the slice this reads.
- `components/chrono-protocol/game-loop-runner.tsx` — the
  orchestrator that writes the values surfaced here.
- `app/play/neo-london/page.tsx` — the splat-library page that
  embeds this widget.
