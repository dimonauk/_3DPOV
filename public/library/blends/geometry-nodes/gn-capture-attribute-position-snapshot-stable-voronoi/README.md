# GN Capture Attribute — Pre-Twist Position Snapshot

**Blender 5.1 · Geometry Nodes · CC0 · Holoflow Studio**

Demonstrates `GeometryNodeCaptureAttribute` by freezing per-vertex world position
before a procedural twist deformation, then using the frozen snapshot as the seed
for a Voronoi texture. The cell boundaries remain locked to the original cylinder
grid regardless of the twist angle — the definitive proof that the capture happened
before the deformation rather than being re-evaluated after it.

## What's in this folder

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python build script — creates mesh, GN tree, material, exports GLB |
| `record.py` | Viewport animation render — 300 frames (10 s), Twist 0°→180°→0° |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Artefacts produced

- `capture_column.blend` — Blender scene with GN modifier and material
- `capture_column.glb` — WebXR-ready export (Draco 6, WebP, hs_cell_id attribute)
- `../../videos/geometry-nodes/gn-capture-attribute-position-snapshot-stable-voronoi/viewport.mp4`

## Running

```bash
blender --background --python blueprint.py   # creates .blend + .glb
blender --background capture_column.blend --python record.py   # renders viewport.mp4
```

## Key learning

`Capture Attribute` is not a pass-through — it forces field evaluation at the node's
position in the GN stack. Without it, `Position` is re-evaluated lazily wherever it's
consumed downstream, giving the post-deformation coordinates. Capturing before the
twist freezes the pre-deform coordinates as a concrete mesh attribute.

## Three canonical use-cases

1. **Stable seeding** — freeze position / UV before remesh/resample
2. **Domain bridging** — store FACE-domain normal so VERTEX-domain nodes can read it
3. **Simulation carry-forward** — write a value in one Repeat iteration, read it next

## Tutorial

`/tutorials/blender-tutorial-gn-capture-attribute-position-snapshot-stable-voronoi`

## Licence

CC0 — public domain dedication. Do what you like with it.
