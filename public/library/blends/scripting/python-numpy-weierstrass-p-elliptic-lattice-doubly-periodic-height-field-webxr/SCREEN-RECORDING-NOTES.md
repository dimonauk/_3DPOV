# Screen-Recording Notes — Weierstrass ℘ Height Field

**Target file**: `screen.mp4`  
**Destination**: `public/library/videos/scripting/python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr/screen.mp4`

---

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (narrate in post if desired) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

---

## Recording script (≈ 15 minutes)

### 1 · Theory intro (3 min)

- Open a browser tab alongside Blender showing [DLMF §23](https://dlmf.nist.gov/23)
- Sketch the concept on screen or in a Blender text object:
  - Complex plane ℂ, lattice Λ, fundamental domain (parallelogram)
  - Formula: `℘(z) = 1/z² + Σ [1/(z−ω)² − 1/ω²]`
  - Why the Eisenstein subtraction is needed (absolute convergence)
  - What the pole at z=0 looks like (volcano peak)
  - The three half-period values e₁, e₂, e₃ and their role in the elliptic curve

### 2 · Parameters walkthrough (2 min)

- Open blueprint.py in the Scripting workspace
- Walk through the constants block at the top:
  - `GRID = 96` — resolution trade-off (higher is slower but smoother)
  - `N_SUM = 10` — why 10 is enough (sum decays as 1/|ω|³; N=8 gives <0.1% error)
  - `POLE_CLIP = 9.0` — why we truncate the pole (necessary for mesh to render)
  - `TAU_*` constants — the three lattice shapes and their symmetry groups

### 3 · Live run (4 min)

- Press Alt+P to run blueprint.py
- Watch the console print:
  - "℘ field — Square τ=i …"
  - "℘ field — Rectangular_tau_1p5i …"
  - "℘ field — Equianharmonic_tau_eiπ3 …"
  - "Computing vertex colours …"
  - Final confirmation with vertex/face counts and GLB path
- Typical runtime: 45–90 s on a modern CPU

### 4 · Result inspection (3 min)

- In 3D Viewport: press Z → Material Preview to see the cyan/magenta gradient
- Rotate around the mesh to show:
  - The truncated volcanic peak at the centre (pole)
  - The three saddle-point dips at the half-period positions (e₁, e₂, e₃)
  - The flat trough regions (where ℘ takes small values near its zeros)
- In Object Properties → Shape Keys:
  - Drag `Rectangular_tau_1p5i` slider to 1.0 — the volcano elongates along Y
  - Drag `Equianharmonic_tau_eiπ3` to 1.0 — the volcano gains 6-fold symmetry
  - Scrub back and forth to show the morph

### 5 · File save + record.py (2 min)

- File → Save As → `hf_weierstrass_p.blend`
- Load record.py, press Alt+P
- Show viewport animation rendering (120 frames)
- Confirm `viewport.mp4` exists in the output directory

### 6 · GLB in WebXR context (1 min)

- Note: the GLB can be dragged into any Holoflow stage as a floor mesh
- The `morphTargetInfluences[0]` / `[1]` slots match the shape keys for browser-side τ morphing

---

## Post-processing

- Trim to remove any long pauses during computation
- Add silent title card at start: "Weierstrass ℘-function · Blender 5.1 · Holoflow Studio"
- Export at 1080p / 30 fps / H.264 / AAC
