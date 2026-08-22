# Screen-Recording Notes — BVHTree Surface Scatter

## Software

OBS Studio 30+ recommended.  Windows Game Bar (Win + G) works as a fallback.

## Capture settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 — main window |
| Capture resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off — no mic, no desktop audio |
| Output codec | H.264 |
| Output file | `screen.mp4` |

## Script to follow

### Part 1 — Concepts walkthrough (≈ 1 min 30 s)

1. **0:00** — Open a fresh Blender 5.1 General file.  Narrate the plan:
   "We are building a BVH acceleration structure from this sphere's evaluated mesh
   and firing 240 inward rays to place props on its surface."
2. **0:20** — Open the Text Editor (Shift+F11).  Paste `blueprint.py`.  Scroll to the
   `fibonacci_hemisphere()` function and explain why golden-ratio spiral avoids
   polar clustering.
3. **0:45** — Scroll to `BVHTree.FromObject()`.  Note the `depsgraph` argument —
   this is what forces modifier evaluation before the tree is built.
4. **1:05** — Scroll to `orient_to_normal()`.  Explain `rotation_difference` vs
   `Matrix.Rotation` — the quaternion path handles `normal ≈ −Z` without NaN.

### Part 2 — Live run (≈ 1 min)

5. **1:30** — Save the `.blend` to a local folder (required for `//` paths).
   Press Run Script (Alt + P).
6. **1:40** — Cut to the System Console (Window > Toggle System Console on Windows,
   or terminal on Linux/Mac).  Show the hit-count line:
   `[BVHTree scatter] 174 props from 240 rays`
7. **1:55** — Return to the 3D Viewport.  Use numpad 5 for orthographic, then orbit
   around the sphere to show props sitting flush to the displaced surface.

### Part 3 — Collision proxy (≈ 30 s)

8. **2:25** — Select `collision_proxy` in the Outliner.  Switch Viewport Shading to
   Wireframe (Z key > Wireframe).  Show the convex hull wrapping the scatter cloud.
9. **2:40** — Briefly explain WebXR use: "In the XR runtime the engine ray-tests this
   proxy AABB first.  Only on a hit does it refine against the full scatter surface —
   this is the performance contract."

### Part 4 — record.py tour (≈ 20 s)

10. **2:55** — Switch to `record.py` in the Text Editor.  Point out `reveal_props_sequentially`
    and explain that running it after `blueprint.py` produces the animated `viewport.mp4`.

## File naming

Save to:
```
public/library/videos/scripting/
  python-mathutils-bvhtree-raycast-surface-scatter-webxr/screen.mp4
```
alongside the `viewport.mp4` that `record.py` generates.
