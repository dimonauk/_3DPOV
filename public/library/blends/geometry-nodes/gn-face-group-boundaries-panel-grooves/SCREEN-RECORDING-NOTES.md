# Screen Recording Notes — Panel Groove Engraving

Target file: `public/library/videos/geometry-nodes/gn-face-group-boundaries-panel-grooves/screen.mp4`

## Setup

- **Blender version**: 5.1
- **Window source**: Blender application window (not display capture)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: off

## OBS settings (Windows Game Bar alternative in notes below)

1. Sources panel → **+** → Window Capture → select `blender.exe`
2. Right-click source → Transform → Fit to screen
3. Settings → Output → Recording:
   - Format: `mp4`
   - Encoder: x264 or NVENC (GPU)
   - Bitrate: 8000 kbps
4. Settings → Video → Output resolution 1920×1080, FPS 30

## Blender setup before recording

1. Open `panel_grooves.blend` (run `blueprint.py` first if `.blend` absent)
2. Workspace: **Layout** tab (3D Viewport + Properties)
3. Viewport shading: **Material Preview** (Z → Material Preview)
4. Viewport overlay: disable Grid (Overlay dropdown → uncheck Floor)
5. Select the cube, press **Numpad 5** (Orthographic off), **Numpad 0** (Camera view)
6. Timeline: scrub to frame 1; confirm rotation animation is keyed (orange dot on Z rotation)

## What to record

| Segment | Duration | Content |
|---|---|---|
| A | 10 s | Camera view, frame 1–80 playing — full rotation showing all six faces |
| B | 20 s | Switch to Geometry Nodes workspace; pan through the node graph left→right, pausing at FaceGroupBoundaries and SeparateGeometry |
| C | 10 s | Return to Layout; zoom into a corner of the cube to show the square-section groove tubes |
| D | 5 s | Properties → Modifier panel; show the PanelGrooveMaker modifier with node group name |

Total target: ~45 seconds, trimmed to ≤ 60 s.

## Windows Game Bar alternative

Press **Win + G** → Capture → Record (or Win + Alt + R to toggle without overlay).
Captures the foreground window. Same resolution/fps as system display.
Trim in Photos app or via ffmpeg:
```
ffmpeg -i raw_capture.mp4 -ss 00:00:02 -t 00:00:50 -c copy screen.mp4
```

## Delivery

Place the trimmed file at:
```
public/library/videos/geometry-nodes/gn-face-group-boundaries-panel-grooves/screen.mp4
```
