# Shadrerapp atomisation plan

Source: `D:\.github\Shadrerapp` — "DollyOS Diagnostic & Shader Suite",
authored in Google AI Studio. React 19 + Vite 6 + Three 0.184 + R3F 9
+ Zustand 5 + Tailwind 4 + meyda (audio) + lz-string + qrcode.react +
html5-qrcode + motion + lucide-react. SPDX: Apache-2.0.

Three sub-apps in a tabbed shell:

1. **ShaderEditor** — full GLSL editor with R3F sphere preview,
   audio-reactive uniforms (meyda FFT), QR code-transfer, snippet +
   preset libraries, history (undo/redo), persistence, equirect
   export, custom uniforms, code folding, WebXR spatial preview.
2. **GazeHeatmap** — yaw/pitch gaze sample stream → equirect heatmap
   with saccade detection, dwell zones, scanpath statistics, temporal
   weighting.
3. **DollySystem** — diagnostic panel (sidebar + main stage + detail
   panel) with boot-sequence logging and uptime.

Per `docs/ARCHITECTURE.md` Rule 3 (Atomise on Entry), nothing crosses
the border as a vendored folder. Each piece is shredded to capability
shape, rewritten to studio conventions, stripped of AI Studio shell
furniture, registered, credited.

## Tech-stack overlap

| Shadrerapp dep | Holoflow has | Action |
|---|---|---|
| react 19 | react 19 | match — pass through |
| three 0.184 | three 0.171 | Holoflow stays on 0.171; tweak shader code only if 0.184 APIs are used |
| @react-three/fiber 9 | @react-three/fiber 9 | match |
| @react-three/drei 10.7 | @react-three/drei 10 | match |
| @react-three/postprocessing 3 | @react-three/postprocessing 3 | match |
| zustand 5 | zustand 5 | match |
| @google/genai 1.29 | @google/genai 2.2 | use 2.2 |
| meyda 5.6 | **missing** | add `pnpm add meyda` |
| lz-string 1.5 | **missing** | add `pnpm add lz-string` (QR payload compression) |
| qrcode.react 4.2 | qrcode + qr-code-styling | use existing — replace `qrcode.react` calls with `qr-code-styling` (better branding hooks) |
| html5-qrcode 2.3 | qr-scanner | use existing `qr-scanner` |
| lucide-react 0.546 | @heroicons/react 2 | swap icon imports (cosmetic) |
| motion 12 | **missing** | already partial via tailwind — decide per component; Aura uses CSS transitions, AuraTron uses raw rAF |
| tailwind 4 | tailwind 4 | match |

**Net new deps**: `meyda` (real-time FFT) + `lz-string` (QR payload
compression). Everything else either matches or has a Holoflow
equivalent.

## Capability map

Eight new capabilities + three lib modules, plus one new chamber per
sub-app.

### New capabilities

| Capability | Source files | Notes |
|---|---|---|
| `viz.shader-editor` | `apps/ShaderEditor/index.tsx`, `Scene.tsx`, `EditorStation.tsx`, `useUniformDetection.ts`, `useHistory.ts` | The full GLSL editor + R3F preview as one capability. Mounts into a chamber (see below). |
| `viz.shader-preset` | `apps/ShaderEditor/components/PresetLibrary.tsx` + `constants.ts` PRESETS | Preset registry + render. Headless registry split from React component. |
| `viz.shader-snippet` | `apps/ShaderEditor/components/SnippetLibrary.tsx` | Snippet registry. Same split. |
| `viz.shader-export` | `apps/ShaderEditor/hooks/useShaderExport.ts` | Equirect / cubemap render from a compiled shader. Chains with `viz.spatial-export` (existing) for SBS-MP4 output. |
| `audio.spectrum` | `apps/ShaderEditor/hooks/useAudio.ts` (meyda) | Real-time FFT → low/mid/high/volume bands. Companion to existing `audio.stt` / `audio.tts` / `audio.visemes`. |
| `media.qr-transfer` | `apps/ShaderEditor/components/QRTransfer.tsx` | Peer-to-peer payload via QR (encode + scan), lz-string compressed. Chunked for payloads > QR capacity. |
| `input.gaze` | `apps/GazeHeatmap/index.tsx` (sample stream parts) | Yaw/pitch gaze sample stream. Companion to existing `input.headpose`. |
| `viz.heatmap-equirect` | `apps/GazeHeatmap/components/HeatmapViewport.tsx` + `libs/heatmap-utils.ts` | Render an equirect heatmap from a gaze sample stream. |

### New lib modules

| Lib | Source | Destination | Note |
|---|---|---|---|
| GLSL helpers | `libs/glsl-utils.ts` (214 lines) | `lib/math/glsl/` (folder split per Rule 1) | Named-string registry of HASH/NOISE/SDF/COLOR/FBM/etc. Split: `lib/math/glsl/hash.ts`, `noise.ts`, `sdf.ts`, `color.ts`, `index.ts` (assembly + `injectLibs()`). |
| Color helpers | `libs/color-utils.ts` (45 lines) | `lib/math/color.ts` | Single file under cap. |
| Spherical + signal math | `libs/math-utils.ts` (79 lines) | `lib/math/spherical.ts` + `lib/math/signal.ts` | Split SphericalMath + SignalMath into siblings. |
| Heatmap generator | `libs/heatmap-utils.ts` (88 lines) | `lib/algorithms/heatmap.ts` | Joins existing `lib/algorithms/` registry. |

### New atelier chambers

| Chamber | Wires | Where |
|---|---|---|
| `/atelier/shader-station` | `viz.shader-editor`, `viz.shader-preset`, `viz.shader-snippet`, `viz.shader-export`, `audio.spectrum`, `media.qr-transfer` | `app/atelier/shader-station/{page.tsx, shader-station-client.tsx}` |
| `/atelier/gaze-heatmap` | `input.gaze`, `viz.heatmap-equirect` | `app/atelier/gaze-heatmap/{page.tsx, gaze-heatmap-client.tsx}` |

The DollySystem panel is mostly UI shell — `workshop-shell.tsx` +
`bottom-terminal.tsx` already cover that ground in Holoflow. Skip
the panel chrome; lift only the boot-sequence pattern if it's wanted.

## What to STRIP at the border

Per Rule 3, the following are AI-Studio scaffolding, not substance:

- `src/systems/SystemShell.tsx` + `src/systems/shellConfig.ts` —
  tabbed app launcher + theme tokens. Holoflow has `WorkshopShell`
  and Tailwind `@theme` tokens. Drop entirely.
- `src/hooks/useTheme.ts` — single-source theme hook. Use Tailwind +
  `app/globals.css` `@theme` instead.
- `src/apps/*App.tsx` orchestrators — the outer wrappers exist only
  to bridge the SystemShell. The `index.tsx` inside each sub-app
  carries the real composition.
- Inline `style={{ ... }}` blocks everywhere — port to Tailwind
  classes following the studio's design tokens (`chrome-100`,
  `pink-200`, `warm-black-*`, `font-mono`).
- `useLogger.ts` (×3 — one per sub-app) — Holoflow has `lib/log.ts`
  with `createLogger(scope)`. Re-use it; drop the per-app loggers.
- Lucide icons — swap for `@heroicons/react/24/outline`. Mechanical.
- `qrcode.react` — swap for the studio's existing `qr-code-styling`
  branding helper (see `lib/qr.ts`).
- `html5-qrcode` — swap for `qr-scanner` already in package.json.

## What to KEEP verbatim (almost)

- `libs/glsl-utils.ts` GLSL_LIBS table — these are battle-tested shader
  fragments (Inigo Quilez-style hashes, fbm, sdf primitives). Crediting
  goes in `docs/ATTRIBUTIONS.md` per Rule 3 step 5. Split by topic into
  `lib/math/glsl/*.ts` and re-export.
- `useShaderStore` zustand slice — already matches studio Rule 2.
  Rename to `viz` slice in `lib/state/viz.ts` (which already exists per
  the architecture canon) and *merge* the relevant keys. Some current
  `viz.ts` slots (attractor params, particle counts) will sit alongside
  the new shader keys.
- `useHistory` undo/redo hook — pure logic, ports as
  `lib/capabilities/viz/shader-history.ts` (or stay as a hook in
  `components/hooks/use-shader-history.ts`).
- `PRESETS` map — moves to a `lib/algorithms/shaders/` sibling of the
  existing 30 algorithms (matches `/atelier/algorithms` pattern).

## Migration order (commits)

Eleven commits, each independently reviewable + revertable. Land in
sequence; don't merge to main until the chamber smoke-tests render.

| # | Commit | Files touched | Rough size |
|---|---|---|---|
| 1 | `deps: add meyda + lz-string` | `package.json`, `pnpm-lock.yaml` | small |
| 2 | `lib/math: split GLSL helpers into typed registry` | new `lib/math/glsl/{hash,noise,sdf,color,index}.ts` + `docs/ATTRIBUTIONS.md` entry | medium |
| 3 | `lib/math: spherical + signal helpers from gaze-heatmap` | new `lib/math/spherical.ts`, `lib/math/signal.ts` | small |
| 4 | `lib/algorithms: heatmap generator` | new `lib/algorithms/heatmap.ts` + index entry | small |
| 5 | `lib/algorithms/shaders: preset + snippet libraries` | new `lib/algorithms/shaders/{presets,snippets,index}.ts` | medium |
| 6 | `audio.spectrum capability (meyda)` | new `lib/capabilities/audio/spectrum.{ts,server.ts,PURPOSE.md}`, registry entry | small |
| 7 | `media.qr-transfer capability (chunked QR)` | new `lib/capabilities/media/qr-transfer.{ts,PURPOSE.md}`, registry entry | medium |
| 8 | `input.gaze capability (sample stream)` | new `lib/capabilities/input/gaze.{ts,PURPOSE.md}`, registry entry | small |
| 9 | `viz.heatmap-equirect capability` | new `lib/capabilities/viz/heatmap-equirect.{ts,PURPOSE.md}`, registry entry | medium |
| 10 | `viz.shader-editor + shader-export capability + chamber` | new `lib/capabilities/viz/shader-{editor,export}.*`, `app/atelier/shader-station/*`, components | large |
| 11 | `/atelier/gaze-heatmap chamber` | `app/atelier/gaze-heatmap/*`, components | medium |

## Acceptance criteria

- `pnpm typecheck` clean after each commit.
- `pnpm test:e2e` route sweep passes (new chamber routes added to
  `tests/e2e/routes.mjs`).
- `/atelier/shader-station` mounts, the MANDALA preset renders on the
  sphere, audio toggle hooks meyda, QR transfer round-trips a shader.
- `/atelier/gaze-heatmap` mounts, an uploaded JSON sample file renders
  on the equirect, dwell zones display.
- `/capabilities` browse route lists the 6 new capabilities under
  `audio`, `input`, `media`, `viz` with `status: "registered"`.
- `docs/ATTRIBUTIONS.md` carries one entry per cribbed file (or one
  per sub-app — discretion).
- No `style={{...}}` inline blocks remain; all styling is Tailwind.
- Both chambers' files all under 300 lines (split where needed per
  Rule 1).

## Things to revisit later (not in this migration)

- **DollySystem boot-sequence logger pattern** — the staggered-delay
  boot sequence is a nice UX touch; might land as a `<BootLog />`
  primitive in `components/shell/` later if/when Aura wants a
  loading register.
- **SpatialPreview WebXR mode** — duplicates existing `app/spatial/`
  work. Compare; might lift specific patterns rather than the whole
  surface.
- **EditorStation 786 lines** — over the 300-line cap; must split
  into pieces (line-number gutter, syntax-highlighted text area,
  fold/unfold gutter, drag handles) during migration. Plan in
  commit 10.
- **`constants.ts` 834 lines** of PRESETS — must split per shader, one
  file per preset under `lib/algorithms/shaders/presets/<name>.ts`.

## Open question for the operator

The user said **"explore what the app can do"** — before migration
starts, recommend booting the AI Studio app once (`cd
D:\.github\Shadrerapp && npm install && npm run dev`, port 3000) to
walk all three sub-apps and decide:

1. Which sub-app to migrate first? (Suggested: ShaderEditor — most
   alignment with the existing atelier; biggest payoff for the
   visualiser surface.)
2. Whether DollySystem has any piece worth lifting at all.
3. Whether WebXR spatial preview belongs as its own chamber or merges
   into the existing `/spatial` route.
