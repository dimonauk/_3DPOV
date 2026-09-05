# Screen Recording Notes — Sprott O Attractor

## OBS Studio settings
- **Source**: Window Capture → Blender (title: "Blender")
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: Disabled (no mic input needed)
- **Output format**: MP4 / H.264 CRF 18
- **Output file**: `public/library/videos/scripting/python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## Blender setup before recording
1. Open Blender 5.1 → Scripting workspace
2. Paste and run `blueprint.py` — wait for console: `[SprottO] Done.`
3. Switch to **3D Viewport** workspace
4. Set viewport shading: **Vertex Color** (shortcut: hold Z → Vertex Color)
5. Numpad `0` → Camera view; if no camera, Numpad `5` → orthographic, then orbit to taste
6. Enable **Overlays → Statistics** to show face / vertex count in corner

## Recording sequence (≈ 45 s total)
| Time | Action |
|------|--------|
| 0–5 s | Show Scripting workspace with `blueprint.py` code visible |
| 5–10 s | Press **Run Script** — watch console output appear |
| 10–18 s | Switch to 3D Viewport; orbit around attractor with middle-mouse |
| 18–28 s | Open Properties → Object Data → Shape Keys; slide `SK_LowB` from 0 → 1 → 0 |
| 28–36 s | Slide `SK_HighB` from 0 → 1 → 0 to show tighter orbit |
| 36–45 s | Slide `SK_NearP` from 0 → 1 → 0; zoom out to show full attractor |

## Windows Game Bar (alternative)
- Press **Win + G** → Capture → Start Recording (or **Win + Alt + R**)
- Same window-source selection; set to 1080p 30 fps in Xbox Game Bar settings
- Trim start/end in the Clips panel

## Key Blender shortcuts for recording
- `Numpad 5` — toggle perspective / ortho
- `Middle-mouse drag` — orbit
- `Scroll wheel` — zoom
- `G` → `Z` → drag — move attractor vertically (if repositioning needed)
- `Ctrl + Z` — undo any accidental edits

## Post-processing (optional)
- Trim first / last 2 s of dead air in DaVinci Resolve or ffmpeg:
  `ffmpeg -i screen.mp4 -ss 2 -to 43 -c copy screen_trimmed.mp4`
- No colour grade needed — vertex colour is already calibrated cobalt→amber
