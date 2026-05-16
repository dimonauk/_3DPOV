# `wardrobe-client.tsx` — purpose twin

## Role

The client-side bridge for `/aura/wardrobe`. Mounts the R3F
Canvas, drops Aura into her auraDefault pose, starts the idle
breath/blink loop, and accepts .vrm file drops anywhere on the
viewport. Each dropped file becomes a clickable "Wear X" chip on
the bottom rail. Clicking a chip calls the
`vrm.wardrobe.swap` capability — outfit textures land on the
live rig, no reload.

## Public surface

- Default export `WardrobeClient({ url })` — `url` is the base
  rig (Aura's main .vrm).

## Internal

- `handleId` state — first VRM handle the slice carries. Pose +
  idle attach to it.
- `outfits` state — registered outfit list (in-memory only, no
  IndexedDB persistence at this surface).
- `activeId` state — which outfit chip is currently worn.
- `status` state — short human-readable status string on the
  rail ("Applying X…", "5 outfits added.").
- `busy` state — disables wear buttons while a swap is in flight.
- `dragging` state — toggles the "drop .vrm to dress her" overlay.
- `registerOutfitFiles(files)` — filters .vrm extensions, reads
  each as `ArrayBuffer`, pushes onto `outfits`. Auto-wears the
  first one if nothing is active.
- `wear(outfit)` — calls `swapOutfit(handleId, buffer)`, updates
  active ID + status from the result.
- `removeOutfit(id)` — drops it from the in-memory list.

## Depends on

- `@react-three/fiber` — `<Canvas>`.
- `@react-three/drei` — `<OrbitControls>`.
- `components/three/VRMAvatar` — the rig.
- `lib/capabilities/vrm/pose` — `setNamedPose`.
- `lib/capabilities/motion/idle` — idle loop.
- `lib/capabilities/vrm/wardrobe` — `swapOutfit`.
- `lib/state/vrm` — `vrmStore.subscribe` for handle pickup.
- `lib/log` — namespaced logger
  (`route:/aura/wardrobe`).

## Does not

- **Does not persist outfits.** Refreshing the page clears the
  rail. IndexedDB persistence belongs in a future
  `vrm.wardrobe.persist` capability so the rail can also live
  outside this route.
- **Does not generate thumbnails.** The source aura-vrm app
  rendered each outfit to a small canvas; that's a heavier
  step (offscreen Canvas + render pass) and skipped for v1 to
  keep the port lean.
- **Does not own the rig.** `VRMAvatar` does. This client only
  triggers material swaps on whatever rig the slice contains.
- **Does not own the dialogue / TTS loop.** That's on
  `/demo/aura-talks` and downstream of `agent.dialogue`.

## Bordering files

- `app/aura/wardrobe/page.tsx` — server-component shell.
- `lib/capabilities/vrm/wardrobe.ts` — the capability this
  client wires.
- `components/three/VRMAvatar.tsx` — the rig renderer.
- `lib/state/vrm.ts` — the slice subscription source.

## Overlap with existing surfaces

- `/demo/vrm` — same VRMAvatar + named-pose pattern; this route
  layers wardrobe on top.
- `/demo/aura-talks` — same VRMAvatar + idle loop; orthogonal
  feature (sound vs. clothes).
- `/aura/web-llm` — text-only chat, no VRM, no overlap.
