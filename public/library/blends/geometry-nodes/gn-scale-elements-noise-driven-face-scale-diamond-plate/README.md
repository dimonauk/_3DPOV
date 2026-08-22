# GN Scale Elements — Noise-Driven Face-Scale Diamond Plate

**Blender 5.1 · Geometry Nodes · CC0**

## What this builds

A 16 × 16 flat quad grid where every face is scaled independently toward its
own centroid by a Noise Texture field. Faces with low noise values receive a
scale of ~0.52, opening a wide seam to their neighbours; faces with high values
receive ~0.97, appearing nearly flush. The result is an industrial "diamond
plate" or "scale armour" surface that varies without any manual work.

The named attribute `hs_panel_scale` (FLOAT, POINT domain) is written onto each
vertex so the Principled BSDF material can colour-map it (dark seam → pale steel)
and the GLB exporter carries it as a custom extra attribute for Three.js shaders.

## Key concept: why Scale Elements opens real gaps

Unlike Set Position (which averages shared-vertex displacements from adjacent
faces, giving near-zero net movement on a regular grid), **Scale Elements**
disconnects shared vertex ownership before scaling each face independently. Each
face receives its own isolated copy of its vertices, scales them toward the face
centroid, then emits them as separate geometry. Adjacent faces no longer share
edges or vertices after the node runs, which is why sub-1.0 scale values produce
real gaps rather than a subtle warp.

Consequence for export: the GLB triangle count is higher than the raw quad count
because Scale Elements effectively un-welds the mesh at every edge. For WebXR,
consider Merge by Distance after Scale Elements if topology connectivity is
required downstream.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the GN tree, grid mesh, material, and exports `diamond_plate.glb` |
| `record.py` | Animates Scale Min 1.0 → 0.52 and renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for a manual screen recording |
| `.expected-artefacts.json` | CI manifest of expected output files |

## How to run

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Press **New** in the Text Editor. Paste the contents of `blueprint.py`.
3. Press **Alt+P** (or ▶ Run Script). Two files appear under `output/`:
   - `diamond_plate.blend`
   - `diamond_plate.glb`
4. To record the animation: open `record.py` in a new Text Editor tab,
   press **Alt+P**. `viewport.mp4` renders to `public/library/videos/`.

## GN tree layout

```
[GroupInput]
  ├─ Geometry ──────────────────────────────────────────────────► [ScaleElements]
  │   (domain = FACE)                                                     │
  ├─ Noise Scale ──────────────► [NoiseTexture]                           │
  │                                  │ Fac                                │
[Position] ─► Vector ──────────────────────► [MapRange]                  │
                                               │ (To Min = Scale Min)     │
  └─ Scale Min ───────────────────────────────►│                          │
                                               │ Result ──────────────────┤
                                               │ Result ─────────────► [StoreNamedAttribute]
                                                                              │ "hs_panel_scale"
[GroupOutput] ◄── Geometry ◄───────────────────────────────────────────────────┘
```

## WebXR notes

- `export_apply=True` in the GLB exporter realises the GN modifier at the export
  frame, so the full modified geometry (all faces un-welded and scaled) goes into
  the GLB. The `hs_panel_scale` float attribute appears under
  `mesh.primitives[0].attributes` as a custom accessor.
- In Three.js, read it via `geometry.attributes.hs_panel_scale.array` after
  loading with GLTFLoader. Use it to drive emissive intensity or a custom GLSL
  attribute in `onBeforeCompile`.

## Credits

**Outside sources referenced in this tutorial:**
- Blender Manual — Scale Elements node: https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/scale_elements.html · CC-BY-SA-4.0 · Blender Foundation
- njanakiev/blender-scripting: https://github.com/njanakiev/blender-scripting · MIT · Nicolas Janakiev — sibling: https://github.com/njanakiev/blender-jupyter
