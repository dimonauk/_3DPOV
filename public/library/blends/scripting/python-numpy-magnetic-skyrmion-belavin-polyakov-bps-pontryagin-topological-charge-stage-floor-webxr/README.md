# Magnetic Skyrmion — Belavin-Polyakov BPS Topological Soliton

**Topic**: O(3)/CP¹ sigma model · Pontryagin index · BPS exact solution  
**Blender**: 5.1 · Python scripting · NumPy  
**Output**: `skyrmion_floor.blend` · `skyrmion_floor.glb` · `viewport.mp4`

---

## What is a magnetic skyrmion?

A skyrmion is a localised spin texture in which the unit magnetisation
vector **n**(x,y) wraps around the sphere S² exactly once as (x,y) sweeps
the plane.  The winding cannot be undone by any continuous deformation —
it is *topologically protected*.  The integer that counts the wrapping is
the Pontryagin index Q (also called the topological charge or Hopf index):

```
Q = (1/4π) ∫ n · (∂_x n × ∂_y n) dx dy  ∈  ℤ
```

Belavin & Polyakov (1975) found the field configurations that minimise
energy for each Q:  the **BPS** (Bogomolny–Prasad–Sommerfield) solitons.
For winding m and size parameter λ:

```
n_z = (r^{2m} − λ^{2m}) / (r^{2m} + λ^{2m})

       n_z(0) = −1  (core points down)
       n_z(∞) = +1  (vacuum points up)
```

The floor height encodes n_z; the colour encodes it again as
cobalt (core, n_z = −1) → amber (background, n_z = +1).

## Shape keys

| Key | m | λ (m) | Q | Description |
|-----|---|--------|---|-------------|
| Basis   | 1 | 0.50 | −1 | Q=1 skyrmion — standard hollow centre |
| SK_Q2   | 2 | 0.50 | −2 | Q=2 two-skyrmion — narrower, steeper walls |
| SK_Anti | 1 | 0.50 | +1 | Q=−1 antiskyrmion — inverted dome |
| SK_Large| 1 | 1.00 | −1 | Dilated skyrmion — same topology, wider profile |

> Note on sign convention: the BPS profile f(r) = 2 arctan((λ/r)^m) gives
> Q = −m.  The table lists |Q| for clarity.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Blender scripting: builds mesh, shape keys, vertex colour, GLB export |
| `record.py` | Blender scripting: sets up camera, EEVEE Next, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Quick-start

```bash
blender --python blueprint.py   # build .blend + export .glb
blender --python record.py      # render viewport.mp4 (10 s clip)
```

## Mathematical depth

- **Homotopy**: π₂(S²) = ℤ classifies maps from compactified ℝ² ≅ S² into S².
- **Bogomolny bound**: E ≥ 4π|Q|J, saturated by BPS solutions.
- **Pontryagin density**: ρ(r) peaks at r = 0 (centre), integrates to −m.
- **Physical realisation**: MnSi, FeGe, Cu₂OSeO₃ — observed 2009–2016,
  connected to the 2016 Nobel Prize in Physics (Thouless, Haldane, Kosterlitz).
