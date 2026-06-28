# Screen-Recording Notes — Face-Push Panel Stamp Node Tool

**Output**: `public/library/videos/geometry-nodes/gn-node-tool-face-push-panel-stamp/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Encoder | x264, CRF 18 |
| Output | screen.mp4 |

## Suggested Shot List

1. **Open `face_push_panel_stamp.blend`** (2 s) — show the flat 4 × 4 grid in
   Solid + Matcap shading with cavity on. Orbit slowly so depth reads.

2. **Geometry Node Editor split** (5 s) — drag to show the GN editor alongside
   the 3D view. Name each node as you hover: Group Input → Index → Random
   Value → Math chain → SetPosition → StoreNamedAttribute → Group Output.

3. **Modifier vs Tool panel** (5 s) — with `GN_FacePush_Modifier` on the
   object, drag the Amount slider from 0 to 0.12 in the N-panel to show
   modifier mode. Then drag Randomness from 0 → 1 to show per-face variation.

4. **Switch to `GN_FacePush_Tool` in the GN editor** (3 s) — change the active
   node tree to `GN_FacePush_Tool`. Highlight `is_tool = True` in the header
   (Blender shows the tool-mode chip when active).

5. **Enter Edit Mode → select half the faces** (5 s) — Tab into Edit Mode on
   the grid object. Switch to Face Select mode (3). A → deselect all. B-box
   select the left two columns of faces.

6. **Activate the Node Tool in the toolbar** (5 s) — in the left toolbar (T),
   scroll to the "Holoflow" section (or the custom tool section). Click
   "Face Push Stamp". The tool header shows Amount and Randomness fields.

7. **Adjust Amount and click Apply** (5 s) — set Amount to 0.08. Click Apply
   (or press Enter). The selected faces push outward; unselected faces remain
   flat. Orbit to show the raised panels.

8. **Undo and repeat with Randomness 0.5** (5 s) — Ctrl+Z, set Randomness to
   0.5, Apply again. Show the subtle per-face height variation.

9. **GLB export** (3 s) — File → Export → glTF 2.0 → enable Draco, WebP, and
   Custom Properties → Export. Show the file size in the file browser.

## Notes

- Cavity shading is key for legibility — enable in the Viewport Shading
  popover (top-right of 3D view) before recording.
- If the "Holoflow" toolbar section is not visible, the tool needs to be
  registered via `holoflow_macros/gn_node_tool_face_push.py` first (see the
  tutorial for the registration snippet).
- The tool-mode chip in the GN editor header reads "Tool" instead of
  "Modifier" — this is the visual confirmation that `is_tool = True` is set.
