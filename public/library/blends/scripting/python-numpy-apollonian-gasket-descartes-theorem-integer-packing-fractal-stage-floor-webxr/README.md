# Apollonian Gasket — Stage Floor (Blender 5.1)

**Topic**: Scripting · Fractal Circle Packing · Descartes Theorem  
**Licence**: CC0  
**Blender version**: 5.1  
**Output**: stage floor GLB for WebXR

---

## What this is

The Apollonian gasket is a fractal tiling of the plane by circles of ever-smaller
radius, constructed by the Problem of Apollonius: given three mutually tangent
circles, inscribe a circle tangent to all three, then repeat. This blueprint
generates the integer Apollonian gasket starting from the seed `(−1, 2, 2, 3)`,
where the numbers are curvatures k = 1/r (the enclosing outer circle has
negative curvature k = −1).

## Mathematics

**Descartes' Circle Theorem (1643 / Soddy 1936)**  
Four mutually tangent circles satisfy:
```
(k₁+k₂+k₃+k₄)² = 2(k₁²+k₂²+k₃²+k₄²)
```

**Vieta jumping** makes the recursion integer-exact: given a valid quadruple
`(k1,k2,k3,k4)`, the sibling of k4 is `k4' = 2(k1+k2+k3) − k4`, and the
complex centre follows `k4'·z4' = 2(k1z1+k2z2+k3z3) − k4·z4`.

Starting from `(−1,2,2,3)`, every descendant curvature is a positive integer.
The Hausdorff dimension of the residual limit set is δ ≈ 1.3057 (Boyd 1973).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | BFS packing + Blender mesh + GLB export |
| `record.py` | 180-frame viewport animation + shape-key morph |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `apollonian_gasket_floor.blend` | saved Blender file (run blueprint.py first) |
| `apollonian_gasket_floor.glb` | Draco-6 compressed WebXR asset |

## Quick start

```python
# In Blender 5.1 Script Editor:
import bpy
exec(open("blueprint.py").read())  # generates mesh and exports GLB

# Then (optional):
exec(open("record.py").read())     # renders viewport.mp4
```

## Mesh spec

| Property | Value |
|----------|-------|
| Circle count (MAX_K=80) | ~280–400 |
| Vertex attribute | `Apollon_K` (FLOAT_COLOR, POINT) |
| Colour gradient | Cobalt (k=2) → Amber (k=MAX_K) |
| Shape keys | `Basis`, `SK_Elevated`, `SK_Inverted` |
| WebXR export | +Y-up, Draco-6, WebP |

## Shape keys

- **Basis** — flat disc array at z = 0; pure 2D tiling view.
- **SK_Elevated** — each disc raised by log(k)/log(MAX_K) × 0.12 m; small
  circles peak above large ones, turning the gasket into a curvature landscape.
- **SK_Inverted** — large circles elevated, small circles flat; inverts the
  landscape to show the low-curvature structure.

## Troubleshooting

**"Too few circles / gasket looks sparse"** — raise MAX_K above 80. Each step
roughly doubles the circle count (growth ~ K^1.3057).

**"Script hangs / very slow"** — the BFS queue can grow large. Add a
`queue.maxlen` limit or reduce MAX_K to 40 for a quick preview.

**"GLB has no morph targets"** — `export_morph=True` is required explicitly.

**"Colour gradient missing"** — the `ShaderNodeAttribute` must use
`attribute_type='GEOMETRY'` and name `'Apollon_K'`. Switch Viewport Shading
to **Material Preview** (Z key).
