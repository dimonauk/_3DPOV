# Screen Recording Notes — GN Edge Angle Crease

**Target file**: `public/library/videos/geometry-nodes/gn-edge-crease-subdiv-hard-surface/screen.mp4`

---

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 / H.264 |
| Audio | Off |
| Duration | ~3–4 minutes |

---

## What to record

Open `edge_crease_hard_surface.blend` (run `blueprint.py` first if not yet built).

### Scene 1 — Modifier stack overview (30 s)

1. Select the `edge_crease_hard_surface` object.
2. Open the Properties panel → Modifier Properties tab.
3. Show the two modifiers in order: `HoloflowGNCrease` (Geometry Nodes) then
   `HoloflowSubdiv` (Subdivision Surface).
4. Highlight that `HoloflowSubdiv → Use Creases` is ticked.

### Scene 2 — Live threshold sweep (60 s)

1. Expand `HoloflowGNCrease`.  Locate **Angle Threshold Deg** (currently 40.0).
2. Set the viewport to **Material Preview** or **Rendered** shading.
3. Slowly drag **Angle Threshold Deg** from `0` to `85`.
   - At 0°: mesh looks like a softly subdivided sphere (no creases).
   - At ~40°: box corners snap sharp (watch the panel inset edges).
   - At ~80°: nearly every edge is creased; mesh reads as a sharp hard-surface block.
4. Drag back to `40` to restore the default.

### Scene 3 — Node tree walkthrough (90 s)

1. Switch to the **Geometry Node Editor** workspace.
2. Show the full tree: Group Input → Math (deg→rad) → lo/hi → MapRange →
   Store Named Attribute → Group Output.
3. Hover over the **Edge Angle** node and explain Unsigned vs Signed angle.
4. Hover over **Store Named Attribute** and show `domain=EDGE`,
   `name=crease_edge`.

### Scene 4 — Export verification (30 s)

1. In the Scripting workspace, run a quick check:
   ```python
   obj = bpy.data.objects['edge_crease_hard_surface']
   attr = obj.data.attributes.get('crease_edge')
   print(attr, attr.domain if attr else 'not found')
   ```
2. Show the console output confirming the attribute exists on the EDGE domain.

---

## Post-production notes

Trim to ≤ 4 minutes.  No music required.  Add chapter markers in the video
description matching the four scenes above.
