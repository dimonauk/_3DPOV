# Arnold's Cat Map — Anosov Diffeomorphism & Golden-Ratio Manifolds

**Blender 5.1 · Python/NumPy · CC0**

The hyperbolic torus automorphism M = [[2,1],[1,1]], introduced by Vladimir
Arnold in the 1960s to demonstrate that a smooth, volume-preserving map on a
compact manifold can produce uniform chaos with an exactly known Lyapunov
exponent.

## Mathematical content

| Property | Value |
|---|---|
| Map | f(u,v) = (2u+v, u+v) mod 1 |
| Matrix | M = [[2,1],[1,1]], det M = 1 |
| Eigenvalues | λ± = (3±√5)/2 = φ² and 1/φ² |
| Lyapunov exponent | Λ = log(φ²) ≈ 0.962 nats/iter |
| Stable mfd slope | -φ ≈ -1.618 (eigenvec of λ₋) |
| Unstable mfd slope | 1/φ ≈ 0.618 (eigenvec of λ₊) |
| M^k entries | Fibonacci numbers (M^3 = [[13,8],[8,5]]) |
| Dynamical type | Anosov diffeomorphism (uniformly hyperbolic) |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Blender 5.1 bpy script — builds the disc, shape keys, colour attribute |
| `record.py` | Render animation (K-step morph) → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Artefacts produced

- `hf_arnold_cat.blend` — Blender save (run File → Save after blueprint.py)
- `hf_arnold_cat.glb` — Draco-6 compressed WebXR asset
- `viewport.mp4` — 10-second morph render (record.py)
- `screen.mp4` — manual screen recording (see notes)

## Running

```bash
blender --background --python blueprint.py
```

Or paste `blueprint.py` into the Scripting editor and press **Run Script**.

## Shape keys

| Key | K steps | M^K entries |
|---|---|---|
| Basis | 0 | identity (flat disc) |
| SK_Step1 | 1 | [[2,1],[1,1]] |
| SK_Step2 | 2 | [[5,3],[3,2]] |
| SK_Step3 | 3 | [[13,8],[8,5]] |
| SK_Step5 | 5 | [[89,55],[55,34]] |
| SK_Step8 | 8 | [[987,610],[610,377]] |

## Licence

All files in this directory are released under **CC0 1.0 Universal**
(public domain dedication). No attribution required, but it is appreciated.
