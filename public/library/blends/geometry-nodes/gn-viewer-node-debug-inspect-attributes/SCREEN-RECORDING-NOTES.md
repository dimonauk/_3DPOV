# Screen Recording Notes — GN Viewer Node Debug (Blender 5.1)

## Target file
`public/library/videos/geometry-nodes/gn-viewer-node-debug-inspect-attributes/screen.mp4`

## Before recording

1. Run `blueprint.py` in Blender's **Scripting** tab.
2. Split the workspace into two panels:
   - Left: 3D Viewport (set to **Solid** shading — shortcut `Z → Solid`)
   - Right: **Geometry Nodes** editor (with the GN_Viewer_Debug_Tree open)
3. Add a third panel at the bottom right: **Spreadsheet Editor**.
4. In the 3D Viewport **Overlays** dropdown (top-right circle icon), confirm
   **Geometry Nodes** is ticked under the Overlays section.
5. Click **Viewer: Noise Scalar** in the GN editor. The 3D Viewport grid
   should immediately show a grayscale gradient across the displaced surface.
   If it stays solid grey, check that the GN modifier is active on the object.

## OBS setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 / H.264 |

## Recording script (~10 minutes)

### 0:00 – 0:45  Introduction
Show the three-panel layout (GN editor / 3D Viewport / Spreadsheet).
No Viewer active yet — grid is flat grey. Explain what the Viewer node is
and why it lives *off* the main chain.

### 0:45 – 2:30  Probe A — Noise Scalar
Click **Viewer: Noise Scalar**. Watch the grayscale appear.
Pan around the grid in the viewport.
Switch to Spreadsheet → **Vertices** tab → show the **Viewer** column.
Sort descending — find the white (value ≈ 1) vertices; locate them on the
grid visually. Point out that value 0 and value 1 correspond to black and white.

### 2:30 – 4:30  Probe B — Face Normal
Click **Viewer: Face Normal** in the GN editor.
Grid switches to RGB: mostly blue on horizontal faces, red/green on slopes.
Rotate the view to see oblique faces go saturated.
Open Spreadsheet → **Faces** tab → Viewer column shows XYZ vector triples.
Explain the colour encoding: X→R, Y→G, Z→B.

### 4:30 – 6:30  Probe C — Named Attribute Round-trip
Click **Viewer: Named Attr RT**.
Should be identical to Probe A.
To demonstrate the value of this check: go into the node editor, find
**Store Named Attribute**, change its Name from `noise_height` to `noise_ht`.
Watch Probe C go *black* (attribute not found → returns 0).
Fix the typo → Probe C recovers immediately.

### 6:30 – 8:30  Spreadsheet debugging workflow
Keep Probe C active. Open Spreadsheet at full width.
Show sorting the Viewer column to find extremes.
Show filtering by the named attribute `noise_height` column alongside
the Viewer column — both should show identical values, confirming the
Store node is working correctly.

### 8:30 – 10:00  Disconnecting a probe
Select the Viewer: Face Normal's Geometry input link, `X` to delete.
Watch it go dark — geometry is disconnected but the node stays in the tree.
Reconnect from the Store node output. Explain the workflow:
add probe → debug → disconnect or delete when satisfied.

## Post-processing in VSE

1. `File → New → Video Editing`
2. `Add → Movie → screen.mp4`
3. Add chapter strip markers at 0:45, 2:30, 4:30, 6:30, 8:30 via `M`
4. `Output Properties → FFmpeg Video → H.264 → 1920×1080 → 30 fps`
5. Render Animation → `screen_edit.mp4`
