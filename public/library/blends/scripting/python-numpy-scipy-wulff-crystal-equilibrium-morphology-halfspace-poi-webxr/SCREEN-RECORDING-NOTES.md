# Screen Recording Notes — Wulff Crystal Construction

**Target file:** `public/library/videos/scripting/python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr/screen.mp4`

---

## OBS / Game Bar Settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |
| Output path | `…/videos/scripting/python-numpy-scipy-wulff-crystal-equilibrium-morphology-halfspace-poi-webxr/screen.mp4` |

---

## What to Record

**Total target runtime: 8–12 minutes** (trim to best 6 min for the tutorial embed).

### Part 1 — Set up (2 min)
1. Open Blender 5.1 → **Scripting** workspace.
2. New text block; paste `blueprint.py`.
3. Show the parameter block at the top — point out `SHAPE_KEYS` list,
   `ISO_LEVEL`, `SCALE`.
4. Explain `wulff_radius()` in 30 seconds: "minimum distance over
   forward-facing halfspaces".

### Part 2 — Run and inspect (3 min)
1. Hit **Run Script** (▶).  Expect ~3–8 s on modern hardware.
2. Switch to **3D Viewport**.
3. In Properties → Object Data → Shape Keys:
   - Activate `cube` → see sharp square faces.
   - Slide to `cuboctahedron` → triangular + square faces appear.
   - Slide to `octahedron` → all square faces gone, 8 triangular faces.
4. Zoom close to a facet; show that triangles on the same crystal face
   are perfectly coplanar (identical flat normals → no artefact shading).

### Part 3 — Material + render (2 min)
1. Switch to **Material Preview** (HDRI sphere in header).
2. The diamond-IOR transmission material should give rainbow caustic
   highlights under most HDRIs.
3. Set render engine → **Cycles** (or EEVEE Next) for a quick F12 render.
4. Show the shape key morph in Rendered mode:  
   drag `cuboctahedron` value from 0 → 1 while recording.

### Part 4 — GLB export (1 min)
1. Set `EXPORT_GLB = True` in the script (it already is).
2. Re-run; console shows `[Wulff] GLB → …`.
3. Drag-drop the `.glb` into `gltf.report` or the Three.js viewer to
   confirm morph targets exported.

---

## After Recording
- Trim start/end silence.
- No colour-grade needed (keep the raw viewport look).
- Export as MP4 H.264, rename to `screen.mp4`, place at path above.
