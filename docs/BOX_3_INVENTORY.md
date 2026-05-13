# Box 3 — open-source quarry inventory

**Box 3** is the open-source-toys-box-of-Legos next to Hangar (Box 1)
and Holoflow Studio (Box 2). It is a *quarry*, not a dependency
graph. Every toy here gets mined for parts, ported to our types, and
forgets it was ever a library. We could write each of these
ourselves; we don't, because working code beats unwritten code and
the studio has things to ship.

**Border discipline:** see `docs/MIGRATION_PRINCIPLES.md` (queued).
TL;DR: lift, rewrite to our conventions, strip UI, atomise to a
capability, credit in file header + `docs/ATTRIBUTIONS.md`.

**File cap:** every file we make is under 300 lines. Past that, it
splits into a folder. Applies here too — when this inventory grows,
it becomes `docs/box-3/<kind>.md` per kind.

## Status legend

- `📋 queued` — identified, not yet examined
- `🔍 examined` — read the source, scoped the lift
- `🔨 lifted` — code ported, capability registered
- `📚 bibliography` — kept as reference, not lifted

## Pipeline Epsilon — strange attractors

| Toy | Status | Lift | Target capability |
|---|---|---|---|
| `merrypranxter/strange_attractors` | 🔍 | GPGPU 512×512 RGBA32F ping-pong texture pattern; Clifford / Thomas / Lorenz shader fragments. Drop their de Jong + Aizawa. | `viz.attractor` |
| `daybarr/lorenz-webgl` | 📚 | Lorenz-specific reference implementation | — |
| `artmen1516/threejs-lorenz-attractor` | 📚 | Three.js-native Lorenz | — |
| `wshahbaz/Strange_Attractors` | 📚 | Multi-engine reference | — |
| `QC20/Attractor` | 📚 | Thomas-specific | — |
| *(write our own)* | 📋 | Dequan Li attractor shader | `viz.attractor` (fourth engine) |

## VRM runtime — already-real dependency line

| Toy | Status | Role |
|---|---|---|
| `@pixiv/three-vrm` | 🔨 (npm) | Real dep, stays a dep — maintained, versioned. We lift no code from it; we use its API. |
| `three-vrm-springbone` | 📋 | Already in dep chain; consult for `vrm.lookAt` polish |
| `ChatVRM` | 🔍 | Crib lipsync timing + character bible pattern. Drop the Next.js demo skin entirely. |
| `react-three-npc` | 📋 | Examine for `agent.dialogue` + `vrm.lookAt` composition pattern |

## Agent runtime — character bibles, memory, dialogue

| Toy | Status | Lift | Target capability |
|---|---|---|---|
| `AkshitIreddy/Interactive-LLM-Powered-NPCs` | 🔍 | Pre-conversation file format (per-character bible); embed-then-retrieve memory loop. Drop the Unity wrapper. | `agent.memory`, `lib/cast/*.ts` |
| `agent-topia/evolving_personality` | 🔍 | Dynamic-personality drift ledger pattern (their MBTI; we map to OCEAN). Drop their MBTI types. | `agent.dialogue` (mood drift) |
| `choosewhatulike/trainable-agents` | 📚 | Character-LLM role-play reference | — |
| `litanlitudan/skyagi` | 📚 | Generative Agents memory/reflection loop reference | — |
| `alfiinyang/personalityai` | 📚 | Personality-driven agent reference | — |
| `yuka.js` | 📋 | Steering behaviours for NPC autonomous movement in Shell 9 | `motion.npc-steering` (future) |

## Shell 9 — condensed London + CCTV + open data

| Toy | Status | Lift | Target capability |
|---|---|---|---|
| `MapLibre GL JS` | 🔨 (npm) | Real dep — maintained, versioned. Use API; lift no code. | `world.london-map` |
| `maplibre-three-plugin` | 📋 | Three.js ↔ MapLibre bridge for VRM placement on map | `world.london-map` |
| OpenStreetMap CCTV markers (Overpass API) | 📋 | Open data source — cache to SQLite per `docs/CCTV_PIPELINE.md` | `world.cctv-markers` |
| TfL Open Data | 📋 | Live transport data | `world.tfl-live` (future) |

## Cereal-box TUI — cyberpunk CRT surface

| Toy | Status | Lift | Target |
|---|---|---|---|
| `HairyDuck/terminal` | 🔍 | Retro-CRT shaders: flicker, scanlines, glitch, phosphor curvature | `components/shell/crt-finish.tsx` |
| CSS-Tricks "Old Timey Terminal" | 🔍 | Vignette + barrel-distortion CSS layer | same |
| Aleclownes CRT pen | 🔍 | Chromatic-aberration filter | same |
| Existing `workshop-shell.tsx` scanlines | 🔨 | Already landed; CRT layer extends it | — |

## 10-shell parallax — Russian doll z-layers

| Toy | Status | Lift | Target |
|---|---|---|---|
| CodePen translateZ + perspective patterns | 🔍 | `transform: translateZ(-N) scale(N+1)` formula + parented perspective context | `components/world/parallax-shells.tsx` v0.1 (CSS 3D) |
| Multi-layer translateZ demos | 🔍 | Depth-curve scaling math (100→10% across 10 shells) | same |
| *(write our own — later)* | 📋 | WebGPU TSL port of the same affordance | same v1.0 |

## Splat pipeline — single-image gaussian splats

| Toy | Status | Lift | Target |
|---|---|---|---|
| `Spark` (Apple SHARP, Dec 2025 release) | 🔨 (lib) | Real lib — install + use. Lift no code. | `viz.splat` (future) |
| Hangar SHARP integration | 📋 | Existing setup notes at `docs/SHARP_PIPELINE.md` | same |

## Visual novel / cast dialogue UI

| Toy | Status | Lift | Target |
|---|---|---|---|
| `Pixi'VN` | 🔍 | Visual-novel character dialogue + branching narrative engine. Examine for cast scene composition. | `components/cast/scene.tsx` (future) |

## Particle systems — already in Hangar

The 50k+ particle library at `webgpu-particles-library/` is **Box 1**,
not Box 3 — it's ours, just locked in an app. Atomises to
`viz.particles` per Wave 1 of the registry plan. Listed here only to
distinguish ownership.

## Head-pose tracking

| Toy | Status | Lift | Target |
|---|---|---|---|
| MediaPipe Tasks Vision (Face Landmarker) | 🔨 (lib) | Real lib — use API. | `input.headpose` |
| WebXR head-pose | 🔨 (browser) | Native; first in priority chain | same |
| Mouse-fallback pattern | 📋 | Our own — write under priority chain | same |

## What is NOT in Box 3

Real maintained libraries with release cadences and maintainers stay
as proper npm dependencies. We don't fork, we don't crib, we use the
API:

- Three.js, @react-three/fiber, @react-three/drei
- @pixiv/three-vrm
- MapLibre GL JS
- MediaPipe Tasks
- Spark (Apple SHARP)
- Tailwind, Next.js, React, Firebase, Stripe

Box 3 is *only* demo-grade quarry: pens, gists, "look what I made"
repos, course-project repos. The stuff with no maintenance contract.

## What ships first (Box 3 → Box 2 ramp)

1. `viz.attractor` — fork `merrypranxter/strange_attractors`, swap one
   engine to Dequan Li, wire to `aura` slice. Pipeline Epsilon body.
2. `crt-finish` component — borrow scanline/barrel/flicker from CRT
   pens, layer over `workshop-shell.tsx`.
3. `parallax-shells` v0.1 — CSS 3D ten-shell wrapper, palette tied to
   the 5-mode pie. WebGPU TSL port comes later (Wave D).
4. `agent.memory` — pre-conversation file format + embed-then-retrieve
   from `Interactive-LLM-Powered-NPCs`. Penny/Baby/Marcel bibles
   first.

Each lift carries credit at the top of its target file + an entry in
`docs/ATTRIBUTIONS.md` (to be created with the first real lift).
