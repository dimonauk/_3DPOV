# Burning Ship Fractal — Michelitsch & Rössler (1992)

**Blender 5.1 | Python + numpy | Stage Floor | WebXR**  
Licence: CC0 (mathematical algorithm — equations and iteration rules are in the public domain)

---

## The iteration

The Burning Ship fractal, first described by Michelitsch & Rössler (1992), modifies
the Mandelbrot iteration by taking absolute values of both real and imaginary parts
before each squaring:

```
z₀ = 0
z_{n+1} = (|Re(zₙ)| + i·|Im(zₙ)|)² + c
```

Expanded into real arithmetic:

```
a = |Re(z)|,   b = |Im(z)|
Re(z') = a² − b² + Re(c)
Im(z') = 2ab    + Im(c)
```

The absolute-value fold forces every iterate into the first quadrant (a ≥ 0, b ≥ 0)
before squaring.  This breaks the analytic (holomorphic) symmetry of the Mandelbrot
map and redirects leftward-moving trajectories back toward the real axis, producing
the dense horizontal "rigging" structures characteristic of the fractal.

---

## Why it looks like a burning ship

When the imaginary axis is drawn with Im increasing downward (the standard orientation
for this fractal), the main body of the filled set resembles a ship viewed from below,
with a prominent "mast" rising from the upper-right of the hull.  The rigging
structures are dense horizontal filaments extending along the real axis — a direct
consequence of the fold making Im(z) non-negative each step, which builds up
structures along Im(c) ≈ 0.

The main body ("hull") sits near:
```
Re(c) ≈ −1.75,   Im(c) ≈ −0.03
```
The mast tip (a deep mini-ship):
```
Re(c) ≈ −1.755,  Im(c) ≈ −0.028
```

---

## Smooth colouring

Raw escape-time colouring produces discrete bands (integer level sets of n).
The smooth iteration count removes this by interpolating within each band:

```
n_smooth = n_escape − log₂(log₂|z_escape|)
```

When |z| > 2 (the bail-out radius), `log₂(log₂|z|)` lies in (0, 1], so
`n_smooth` is a continuous value that slides smoothly between the integer levels.
This is then normalised to [0, 1] and mapped through a Bernstein cubic colour ramp
(cobalt → sky-blue → warm-amber → amber).

---

## Shape keys

| Key | Region Re | Region Im | max_iter | Description |
|-----|-----------|-----------|----------|-------------|
| Basis | [−2.5, 1.0] | [−2.0, 0.5] | 256 | Full Burning Ship view |
| SK_Ship | [−1.90, −1.60] | [−0.10, 0.05] | 512 | Hull zoom (≈10× magnification) |
| SK_Mast | [−1.775, −1.740] | [−0.040, −0.010] | 768 | Mast tip detail (≈75× magnification) |
| SK_Julia | [−1.8, 1.8] × [−1.8, 1.8] | c=(−1.755, −0.028) | 512 | Burning Ship Julia set |

All Im ranges are drawn flipped (large Im at top) so the ship is upright.

---

## Mesh

- **Grid**: 120 × 120 = 14 400 vertices, 14 161 quad faces
- **Extent**: 8.4 m × 8.4 m (CELL_SIZE = 0.07 m/cell)
- **Max height**: 0.55 m (HEIGHT_SCL)
- **Vertex colour attribute**: `BS_Escape` (FLOAT_COLOR, POINT domain)

---

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Open `blueprint.py` and click **Run Script**.
3. The `BurningShip` stage-floor object appears in the scene.
4. Switch shape keys in Object Data Properties → Shape Keys to explore views.
5. Export as glTF 2.0 with Draco compression and morph targets for WebXR.

---

## Sources

- Michelitsch M & Rössler O (1992) "The 'burning ship' and its quasi-Julia sets."
  *Comput & Graphics* **16**(4):435–438. DOI [10.1016/0097-8493(92)90007-3](https://doi.org/10.1016/0097-8493(92)90007-3).
  Mathematical equations and iteration: public domain.
- Mandelbrot B (1982) *The Fractal Geometry of Nature.* W.H. Freeman.
  Smooth colouring theory: public domain equations.
