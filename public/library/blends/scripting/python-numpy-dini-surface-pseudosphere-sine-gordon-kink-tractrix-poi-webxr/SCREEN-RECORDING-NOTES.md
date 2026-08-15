# Screen Recording Notes — Dini's Surface Poi Head

Target output: `public/library/videos/scripting/python-numpy-dini-surface-pseudosphere-sine-gordon-kink-tractrix-poi-webxr/screen.mp4`

---

## Software

| Tool | Version | Notes |
|------|---------|-------|
| OBS Studio | ≥ 30 | Window capture |
| Blender | 5.1 | Python Scripting workspace |

---

## Scene preparation

1. Open Blender 5.1 → **Scripting** workspace.
2. Paste `blueprint.py` into the text editor and run it (`▶ Run Script`).
   - Confirm the console reads `✓ Dini surface complete`.
   - The helical pseudosphere should appear in the viewport, coloured with
     a rainbow kink-angle hue wrapping around the helix.
3. Switch viewport to **Material Preview** (Lookdev, `Z → 4`).
   Backface culling is disabled — the inner face of the curl is intentionally
   visible; do not enable backface culling.
4. Enable **Overlays → Wireframe** at 10% to show the quad structure.
5. In the **Properties → Object Data → Shape Keys** panel, pin all five keys
   so they're visible.

---

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Encoder | H.264 / x264 |
| Rate control | CRF 18 |
| Output | `screen.mp4` |

---

## Recording script (≈ 4 min)

### 1 · Introduction (0:00 – 0:30)
- Show the full viewport: rainbow-coloured helical surface, three and a half turns.
- Zoom orbit around the object to show the cusp at the tip (v → 0) and the open
  base (v → π).  These are the singularities Hilbert's theorem predicts.

### 2 · Shape-key morphing (0:30 – 1:30)
- Open **Properties → Object Data → Shape Keys**.
- Drag **SK_Gentle** to 1.0: surface uncoils slightly.
- Drag back to 0, then **SK_Moderate** to 1.0: moderate helix develops.
- Continue through **SK_Tight** and **SK_Drill**.
- Comment: "At b = 0 this is Beltrami's pseudosphere — a model of the
  hyperbolic plane.  As b increases, the Lorentz-boost of the sine-Gordon
  kink soliton tightens the helix."

### 3 · Shader node tour (1:30 – 2:15)
- Open the **Shader Editor** with the object selected.
- Point out: `ShaderNodeAttribute ("DiniCol")` → base colour and emission.
- The emission glow comes from the kink-angle hue being both diffuse and emissive.

### 4 · Blueprint walkthrough (2:15 – 3:30)
- Switch to **Scripting** workspace.
- Scroll through `blueprint.py`, pausing at:
  - `dini_verts()` — the parametric formula
  - `kink_colour()` — boosted-kink angle as HSV hue
  - `add_shape_keys()` — five pitch values → GLTF morph targets
  - `finalise()` — +Y-up rotation, POI_DIAMETER scale

### 5 · GLB export (3:30 – 4:00)
- Run `record.py` (or trigger the viewport animation manually).
- Show the Draco-6 GLB appearing in the output directory.
- End shot: orbit around the Drill shape key at full value.
