# Screen Recording Notes — bmesh.ops Primitive Forge: Crystal Tile

**For: OBS Studio / Windows Game Bar / macOS Screenshot (⌘⇧5)**

## Setup

1. Open `blueprint.py` in Blender's Text Editor
2. Set viewport shading to **Material Preview** (Z → Material Preview)
3. Recommended resolution: **1920 × 1080** @ 30 fps
4. Window source: Blender application window (full screen or borderless)
5. Audio: **OFF** — silent screencap only

## What to capture (approx. 100 seconds total)

| Segment | Action | Duration |
|---------|--------|----------|
| 1 | Open `blueprint.py` — show PARAMETERS block, point out size semantics comment | 12 s |
| 2 | Run script (Alt+P) — entire tile builds instantly | 5 s |
| 3 | Orbit overhead and zoom out to see the full 3 m tile with 5 spires | 10 s |
| 4 | Zoom to one spire — show gem cap overlapping the cone tip | 12 s |
| 5 | Zoom to central pedestal — show cube + UV-sphere accent stacked | 10 s |
| 6 | Toggle wireframe overlay (Z → Wireframe or `Alt+Z`) — show all primitive seams | 15 s |
| 7 | Zoom to tile floor — show base ring disc at spire base | 8 s |
| 8 | Back to Material Preview, full 360° orbit of the scene | 18 s |
| 9 | Open terminal, show `blender --background --python blueprint.py` output line | 10 s |

## OBS Settings

```
Video Bitrate: 8000 kbps
Audio: none (muted)
Framerate: 30 fps
Encoder: H264 / NVENC
Output: screen.mp4
```

## Tips

- Press `Numpad 5` to toggle ortho — perspective shows depth better for spires
- Press `Numpad 7` for overhead view to show the pentagon arrangement
- The ring discs at spire bases are subtle — zoom in and switch to wireframe for segment 7
- Use `Numpad 4/6` for slow manual orbit during the 360° section
- In Edit Mode (Tab), `A` selects all — use this to highlight the combined single-mesh topology
- Annotate with Blender's built-in Annotate tool (D + drag) to circle the gem cap seam
