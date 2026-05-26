# Screen Recording Notes — GN Raycast Shadow Mask

Target file: `public/library/videos/geometry-nodes/gn-raycast-shadow-mask/screen.mp4`

## Software

- OBS Studio 30+ or Windows Game Bar (`Win + G`)
- Source: Window Capture → Blender 5.1
- Resolution: 1920 × 1080, 30 fps
- Audio: off (no mic, no system audio)
- Output format: MP4 / H.264

## Setup before recording

1. Open `raycast_shadow_grid.blend` (run `blueprint.py` first if it doesn't exist).
2. In the 3D Viewport, press `Numpad 5` → Orthographic, then `Numpad 7` → top view.
   Switch back to Perspective with `Numpad 5` and orbit to a 45° elevated front view
   (roughly matching the camera: X=3, Y=−3.5, Z=6.5).
3. Set the Viewport Shading to **Material Preview** (sphere icon, or press `Z` → Material Preview).
   The two-tone cel shadow should be visible immediately — warm amber on lit faces,
   cool blue-grey under the blocker sphere.
4. Open a second area as the **Geometry Nodes editor** (split the viewport, choose
   Geometry Nodes from the editor type menu). Select the `raycast_shadow_grid` object —
   the GN tree should appear showing: ObjectInfo → Raycast → Switch → StoreNamedAttribute.
5. Open a third area as the **Spreadsheet** (editor type: Spreadsheet). Set domain to
   **Point**. You should see a `shadow_mask` column of 0.0 and 1.0 values.

## Recording sequence (≈ 8 minutes)

| Time | Action |
|------|--------|
| 0:00 | Show the full layout: viewport (left, large), GN editor (top-right), Spreadsheet (bottom-right). |
| 0:30 | In the GN editor, click the **Raycast** node. Show its properties in the sidebar: data_type=FLOAT, Ray Length=6.0. |
| 1:00 | In the viewport, select the `shadow_blocker` sphere and move it in X (`G X` then type `1.5`). Watch the shadow footprint shift live. Undo (`Ctrl+Z`). |
| 1:45 | In the Spreadsheet, hover over the shadow_mask column. Show that vertices beneath the sphere read 0.0 and those outside read 1.0. |
| 2:30 | In the GN editor, disconnect the **ObjectInfo → Raycast** link. The shadow_mask goes flat — all 1.0 (no target, no hits). Reconnect. |
| 3:15 | Change the **Switch False** socket from 1.0 to 0.5 (partial lit). The lit area dims. Restore to 1.0. |
| 4:00 | Show the **Material Preview** close-up of the shadow edge. Zoom in on the boundary — note the per-vertex interpolation at the silhouette. |
| 5:00 | Switch the GN editor to show the **ObjectInfo** node. Toggle transform_space between RELATIVE and ORIGINAL — show that ORIGINAL breaks positioning (blocker appears at origin). Restore to RELATIVE. |
| 6:00 | Open Properties → Modifier → GN modifier on the grid. Click the **Geometry Nodes** socket pin to show the object dependency on `shadow_blocker`. |
| 7:00 | Open the Python console or Scripting tab and run `record.py` to show the animated orbit render kicking off. You don't need to wait for it to finish — just show the first frame appearing. |
| 7:45 | Final wide shot of the viewport with the shadow mask visible — hold 15 seconds, then stop recording. |

## Export

- OBS: File → Remux Recordings if output is `.mkv` → convert to `.mp4`.
- Place the file at: `public/library/videos/geometry-nodes/gn-raycast-shadow-mask/screen.mp4`
