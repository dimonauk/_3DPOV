# Screen Recording Notes — Compositor Mist Pass + Z-Depth Defocus

Target file: `public/library/videos/rendering/compositor-mist-pass-z-depth-defocus-atmospheric/screen.mp4`

## Software

OBS Studio (Windows/Mac/Linux) or Xbox Game Bar (Windows only).

## OBS Setup

1. **New Scene** — name it `mist_depth_tutorial`.
2. **Source → Window Capture** — select the Blender 5.1 window.
3. **Output**
   - Resolution: 1920 × 1080
   - FPS: 30
   - Encoder: H.264 (NVENC or x264)
   - CRF / Quality: 18
4. **Audio** — disable all audio capture; tutorial narration is added in post.

## What to record (in order)

| # | Action | Duration |
|---|--------|----------|
| 1 | Open Blender 5.1. Run `blueprint.py` via `Scripting` workspace. | ~20 s |
| 2 | Viewport shading → Rendered. Pan to show the three orbs with depth falloff. | ~10 s |
| 3 | Switch to **Compositor** workspace. Show the node tree (Render Layers → Defocus → Fog Mix → Composite). | ~20 s |
| 4 | Click the Render Layers node. Show Z and Mist outputs in the Viewer by Shift-clicking each socket. | ~20 s |
| 5 | Open **World Properties** → Mist Pass. Drag the Depth slider (2 → 12) while the Viewer shows the Mist output. | ~15 s |
| 6 | Back to the tree — adjust Defocus `F-Stop` from 2.8 → 1.4 and watch the near orb get more blurred. | ~15 s |
| 7 | Play the animation (Space) — camera arc shows focus shifting from mid to far orb. | ~10 s |
| 8 | Press F12 to render one frame at full Cycles quality. Switch to Image Editor to see the result. | ~30 s |

## Blender workspace layout recommendation

Split the screen:
- **Left 60%** — 3D Viewport (Rendered shading)
- **Right top 40%** — Compositor
- **Right bottom 40%** — Properties (World or Render tab)

This shows cause and effect simultaneously: changing a World mist setting
immediately updates the Compositor's Mist pass preview.

## Post-production (optional)

Trim silence at start/end. No colour grading — the raw Blender output is the content.
Add text overlays for node names in a video editor if making a narrated tutorial.
Export final at H.264, 1920 × 1080, 30 fps for web.
