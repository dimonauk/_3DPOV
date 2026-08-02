# Screen Recording Notes — Ikeda Map Blueprint

## Software
OBS Studio 30+ or Windows Game Bar (Win+G).

## Window source
- Application: **Blender 5.1**
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off** (no microphone needed)

## What to capture

| Segment | Duration | Action |
|---------|----------|--------|
| 1 | 0:00–0:30 | Open Blender 5.1 → Scripting workspace. Paste `blueprint.py`. Walk camera around the script, pausing on the PARAMETERS block. |
| 2 | 0:30–1:20 | Run script. Show the Text Editor output `[ikeda] exported hf_ikeda.glb`. Switch to 3D Viewport — the cyan-magenta height-field fills the frame. |
| 3 | 1:20–2:00 | Properties → Object Data → Shape Keys. Drag the `b=0.70` slider from 0 → 1. Observe the attractor morphing from periodic ridges to diffuse fog. Return to 0. |
| 4 | 2:00–2:45 | Repeat for `b=0.85` then `b=0.92`. Pause on 0.92 to show the full strange attractor geometry. |
| 5 | 2:45–3:15 | Viewport shading → Material Preview. Rotate orbit around the mesh to show the emissive cyan filaments. |
| 6 | 3:15–3:45 | Scripting workspace: run `record.py`. Switch to Timeline, press Spacebar — show the 90-frame shape-key animation playing back. |

## OBS scene settings
```
Output → Recording → Format: mp4
Video → Base (Canvas) Resolution: 1920×1080
Video → Output (Scaled) Resolution: 1920×1080
Video → Common FPS Values: 30
Audio → disabled for all tracks
```

## File naming
Save as `screen.mp4` inside:
```
public/library/videos/scripting/
python-numpy-ikeda-map-complex-laser-cavity-attractor-basin-poi-webxr/
screen.mp4
```
