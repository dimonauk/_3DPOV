# Torus Knot T(p,q) — Blender 5.1 Library Entry

**Topic:** Knot theory · Seifert genus · Alexander polynomial · Milnor fibre  
**Format:** Poi head (GLB) + Blender source  
**Blender version:** 5.1  
**Licence:** CC0 (blueprint code) — equations public domain

## What is a torus knot?

A torus knot T(p,q) wraps p times longitudinally and q times meridionally around
the surface of a torus before closing into itself.  The requirement gcd(p,q) = 1
ensures it is a knot (one component) rather than a link.

Parametrically, on a torus with major radius R=2 and minor radius r=1:

```
γ(t) = ((2 + cos(qt))·cos(pt),
         (2 + cos(qt))·sin(pt),
         sin(qt))          t ∈ [0, 2π)
```

## Invariants for the four shape keys

| Shape key | T(p,q) | Seifert genus g | Crossing number c | Alexander polynomial Δ(t) |
|---|---|---|---|---|
| Basis | T(2,3) trefoil | 1 | 3 | t² − t + 1 |
| SK_Cinq | T(2,5) cinquefoil | 2 | 5 | t⁴ − t³ + t² − t + 1 |
| SK_T34 | T(3,4) | 3 | 8 | see blueprint docstring |
| SK_T35 | T(3,5) | 4 | 10 | see blueprint docstring |

**Seifert genus formula:** g = (p−1)(q−1)/2  
**Alexander polynomial:** Δ_{p,q}(t) = (t^{pq}−1)(t−1) / ((t^p−1)(t^q−1))  
**Milnor fibre:** all torus knots are fibered — the fibre surface is the Milnor fibre of z^p + w^q = 0.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Generates the knot mesh + shape keys in Blender 5.1 |
| `record.py` | Renders `viewport.mp4` via EEVEE Next |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output file listing |

## Running

1. Open Blender 5.1, go to **Scripting** workspace.
2. Open `blueprint.py`, press **Run Script**.
3. Check the system console for `[TorusKnot] done` message.
4. Open `record.py`, press **Run Script** to generate `viewport.mp4`.

## Export (GLB)

Use the holoflow WebXR exporter add-on with defaults:
- Draco compression level 6
- WebP textures
- Export morph targets (shape keys)
- Export vertex colours (TorKnot_Z attribute)
- +Y up

Output: `public/library/glbs/scripting/.../hf_torus_knot_poi.glb`
