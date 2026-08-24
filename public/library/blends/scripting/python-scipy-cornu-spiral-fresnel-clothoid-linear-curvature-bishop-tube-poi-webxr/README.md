# Cornu Spiral — Euler Spiral / Clothoid

**Blueprint:** `blueprint.py`  
**Record:** `record.py`  
**Tutorial:** `/tutorials/blender-tutorial-python-scipy-cornu-spiral-fresnel-clothoid-linear-curvature-bishop-tube-poi-webxr`  
**Blender version:** 5.1  
**Licence:** CC0

---

## What is the Cornu spiral?

The Cornu spiral traces the path of a particle moving at unit speed with curvature increasing linearly in time. Formally, the position at arc-length parameter t is:

```
x(t) = C(t) = ∫₀ᵗ cos(πu²/2) du   (Fresnel cosine integral)
y(t) = S(t) = ∫₀ᵗ sin(πu²/2) du   (Fresnel sine integral)
```

The curvature at parameter t is κ(t) = πt. The curve winds infinitely many times as |t| → ∞, converging on the limiting points (±½, ±½). The bilateral spiral (t ∈ [−T_MAX, +T_MAX]) forms a smooth, symmetric S-shape: zero curvature and zero torsion at the origin, tightest coiling at the tips.

This blueprint uses `scipy.special.fresnel` to compute (S(t), C(t)) numerically and wraps the resulting space curve in a Bishop parallel-transport tube exported as Draco-6 WebP GLB for WebXR.

---

## Three discoverers

| Person | Year | Context |
|--------|------|---------|
| Leonhard Euler | 1768 | Computed ∫₀^∞ cos(t²) dt = ∫₀^∞ sin(t²) dt = ½√(π/2) in *Institutionum Calculi Integralis* |
| Augustin-Jean Fresnel | 1818 | Derived C(t) and S(t) to calculate Fresnel diffraction at a straight edge |
| Marie Alfred Cornu | 1874 | Plotted C vs S as a single graphical tool for diffraction calculations |

The curve also appears in railway engineering as the **clothoid** or **transition curve** — the unique curve interpolating between a straight track (κ = 0) and a circular arc (constant κ) so that the lateral acceleration on a moving vehicle varies continuously.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Pure-bpy script — builds Cornu tube + shape keys + emissive material + GLB export |
| `record.py` | Viewport animation render — 300 frames, 10 s, EEVEE Next |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `hf_cornu_poi.blend` | Saved Blender scene (generated on local run) |
| `hf_cornu_poi.glb` | Draco-6 WebP GLB for WebXR (generated on local run) |

---

## Shape keys

| Key | Parameter change | Visual effect |
|-----|-----------------|---------------|
| Basis | T_MAX=3.0, z=0 | Flat 2-D S-spiral |
| SK_Helix | z = 0.055 × t | Lifts into 3-D helical clothoid |
| SK_Tight | T_MAX=1.5, z=0 | Fewer coils, relaxed central shape |
| SK_Fat | T_MAX=3.0, TUBE_R×1.6 | Wide tube, emphasises cross-section |

---

## Cross-references

- [Euler Elastica — Jacobi dn, Curvature Lemniscate, Ribbon Poi](/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr)
- [Viviani's Curve — Bishop Tube, Figure-8 Poi](/tutorials/blender-tutorial-python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr)
- [Dini Surface / Pseudosphere — Tractrix, Sine-Gordon, Kink](/tutorials/blender-tutorial-python-numpy-dini-surface-pseudosphere-sine-gordon-kink-tractrix-poi-webxr)
- [Kuen Surface — Pseudospherical, Sine-Gordon](/tutorials/blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr)
