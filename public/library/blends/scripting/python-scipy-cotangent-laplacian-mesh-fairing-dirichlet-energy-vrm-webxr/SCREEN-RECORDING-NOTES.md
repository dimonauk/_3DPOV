# Screen Recording Notes — Cotangent Laplacian Mesh Fairing

**Target file:** `public/library/videos/scripting/python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic needed) |
| Output format | MP4 (H.264) |

## What to Record

### Pass 1 — Scripting workspace run (≈ 90 s)
1. Open Blender 5.1 → new General file.
2. Switch to the **Scripting** workspace.
3. Click **New** in the Text Editor, paste the contents of `blueprint.py`.
4. Click **Run Script**. Watch the Python Console for `"Fairing done"`.
5. Switch to **Layout** workspace. Show the sphere in Solid mode first, then
   Material Preview mode — the blue-to-amber gradient shows where Taubin
   moved vertices furthest from the original.

### Pass 2 — Shape key scrub in Properties (≈ 60 s)
1. Select the sphere. Open **Object Data Properties → Shape Keys**.
2. Slowly scrub the **Taubin** key from 0 → 1 while watching the 3D viewport
   — show how the noisy bumps flatten without the sphere shrinking.
3. Return Taubin to 0. Scrub **Implicit** from 0 → 1 — show the heavier
   global smoothing at the same time-step.
4. Set both keys to 0.5 simultaneously — show the interpolated intermediate.

### Pass 3 — Spreadsheet attribute inspection (≈ 30 s)
1. Open the **Spreadsheet** editor. Set domain to **Point**.
2. Columns `dev_taubin` and `dev_implicit` show per-vertex displacement
   magnitudes. Sort descending to find the vertex displaced furthest.

### Pass 4 — GLB in glTF viewer (≈ 30 s)
1. Drag `hf_fairing.glb` into `https://gltf.report` (or Babylon.js Sandbox).
2. In the Morph Targets panel, scrub **Taubin** and **Implicit** sliders to
   demonstrate real-time morph playback in the browser.

## Edit Notes
- Cut between scripting run and shape-key scrub at the `"Fairing done"` print.
- Add lower-third text overlay: "Cotangent weights | Taubin λ/μ | Implicit (Desbrun 1999)".
- Export final cut at 1080p 30fps H.264 CRF 22.
