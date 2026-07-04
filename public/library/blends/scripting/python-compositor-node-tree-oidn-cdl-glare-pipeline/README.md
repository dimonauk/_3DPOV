# Python CompositorNodeTree — OIDN Denoise + ASC-CDL Grade + Streak Glare

**Blender 5.1** · **CC0** · topic: scripting

## What this builds

A production compositor pipeline wired entirely from Python — no
editor-side drag-and-drop required. The pipeline chains four stages in a
single `CompositorNodeTree` attached to the scene:

1. **OIDN guided denoising** — Cycles Combined pass cleaned with Denoising
   Normal and Denoising Albedo as guidance. `prefilter='ACCURATE'` removes
   fireflies from the auxiliaries before guidance to prevent smearing.
2. **ASC-CDL colour balance** — per-channel Slope/Offset/Power correction in
   the industry-standard Colour Decision List format, as used in DCP mastering.
3. **Streak glare** — four anamorphic radial streaks from emission highlights
   above a scene-linear threshold of 0.85, firing on the gem's emission
   (Strength=2.8) without touching lit diffuse surfaces.
4. **Float-32 EXR output** — post-pipeline composite written to disk via a
   `CompositorNodeOutputFile` node for round-trip grading in DaVinci or Nuke.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy build: scene, Cycles config, compositor tree |
| `record.py` | Workbench viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for `screen.mp4` |
| `oidn_cdl_glare.blend` | Generated .blend (run blueprint.py) |

## Quick start

```bash
blender --background --python blueprint.py
# → oidn_cdl_glare.blend

blender oidn_cdl_glare.blend --python record.py
# → viewport.mp4

# To render with the compositor applied:
blender oidn_cdl_glare.blend
# Press F12 (or Render > Render Image)
# Open Rendering > Compositing workspace to inspect the node tree
```

## Parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `RENDER_SAMPLES` | 96 | Cycles samples; raise to 512+ for a clean result |
| `CDL_SLOPE` | (1.04, 1.0, 0.96) | Per-channel gain — warm reds, cool blues |
| `CDL_OFFSET` | (0.02, 0.01, 0.0) | Shadow lift per-channel |
| `CDL_POWER` | (0.94, 0.96, 1.02) | Gamma per-channel (cool G/B mids) |
| `GLARE_THRESHOLD` | 0.85 | Scene-linear threshold for streak onset |
| `GLARE_STREAKS` | 4 | Number of radial streak arms |
| `GLARE_MIX` | 0.0 | -1=no glare, 0=50/50, +1=pure glare |
| `GEM_EMISSION_STR` | 2.8 | Forces gem above GLARE_THRESHOLD |

## The three Blender node trees

| Tree type | Location | Python access |
|-----------|----------|---------------|
| `ShaderNodeTree` | per-Material | `mat.node_tree` |
| `GeometryNodeTree` | per-GN Modifier | `mod.node_group` |
| `CompositorNodeTree` | per-Scene | `scene.node_tree` |

All three share the same `nodes.new()` / `links.new()` / `interface` API.
The `bl_idname` prefix differs: `ShaderNode*`, `GeometryNode*`, `CompositorNode*`.

## Outside sources

- **Blender Manual: Compositing** — CC-BY-SA 4.0, Blender Foundation
  https://docs.blender.org/manual/en/5.1/compositing/index.html
  sibling: https://github.com/blender/blender

- **ASC-CDL Specification** — Apache-2.0, ACES Central / Academy Software Foundation
  https://docs.acescentral.com/specifications/acescc-technical-reference/
  sibling: https://github.com/AcademySoftwareFoundation/aces-dev
