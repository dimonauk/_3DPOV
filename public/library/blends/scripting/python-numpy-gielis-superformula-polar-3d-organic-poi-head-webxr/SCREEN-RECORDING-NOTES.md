# Screen Recording Notes — Gielis Superformula Poi Head

## Software
OBS Studio (≥ 30.0) or Windows Game Bar (Win+G).

## Source setup
- **Window Capture** — source = Blender (not Display Capture)
- Resolution: 1920×1080, Base 1920×1080, Output 1920×1080
- FPS: 30
- Audio: off (no mic, no desktop audio)
- Format: MP4 / H.264, CRF 18

## Output file
Save to:
`public/library/videos/scripting/python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr/screen.mp4`

---

## Recording script (~6 minutes)

### 1. Theory intro — the superformula (90 s)
Open Blender 5.1. Switch to **Scripting** workspace. Load blueprint.py.
Walk through the formula at the top of the file:

    r(θ) = [ |cos(mθ/4)/a|^n2 + |sin(mθ/4)/b|^n3 ]^(−1/n1)

Point out each parameter and its role:
- **m** — number of rotational symmetry lobes
- **n1** — global sharpness (large n1 → angular; small n1 → bulgy)
- **n2, n3** — independent exponents for cosine / sine terms
  (asymmetric values give lopsided lobes)

Show the `MORPHS` table and read out the five parameter sets.

### 2. Blueprint run (60 s)
Press **Alt+P**. Watch the console print mesh statistics and the final
`✓ exported //hf_superformula_poi.glb` line.
Switch to **3D Viewport → Material Preview** (Z → Material Preview).

### 3. Mesh inspection — Basis hex blob (45 s)
The default (m=6, n1=n2=n3=1) should look like a rounded hexagonal sphere —
six gently bulging lobes, violet in the recesses, cyan at the tips.
Press **Numpad 7** (top-down) to see the six-fold symmetry.
Press **Numpad 1** (front) to see the equatorial outline.

### 4. Shape key demo (120 s)
Open **Object Properties → Shape Keys**.  Drag each weight from 0 → 1 slowly
and hold at 1 for ~5 s before returning to 0:

- **Starfish** (m=5, n2=n3=7): five elongated arms radiate outward; the tips
  are very sharp because high n2/n3 concentrates the cosine term.
- **Cross** (m=4, n2=n3=2): four rounded lobes at 90°; softer than the
  starfish because n2/n3 are lower.
- **Thorns** (m=8, n1=0.5, n3=8): eight sharp spines; n1=0.5 gives a large
  reciprocal exponent (−1/0.5 = −2) which amplifies peaks dramatically.
- **Cube** (m=4, n1=n2=n3=50): the formula approaches a cube as all exponents
  → ∞, because the Lp norm converges to the L∞ norm (Chebyshev distance).

### 5. record.py render (30 s)
Load record.py. Press **Alt+P**. The 120-frame animation renders to viewport.mp4
via Workbench. Play it back in the Video Sequence Editor to confirm smooth
morph transitions and the full 360° rotation.

### 6. GLB in browser (30 s)
Open hf_superformula_poi.glb in model-viewer or Three.js.
Set `morphTargetInfluences[1]` (Starfish) to 0.7 in the browser console
to show the shape key working outside Blender.

---

## OBS quick-start
```
Start recording: Alt+F9
Stop recording:  Alt+F9
```
