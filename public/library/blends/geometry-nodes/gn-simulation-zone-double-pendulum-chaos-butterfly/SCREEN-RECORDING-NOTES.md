# Screen Recording Notes — Double Pendulum Chaos

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-double-pendulum-chaos-butterfly/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture |
| Window | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| CRF | 18 (near-lossless) |

## Capture procedure

1. Run `blueprint.py` in the Scripting workspace.
2. Switch to the **3D Viewport** and set shading to **Rendered** (EEVEE Next).
3. Drag the viewport to fill the full screen (`Ctrl + Space` in the viewport).
4. In OBS, start recording.
5. Press **Space** to play the animation from frame 1 to 250.
6. Stop OBS recording after playback ends.
7. Rename the output to `screen.mp4` and place in the target directory above.

## What to show

The first 30 frames: five trails begin layered almost identically — the
pendulums are still synchronised. By frame 80 the paths begin to separate.
By frame 180 the trajectories are completely uncorrelated. Pause at frame
200 to show all five trails filling the frame like neon calligraphy.
