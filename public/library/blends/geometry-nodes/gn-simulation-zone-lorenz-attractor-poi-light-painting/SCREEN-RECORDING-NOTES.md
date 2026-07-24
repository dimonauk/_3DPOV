# Screen Recording Notes — Lorenz Strange Attractor

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-lorenz-attractor-poi-light-painting/screen.mp4`

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
3. Drag the viewport to fill the full screen (`Ctrl + Space` in the 3D Viewport).
4. In OBS, start recording.
5. Press **Space** to play the animation from frame 1 to 400.
6. Stop OBS recording after playback ends.
7. Rename the output to `screen.mp4` and place in the target directory above.

## What to show

**Frames 1–80**: six trails emerge from the same point, initially layered as one
thick neon line.  The early portion of all six paths is identical — below the
Lyapunov divergence threshold.

**Frames 80–200**: the trails begin to separate, some climbing the right wing
of the butterfly, others crossing to the left.  This is the onset of chaos
made visible — deterministic physics producing visually uncorrelated paths.

**Frames 200–400**: all six trajectories are fully decorrelated, tracing
different arcs across the butterfly attractor surface.  Pause at frame 350
to show the complete neon butterfly filling the frame.

## Tips

- Use the **Numpad 1** view (front orthographic) initially to show the
  butterfly's characteristic two-wing shape clearly.
- For a second take, switch to **Numpad 4** (left orthographic) to show the
  attractor's depth — it fills a 3D volume, not a flat plane.
