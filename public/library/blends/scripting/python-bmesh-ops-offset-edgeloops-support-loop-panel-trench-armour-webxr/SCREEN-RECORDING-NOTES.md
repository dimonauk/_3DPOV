# Screen Recording Notes — offset_edgeloops Armour Plate

**For: OBS Studio / Windows Game Bar / macOS Screenshot (⌘⇧5)**

## Setup

1. Open `blueprint.py` in Blender's Text Editor
2. Set viewport shading to **Material Preview** (Z → Material Preview)
3. Recommended resolution: **1920 × 1080** @ 30 fps
4. Window source: Blender application window (full screen or borderless)
5. Audio: **OFF** — silent screencap only

## What to capture (approx. 90 seconds total)

| Segment | Action | Duration |
|---------|--------|----------|
| 1 | Open `blueprint.py`, show PARAMETERS block | 10 s |
| 2 | Run script (Alt+P) — plate builds in viewport | 5 s |
| 3 | Zoom to boss base — show support loop flanking | 15 s |
| 4 | Orbit to groove row — show two offset loops + trench | 15 s |
| 5 | Toggle wireframe overlay (Z → Wireframe) — show topology | 15 s |
| 6 | Switch to Solid view, orbit full plate 360° | 20 s |
| 7 | Open Outliner, select object, show Export GLB dialog | 10 s |

## OBS Settings

```
Video Bitrate: 8000 kbps
Audio: none (muted)
Framerate: 30 fps
Encoder: H264 / NVENC
Output: screen.mp4
```

## Tips

- Press `Numpad 5` to toggle ortho/perspective — perspective looks better for the plate
- Press `A` to select all in Edit Mode to show full wireframe structure
- Use `Numpad 4/6` to orbit slowly during the 360° section
- The groove trenches are subtle — zoom in for segment 4
- Use **View → Local View** (Numpad /) on the plate object for a clean isolated shot
