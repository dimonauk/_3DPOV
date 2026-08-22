# Screen Recording Notes — Cayley Nodal Cubic

**For**: `python-numpy-cayley-nodal-cubic-4-nodes-9-lines-algebraic-surface-poi-head-webxr`  
**Output**: `public/library/videos/scripting/…/screen.mp4`

---

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Blender window capture (not monitor) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4 / H.264 |
| CRF | 18 (high quality) |

---

## What to Record

### Part 1 — Blueprint run (≈ 2 min)

1. Open Blender 5.1. Close the splash screen.
2. Delete the default cube: `A` → `X` → Enter.
3. Open the **Scripting** workspace (top tab bar).
4. Click **Open** → navigate to `blueprint.py` and open it.
5. Press **Run Script** (▶ button or `Alt+P`).
6. Watch the Info header — you'll see `{N} vertices, {N} triangles` printed.
7. Switch to **Layout** workspace to see the extracted poi head mesh.
8. Orbit around it in the viewport to show the amber-gold surface and the
   dark node pinch at the origin.

### Part 2 — Vertex colour inspection (≈ 1 min)

1. With the mesh selected, go to **Object Data Properties** → **Color Attributes**.
2. Show the `Col` attribute in the list.
3. In the viewport, press `Z` → **Material Preview** (or Solid mode with **Color →
   Attribute**) to see the amber-gold / deep-blue gradient: the blue node is at
   the centre, the warm amber patches are the smooth surface branches.

### Part 3 — Shape-key morphs (≈ 1 min)

1. Select the mesh. Go to **Object Data Properties** → **Shape Keys**.
2. Scrub the `SK_Tight` value slider from 0 → 1: the sheets close on the node cone.
3. Return to Basis. Scrub `SK_Wide`: the branches spread outward.
4. Scrub `SK_Flatten`: the 2D cross-section appears — the 3 coordinate axes are
   visible as the branching pattern.

### Part 4 — record.py render (≈ 30 sec)

1. Back in **Scripting**, open `record.py`.
2. Run it — the render will start automatically and write `viewport.mp4`.
3. Show the terminal output confirming `Viewport render complete`.

---

## Tips

- Rotate the viewport with **Middle-Mouse drag** to show all faces.
- Press `Numpad 5` to toggle orthographic/perspective — orthographic makes the
  node cone geometry clearest.
- The mesh is flat-shaded (`holoflow:facet=True`); no smooth-shading pass needed.
- If the script prints `0 vertices`, check that Blender 5.1 (not 3.x) is running —
  the `color_attributes` API is 4.0+.
