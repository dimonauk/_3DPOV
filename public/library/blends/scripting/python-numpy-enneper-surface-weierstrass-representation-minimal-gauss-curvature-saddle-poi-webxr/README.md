# Enneper Surface — Weierstrass–Enneper Representation, Minimal Surface, Gauss Curvature Poi Head (Blender 5.1)

Alfred Enneper derived this surface in 1864 as an explicit solution to
Euler–Lagrange's minimal-surface problem using the complex-analytic
apparatus that Hermann Weierstrass was simultaneously developing.
The two men's approaches fuse into what we now call the
**Weierstrass–Enneper representation** — a machine that converts
two complex-analytic choices into a minimal surface in ℝ³.

## Mathematical identity

Choose the Gauss map `g(z) = z` (identity) and height differential `dh = dz`
(simplest possible choices on ℂ).  Integrate:

```
x = Re[z − z³/3]  =  u − u³/3 + u·v²
y = −Im[z + z³/3] =  −v + v³/3 − u²·v
z = Re[z²]        =  u² − v²
```

The resulting surface is **conformal** (E = G = (1 + u² + v²)², F = 0) and
**minimal** (H = 0) by construction.  Gauss curvature:

```
K(u,v) = −4 / (1 + u² + v²)⁴
```

K is negative everywhere (pure saddle), reaching its extremum K = −4 at the
origin and relaxing toward 0 as the arms extend.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert bpy script — surface, curvature colour, shape keys, GLB export |
| `record.py` | Viewport animation render (150 frames, EEVEE_NEXT) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions |
| `.expected-artefacts.json` | CI manifest |

## Output artefacts

- `hf_enneper_poi.blend` — Blender scene (save after running blueprint.py)
- `hf_enneper_poi.glb` — Draco-6, WebP, morph targets, +Y-up
- `public/library/videos/.../viewport.mp4` — rendered by record.py
- `public/library/videos/.../screen.mp4` — OBS screen capture

## Shape keys

| Key | PMAX | Effect |
|-----|------|--------|
| Basis | 2.0 | Standard saddle with partial self-intersection |
| SK_Tight | 1.0 | Clean saddle, self-intersection-free (|u|,|v| < 1.5 threshold) |
| SK_Wide | 3.0 | Exaggerated arms, deep self-intersection, curvature nearly flat at rim |
| SK_Rotate45 | 2.0 | Parameter plane rotated 45° — saddle axis shifts 45° in xy |

## Licence

Blueprint: **CC0** (Holoflow Studio original).  
Outside sources: Enneper 1864 (PD), NumPy BSD-3-Clause.

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-python-numpy-enneper-surface-...`
- Related studio tutorials:
  - Schwarz P, D & Gyroid (other minimal surfaces)
  - Discrete Gaussian Curvature / Gauss-Bonnet
  - Boy Surface (topology of immersed surfaces)
