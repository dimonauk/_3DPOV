# Attributions

The public ledger of open-source code we have lifted, parameters
or shader math we have borrowed, and reference implementations we
consulted while building the Holoflow Studio substrate.

Per the migration ritual at `docs/MIGRATION_PRINCIPLES.md`, no
external repo is vendored or re-exported as-is. Lifted code is
re-typed to our contract, re-shaped to our slice surface, and
credited here + in the lifted file's header preamble.

If you are an author whose work appears here and would like the
attribution adjusted, please open an issue.

## Box 3 — open-source quarry lifts

### Pipeline Epsilon — `lib/capabilities/viz/attractor.ts`

**Source:** [merrypranxter/strange_attractors](https://github.com/merrypranxter/strange_attractors) — MIT licence.

**Lifted:**

- Iteration kernels for Clifford, Lorenz, and Thomas attractors
  (re-typed to our `Step` function shape).
- Canonical parameter sets (a, b, c, d for Clifford; σ, ρ, β for
  Lorenz; b for Thomas).

**Modified:**

- Dropped their de Jong and Aizawa engines (not in our canon).
- Added a fourth engine — Dequan Li — from canonical attractor
  literature (Dequan Li 2009).
- Stripped the GPGPU texture-ping-pong renderer entirely.
  v0.1 is CPU iteration; the GPGPU pattern is the v0.2
  upgrade target behind the same `generateAttractor()` surface.
- Removed Three.js demo scaffolding; output is a typed
  `Float32Array` the studio's component layer renders.
- Wired engine selection to `aura.mood` via the
  `engineFromMood()` canon mapping — original was UI-only.

## Box 3 — bibliography (consulted, not lifted)

These influenced design decisions or are tracked as future
reference, but no code was taken.

- [daybarr/lorenz-webgl](https://github.com/daybarr/lorenz-webgl) — Lorenz-specific reference.
- [artmen1516/threejs-lorenz-attractor](https://github.com/artmen1516/threejs-lorenz-attractor) — Three.js-native Lorenz.
- [wshahbaz/Strange_Attractors](https://github.com/wshahbaz/Strange_Attractors) — multi-engine reference.
- [QC20/Attractor](https://github.com/QC20/Attractor) — Thomas-specific.

## Hangar (Box 1) — internal monorepo derivation

The Hangar is Dimona's private monorepo at `D:\The_Hangar\`. Many
capabilities started life there. These are *not* third-party
lifts — they are atomisations of internal work — but they're
documented here for clarity:

| Capability / module | Hangar source |
| --- | --- |
| `vrm.load` | `webgpu-particles-library/apps/07-aura-alive/main.js` (VRM mount section) + `@pixiv/three-vrm` canonical pattern |
| `motion.idle` | `webgpu-particles-library/apps/07-aura-alive/main.js` (idle loop shape) |
| `viz.particles` | `webgpu-particles-library/` (50k particle library, atomised) |
| `audio.tts` provider shape | `webgpu-particles-library/ws_ai_bridge.py` (provider routing pattern) |
| `audio.stt` provider shape | `webgpu-particles-library/ws_ai_bridge.py` (Whisper provider) + `Dolly_OS` voice store |
| `audio.visemes` timing shape | `apps/07-aura-alive/main.js` (lipsync timing) |
| `vrm.expressions.blend` blend shape | `apps/07-aura-alive/main.js` (mood + viseme layered weights) |

## Real npm dependencies

These stay as proper dependencies and are *not* lifted (we use
their APIs; we don't fork them):

- `@pixiv/three-vrm` (MIT) — VRM loader + humanoid types.
- `three` (MIT) — geometry, scene graph, GLTFLoader.
- `@react-three/fiber` (MIT) — R3F runtime.
- `@react-three/drei` (MIT) — OrbitControls + helpers.
- `@google/generative-ai` (Apache-2.0) — Gemini SDK for
  `agent.dialogue`.
- `zustand` (MIT) — the state-bus.
- `next` (MIT), `react` (MIT), `react-dom` (MIT).
- `@mediapipe/tasks-vision` (Apache-2.0) — head-pose tracking
  (when wired into `input.headpose`).
- `tailwindcss` (MIT) — styling.
- `firebase` (Apache-2.0) — auth + Firestore for the Rookery.
- `sharp` (Apache-2.0) — image processing.

Full dependency list lives in `package.json`. License texts are
under `node_modules/<pkg>/LICENSE` per pnpm's install.

## Reference architectures (consulted, not lifted)

Patterns the substrate references conceptually without lifting
implementation code:

- [AkshitIreddy/Interactive-LLM-Powered-NPCs](https://github.com/AkshitIreddy/Interactive-LLM-Powered-NPCs) — pre-conversation-file pattern + vector-store memory loop. Influences the v0.2 `agent.memory` upgrade path (currently Jaccard; will become embeddings + retrieval).
- [agent-topia/evolving_personality](https://github.com/agent-topia/evolving_personality) — dynamic-personality drift ledger. Influences the `aura.nudgeOcean` + `aura.ledger` design.
- ChatVRM — character bible + lipsync pattern. Influences `lib/cast/<name>.ts` shape (no code lifted).
- HairyDuck/terminal + CSS-Tricks Old Timey Terminal — CRT
  surface treatment for the workshop shell (future).
