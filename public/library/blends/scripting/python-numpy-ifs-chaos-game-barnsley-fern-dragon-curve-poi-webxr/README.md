# IFS Chaos Game: Barnsley Fern, Sierpinski & 3D Dragon Curve

**Blender 5.1 · Python + numpy · CC0**

Implements the Iterated Function System (IFS) chaos game algorithm for three
classic fractal attractors. Consecutive chaos-game points form natural NURBS
brushstroke splines — no spatial sorting required. Exports three GLBs for
WebXR poi light-trail display.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy + numpy script — run in Blender Text Editor |
| `record.py` | EEVEE Next viewport render (240 frames, 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact manifest + cross-references |

## Quick start

1. Open Blender 5.1, switch to the **Scripting** workspace.
2. New text block → paste `blueprint.py` → **Run Script**.
3. Three curve objects appear: `hf_ifs_fern` (green), `hf_ifs_sierpinski` (orange), `hf_ifs_dragon` (blue-purple).
4. Switch to **Material Preview** or **Rendered** shading to see emission glow.

## Output artefacts

- `hf_ifs_fern.glb` — Barnsley Fern as NURBS tube curves (Draco L6)
- `hf_ifs_sierpinski.glb` — Sierpinski triangle brushstrokes
- `hf_ifs_dragon_3d.glb` — Dragon Curve as a 3-D blue helix

## Algorithm notes

### Hutchinson fixed-point theorem (1981)

Given a finite set of affine contractions {f₁,…,fₙ} on a complete metric
space (ℝᵈ, ‖·‖), there exists a **unique** non-empty compact attractor A such
that A = f₁(A) ∪ … ∪ fₙ(A).  The Hausdorff metric on compact subsets is
itself complete, and the union map H → ⋃fᵢ(H) is contractive; Banach's
fixed-point theorem guarantees the unique fixed point.

### Chaos game (Barnsley 1988)

Start at any x₀ ∈ ℝ². At each step draw rule index k from the probability
distribution p(k) ∝ |det fₖ|, then apply xₙ₊₁ = fₖ(xₙ). After the
warm-up transient (≈50 steps), every subsequent point lies on A with
probability 1 (the ergodic theorem for IFS; Elton 1987).

### Why consecutive points form valid curves

Each fₖ is contractive (Lipschitz constant < 1), so |xₙ₊₁ − xₙ| ≤
L·diam(A) where L = max‖fₖ‖ < 1. Consecutive points are bounded-distance
neighbours in A. A window of CHUNK_SIZE = 150 consecutive points therefore
traces a smooth-enough path to fit a NURBS spline — no KD-tree sorting
or strand-building heuristic required.

### Dragon Curve 3-D extension

The Dragon Curve's 2-D attractor lives in [0,1]² under self-similarity; it
is fractal and non-smooth but bounded. Adding a fixed Z offset per chaos-game
step (Z_HELIX_PER_STEP = 0.004 m before SCALE) turns the flat attractor into
a rising helix that reads as a poi light-painting trail when viewed from the
side. The fractal cross-section in any XY slice is still the 2-D Dragon Curve.

## Attribution

- Barnsley, Michael F. "Fractals Everywhere." Academic Press, 1988. The
  specific IFS parameters for the fern and dragon curve are mathematical
  constants in the public domain.
- Hutchinson, John E. "Fractals and self-similarity." Indiana University
  Mathematics Journal 30(5), 1981. Public domain mathematical result.
- Elton, John H. "An ergodic theorem for iterated maps." Ergodic Theory and
  Dynamical Systems 7(4), 1987. Public domain mathematical result.
