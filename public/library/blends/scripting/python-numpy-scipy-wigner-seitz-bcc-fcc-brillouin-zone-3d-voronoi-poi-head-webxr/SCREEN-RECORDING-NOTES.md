# Screen-Recording Notes — Wigner-Seitz Cell Tutorial
**OBS / Game Bar instructions for `screen.mp4`**

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoding | H.264, CRF 18 (High quality) |
| Audio | **Off** — no microphone / system audio |
| Output file | `public/library/videos/scripting/python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr/screen.mp4` |

## Recording Flow (≈ 12 minutes total)

### Segment 1 — Theory (≈ 3 min)
1. Open a browser alongside Blender. Navigate to the tutorial page at `/tutorials/blender-tutorial-python-numpy-scipy-wigner-seitz-bcc-fcc-brillouin-zone-3d-voronoi-poi-head-webxr`.
2. Explain the Wigner-Seitz construction: *"Pick a lattice site; draw perpendicular bisector planes to all nearest neighbours; their intersection is the WS cell."*
3. Show diagrams for all three lattice types side by side. Point out:
   - SC → 6 square faces (cube)
   - BCC → 14 faces: 8 hexagonal {111} (amber) + 6 square {100} (blue)
   - FCC → 12 identical rhombic {110} faces (lime)
4. Mention the Brillouin zone: same construction in reciprocal space. Point to a periodic table of BZ shapes if desired.

### Segment 2 — Script walkthrough (≈ 4 min)
1. Switch to Blender → **Scripting** workspace.
2. Load `blueprint.py` in the Text Editor.
3. Walk through the key functions:
   - `generate_lattice()` — integer-combo loop, origin at index 0.
   - `ws_cell_vertices()` — `scipy.Voronoi`, region lookup, ConvexHull normalisation.
   - `coplanar_polygons()` — merge triangulated hull into polygon faces, angle-sort.
   - `face_colour()` — dot-product family classification.
   - `build_ws_object()` — bmesh construction, emission material, `holoflow:facet` flag.
4. Press **Alt+P** to run. Show console output: SC / BCC / FCC face/vert counts.

### Segment 3 — Viewport inspection (≈ 3 min)
1. Switch to **3D Viewport** → Material Preview mode (sphere icon top-right).
2. Enable vertex-colour display. Show the three cells side by side.
3. Rotate view to show:
   - SC cube: 6 identical blue square faces.
   - BCC truncated octahedron: 8 amber hexagons + 6 blue squares visible.
   - FCC rhombic dodecahedron: 12 lime rhombi, no right-angle corners.
4. Select the BCC cell; open Properties → Object Properties → Custom Properties — show `holoflow:facet = True`.
5. Demonstrate flat shading: all edges are sharp, no smoothing — pure low-poly aesthetic.

### Segment 4 — Export & viewer (≈ 2 min)
1. Run `record.py` (Alt+P in a second text block). Show the 180-frame render starting.
2. Export GLB via File → Export → glTF 2.0:
   - Format: GLB, Draco level 6, Vertex Colors ✓, Apply Transforms ✓.
   - Save as `hf_wigner_seitz.glb`.
3. Load in the Holoflow Three.js viewer. Verify all three cells load with correct colours.

## Key Visual Moments to Highlight
- The moment the BCC truncated octahedron appears — 14 clean faces, immediately recognisable.
- Rotating the FCC rhombic dodecahedron: all 12 faces are identical rhombi, no symmetry-breaking.
- The colour scheme reads as a legend: amber = hexagonal face family, blue = square, lime = rhombic.
- Hover over Custom Properties in the Properties panel to show the `holoflow:facet` flag.

## Post-Processing
- Trim to remove setup pauses. Target duration: 10–12 minutes.
- No colour grading needed — Blender's Material Preview already looks clean.
- Add chapter markers in the video description matching the four segments above.
