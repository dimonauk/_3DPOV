# Screen Recording Notes
## Python — bmesh bridge_loops: Fuselage Hull from Stacked Profile Rings
### Blender 5.1 · OBS Studio / Windows Game Bar

---

## Goal

Capture `screen.mp4`: you walking through `blueprint.py` in the Scripting
workspace, running it, then inspecting the hull topology in the 3D Viewport.

---

## Setup

| Setting | Value |
|---|---|
| Software | OBS Studio 30+ or Windows Game Bar (Win + G) |
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output | MP4 · H.264 · CRF 22 |
| File name | `screen.mp4` |
| Output folder | `public/library/videos/scripting/bmesh-bridge-loops-fuselage-hull/` |

---

## OBS Setup Steps

1. Open OBS → Sources → `+` → Window Capture → select `Blender 5.1`.
2. Settings → Output → Recording Path → set to the output folder above.
3. Settings → Video → Base 1920×1080, Output 1920×1080, FPS 30.
4. Start Recording (or Win+G on Windows).

---

## Recording Script

### Part 1 — Open Scripting workspace (≈ 30 s)

1. Launch Blender 5.1, dismiss the splash.
2. Click the **Scripting** workspace tab.
3. Text Editor → **Open** → navigate to this folder → open `blueprint.py`.
4. Scroll to the `PROFILE` constant — explain each `(z, radius)` tuple as a
   fuselage cross-section, nose to tail.

### Part 2 — Explain the bridge strategy (≈ 60 s)

1. Scroll to `_build_hull()` and show the `create_circle` call.
   - Point out `cap_ends=False` — open ring only.
   - Explain the immediate Z-translate to position each ring.
2. Show the bridge loop:
   - `_ring_edges()` — why we filter edges by ring membership.
   - `bridge_loops(use_cyclic=True)` — emphasise this is **mandatory** for
     closed rings; the script comment explains the gap that appears without it.
   - `use_smooth=False` — intentional, produces hard facet normals.

### Part 3 — Run the script (≈ 20 s)

1. Press **Run Script** (or Alt+P).
2. Check the Info header for errors.
3. Confirm three `[holoflow]` print lines appear in the console output.

### Part 4 — Inspect the hull topology (≈ 90 s)

1. Switch to the **Layout** workspace.
2. Press **Tab** → **Edge select mode**.
3. Hover over one of the horizontal ring edges — show how edge loops run
   cleanly around the hull at each profile station.
4. **Alt+Click** an edge loop to select the full ring — all SEGMENTS edges
   highlight.
5. Switch to **Face select mode** → **Alt+Click** a column of quads — shows
   the bridged quad strip between two adjacent profiles.
6. Switch back to Object Mode.

### Part 5 — Wireframe overlay (≈ 30 s)

1. Press **Alt+Z** to enable Wireframe overlay in the 3D Viewport.
2. Orbit to show the nose-tip fan (triangles) and the belly (quads) side by
   side — explain when fans are acceptable vs grid-fill for subdivision.
3. Disable wireframe overlay.

### Part 6 — Material Preview (≈ 30 s)

1. Press **Z** → **Material Preview**.
2. Orbit to a 3/4 view — show the gunmetal surface with faint engine-blue
   emission on the hull faces.

---

## After Recording

- Stop OBS / Game Bar.
- Rename the output to `screen.mp4`.
- Place in `public/library/videos/scripting/bmesh-bridge-loops-fuselage-hull/`.
