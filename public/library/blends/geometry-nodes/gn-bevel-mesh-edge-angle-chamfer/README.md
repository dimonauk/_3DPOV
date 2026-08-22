# GN Bevel Mesh Node + Edge Angle — Procedural Hard-Surface Chamfer

**Blender 5.1 · CC0 · Holoflow Studio**

A Geometry Nodes modifier that chamfers only the edges where the
inter-face dihedral angle exceeds a threshold — no Edit Mode Ctrl+B,
no Bevel modifier stack position to manage.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds scene + GN chamfer tree; exports `junction_block.glb` |
| `record.py` | Renders 180-frame viewport animation (width grow + 360° rotate) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar session script for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Outputs

- `junction_block.glb` — WebXR-ready hard-surface block, Draco 6 + WebP
- `public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer/viewport.mp4`
- `public/library/videos/geometry-nodes/gn-bevel-mesh-edge-angle-chamfer/screen.mp4`

## GN node chain

```
Group Input ──► Bevel Mesh ──► Group Output
                 ▲  ▲  ▲
         Edge    │  │  │ ← Chamfer Width
         Angle──►│  │  │ ← Segments
              Compare│
              (> threshold)
```

## Key technique notes

- `GeometryNodeInputMeshEdgeAngle` outputs **unsigned_angle** in radians
  per edge; 0 = coplanar, π = inverted.  Cube corner edges ≈ 1.57 rad (90°).
- `FunctionNodeCompare` (FLOAT, GREATER_THAN) turns angle values into
  a boolean field that gates the Bevel Mesh node's Selection input.
- `GeometryNodeBevelMesh` has a `mode` property — EDGES (default) or VERTICES.
- `export_apply=True` in the GLB exporter materialises the GN modifier,
  so the exported mesh contains the actual chamfered geometry.

## Running

```
blender --background --python blueprint.py
```

Requires Blender 5.1+.  GLB writes to the same directory as the .blend.

## Licence

CC0 1.0 Universal.  Attribute as "Holoflow Studio" if you republish.
