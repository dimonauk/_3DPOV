# Screen Recording Notes — Compositor Motion Vector Blur

**Target file:** `public/library/videos/compositing/compositor-motion-vector-blur/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | H.264 (NVENC or x264) |
| Audio | Disabled (no voiceover in this clip) |
| Bitrate | 8 Mbps |

## What to capture

### Act 1 — Setup (60 s)

1. Open Blender 5.1 — show a blank General scene.
2. Open **Text Editor** (Shift+F11), paste `blueprint.py`, press **Alt+P**.
3. The gem appears in the 3D Viewport — switch to **Rendered** shading (**Z** key → Rendered) to show the material.
4. Press **Space** to play the animation — show the gem spinning at 10°/frame.

### Act 2 — Render passes (45 s)

1. Switch to **Properties** → **View Layer** → **Passes** → **Data** tab.
2. Show that **Motion Vector** is ticked (set by blueprint.py).
3. Open **Compositing** workspace — walk through the node tree: Render Layers → VecBlur → Composite.
4. Hover over VecBlur — show the `Samples`, `Speed`, `Max Speed` inputs.

### Act 3 — Live comparison (90 s)

1. Set timeline to **frame 18** (the 180° midpoint — fastest relative lateral velocity on screen).
2. Press **F12** to render with VecBlur active — show the cobalt smear.
3. After render completes, **M** to mute the VecBlur node.
4. **F12** again — show the clean sharp frame.
5. Re-enable VecBlur — compare with the blurred version side-by-side in the UV/Image Editor (use split screen).

### Act 4 — Parameter variation (60 s)

1. Change `vblur.speed = 1.5` in the Blender Python Console — re-render frame 18.
   Show: longer streak, almost disc-like at the gem's equator.
2. Change back to 0.75 — re-render.
3. Change `vblur.max_speed = 20` — show how the clamp limits the streak length.

## Export

File → Export Recording (OBS) → `screen.mp4`

Recommended: trim the start/end dead frames in Blender's own **Video Sequence Editor**
before exporting — see `/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping`
for the post-processing workflow.
