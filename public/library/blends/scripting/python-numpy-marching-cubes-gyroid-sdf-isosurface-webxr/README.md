# Python numpy — Surface Nets: Gyroid SDF Isosurface for WebXR & 3D Print

**Blender**: 5.1 — **Licence**: CC0 — **Topic**: scripting / implicit surfaces

## What this builds

A watertight triangulated mesh of the **Gyroid Triply Periodic Minimal Surface**
(TPMS), extracted from a signed-distance field by the **Surface Nets** algorithm
(Gibson 1998). Exported as a Draco-compressed GLB ready for WebXR, and saved as
a `.blend` for further work or MSLA 3D-print slicing.

The gyroid — `sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x) = 0` — has zero mean
curvature everywhere on its zero-level set and divides space into two
interpenetrating, non-intersecting channels.  Both properties make it ideal for
lattice infill in resin prints and as a structurally interesting WebXR prop.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full pipeline: SDF → Surface Nets → bmesh → GLB |
| `record.py` | Viewport-animation render (5 s rotation @ 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_gyroid.blend` | Blender scene (generated on run) |
| `hf_gyroid.glb` | Draco-compressed GLB (generated on run) |

## Quick start

Open Blender 5.1 → Scripting workspace → open `blueprint.py` → Run Script.
Outputs appear next to the blend file (`//hf_gyroid.glb`, `//hf_gyroid.blend`).

## Parameters to experiment with

| Constant | Default | Effect |
|---------|---------|--------|
| `N` | 48 | Grid resolution; 64 gives finer surface, ~2× slower |
| `HALF_BOX` | 1.5π | World-space extent; increase for more periods |
| `ISO` | 0.0 | Isosurface level; ±0.3 biases wall thickness |
| `DRACO` | 6 | Draco compression level (0–10) |

## Algorithm note

Surface Nets avoids the 256-case Marching Cubes lookup table.  Each surface cell
emits one vertex (placed at the centroid of edge zero-crossings), and adjacent
surface cells sharing a sign-change face are connected by a quad.  Results on
smooth implicit surfaces are comparable in quality to Marching Cubes while being
simpler to implement and audit.

## Cross-references

- [Resin MSLA Light Sculpture tutorial](/tutorials/blender-tutorial-python-bpy-resin-msla-light-sculpture-nested-shell-led-cavity-tir-drainage) — 3D-print export pipeline
- [Surface RD Mesh Laplacian tutorial](/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr) — same NxNxN grid pattern
- [Möbius Strip parametric mesh tutorial](/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr) — parametric vs implicit mesh construction comparison
