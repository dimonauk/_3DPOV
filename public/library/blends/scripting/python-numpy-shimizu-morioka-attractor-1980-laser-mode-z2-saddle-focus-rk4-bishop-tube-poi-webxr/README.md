# Shimizu–Morioka Attractor (1980) — Poi Head for WebXR

**Blender 5.1 · Python / numpy · CC0 · Holoflow Studio**

---

## What is this?

The **Shimizu–Morioka system** is a three-dimensional ordinary differential
equation that Toshio Shimizu and Nozomi Morioka derived in 1980 as a minimal
model for competition between two oscillation modes in a semiconductor laser
cavity.  It generates a Lorenz-type **butterfly strange attractor** with exact
**Z₂ symmetry**: the right wing and the left wing are mirror images under the
transformation (x, y, z) → (−x, −y, z).

Unlike the Lorenz system's 7-term structure, the Shimizu–Morioka system has
only **5 terms** and a single quadratic nonlinearity (the x² term in ż).
Despite this simplicity, it produces richly structured chaos, with orbital
speed varying dramatically between the slow saddle passages near the origin
and the fast outer loops around each wing centre.

```
ẋ =  y
ẏ =  x − a·y − x·z
ż = −b·z + x²

Canonical: a = 0.375,  b = 0.800
```

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: integrates the ODE, builds the Bishop-framed tube mesh, assigns SM_Speed FLOAT_COLOR, adds four shape keys, sets up material, applies +Y-up transform for glTF export |
| `record.py` | Viewport animation render: 240 frames at 24 fps, 300° camera orbit, shape-key cycle — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the manual `screen.mp4` capture |
| `hf_shimizu_morioka_poi.blend` | Saved Blender file (run blueprint.py to regenerate) |
| `hf_shimizu_morioka_poi.glb` | WebXR-ready GLB: Draco-6, WebP textures, +Y-up, morph targets, vertex colour |

---

## Key parameters

| Symbol | Value | Physical meaning |
|--------|-------|-----------------|
| a | 0.375 | Damping coefficient (laser cavity loss) |
| b | 0.800 | Population-inversion relaxation rate |
| D_KY | ≈ 2.089 | Kaplan–Yorke fractal dimension |
| λ₁ | ≈ +0.115 | Largest Lyapunov exponent |
| ∇·F | −1.175 | Constant phase-volume contraction rate |
| Lyapunov time | ≈ 8.7 | Time units for errors to double |

---

## Shape keys

| Key | Parameters | Morphology |
|-----|-----------|------------|
| **Basis** | a=0.375, b=0.800 | Canonical butterfly chaos |
| **SK_LowA** | a=0.200, b=0.800 | Lower damping → wider, more extended orbit; slower saddle switching |
| **SK_HiA** | a=0.600, b=0.800 | Higher damping, approaching the Hopf boundary at a≈1.07; orbit compresses |
| **SK_LowB** | a=0.375, b=0.500 | Slower z-relaxation; equilibria shift inward from (±0.894,0,1) to (±0.707,0,1) |

---

## Holoflow export settings

```python
ob["holoflow:facet"]    = False
ob["holoflow:category"] = "poi-head"
ob["export_name"]       = "hf_shimizu_morioka_poi"
```

GLB export: Draco compression level 6, WebP textures,
`export_morph_targets=True`, `export_colors=True`, +Y-up.

---

## Licence

Blueprint, record script, and documentation: **CC0** (public domain dedication).
Mathematical equations and original physical insight: Shimizu & Morioka (1980),
Physics Letters A 76(3–4):201–204 — mathematical results in the public domain.
