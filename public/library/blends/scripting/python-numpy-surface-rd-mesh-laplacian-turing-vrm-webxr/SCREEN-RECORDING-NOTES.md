# Screen Recording Notes — Surface Reaction-Diffusion via Mesh Laplacian

**Target file:**
`public/library/videos/scripting/python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 — Scripting workspace |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent recording) |
| Output format | MP4 / H.264 |

## What to Record

**Duration target:** 90–120 seconds

1. **Open Blender** — Scripting workspace.  Open `blueprint.py` in the Text Editor.

2. **Explain the constants** — scroll to the CONSTANTS block.  Point out:
   - `SUBDIVISIONS = 4` → 642 vertices, 1280 triangular faces
   - `DU = 0.16, DV = 0.08` — same ratio-2 diffusivities as the flat grid
   - `DT = 0.50` — stable because umbrella Laplacian eigenvalues are bounded at 2

3. **Point to `build_umbrella_adjacency`** — explain why umbrella is used instead
   of cotangent: cotangent eigenvalues scale as 1/h², making DT ≈ 0.001 on a
   metre-scale mesh.

4. **Run the script** — ▶ Run Script.  The Info/terminal overlay should log:
   ```
   step     0  V∈[0.000, 0.250]
   step  2000  V∈[0.001, 0.198]
   step  4000  V∈[0.012, 0.203]
   step  6000  V∈[0.038, 0.211]
   step  8000  V∈[0.051, 0.215]
   step 10000  V∈[0.053, 0.216]
   Surface RD done — V ∈ [0.0530, 0.2163]
   ✓  //hf_surface_rd.glb written
   ```
   Runtime: 60–120 s on a modern CPU (642 verts, 12 000 steps, two Laplacians per step).

5. **Switch to 3D Viewport** — orbit the sphere in Solid and Material Preview.
   Show the faceted leo pard-spot surface from multiple angles.

6. **Run a parameter variant** — change `F_RATE = 0.035` and `K_RATE = 0.060`,
   re-run.  Show the shift from hexagonal spots to stripe labyrinths.

7. **Run record.py** — show the shape-key timeline and hit F12.

## Editing Notes

- Jump-cut the ~90 s simulation wait down to 3 s.
- Add lower-third: "Surface Reaction-Diffusion | Mesh Laplacian | Blender 5.1"
- Final shot: orbit the spot sphere at 45° elevation, fade to black.
