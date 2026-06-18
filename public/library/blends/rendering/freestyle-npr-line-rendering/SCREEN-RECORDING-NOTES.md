# Screen Recording Notes — Freestyle NPR Line Rendering

Target file: `public/library/videos/rendering/freestyle-npr-line-rendering/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| Output path | `…/videos/rendering/freestyle-npr-line-rendering/screen.mp4` |

## What to Capture

1. **Render Properties panel** — show Freestyle enabled, the crease angle slider, and the `Use Material Boundaries` checkbox (15 seconds)
2. **Line Sets list** — click through each of the three line sets (silhouette, crease, material_boundary), showing their edge-type checkboxes (30 seconds)
3. **Line Style for silhouette** — open the Style panel:
   - Scroll to **Color Modifiers** → show `SilhouetteGradient` Along Stroke with the blue-to-amber ramp
   - Scroll to **Alpha Modifiers** → show `SilhouetteFade` Distance from Camera, range 1.5–13 m
   - Scroll to **Geometry Modifiers** → show `SilhouetteWobble` Perlin Noise 2D, amplitude 1.3, octaves 4
   - Scroll to **Thickness Modifiers** → show `SilhouetteTaper` Along Stroke, value_min 0.25
4. **Render a single frame** — press F12, watch Freestyle lines appear as a second pass after the main Cycles render (the progress bar switches from "Render" to "Freestyle" then composites) (20 seconds)
5. **UV Editor / Image Viewer** — show the rendered PNG at 1280×720, zoom into the gem crown to see the dashed gold material-boundary line (15 seconds)

## Tips

- Before recording, run `blueprint.py` so the scene is ready with all three line sets already configured.
- In Blender Render Properties, set Resolution Percentage to 50% for faster preview frames during the walkthrough. Switch back to 100% for the final render shot.
- Dock the Render Result window next to the Render Properties panel so both are visible simultaneously.
- The Freestyle progress percentage appears in the bottom status bar during rendering — keep it visible for the tutorial.

## Windows Game Bar Alternative

Press `Win+G` → Start Recording. Same capture region: the Blender window. Game Bar targets the foreground app, so bring Blender to the front first. Output lands in `Videos/Captures/`.
