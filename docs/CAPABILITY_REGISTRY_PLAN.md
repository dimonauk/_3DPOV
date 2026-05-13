# Capability Registry — atomisation plan

**Status:** scaffold landed (`lib/capabilities/`), 14 stubs registered, no
modules yet. This document is the work-order to populate them.

## Why this exists

Three boxes converge on one shape.

- **Box 1** (The Hangar, private). Working code locked inside demo apps
  and crafting sessions. The plan: atomise it as we migrate.
- **Box 2** (Holoflow Studio, this repo). Where the atomised
  capabilities live, organised under `lib/capabilities/<kind>/<verb>.ts`.
- **Box 3** (open-source quarry). Demo-grade repos and pens that we
  break apart, take parts from, and re-form to our types. We could
  write each ourselves — we don't, because *working code is faster than
  unwritten code* and we have a studio to ship.

The capability registry is the single common shape every artefact
reaches when it crosses any border into Box 2. No exceptions.

## The contract

Every capability:

1. Lives at `lib/capabilities/<kind>/<verb>.ts` — single responsibility,
   one file.
2. Exports typed entry points — no `any`, `noUncheckedIndexedAccess`-clean.
3. Owns no UI. Capabilities are headless.
4. Owns no state. Shared state lives in zustand slices under
   `lib/state/`. Capabilities read and write slices.
5. Registers in `lib/capabilities/index.ts` with a `CapabilityId`,
   metadata, lazy `load()`, and the slices it touches.
6. Carries credit in a file-header comment + an entry in
   `docs/ATTRIBUTIONS.md`.

Border test: if it imports `react`, calls `useState`, returns JSX, or
touches `window.x` outside of a feature-detect, it is not a capability
yet. Refactor or reject.

## Why zustand is non-negotiable for this

The capability registry without a state backbone is just twelve files
that can't talk to each other.

- Composability requires shared state. `vrm.expressions.blend` driven
  by `audio.visemes` driven by `audio.tts` requires all three to write
  to slices the others observe.
- Headlessness requires shared state. If a capability owns its state,
  it owns a lifecycle, which means it owns a place in a component tree
  — which it does not.
- React-context fan-out gets brittle at this many independent
  capabilities. Zustand's selector-subscriber pattern is the cheapest
  way to keep dozens of capabilities composable without re-renders.

Slice layout we'll commit to:

| Slice | Owns |
|---|---|
| `lib/state/vrm.ts` | Loaded VRM handles, current pose target, expression weights |
| `lib/state/audio.ts` | STT transcript stream, TTS queue, viseme stream |
| `lib/state/aura.ts` | Aura's OCEAN vector, current mood, current ChronoMode |
| `lib/state/cast.ts` | Per-character memory references, dialogue history |
| `lib/state/agent.ts` | Active turn state, pending intents |
| `lib/state/input.ts` | Head pose, gesture events, gamepad/XR controllers |
| `lib/state/viz.ts` | Attractor parameters, particle counts, active visualisations |
| `lib/state/shell.ts` | Workshop shell state (already exists at `lib/shell/state.ts`) |
| `lib/state/world.ts` | Current shell index (1–10), parallax depth, scene |

Each slice exports a `use<Slice>Store` hook + typed selectors. No slice
imports another. Cross-slice computation lives in capabilities, not in
slices.

## Wave 1 — atomise Aura-Alive (Hangar)

Source: `D:\The_Hangar\webgpu-particles-library\apps\07-aura-alive\`
+ `ws_ai_bridge.py` + `apps/aura-vrm/ARCHITECTURE_AURA.md`.

14 capability stubs are already registered (`lib/capabilities/index.ts`).
Each needs its module file.

### Atomisation map

| Stub | Source file in Hangar | Target file | Lift-and-rewrite scope |
|---|---|---|---|
| `vrm.load` | `aura-alive/main.js` (VRM mount section) | `lib/capabilities/vrm/load.ts` | Strip the canvas-setup, return a typed `VRMHandle`. Use `@pixiv/three-vrm` types. |
| `vrm.bones.pose` | `aura-alive/main.js` (bone-emitter section) | `lib/capabilities/vrm/pose.ts` | Pure function over the rig: `applyPose(handle, pose)`. No state. |
| `vrm.expressions.blend` | `aura-alive/main.js` (lipsync expression weights) | `lib/capabilities/vrm/expression.ts` | `blend(handle, weights)`. Mouth + brow + eye atoms separated. |
| `vrm.lookAt` | `aura-alive/main.js` (300ms orientation loop) | `lib/capabilities/vrm/look-at.ts` | `setLookTarget(handle, vec3)`. Eye + neck split with weighted bias. |
| `audio.stt` | `ws_ai_bridge.py` (Whisper route) | `lib/capabilities/audio/stt.ts` | Browser path via Web Speech API + server path via Whisper. Provider-agnostic. |
| `audio.tts` | `ws_ai_bridge.py` (TTS route) | `lib/capabilities/audio/tts.ts` | ElevenLabs / F5 / Kokoro providers behind a single typed surface. "Two paths both running" canon. |
| `audio.visemes` | `aura-alive/main.js` (lipsync timing) | `lib/capabilities/audio/visemes.ts` | Audio buffer + transcript → time-aligned viseme events. |
| `motion.idle` | `aura-alive/main.js` (idle loop) | `lib/capabilities/motion/idle.ts` | Breath + blink + weight-shift; reads `aura` slice for modulation. |
| `motion.gesture` | `aura-alive/main.js` (gesture trigger) | `lib/capabilities/motion/gesture.ts` | Named clip player; layers over idle. |
| `agent.dialogue` | `ws_ai_bridge.py` (LLM route) | `lib/capabilities/agent/dialogue.ts` | Single turn: bible + memory + prompt → text + intent + chosen mode. |
| `agent.memory` | _(crib from Box 3)_ | `lib/capabilities/agent/memory.ts` | Vector store per cast member; embed-then-retrieve pattern. |
| `input.headpose` | Hangar webcam + MediaPipe tracking | `lib/capabilities/input/headpose.ts` | Priority chain: WebXR > MediaPipe > Mouse > Touch > Neutral. |
| `viz.attractor` | _(crib from Box 3)_ | `lib/capabilities/viz/attractor.ts` | 4-engine GPGPU attractor field; reads `aura` slice for engine selection. |
| `viz.particles` | `webgpu-particles-library/` | `lib/capabilities/viz/particles.ts` | 50k+ particle library; bone-anchored emitters. |

### Order of operations

1. Land zustand + the 9 state slices listed above. Empty initial state
   is fine; the slice shape is what unlocks the rest.
2. `vrm.load` first — everything `vrm.*` depends on it.
3. `audio.tts` next — it has no dependencies and is testable in
   isolation. ElevenLabs provider first (closest to working), then
   F5/Kokoro behind the same interface.
4. `vrm.expressions.blend` + `audio.visemes` together — first
   cross-capability composition (lipsync). This is the integration
   test of the architecture.
5. `motion.idle` + `vrm.lookAt` — second composition (Aura is
   *alive on the screen*).
6. `agent.dialogue` + `agent.memory` — turn loop. This makes Aura
   *responsive*.
7. `input.headpose` — closes the loop the other direction. Aura looks
   back.
8. `viz.attractor` + `viz.particles` — Pipeline Epsilon visualisation.
   The body-of-mood that the article needs.

### What this delivers

When Wave 1 lands, the following compositions all work without any of
them being explicitly coded:

- **Lipsync**: `audio.tts → audio.visemes → vrm.expressions.blend`
- **Mood face**: `aura slice → vrm.expressions.blend`
- **Aura dancing the attractor she's feeling**: `aura slice →
  viz.attractor → motion.idle modulation`
- **NPC who knows you're looking at them**: `input.headpose → vrm.lookAt
  → agent.dialogue (look-aware prompt boost)`
- **Idle that modulates with character**: `Laban Effort axes (lib/math/laban.ts)
  → motion.idle parameters`
- **Cast-aware parallax**: `input.headpose → world slice → Shell 9
  VRM offsets (Penny leans back when you lean)`

None of these require new capabilities — they're all composition of
the 14. That's the whole point of the registry.

## Wave 2 — Pipeline Epsilon crib

Source: `merrypranxter/strange_attractors` (GPGPU, 5 engines).

- Take the 512×512 RGBA32F texture ping-pong pattern.
- Take Clifford / Thomas / Lorenz shader fragments.
- Drop their de Jong + Aizawa engines (not in our canon).
- Add Dequan Li as a fourth engine.
- Wire engine selection + parameter modulation to `aura` slice.
- Output GLB on commission demand (see `/services/auras-mood-printed`,
  to be wired).

Lands as: `lib/capabilities/viz/attractor.ts` + supporting shaders at
`lib/capabilities/viz/_attractor-shaders/`.

## Wave 3 — Agent memory crib

Source: `AkshitIreddy/Interactive-LLM-Powered-NPCs` (pre-conversation
files + vector store memory).

- Take the pre-conversation file format (per-character bible).
- Take the embed-then-retrieve loop.
- Drop their Unity wrapper entirely.
- Wire into `cast` slice — each cast member gets a stored memory
  reference.
- Re-shape to our character bibles at `lib/cast/<name>.ts`.

Lands as: `lib/capabilities/agent/memory.ts` + `lib/cast/<name>.ts`
files (Penny, Baby, Marcel, Betsy, Trixie, Millie, Tim, Scribe,
Excavation Bot, +5).

## Wave 4 — surface in the UI

After the modules are real:

- `/capabilities` route reads `listCapabilities()` and renders the
  registry as a browsable index. Status badges (registered / stub /
  deprecated). Filters by kind.
- Workshop shell `/run <capability-id>` command resolves through the
  registry and exposes the capability's typed surface as a TUI form.
- `/pipelines` route shows the cross-pollination compositions
  (lipsync, mood face, attractor-dance, etc) as live demos.

## What does NOT go in the registry

- Algorithms in `lib/algorithms/` — they have their own registry at
  `lib/algorithms/index.ts` and a different shape (`generate`,
  `generateGeometry`, `defaultParams`). They're sibling artefacts, not
  capabilities; both will be reachable from `/run` once the terminal
  bridge lands.
- Visualisers in `app/visualiser/` — these are *applications* that
  compose capabilities. Not capabilities themselves.
- React components — they belong in `components/`, never in
  `lib/capabilities/`. Even when "small."
- Anything in `lib/shopify/`, `lib/firebase/`, `lib/rookery/` — those
  are external-system clients, not capabilities. Capabilities can
  *call* them.

## Acceptance criteria for Wave 1

- 14 module files exist, each with a real `load()` returning a typed
  surface (no `Promise.resolve({})` stubs).
- All 14 statuses flip from `stub` to `registered`.
- Two live compositions ship in `/pipelines`: lipsync + mood face.
- Build green. Type-check clean. No `any`. Each file has a credit
  header.
- `docs/ATTRIBUTIONS.md` is created with one entry per cribbed source.
