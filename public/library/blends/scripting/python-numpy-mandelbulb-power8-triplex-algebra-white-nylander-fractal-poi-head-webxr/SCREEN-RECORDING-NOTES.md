# Screen-Recording Notes — Mandelbulb Power-8 Poi Head

## Software
- **OBS Studio 30+** (recommended) or Windows Game Bar (`Win+G`)
- Blender 5.1 open in Scripting layout

## OBS settings
| Setting | Value |
|---|---|
| Video source | Display Capture → Blender window |
| Canvas | 1920 × 1080 |
| Output | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 (CRF 18) or NVENC (quality) |
| Audio | **Disabled** — no microphone needed |
| Output format | `.mp4` (H.264 + AAC-silent) |

## Save path
```
public/library/videos/scripting/
  python-numpy-mandelbulb-power8-triplex-algebra-white-nylander-fractal-poi-head-webxr/
  screen.mp4
```

## What to record

### Take 1 — Blueprint execution (≈ 2 min)
1. Open Blender → Scripting workspace.
2. Load `blueprint.py` via Text editor → Open.
3. Zoom into the **Text editor** so the code is readable.
4. Start OBS recording.
5. Press **Run Script** (▶) — watch the Python console as the field
   computes (escape-time print), then the marching-tetrahedra pass.
6. Tab to **3D Viewport** to reveal the fractal poi head.
7. Rotate the view with middle-mouse drag to show the bulbous fractal
   silhouette from several angles (front, side, isometric).
8. Open the **N-panel** → Item tab and show the shape-key Mandelbulb
   value slider at 0 → 1 → 0 manually.
9. Stop recording.

### Take 2 — record.py animation render (≈ 1 min)
1. In the same Blender session, open `record.py` in the Text editor.
2. Start OBS recording.
3. Run `record.py` — the render progress bar crosses the title bar as
   the 90-frame OpenGL render executes.
4. When it finishes, open a File Browser to confirm `viewport.mp4`
   appeared in the videos directory.
5. Stop recording.

## Post-production (optional)
- Trim leader frames in DaVinci Resolve or Kdenlive.
- Overlay a title card: "Mandelbulb Power-8 — Holoflow Studio".
- No colour grade needed: the emissive vertex colours are intentionally
  saturated for direct camera capture.
