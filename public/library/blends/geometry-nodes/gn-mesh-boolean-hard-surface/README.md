# GN Mesh Boolean — Procedural Holes & Cutouts

**Blender 5.1 · CC0 · Geometry Nodes**

Cuts a Poisson-distributed grid of cylindrical holes through a flat panel
entirely inside a Geometry Nodes modifier — no separate cutter objects, no
manual mesh edits.  Hole count, radius, and depth are live modifier sliders.

## What this entry contains

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy.data script — builds scene, GN tree, material, exports `.blend` + `.glb` |
| `record.py` | Keyframed viewport render — density ramp + camera orbit + radius pulse |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the tutorial screen capture |
| `output/panel_boolean.blend` | Generated Blender scene with live GN modifier |
| `output/panel_boolean.glb` | Draco-compressed export ready for WebXR |

## Run it

```bash
# Headless — generates blend + glb
blender --background --python blueprint.py

# Viewport animation render — generates viewport.mp4
blender --background output/panel_boolean.blend --python record.py
```

## Technique summary

The node tree has five stages:

1. **Distribute Points on Faces (Poisson)** — generates a point cloud on the
   panel surface with a minimum spacing that prevents hole overlap.
2. **Cylinder primitive** — a closed solid mesh used as the boolean cutter.
   Ring vert count = 12; fully closed (NGON caps) so the solver can define
   a volume.
3. **Instance on Points** — places a cylinder at every point. The instances
   are not yet real geometry — they are lightweight transform references.
4. **Realize Instances** — converts instance references to actual mesh data.
   This step is mandatory: `GeometryNodeMeshBoolean` requires a `Mesh` input
   type; it rejects `Instances` with a silent no-op.
5. **Mesh Boolean (DIFFERENCE, EXACT solver)** — subtracts the realized
   cylinder mesh from the panel.  The EXACT solver uses multi-precision
   arithmetic and handles overlapping cutter volumes correctly; the FAST
   solver silently fails at high hole densities.

## Solver choice

| Solver | Speed | Failure modes |
|---|---|---|
| FAST | ~4× faster | Non-manifold input, self-intersecting cutters, overlapping volumes |
| EXACT | Baseline | None — but slower for very dense meshes (>50 k faces) |

For a scatter-based cutter like this one (cylinders can overlap at high
density) EXACT is always the right choice.

## Export

`export_apply=True` is required.  Without it the GLB exporter sees the raw
quad-grid mesh and exports zero holes.  With it the dependency graph evaluates
the GN modifier first, bakes the boolean result to temporary mesh data, and
serialises that to the GLB.

## Cross-references

- `/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines` — complement technique: recessed panel lines via Extrude Mesh rather than Boolean
- `/tutorials/blender-tutorial-gn-instance-on-points` — the Distribute + Instance pattern used by the cutter scatter here
- `/tutorials/blender-tutorial-low-poly-faceted-hard-surface` — the non-GN approach to the same hard-surface asset class
- `/tutorials/blender-tutorial-texture-baking-normal-ao` — baking the high-detail boolean result to a low-poly normal map

## Licence

CC0 — public domain.  No attribution required.
