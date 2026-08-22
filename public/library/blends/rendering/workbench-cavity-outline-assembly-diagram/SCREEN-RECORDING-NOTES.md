# Screen Recording Notes — Workbench Assembly Diagram

## Software
OBS Studio (Windows: Win+G Game Bar works as fallback)

## Source settings
- **Window Capture** → select "Blender 5.1" window
- Resolution: **1920×1080** (match your Blender window)
- FPS: **30**
- Audio: **off** (narration added in VSE post)

## Takes to record

### Take 1 — Engine comparison (45 sec)
1. Open the blend file built by `blueprint.py`.
2. In the top-left header set engine to **Cycles**, switch viewport to Rendered. Show the pod (black — no light rig).
3. Switch engine back to **WORKBENCH**, shading to **Solid**. Instantly lit with colour-by-object + cavity.
4. Record this comparison: the point is that Workbench needs zero lights.

### Take 2 — Cavity live demo (30 sec)
1. Stay in Solid/Workbench viewport.
2. Open N panel → Viewport Shading. Toggle **Cavity** on and off several times so the recesses darkening is visible (especially around the emitter ring groove and the lens edge).
3. Switch **Cavity Type** between SCREEN and WORLD. WORLD captures the underside concavity of the lens even when off-screen.

### Take 3 — Explode animation playback (30 sec)
1. Press **Space** to play the timeline.
2. Camera view active (numpad 0). Watch the five parts ease out to their exploded positions over 60 frames.
3. Scrub back to frame 1, replay. Note each part moves independently along its pre-set offset vector.

### Take 4 — Edge outline demo (20 sec)
1. In Viewport Shading toggle **Object Outline** off — parts lose silhouette separation.
2. Toggle back on. Zoom in on emitter ring / housing junction to show the Sobel depth-buffer edge between adjacent parts.

## Output
Save as: `public/library/videos/rendering/workbench-cavity-outline-assembly-diagram/screen.mp4`

## Editing note
In Blender VSE: assemble takes in order — comparison, cavity, outline, explode.
Add title cards between takes. Export at 1920×1080 H.264 CRF 18.
