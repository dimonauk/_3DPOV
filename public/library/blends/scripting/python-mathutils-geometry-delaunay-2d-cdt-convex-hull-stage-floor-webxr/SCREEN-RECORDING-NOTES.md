# Screen Recording Notes
## mathutils.geometry CDT Stage Floor

Target: `public/library/videos/scripting/python-mathutils-geometry-delaunay-2d-cdt-convex-hull-stage-floor-webxr/screen.mp4`

---

### Software
- **OBS Studio** 30.x or Windows Game Bar (`Win + G`)
- Blender 5.1 (standalone window)

### Capture settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output | MP4 (H.264 / CRF 18) |

---

### What to record (≈ 6–8 minutes raw → edit to 2–3 min)

1. **Open Blender 5.1** — New General file.  Switch to the Scripting workspace.
2. Open a new text block, title it `cdt_stage_floor.py`.
3. **Type (or paste) the import block** — pause on `from mathutils.geometry import delaunay_2d_cdt, convex_hull_2d` and open the Python console to show the docstring:
   ```python
   help(mathutils.geometry.delaunay_2d_cdt)
   ```
4. **Add phyllotaxis section** — draw the golden-angle diagram on a sticky note / whiteboard beside the screen to show WHY `√(i/n)` for radius distributes points uniformly in area.
5. **Call CDT** — show `output_type=0` first.  Print the first 5 faces to console so viewers see the index triples.
6. **Call `convex_hull_2d`** — print hull indices. Point out CCW winding order.
7. **Build bmesh** — show `bm.verts.new()` loop, then `bm.faces.new()` loop.
8. **Circumradius tinting** — hover over the formula in the code, explain that small R = compact Delaunay triangle (good), large R = near-degenerate (bad).
9. **Run the script** — press Alt+P.  In 3D viewport (split screen) the triangulated floor and purple ring appear.
10. Switch to Material Preview.  Show the per-face colour gradient top-down.
11. Tilt view to 30° elevation so the ring height is visible.
12. **Export GLB** — run script or File → Export → glTF 2.0 → GLB, Draco enabled.

### Post-production hints
- Speed-ramp the import/type-in sections ×1.5.
- Freeze frame at the moment the CDT mesh appears in viewport — let it hold 1 s.
- Add a text overlay showing "Delaunay: min angle ≥ any alternative triangulation" at step 5.
- Contrast shot: briefly show what a fan triangulation from the centroid would look like (elongated triangles near edge) vs the CDT result.
