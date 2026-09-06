# Sprott H Attractor — Blender 5.1 Library Entry

**Topic:** Scripting → Python + NumPy  
**System:** ẋ=−y+z², ẏ=x+ay, ż=x−z  (Sprott 1994, Case H)  
**Canonical parameter:** a = 0.50  
**Blender version:** 5.1  
**Licence:** CC0 (blueprint code); equations are public-domain mathematics.

---

## What This Entry Contains

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: RK4 integrator, Bishop tube, shape keys, material |
| `record.py` | Viewport animation recorder (150 frames, EEVEE Next) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 |

Expected artefacts (produced when scripts are run locally):

```
hf_sprott_h_poi.blend
hf_sprott_h_poi.glb
public/library/videos/scripting/…/viewport.mp4
public/library/videos/scripting/…/screen.mp4
```

---

## The System at a Glance

```
ẋ = −y + z²          ← sole nonlinearity; quadratic z-injection
ẏ = x + a·y          ← a tunes divergence and Shilnikov ratio
ż = x − z            ← self-damping toward x
```

**Divergence (constant):** ∇·F = a − 1 = −0.50

**Shilnikov saddle-focus at the origin:**
- Eigenvalues: −1, 0.25 ± 0.968i
- Condition ρ/|λ_s| = 0.25 < 1 ✓ — chaos guaranteed by Shilnikov's theorem

**Lyapunov spectrum:**  
λ₁ ≈ +0.094, λ₂ ≈ 0.000, λ₃ ≈ −0.594 → D_KY ≈ 2.158

**Shape keys:**

| Key | a | Effect |
|-----|---|--------|
| Basis | 0.50 | canonical spiral orbit |
| SK_LoA | 0.25 | stronger dissipation, tighter tube |
| SK_HiA | 0.75 | weaker dissipation, wider orbit |
| SK_NearCons | 0.95 | near-conservative, large chaotic cloud |

---

## How to Run

1. Open Blender 5.1 with a blank scene.
2. Open `blueprint.py` in the Text Editor.
3. Click **Run Script** (Alt+R) or press the ▶ button.
4. Inspect the result in the 3D Viewport (Material Preview for colours).
5. Export GLB: call `export_glb("hf_sprott_h_poi.glb")` or use
   File → Export → glTF 2.0 with Draco level 6, WebP textures, morph
   targets and vertex colours enabled.

To record the viewport animation, open `record.py` and run it inside the
same .blend file.

---

## Sources

- Sprott JC (1994). *Some simple chaotic flows.*  
  Phys. Rev. E **50**(2):R647–R650. DOI 10.1103/PhysRevE.50.R647  
  (Table I, Case H — equations are public-domain mathematical facts.)
- Shilnikov LP (1965). *A case of the existence of a countably infinite
  number of periodic motions.*  
  Sov. Math. Dokl. **6**:163–166. (Public domain — establishes the
  homoclinic orbit chaos theorem invoked above.)
- Gilpin W (2021–2024). *dysts: Dynamical Systems Benchmarks.*  
  MIT licence. https://github.com/williamgilpin/dysts
