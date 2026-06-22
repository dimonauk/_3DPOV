# Screen Recording Notes — Geometry to Instance Multi-Variant Prop Scatter

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` |

## What to record

### Run 1 — Pick Instance toggle (~2 min)

1. Run `blueprint.py`. Switch to Layout, select terrain.
2. Open GN editor. Find `InstanceOnPoints`.
3. **Disable** Pick Instance — show all 4 boulder variants stacking.
4. **Re-enable** — show one variant per scatter point, natural result.

### Run 2 — Variant count tweak (~2 min)

1. In blueprint.py change `VARIANT_COUNT = 2`. Re-run.
2. Show only 2 variants. Change back to 4. Re-run.
3. Show the richer variety.

### Run 3 — Node graph walkthrough (~3 min)

1. Zoom to the `ObjectInfo → GeometryToInstance → JoinGeometry` fan.
2. Disconnect one GeometryToInstance. Show that variant disappearing.
3. Reconnect it.
4. Find the `RandomValue(INT)` node. Change Max from 3 to 1 — only 2 variants.
5. Restore to 3.

### Run 4 — Spreadsheet (~1 min)

1. Spreadsheet editor → Instance domain → Evaluated Data.
2. Show 4 instance slots.
3. Switch to Point domain — show per-point Instance Index column.

### Run 5 — GLB in browser (~30 sec)

1. Drag `boulder_scatter.glb` into gltf.report.
2. Orbit to show all four boulder shapes.

## Key moments to highlight

- The "all variants stacked" failure when Pick Instance is off
- The single checkbox fixing it
- JoinGeometry as the "library shelf"
- The four visually distinct boulder shapes in the final GLB

## Material tip

Assign distinct viewport Display Colours to each boulder variant before
recording so the four types are visually distinct in solid-mode.
