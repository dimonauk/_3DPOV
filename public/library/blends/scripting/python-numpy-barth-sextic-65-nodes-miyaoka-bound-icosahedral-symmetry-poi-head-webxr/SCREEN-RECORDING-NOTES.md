# Screen Recording Notes — Barth Sextic Poi Head

**Tutorial:** Python numpy — Barth Sextic: 65 Nodes, Miyaoka Bound, Icosahedral Symmetry (Blender 5.1)
**Target file:** `public/library/videos/scripting/python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr/screen.mp4`

---

## OBS Setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture — select **Blender 5.1** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no desktop audio) |
| Output format | MP4 / H.264, CRF 18 |
| Encoder preset | Veryfast |

## What to capture (∼8 minutes)

### 00:00 – 01:00  Open & paste blueprint

1. Open Blender 5.1. Go to **Scripting** workspace.
2. New text block — paste `blueprint.py` in full.
3. Show the docstring section explaining **Miyaoka bound** and the **icosahedral symmetry** (scroll through the comments slowly, 5–10 seconds per paragraph).

### 01:00 – 01:30  Run the script

1. Press **Run Script** (▷ button or Alt+P).
2. Let the marching-tetrahedra extraction run. Show the **Info bar** at the bottom streaming:
   - `Barth Sextic: extracting isosurface (N=80)…`
   - `XXXX vertices, YYYY triangles`
   - `GLB exported → …`
3. Keep the camera on the Info bar long enough to see the vertex/face count.

### 01:30 – 03:00  Viewport exploration

1. Switch to **3D Viewport** → **Material Preview** (Z-key) or **Solid** with **Vertex Color** enabled.
2. Orbit slowly around the poi head. **Pause on the pole view** (numpad 7) to show the 5-fold icosahedral symmetry.
3. Tilt to equatorial view — show how the 65 node-proximity points appear as **dark blue patches** in the vertex colour.
4. Zoom in on two or three individual nodes (they appear as pinch-point crease marks in the mesh).

### 03:00 – 04:30  Shape keys

1. In **Properties → Object Data → Shape Keys**, select **SK_Compact** and drag the value slider 0→1→0.
   - The surface "shrinks" but nodes remain identifiable.
2. Same for **SK_Inflate** (surface puffs out).
3. Select **SK_Flatten** — drag 0→1 slowly, pointing out how the flattened cross-section reveals the icosahedral orbit structure in 2D.

### 04:30 – 06:00  Shader edit & quick material

1. Switch to **Shading** workspace.
2. Show the **Principled BSDF** node — highlight the deep-indigo Base Color and the slight Emission.
3. Drag **Metallic** from 0.30 to 0.80 — show the poi head glinting.
4. Drag back to 0.30.

### 06:00 – 07:00  GLB export & side-by-side compare

1. Open a file browser and navigate to the `public/library/blends/…/` folder.
2. Show `hf_barth_sextic.glb` exists.
3. Return to Blender. Mention the companion algebraic surfaces in the library:
   - **Clebsch Cubic** (degree 3, 27 lines)
   - **Kummer Quartic** (degree 4, 16 nodes)
   - **Barth Sextic** is now the degree-6 entry in this series.

### 07:00 – 08:00  Summary

- Read back the key invariants from the console output.
- Final slow orbit with Cavity mode on (Viewport Overlays → Cavity).

---

## Post-production (edit in DaVinci Resolve or Kdenlive)

- Trim dead space before run and after GLB export message.
- Cut to 6–7 min for the final upload.
- Add lower-third text card at 00:00: **"Barth Sextic · 65 Nodes · Iₕ Symmetry · Blender 5.1"**
- Colour grade: neutral, no LUT.
- Export as 1080p H.264 MP4, place in `public/library/videos/scripting/<slug>/screen.mp4`.
