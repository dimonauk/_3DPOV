# `aura-talks-client.tsx` — purpose twin

## Role

The client-side bridge for `/demo/aura-talks`. Mounts the R3F
Canvas, applies the auraDefault pose, starts idle + blend loops,
and exposes a "speak" button that runs the full lipsync chain
(TTS + viseme cursor + expression blend) on whatever line the
user types. Mood buttons let the viewer swap Aura's mood and
watch her stance + face shift live.

## Public surface

- Default export `AuraTalksClient({ url, defaultLine })`.

## Internal

- `handleId` state — tracks the first loaded VRM handle.
- `line` state — controlled input for the spoken text.
- `speaking` state — disables the button while TTS is in flight.
- `MOODS` array — visible mood-button set in display order.
- `handleSpeak()` — fires `visemes.start()` in parallel with
  `speak()`, awaits TTS, stops the visemes cursor. Tries/finallies
  so a TTS error still tears down the cursor.

## Depends on

- `@react-three/fiber` — `<Canvas>`.
- `@react-three/drei` — `<OrbitControls>`.
- `components/three/VRMAvatar` — the rig renderer.
- `lib/capabilities/vrm/pose` — `setNamedPose`.
- `lib/capabilities/motion/idle` — `startIdle` / `stopIdle`.
- `lib/capabilities/vrm/expression` — `startBlend` / `stopBlend`.
- `lib/capabilities/audio/tts` — `speak`.
- `lib/capabilities/audio/visemes` — `start` / `stop` /
  `estimateDurationMs`.
- `lib/state/aura` — `useAuraStore` for mood read + write.
- `lib/state/vrm` — `vrmStore.subscribe` for handle pickup.

## Does not

- **Does not own capabilities.** Every capability invocation goes
  through its public surface; this client never reaches into a
  capability's internals.
- **Does not own the dialogue loop.** When `agent.dialogue` lands,
  it will own the speak-on-LLM-response flow. This demo is the
  *manual* version: user types, button speaks. Same chain.
- **Does not lock mood to dialogue intent.** Mood buttons here
  are explicit overrides; in production `agent.dialogue` writes
  to mood based on the LLM's intent output.
- **Does not handle multiple speakers.** Single VRM, single
  viseme cursor.

## Bordering files

- `app/demo/aura-talks/page.tsx` — server-component shell.
- `components/three/VRMAvatar.tsx` — the rig renderer.
- `lib/capabilities/audio/*` — TTS + visemes.
- `lib/capabilities/vrm/*` — pose + expressions + load.
- `lib/capabilities/motion/idle.ts` — breath + blink layer.
