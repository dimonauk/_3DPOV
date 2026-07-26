# Screen Recording Notes — Geodesic Sphere Icosahedron Subdivision

**Tool:** OBS Studio or Windows Game Bar (Win+G)  
**Source:** Window Capture → Blender  
**Resolution:** 1920×1080 @ 30 fps  
**Audio:** Off (no commentary needed for viewport capture)

## Steps

1. Open Blender. Run `blueprint.py` (Scripting workspace → ▶ Run Script).  
   Confirm `GeodesicSphere` appears in the 3D Viewport.

2. Switch to **3D Viewport**. Set Viewport Shading → **Material Preview** (Z key → Material).  
   The navy-to-gold gradient should be visible across the geodesic facets.

3. Open `record.py` in the Scripting editor and run it.  
   This sets up the camera, lights, and 300-frame spin animation.

4. Press **Spacebar** in the 3D Viewport to play the animation and confirm the sphere
   rotates and the camera arcs upward over 150 frames.

5. Start OBS → Start Recording.

6. In Blender: **Render > Render Animation** (or Ctrl+F12).  
   The render writes to `public/library/videos/scripting/.../viewport.mp4`.

7. Stop OBS → save as `screen.mp4` in the same folder.

## What to capture

- Close-up of the faceted equatorial band (hexagonal faces, 6 edges each)
- Pole view showing the 5-edge pentagonal face (one of 12 on any geodesic sphere)
- Wide view showing the full 360° rotation with light catching the extrude accent gaps

## Naming convention

| File | Description |
|------|-------------|
| `viewport.mp4` | Blender render output (automated via record.py) |
| `screen.mp4`   | OBS full-Blender-window capture during setup |
