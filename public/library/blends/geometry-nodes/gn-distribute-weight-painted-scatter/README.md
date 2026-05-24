# GN Distribute Points on Faces — Weight-Painted Density Scatter

**Blender 5.1 · CC0 · Holoflow Studio**

Art-directed scatter driven by a per-vertex FLOAT attribute (`scatter_density`).
Paint density directly in Vertex Paint mode; Geometry Nodes reads the
interpolated value at every distributed point and uses it as a probability
threshold to cull the scatter before instancing.

## Quick start

```bash
blender --background --python blueprint.py
```

Outputs `scatter_terrain.blend` alongside this file and
`../../../../glbs/geometry-nodes/gn-distribute-weight-painted-scatter/scatter_terrain.glb`.

## Record viewport animation

```bash
blender --background scatter_terrain.blend --python record.py
```

Outputs `../../../../videos/geometry-nodes/gn-distribute-weight-painted-scatter/viewport.mp4`.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene — terrain + rock prop + GN scatter tree |
| `record.py` | Camera-orbit animation render for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |
| `scatter_terrain.blend` | Generated — run blueprint.py |
| `scatter_terrain.glb` | Generated — run blueprint.py |

## Technique notes

- `GeometryNodeDistributePointsOnFaces` (RANDOM mode) distributes at
  `MAX_DENSITY` per m² across the entire terrain surface.
- Blender transfers POINT-domain attributes to output points via bilinear
  face-corner interpolation — no `Capture Attribute` node required.
- `GeometryNodeInputNamedAttribute` reads `scatter_density` from the
  distributed-points geometry context.
- `GeometryNodeRandomValue` (FLOAT, per-point) provides the random draw.
- `FunctionNodeCompare` (GREATER_EQUAL) outputs True where `random >= density`
  — those points are removed by `GeometryNodeDeleteGeometry`.
- Remaining points receive a low-poly rock prop via `GeometryNodeInstanceOnPoints`
  with random Z-axis rotation from a second `GeometryNodeRandomValue` (FLOAT_VECTOR).
- `GeometryNodeRealizeInstances` bakes everything before `export_apply=True` GLB.

## Interactive density painting

Open `scatter_terrain.blend`, select the terrain object, switch to
**Vertex Paint** mode. The `scatter_density` attribute appears in the header
drop-down (Blender 5.1: Header → Attribute → scatter_density). Paint black
for zero scatter, white for full scatter. Switch back to Object mode and tab
into the Geometry Nodes modifier to see the scatter update live.

## WebXR considerations

The realized and Draco-compressed GLB averages ~40–120 triangles per rock
at 20 subdivision, giving roughly 2 000–6 000 triangles total for a 4 m²
terrain patch at MAX_DENSITY=8. For mobile WebXR budgets reduce MAX_DENSITY
to 4 or drop TERRAIN_DIVS to 10.

## Licence

CC0 1.0 Universal. No attribution required. Do what you like.
