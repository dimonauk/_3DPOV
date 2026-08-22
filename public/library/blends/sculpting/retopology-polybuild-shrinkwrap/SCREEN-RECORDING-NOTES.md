# Screen Recording Notes — Retopology: Poly Build + Shrinkwrap

## Software
OBS Studio (Windows) or Game Bar (`Win+G`) — either works.

## Session Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 (windowed, not fullscreen) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no commentary needed for library version) |
| Output format | MP4 / H.264 |
| Output file | `public/library/videos/sculpting/retopology-polybuild-shrinkwrap/screen.mp4` |

## Blender Layout Before Recording

1. Run `blueprint.py` from Scripting workspace → scene populates.
2. Switch to **Layout** workspace.
3. In the **Viewport Overlays** dropdown (top-right icon):
   - Enable **Wireframe** overlay (so retopo quad edges are visible)
   - Enable **Face Orientation** (optional — shows normals as blue/red)
4. In **Viewport Shading** (top-right sphere icon): choose **Solid** (Material Preview shows both meshes clearly).
5. Select `retopo_mesh`, press **Tab** → Edit Mode.
6. Open the **T-panel** (T key) → confirm **Poly Build** is listed under the Mesh Edit tools.
7. In the header Snap menu: enable **Face** snap, check **Project Individual Elements**.

## Shot List

| Clip | Duration | What to show |
|---|---|---|
| 01-overview | 10 s | Both meshes in viewport — sculpt orange tint, retopo blue wireframe on top |
| 02-modifier-stack | 8 s | Properties → Modifier tab: Mirror (top) + Shrinkwrap (below) |
| 03-shrinkwrap-settings | 8 s | Shrinkwrap panel: mode = PROJECT, both directions ticked, offset = 0.001 |
| 04-polybuild-toolbar | 5 s | T-panel with Poly Build highlighted |
| 05-draw-quad | 15 s | In Edit Mode: click to create a triangle near the sculpt equator; watch it snap |
| 06-extrude-edge | 15 s | Drag an existing edge to extrude a new quad; vertex slides on sculpt surface |
| 07-delete-element | 8 s | Ctrl+LMB to remove a stray triangle |
| 08-mirror-seam | 10 s | Show verts at X=0 being clipped/welded by Mirror |
| 09-result | 10 s | Final mesh with all loops placed; rotate view to show 3D wrap |

## OBS Scene Setup

1. Add **Window Capture** source → select Blender.
2. Set canvas to 1920×1080.
3. Add a **Crop/Pad** filter to exclude the system taskbar if visible.
4. Start recording → work through the shot list → stop recording.
5. Use **Remux Recordings** in OBS (File menu) if output is `.mkv` — convert to `.mp4`.
6. Rename output to `screen.mp4` and place in the videos folder above.

## Tips

- Slow down mouse gestures during Poly Build — the viewer needs to see each vertex snap.
- Zoom in on the X=0 seam when showing Mirror clip — it is subtle without zoom.
- Press `Numpad 1` (Front Ortho) for the modifier-stack and settings clips; press `Numpad 5` to toggle persp/ortho for 3D shots.
- Press `Z` → **Wireframe** mode briefly to show the edge-loop structure without material noise.
