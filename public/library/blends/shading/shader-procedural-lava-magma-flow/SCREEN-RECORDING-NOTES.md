# Screen Recording Notes — Shader: Procedural Lava / Magma Flow

**Target file:** `public/library/videos/shading/shader-procedural-lava-magma-flow/screen.mp4`

## Software

OBS Studio (recommended) or Windows Game Bar (Win+G) on Windows 11.

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Canvas | 1920 × 1080 |
| Output | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 (Software) or NVENC (GPU) |
| Rate Control | CRF 18 |
| Audio | Disabled (tutorial is silent) |

## What to Capture

1. Open `lava_magma_flow.blend` in Blender 5.1.
2. Switch to the **Shading** workspace.
3. Show the node tree briefly — Voronoi DISTANCE_TO_EDGE → invert → crack ramp → emission.
4. Switch to **Material Preview** (Z → Material Preview) in the 3D viewport.
5. Press **Spacebar** to play the animation — the surface should scroll slowly upward.
6. Hold for 10–15 seconds showing the animated crack glow.
7. Switch to **Rendered** view (Z → Rendered) to show EEVEE Next bloom.
8. Hold for 5–10 seconds.

## Trim Target

Trim to 15–20 seconds. Cut any dead time at the start of playback.

## File Naming

Save as `screen.mp4` (H.264, AAC silent) into the target folder above.
Do **not** commit the `.mp4` file — it is listed in `.gitignore`.
