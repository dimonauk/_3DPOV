# Liu Attractor (2004) — Holoflow Studio Library

**System**: ẋ=a(y−x)  ẏ=bx−kxz  ż=−cz+hx²  
**Parameters**: a=10 b=40 k=1 c=2.5 h=4  
**Blender**: 5.1 | **Licence**: CC0 | **Topic**: scripting/chaos

---

## What this is

A 3D strange attractor discovered by C. Liu, T. Liu, L. Liu, and K. Liu in
2004, published in *Chaos Solitons Fractals* 22(5):1031–1038.  It is a
close relative of the Lorenz system with one key change: the xy cross-product
that drives the z-equation in Lorenz is replaced by **hx²**.  Because x² is
always non-negative, the z-variable is always driven upward and can never be
driven negative — the attractor lives entirely in z > 0.

The orbit forms a Z₂-symmetric butterfly (the map (x,y,z)→(−x,−y,z) leaves
the equations invariant) with two wings anchored near P± = (±5, ±5, 40).
Trajectories spiral inward toward each wing's stable manifold, are then
ejected along the wing's strongly unstable real eigenvalue (≈+9.05), and
are reinjected through the origin region to the opposite wing.

## Key numbers

| Quantity | Value |
|----------|-------|
| Divergence ∇·F | −12.5 (constant) |
| λ₁ (Lyapunov) | +1.847 |
| Lyapunov time | ≈0.54 |
| D_KY | ≈2.129 |
| Fixed points | O=(0,0,0), P±=(±5,±5,40) |
| Origin eigen | +15.62, −25.62, −2.5 |
| Wing eigen (P±) | +9.05, −10.78±10.24i |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender 5.1 to build the mesh + GLB |
| `record.py` | Run after blueprint.py to render `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_liu_poi.blend` | Saved blend (run blueprint.py to generate) |
| `hf_liu_poi.glb` | WebXR-ready GLB (Draco 6, WebP, Y-up) |

## Shape keys

| Key | Parameters | Effect |
|-----|-----------|--------|
| Basis | canonical (b=40, c=2.5) | standard butterfly |
| SK_LoB | b=28 | wings at z=28, x±≈±4.18 — compact |
| SK_HiB | b=52 | wings at z=52, x±≈±5.70 — expanded |
| SK_SoftZ | c=1.5 | slower z-decay, x±≈±3.87 — reshaped |

## Usage in WebXR

Export settings (set automatically by `blueprint.py`):

```
Y-up: True      Draco level: 6      Textures: WebP
Apply transforms: True   Export morph targets: True
Export vertex colours: True   Root name: hf_liu_poi
```

The `Liu_Speed` FLOAT_COLOR attribute on `POINT` domain drives the
cobalt→amber gradient in the Three.js / WebXR scene.

## Outside sources

1. Liu C et al (2004) *Chaos Solitons Fractals* 22(5):1031–1038.
   DOI: [10.1016/j.chaos.2004.02.060](https://doi.org/10.1016/j.chaos.2004.02.060).
   Mathematical equations are in the public domain.

2. NumPy (BSD-3-Clause). Harris CR et al (2020) *Nature* 585:357–362.
   https://numpy.org — https://github.com/numpy/numpy

## Studio links

- Tutorial: `/tutorials/blender-tutorial-python-numpy-liu-attractor-2004-lorenz-variant-x-squared-z-driving-z2-symmetry-constant-divergence-rk4-bishop-tube-poi-webxr`
- Related: Lorenz, Chen, Lü, Shimizu–Morioka attractors in this library
