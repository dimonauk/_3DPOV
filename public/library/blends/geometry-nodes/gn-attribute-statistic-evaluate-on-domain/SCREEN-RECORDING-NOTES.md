# Screen Recording Notes — GN Attribute Statistic + Evaluate on Domain

## Software
- **OBS Studio** (recommended) or Windows Game Bar (Win+G)
- Window capture source: Blender 5.1 window

## Settings
| Setting | Value |
|---------|-------|
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary needed for library) |
| Output | `public/library/videos/geometry-nodes/gn-attribute-statistic-evaluate-on-domain/screen.mp4` |

## Recommended workspace layout
- **3D Viewport** (largest panel, top-left) — Material Preview shading
- **Geometry Nodes editor** (bottom-left) — AreaHeatMap tree open
- **Spreadsheet** (right) — toggle between Face and Vertex domains
- **Properties panel** (right column) — Modifier tab, AreaHeatMap expanded

## Recording script (5–8 minutes)

1. **Open `area_heat_map.blend`** — the terrain should be visible with the
   heat map active.  Frame count at the top-left should show 1/1.

2. **Modifier panel walk-through** — expand AreaHeatMap, show the
   Noise_Strength slider at its default (0.28).  Point out the live
   geometry update.

3. **Drag Noise_Strength from 0 to 0.35** — let the viewer watch the flat
   grid deform into terrain and the heat-map colours shift as face areas
   change.  Drag back to 0 to show the map returning to uniform.

4. **Spreadsheet — Face domain** — switch to Face domain in the Spreadsheet.
   Drag Noise_Strength again; show the `face_heat` RGBA column live-updating
   per-face as the statistic recalculates.

5. **Spreadsheet — Vertex domain** — switch to Vertex (Point) domain.  Show
   `vertex_heat` present per-vertex.  Note that adjacent vertices of the same
   face share the same colour — this is the "no interpolation" behaviour of
   Evaluate on Domain.

6. **GN editor — AttributeStatistic node** — Ctrl+Shift+click to pin the node
   output in the Spreadsheet.  Drag Noise_Strength; confirm Min and Max scalars
   change with the deformation.

7. **GN editor — Evaluate on Domain node** — hover over it, show the
   `domain=FACE` and `data_type=FLOAT_COLOR` properties in the node panel.

8. **GLB export demo** — File → Export → glTF 2.0.  Tick "Custom Attributes".
   Export to a temporary path.  Drag the exported `.glb` into
   `https://gltf.report` (or Three.js viewer) and confirm `_FACE_HEAT` and
   `_VERTEX_HEAT` custom accessors are present.

## Notes
- Keep the 3D Viewport in **Material Preview** (not Rendered) for smooth
  playback during slider drags.
- The heat-map self-calibrates on every modifier evaluation — there is no
  need to bake or refresh manually.
