# Screen Recording Notes — Dadras Attractor Poi Head

## Target files
- `public/library/videos/scripting/python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software
OBS Studio 30+ (Windows / macOS / Linux).

## Setup checklist

### Window source
1. Open Blender 5.1 and run `blueprint.py` from the Text Editor.
2. Switch to the **Layout** workspace; set the viewport to **Material Preview** or **Rendered** (EEVEE Next).
3. In OBS → Sources → Add → **Window Capture**.  
   Select the Blender window.  Set canvas to **1920 × 1080**.

### OBS settings
| Setting | Value |
|---|---|
| Output format | MP4 |
| Encoder | H.264 (hardware if available) |
| Bitrate | 8 000 kbps |
| Audio | **Off** (no audio track) |
| FPS | 30 |

### Viewport framing
- Numpad `0` → Camera view (after running `record.py` to set the camera).
- Alternatively: orbit with middle-mouse so the full cobalt–amber tube fills ~80% of the frame.
- HDRI: `Holoflow Studio Dark` or a plain black world shader.

### What to record
1. **Step 1 (15 s)**: Show the Basis 4-scroll attractor rotating gently in camera view.  
   Narrate: *"Four lobes, each one the trajectory winding around an unstable equilibrium."*
2. **Step 2 (20 s)**: In the Shape Key panel, drag `SK_TwoScroll.value` from 0 → 1.  
   Narrate: *"Lower the q coupling and the system loses two lobes — a classic figure-eight."*
3. **Step 3 (20 s)**: Drag `SK_Compact.value` from 0 → 1.  
   Narrate: *"Raising s tightens the z-decay, compressing the attractor vertically."*
4. **Step 4 (10 s)**: Switch to **Wireframe** to show Bishop-frame quads.  
   Narrate: *"Eight-sided Bishop tube, parallel-transported to avoid torsion artefacts at inflection points."*

### Post-processing
- Trim silence from start/end in DaVinci Resolve or ffmpeg:
  ```
  ffmpeg -i screen_raw.mp4 -ss 00:00:01 -to 00:00:55 -c copy screen.mp4
  ```
- Place the output at the target path above.

## Thumbnail
Viewport screenshot (Ctrl+F3 in Blender) at the 4-scroll orientation with bloom visible.  
Save to `public/library/reference-images/dadras-attractor-thumbnail.webp`.
