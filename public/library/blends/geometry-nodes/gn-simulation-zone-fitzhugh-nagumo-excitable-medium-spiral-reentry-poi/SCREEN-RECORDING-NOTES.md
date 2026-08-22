# Screen Recording Notes — FitzHugh-Nagumo Excitable Medium

**Output**: `public/library/videos/geometry-nodes/gn-simulation-zone-fitzhugh-nagumo-excitable-medium-spiral-reentry-poi/screen.mp4`

## OBS / Xbox Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |

## What to capture (8–12 minutes)

1. **Open Blender 5.1** — Scripting workspace. Show the system console (`Window → Toggle System Console` on Windows).
2. **Paste blueprint.py** — walk through the parameters block and docstring. Point out `EPSILON`, `D_EFF`, and how `D × 5` compensates for the blur-Laplacian scaling. **Run script** (Alt+P).
3. **Switch to Layout workspace** — press Space to play. Let the first 80 frames run. Point at the rightward-moving orange wavefront (target wave from S1).
4. **Pause at frame 60** — advance frame by frame (← / →) through frames 59–70 to show the S2 stimulus activating the bottom half and the wave-break occurring at the boundary.
5. **Continue playback to frame 120** — the spiral should be clearly rotating. Point at the blue refractory tail behind the wavefront.
6. **GN Editor split** — open the Geometry Node editor in a second panel. Trace the Simulation Zone inputs and outputs. Show the BlurAttribute node and the stimulus Switch nodes.
7. **Change I_EXT to 0.0** — demonstrate the excitable (non-oscillatory) regime: the grid returns to rest after a single wavefront rather than firing spontaneously.
8. **Run record.py** — show the render starting (thumbnail previews in the render window).

## Framing tips

- Use **Material Preview** shading (Z key) so the emission colours are visible without a full render.
- Split the viewport: left = 3-D view (Camera view Numpad 0), right = GN editor.
- When showing the phase plane, sketch it on a secondary whiteboard/paper on screen: draw the cubic N-shaped u-nullcline and the straight v-nullcline crossing at the unstable fixed point.
