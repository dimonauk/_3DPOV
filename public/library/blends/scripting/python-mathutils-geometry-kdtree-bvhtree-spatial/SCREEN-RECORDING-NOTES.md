# Screen Recording Notes
## python-mathutils-geometry-kdtree-bvhtree-spatial

Target file: `public/library/videos/scripting/python-mathutils-geometry-kdtree-bvhtree-spatial/screen.mp4`

---

### Software

| Tool | Setting |
|------|---------|
| OBS Studio | Source → Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (mute all sources) |
| Output format | MP4 / H.264 / CRF 18 |

---

### Scene layout before recording

1. Run `blueprint.py` in the Script Editor. You should see an icosphere (dark blue) and a coloured point-cloud constellation in the 3D Viewport.
2. Switch to **Vertex Paint** colour display: Viewport Shading → Solid → Colour: **Vertex**. The constellation probes should show a red-to-blue gradient.
3. Open a second editor area: **Python Console** on the left, **3D Viewport** on the right.
4. Zoom viewport to fit the full constellation + anchor (`Numpad .`).
5. Set Viewport to **Material Preview** (`Z → Material Preview`) so the Emission shader on the constellation reads the vertex attribute.

---

### Recording sequence (approx 90 s total)

| Clip | Action | Notes |
|------|--------|-------|
| 0–10 s | Show final result — rotate anchor + constellation with middle mouse drag | Establishes what we are building |
| 10–25 s | Open Script Editor, scroll through `blueprint.py` — pause at KDTree build section | Keep `kd.balance()` visible for at least 3 s |
| 25–40 s | Scroll to BVHTree section — highlight `find_nearest()` call and the `if loc is None` guard | |
| 40–55 s | Run `blueprint.py` (Alt-P or Run Script button) — watch console output | Script clears scene then rebuilds |
| 55–75 s | Rotate finished scene, zoom in on constellation edges, toggle between Solid and Material Preview | Show vertex colour gradient |
| 75–90 s | Open System Console (Window → Toggle System Console on Windows) — show the print output confirming probe count and edge count | |

---

### Post-processing

- Trim leader/trailer to ±0.5 s of action.
- No colour grading needed — Blender viewport is source of truth.
- Export MP4 at 1920 × 1080, H.264 CRF 20, AAC audio (silent track OK).
- Drop the file at:
  `public/library/videos/scripting/python-mathutils-geometry-kdtree-bvhtree-spatial/screen.mp4`
