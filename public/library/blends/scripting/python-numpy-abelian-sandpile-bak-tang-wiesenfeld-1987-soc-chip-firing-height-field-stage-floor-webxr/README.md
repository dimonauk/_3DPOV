# Abelian Sandpile Model — BTW 1987, Self-Organised Criticality

**Blender 5.1** · Python + numpy · Stage Floor · WebXR-ready GLB  
Licence: CC0 | `public/library/blends/scripting/<slug>/`

---

## What this is

A grid of cells, each holding non-negative integer "chips" (sand grains), ruled by:

> If a cell holds **≥ 4 chips**, it **topples**: loses 4 chips; each cardinal
> neighbour gains 1. Chips falling off the boundary are lost.

Bak, Tang & Wiesenfeld (1987) discovered that when chips are added one at a time
to the centre of this grid, the system **self-tunes to criticality** without any
external parameter tuning — the first example of *self-organised criticality* (SOC).
Avalanche sizes follow a power law P(s) ∝ s^{−1.21}, spanning all scales.

The stable pile forms a quasi-fractal disc with **exact D₄ symmetry** and a
domain-boundary Hausdorff dimension d_H ≈ 1.7845.

| Shape key | Chips | Radius | Highlight |
|-----------|-------|--------|-----------|
| **Basis** | 12 000 | ≈ 42 cells | Canonical diamond fractal |
| SK_Sparse | 3 000 | ≈ 21 cells | Early intricate pattern |
| SK_Dense  | 25 000 | ≈ 61 cells | Finite-size cutoff at grid edge |
| SK_Cross  | 4 × 1 500 | ≈ 21 each | Four overlapping piles in cross |

Vertex colour `Sandpile_Chips`: **cobalt** (0 chips) → **sky blue** (1) →
**warm amber** (2) → **amber** (3 chips).

---

## The Abelian property

**Dhar (1990)** proved that any sequence of toppling unstable cells reaches the
same final stable configuration — toppling order is irrelevant.  This makes the
stable state unique and the model algebraically elegant: the set of stable
configurations forms a commutative monoid (the "sandpile group").  Parallel
(synchronous) toppling in numpy therefore gives the canonical stable state.

---

## Blueprint parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `N` | 101 | Grid side (101² = 10 201 vertices) |
| `CELL_SIZE` | 0.07 m | Physical size per cell |
| `HEIGHT_SCL` | 0.35 m | z elevation at 3 chips |
| `BATCH` | 200 | Chips per incremental stabilisation call |
| `N_BASIS` | 12 000 | Chips for Basis shape key |
| `RING_OFF` | 20 | Off-centre seed distance for SK_Cross |

---

## Quick start

1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py` → **Run Script**.  
   Console prints chip counts and final vertex / face count.
3. Switch to **Layout** workspace → select `Sandpile_SOC`.
4. Open **Properties → Object Data → Shape Keys** panel.
   Blend between `Basis`, `SK_Sparse`, `SK_Dense`, `SK_Cross`.
5. For screen recording see `SCREEN-RECORDING-NOTES.md`.
6. For the rendered viewport animation run `record.py` in a second Text
   Editor tab after the scene is built.
7. Export for WebXR:
   ```
   File → Export → glTF 2.0
   Format: GLB  |  +Y up  |  Apply transforms  |  Draco 6  |  WebP textures
   Shape Keys: ✓  |  Vertex Colours: ✓  |  Custom Properties: ✓
   ```

---

## Troubleshooting

- **Slow computation** — the incremental BATCH=200 approach keeps each
  stabilisation call fast. If it still feels slow, reduce N_BASIS or increase
  BATCH to 500.
- **Pile looks too sparse** — small N_BASIS with a large grid gives an
  under-sampled result; raise N_BASIS or lower CELL_SIZE.
- **SK_Dense shows sharp rectangular cuts** — this is correct: it's the
  finite-size effect where the pile exceeds the grid half-width and chips
  fall off the absorbing boundary.
- **SK_Cross piles merge** — at RING_OFF=20 and R≈21, the sub-piles just
  overlap. Reduce RING_OFF to 30 to keep piles independent, or reduce N_CROSS.

---

## Sources

1. Bak P, Tang C, Wiesenfeld K (1987) "Self-Organized Criticality: An
   Explanation of the 1/f Noise." *Phys Rev Lett* **59**(4):381–384.
   https://link.aps.org/doi/10.1103/PhysRevLett.59.381  — equations PD.

2. Dhar D (1990) "Self-organized Critical State of Sandpile Automaton Models."
   *Phys Rev Lett* **64**(14):1613–1616.
   https://link.aps.org/doi/10.1103/PhysRevLett.64.1613  — equations PD.

3. Levine L, Peres Y (2010) "Scaling limits for internal aggregation with
   multiple sources." *J Anal Math* **111**:151–219.
   https://arxiv.org/abs/0712.3378  — proved the limit-shape theorem (disc).
