# Screen Recording Notes — GN Smooth by Angle

## Session goal

Record `screen.mp4`: a 3–4 minute narrated walkthrough showing how to build
the Smooth by Angle GN tree from scratch in Blender 5.1 and verify the output
in the Spreadsheet editor and a GLB viewer.

## OBS / Game Bar settings

- **Window source**: Blender 5.1 (full window, 1920 × 1080)
- **Frame rate**: 30 fps
- **Audio**: off (add narration in post via VSE if desired)
- **Output**: `screen.mp4` → copy to
  `public/library/videos/geometry-nodes/gn-smooth-by-angle-normal-split/`

## Shot list

1. **Open Blender 5.1.** Delete the default cube. Add → Mesh → Cylinder (16
   vertices, Depth 1.6). Tab into Edit Mode, confirm flat cap and side faces.
   Return to Object Mode.

2. **Old method (5 seconds to show it fails).** Open the Properties panel →
   Object Data → Normals. Point out that *Auto Smooth* is gone. Open the Python
   console and type `bpy.context.object.data.use_auto_smooth` — show the
   `AttributeError`. This is the migration pain point.

3. **New method — SMOOTH_BY_ANGLE modifier.** Open Properties → Modifier
   (wrench icon). Click Add Modifier → search "Smooth". Select
   *Smooth by Angle*. Drag the Angle slider from 5° to 60° and show the
   viewport normal feedback change in EEVEE (normals overlay ON). Hold at
   30° to show smooth sides, sharp caps.

4. **GN tree method.** Remove the Smooth by Angle modifier. Add a new
   *Geometry Nodes* modifier. Open the Geometry Node Editor. Build the tree
   manually:
   - Group Input → **Set Shade Smooth** (domain: Face, Shade Smooth: ON)
     → **Smooth by Angle** (Angle: 30°) → Group Output.
   - Show that skipping Set Shade Smooth makes no difference (everything stays
     flat) — then re-add it and show the smooth baseline returning.

5. **Spreadsheet verification.** Open the Spreadsheet editor. Select the
   cylinder. Switch domain to **Edge**. Show the `sharp_edge` boolean column.
   Filter or scroll to find side edges (False = smooth) and cap-ring edges
   (True = sharp). Change the Angle to 15° and show more edges flip to True.

6. **Export.** Run the script `blueprint.py` to export both GLBs. Open
   `smooth_prism_30deg.glb` in a glTF viewer tab (drag-and-drop into
   <https://gltf-viewer.donmccurdy.com>) — smooth cylindrical sides,
   distinct cap disc edge. Open `smooth_prism_15deg.glb` — fully faceted
   16-panel appearance.

## Post-production checklist

- [ ] Trim dead time at start/end
- [ ] Zoom into node editor when wiring nodes (crop to ~70% of frame width)
- [ ] Add lower-third text: "Blender 5.1 — Auto Smooth → Smooth by Angle"
- [ ] Export via VSE: H.264, 1920 × 1080, CRF 18, AAC audio off
