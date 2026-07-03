# Screen Recording Notes — GN Active Camera Billboard (Blender 5.1)

## Target file
`public/library/videos/geometry-nodes/gn-active-camera-billboard-sprite-webxr-hud/screen.mp4`

## Software
OBS Studio (free, MIT-licensed) or Windows Game Bar (Win + G).

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 / H.264 |
| Audio | Disabled |
| Downscale filter | Lanczos |

## What to record

### Part 1 — GN node graph (30–45 s)
1. Open the Geometry Nodes workspace.
2. Select the `hud_billboard_grid` empty.
3. Slowly pan across the node graph from left to right:
   - Pause 2 s on the `Active Camera` node.
   - Pause 2 s on the `Separate Matrix` node — mouse over output socket labelled **Column 3** and show the tooltip.
   - Pause 2 s on the `Align Euler to Vector` node — show **Axis: Z** and **Pivot: Auto** in the sidebar.
   - Pause 2 s on `Rotate Instances`.
4. Scrub the timeline (drag playhead) while watching the viewport — sprites should rotate.

### Part 2 — Live billboard in 3D viewport (20–30 s)
1. Switch to the Layout workspace; set Viewport Shading to **Material Preview** (Z → 4).
2. Middle-click-drag to orbit the viewport.
   - The nine coloured sprites should all face the camera as you orbit — show this clearly.
3. Move the camera object (G → Y) by a large amount; sprites must reorient instantly.
4. Press Numpad 0 to enter camera view and orbit again — sprites still face the lens.

### Part 3 — GLB export check (optional, 15 s)
1. File → Export → glTF 2.0.
2. Tick **Apply Modifiers**, set Format → **glTF Binary (.glb)**.
3. Show the exported .glb in the Blender Outliner or drag into a WebXR viewer.
   (Note: exported GLB has rotation baked; it will NOT billboard in Three.js unless
    you add a MSFT_lod or THREE.Sprite wrapper — mention this in voice-over.)

## Editing notes
- Trim to ≤ 2 min total.
- No zoom-in required — keep the full Blender window visible.
- Add chapter markers at 0:00 (Node graph), 0:45 (Live billboard), 1:30 (GLB export).
- No background music.
