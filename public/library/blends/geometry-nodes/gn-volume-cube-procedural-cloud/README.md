# GN Volume Cube + Noise Field — Procedural Cumulus Cloud

**Blender 5.1 · Geometry Nodes · CC0**

A Geometry Nodes setup that builds a volumetric cloud from scratch using the
**Volume Cube** node with a per-voxel noise density field.  No particles, no
physics, no external textures — purely procedural mathematics evaluated at
every voxel centre.

## What it demonstrates

- `GeometryNodeVolumeCube` — the GN primitive that creates a voxel grid and
  evaluates any field node (Noise Texture, Map Range, Math) **per voxel**
- Two-layer noise blending: coarse cloud-mass structure plus fine wispy detail
- Altitude gradient (flat base / rounded top) via Map Range on the Z component
- Density threshold stripping: below 0.45 collapses to clear sky
- Principled Volume material — scatter colour, absorption, anisotropy
- Mesh from Volume iso-surface for WebXR / GLB export (glTF has no volume primitive)

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene-build script |
| `record.py` | Viewport animation: cloud forming over 60 frames → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```bash
blender --background --python blueprint.py
```

This creates `cumulus_cloud` (volume) and `cumulus_cloud_iso` (mesh) in the
default scene.  Open in Blender UI, switch to Rendered viewport with Cycles,
and let 32+ samples accumulate.

## Tuning guide

| Parameter | Effect |
|-----------|--------|
| `VOXEL_RES` | Memory ∝ x·y·z — halve for iteration, raise for finals |
| `NOISE_A_SCALE` | Lower → larger cloud cells |
| `DENSITY_THRESHOLD` | Lower → more cloud, higher → thin cirrus |
| `DENSITY_MULT` | Principled Volume density multiplier — controls opacity |
| `ANISOTROPY` | 0 = isotropic; +0.3 = forward-scatter (typical water drops) |

## Outside sources

- Blender Manual — [Volume Cube Node](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/volume/volume_cube.html) · CC-BY-SA 4.0
- Blender Manual — [Principled Volume Shader](https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/volume_principled.html) · CC-BY-SA 4.0
- [blender-scripting](https://github.com/njanakiev/blender-scripting) by Nicolas Janakiev · MIT

## Studio cross-references

- [Shader — Principled Volume: Procedural Fog Column](/tutorials/blender-tutorial-shader-principled-volume-fog-column)
- [GN Distribute Points — Procedural Ground Cover Scatter](/tutorials/blender-tutorial-gn-distribute-points-ground-cover-scatter)
- [GN Simulation Zone — Grey-Scott Reaction-Diffusion Turing Pattern](/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing)
