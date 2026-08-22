# Screen Recording Notes
**Tutorial**: Python gpu.types.GPUOffScreen — Offscreen Render-to-Texture for WebXR Data Textures
**Target file**: `public/library/videos/scripting/python-gpu-offscreen-render-to-texture-webxr/screen.mp4`

## Software
OBS Studio 30+ or Windows Game Bar (Win+G) — OBS preferred for clean crop.

## Setup
- Window source: **Blender 5.1**
- Output resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off**
- Bitrate: **6000 kbps** (CBR) or CQP 22 (hardware encoder)

## What to record

### Part 1 — Writing and running blueprint.py (≈ 2 min)
1. Open a new Blender file. Switch to the **Scripting** workspace.
2. Create a new Text data-block and paste `blueprint.py`.
3. Press **Run Script** (Alt+P).
4. In the **Info** bar show the `Normal map baked →` and `GLB exported →` lines.
5. Open the **Image Editor** and load `world_normal_data_tex.webp` from the blend directory. Show the baked normal map full-screen for 5 seconds.

### Part 2 — Inspecting the offscreen buffer structure (≈ 90 s)
1. In the **Scripting** workspace, show the `bake_normal_map()` function.
2. Highlight the `with offscreen.bind():` block and explain the framebuffer lifecycle.
3. Hover over `fb.read_color()` and show the docstring / API sidebar if available.

### Part 3 — Inspecting the GLB in the 3D Viewport (≈ 60 s)
1. Switch to the **Layout** workspace.
2. The icosphere should be visible with the baked WebP assigned to Base Color.
3. In Material Preview mode (Z → Material Preview) spin the object to show the normal-encoded colours.

### Part 4 — Running record.py for the viewport animation (≈ 30 s)
1. Open `record.py` in a new Text data-block.
2. Press **Run Script**.
3. Show the render progress bar.

## Output file
Trim to ≤ 5 minutes. Export as H.264 MP4, save to:
`public/library/videos/scripting/python-gpu-offscreen-render-to-texture-webxr/screen.mp4`
