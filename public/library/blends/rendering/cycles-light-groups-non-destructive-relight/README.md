# Cycles Light Groups — Non-Destructive Studio Relighting

**Blender 5.1 · CC0 · rendering**

---

## What this demonstrates

Three named light groups (`neon_left`, `neon_right`, `ceiling`) partition a Cycles
scene into independent HDR colour channels. A single 64-sample render produces a
multilayer EXR with one full-range layer per group. The Compositor's Gamma and Mix
nodes then let you shift any group's intensity or hue without spending another sample.

## Scene

| Object | Type | Notes |
|--------|------|-------|
| `gem` | Ico sphere, subdiv 2, flat-shaded | Principled BSDF, Transmission=1, IOR 1.77 |
| `pedestal` | 8-sided cylinder, flat-shaded | Near-black matte diffuse |
| `Light_neon_left` | Area disk, cool blue | Light group: `neon_left` |
| `Light_neon_right` | Area disk, warm pink | Light group: `neon_right` |
| `Light_ceiling` | Area disk, warm white | Light group: `ceiling` |
| `Camera` | 85 mm, f/5.6 DoF | Focused on gem |

## How Light Groups work (Blender 5.1)

1. **View Layer Properties → Light Groups panel** — add named groups.
2. **Object Properties → Light Group field** (per light *object*) — assign to a group.
3. **Cycles only.** Render engine must be Cycles; EEVEE does not support light group passes.
4. On F12, Cycles writes one EXR layer per group. The Compositor's Render Layers node
   exposes each group as an output socket named after the group.
5. **Denoiser must be off** when capturing per-group passes — the integrated denoiser
   merges contributions before the per-group decomposition happens.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build script — run once in Scripting workspace |
| `record.py` | 120-frame viewport animation — light reveal + gem rotation |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Output file list + cross-reference registry |

## Running

1. Open Blender 5.1 → Scripting workspace.
2. Load `blueprint.py` → Run Script.
3. Press **F12** to render the multilayer EXR to `output/relight_scene0001.exr`.
4. Open the Compositor (already wired) and use the Gamma nodes to taste.

## Adapting

- **Change group colours in the compositor only** — no re-render needed.
  Set any Gamma node's input to 0.0 to mute that light entirely.
- **Add a Hue-Saturation node** after a Gain node to remap a group's colour.
  (e.g. turn the blue neon group violet post-render.)
- **Per-group denoising**: connect a Denoise compositor node to each group output
  before the Gamma node. Feed the RLayers "Normal" and "Albedo" passes into it.
- **Raise sample count** to 512 for production EXRs; 64 is for fast script preview.
