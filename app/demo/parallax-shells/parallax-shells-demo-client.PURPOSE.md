# `parallax-shells-demo-client.tsx` — purpose twin

## Role

The client-side wire for `/demo/parallax-shells`. Starts the
mouse-driven head-pose tracker, hooks the parallax-from-headpose
loop, renders 10 labelled placeholder shells through the
`ParallaxShells` wrapper. The end-to-end proof that the substrate
works.

## Public surface

- Default export `ParallaxShellsDemoClient` — no props.

## Internal

- `SHELL_PALETTE` — purple-to-orange ramp across the 10 shells.
- `SHELL_LABELS` — labels referencing the studio's planned shell
  content (innermost is Aura's body; outermost is workshop
  frame).
- `ShellPlaceholder` — renders a centred bordered box; size grows
  with shell index so deeper shells are visually smaller (matches
  the world-wrapper's scale step).

## Depends on

- `components/world/parallax-shells` — the wrapper component.
- `components/world/use-parallax-from-headpose` — the head-pose
  → parallax hook.
- `components/hooks/useHeadPose` — starts the input.headpose
  capability.

## Does not

- **Does not have real content.** Placeholders for v0.1. When
  real shell content lands (Aura's body, London map, academy
  scene), each shell's slot gets a real component.
- **Does not render in 3D.** CSS 3D only. Wave D will replace.
- **Does not handle XR.** Mouse-only head-pose for v0.1. When
  WebXR support lands in `input.headpose`, this demo will gain
  XR support for free.

## Bordering files

- `app/demo/parallax-shells/page.tsx` — server shell.
- `components/world/parallax-shells.tsx` — wrapper.
- `components/world/use-parallax-from-headpose.ts` — hook.
- `components/hooks/useHeadPose.ts` — input bridge.
- `lib/state/world.ts` + `lib/state/input.ts` — slices.
