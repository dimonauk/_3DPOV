# Screen-Recording Notes — Wigner GOE Floor

**Target file:** `public/library/videos/scripting/python-numpy-wigner-semicircle-goe-random-matrix-eigenvalue-level-repulsion-stage-floor-webxr/screen.mp4`

---

## OBS Settings

| Setting | Value |
|---|---|
| Base (canvas) resolution | 1920 × 1080 |
| Output (scaled) resolution | 1920 × 1080 |
| Frame rate | 60 fps |
| Encoder | x264 (CRF 18) or NVENC (quality 20) |
| Output format | mp4 |
| Audio | Disabled (no microphone) |
| Capture source | Window capture — Blender |

---

## Pre-recording checklist

- [ ] Run `blueprint.py` in the Blender Scripting workspace; confirm output line  
  `[wigner] 14400 verts  14161 quads  4 shape keys  Done.`
- [ ] Switch to Layout workspace; confirm `WignerGOE_Floor` is visible in the viewport
- [ ] Set viewport shading to **Material Preview** (Sphere icon) — this activates the emission material
- [ ] Set render engine to **EEVEE Next** in the scene properties
- [ ] Open the **Shape Keys** panel (Object Data Properties → Shape Keys tab)
- [ ] Confirm four keys visible: `Basis`, `SK_Small`, `SK_Med`, `SK_Pois`
- [ ] Position 3D viewport camera: numpad 5 (ortho), numpad 7 (top), then numpad 4 to tilt 45° — or use `setup_camera()` from `record.py`

---

## Suggested takes (60–90 s each)

### Take 1 — Wigner ridge overview (top-down)
Camera: top-down, centred on origin, slight 30° tilt.  
Script commentary to read aloud (or overlay as text card):

> *The x-axis is the eigenvalue λ; the y-axis is the unfolded nearest-neighbour spacing s.  
> The Wigner ridge at s ≈ 0.9 shows where GOE eigenvalues prefer to be spaced.  
> The void at s = 0 is level repulsion: two eigenvalues never coincide.*

Action sequence:
1. Start on **Basis** (N=100 GOE) — show the ridge and the depleted s=0 zone (≈15 s)
2. Drag **SK_Pois** slider from 0 → 1 — watch the ridge collapse and s=0 fill in (≈20 s)
3. Hold Poisson state — note the exponential tail extending to large s (≈10 s)
4. Return SK_Pois → 0, Basis restored (≈10 s)

### Take 2 — Convergence with matrix size (SK_Small, SK_Med, Basis)
Camera: 45° orbit, slow pull-back.

> *As the matrix size N increases from 20 to 50 to 100, the histogram converges to the  
> universal Wigner–Dyson distribution. At N=20 the ridge is noisy; at N=100 it is sharp.*

Action sequence:
1. Start on **SK_Small** (N=20): ragged, broad ridge (≈15 s)
2. Cross-fade to **SK_Med** (N=50): ridge sharpens (≈20 s)
3. Cross-fade to **Basis** (N=100): clean semicircle profile on x-axis, clean surmise on y-axis (≈20 s)

### Take 3 — Scripting workspace run (live demo)
Show the Blender Scripting workspace, open `blueprint.py`, run it, then switch to Layout.

> *The entire geometry is generated procedurally: no manual modelling, no UV mapping,  
> no external assets. The physics is in the Python — the mesh is its output.*

Action:
1. Open Scripting workspace (≈5 s)
2. Click **Run Script** — watch console output (≈20 s; N_MAT=250 takes ≈15 s on a modern CPU)
3. Switch to Layout, tumble around the object (≈30 s)

---

## Export

After recording, trim to ≤90 s and export to:

```
public/library/videos/scripting/
  python-numpy-wigner-semicircle-goe-random-matrix-eigenvalue-level-repulsion-stage-floor-webxr/
    screen.mp4
```

Do **not** commit mp4 files — the `.gitignore` excludes them; the `.gitkeep` placeholder is already present.
