# Screen Recording Notes — Klein Bottle Blueprint

**Target file**: `public/library/videos/scripting/python-numpy-klein-bottle-non-orientable-figure8-immersion-self-intersection-poi-webxr/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 (CRF 18) or NVENC H.264 |
| Audio | **Off** (no microphone needed) |

## Before you start

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Load `blueprint.py` via *Text → Open* (or paste it into a new text block).
3. Set the Blender window to fill the whole screen (View → Fullscreen Area, or drag the header).
4. In OBS, add a **Window Capture** source pointing at Blender.
5. Crop the capture to remove OS chrome if needed.

## Recording sequence

| Step | What to show | Duration |
|------|-------------|---------|
| 1 | Scroll slowly through `blueprint.py` so the parameter block and `figure8_klein()` function are visible | 30 s |
| 2 | Press **Run Script** (▶ button). Watch the Python console for the print statement | 15 s |
| 3 | Switch to **3D Viewport** → press Numpad 5 (orthographic), rotate the view to show the self-intersection seam glowing orange | 20 s |
| 4 | In Properties → Object Data → Shape Keys, drag 'saddled' from 0 → 1 and back | 20 s |
| 5 | In Properties → Object Data → Shape Keys, drag 'pinched' from 0 → 1 | 15 s |
| 6 | Orbit around the figure-8 shape; pause on the neck region | 20 s |

**Total target**: ≤ 2 min 30 s.

## Post-processing

Trim to the action only, then:
```
ffmpeg -i screen_raw.mp4 -vf "scale=1920:1080" -c:v libx264 -crf 18 -an screen.mp4
```

## Common issues

- **Surface looks faceted**: correct, `use_smooth=False` is intentional for WebXR flat shading.
- **Self-intersection seam not visible**: check EEVEE bloom is enabled (Scene Properties → Render).
- **Script error on shape key**: run `clear_scene()` first if a previous run left orphan data.
