# Screen Recording Notes — GN Sample Nearest Surface: Mesh-Conform Tile Armour

**Target file:** `public/library/videos/geometry-nodes/gn-sample-nearest-surface-mesh-conform/screen.mp4`

---

## Setup checklist

- [ ] Blueprint run: `blender --background --python blueprint.py` (creates `tile_armour.blend`)
- [ ] Open `tile_armour.blend` in Blender 5.1
- [ ] Workspace: **Geometry Nodes** tab
- [ ] Select `TileArmour` object in the Outliner
- [ ] Zoom the node editor so the full graph is visible — left edge at Group Input, right edge at Group Output

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (full window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4` (H.264, CRF 18) |

## What to record (≈ 3 minutes)

1. **Node graph overview** (30 s)
   - Pan slowly left-to-right across the full node tree
   - Hover over each SNS node to show its tooltip

2. **Two-context demonstration** (60 s)
   - Click on `SNS #1` (position snap) to select it
   - In the Spreadsheet (open it via the + tab), set Domain = Point on the `TileArmour` object
   - Show the `Position` column jumping from scatter-sphere values to snapped surface values as you enable/disable `Set Position`

3. **Live parameter tweak** (60 s)
   - In the Properties panel → Modifier, scrub **Tile Scale** from 0.28 to 0.84 — tiles visibly tighten
   - Scrub **Scatter Density** from 100 to 600 — armour density fills in
   - Scrub **Seed** through 0–5 — pattern reshuffles

4. **Material Attribute hook** (30 s)
   - Switch to the **Shading** workspace
   - Show the `Attribute` node reading `tile_lat`
   - Drag the colour stops on the `ColorRamp` to show the per-tile colour updating live

## Tips

- Keep Blender's viewport in **Rendered** (EEVEE) for the material to show.
- The `ConformTarget` sphere is hidden in render but visible in viewport — useful to show the target relationship.
- If the tile density is low during the Spreadsheet section, temporarily set **Scatter Density** to 200 so the Spreadsheet rows are manageable.
