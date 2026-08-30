# Brusselator Reaction-Diffusion — Stage Floor

**Prigogine & Lefever 1968** · Blender 5.1 · CC0

An 80×80 quad-grid stage floor whose height and vertex colour encode the
activator (U) concentration from the Brusselator reaction-diffusion
system — the founding model for dissipative structure formation.
Ilya Prigogine was awarded the 1977 Nobel Prize in Chemistry for this
theory of self-organisation in non-equilibrium systems.

## Equations

```
∂U/∂t = D_u·∇²U + A − (B+1)U + U²V     (activator / slow diffuser)
∂V/∂t = D_v·∇²V + BU − U²V              (inhibitor / fast diffuser)
```

Steady state: U\* = A, V\* = B/A  
Hopf bifurcation at B = 1 + A² (temporal oscillation onset)  
Turing instability when B < 1+A² and D\_v >> D\_u

## Shape keys

| Key        | A   | B   | D\_u | D\_v | Pattern              | k²\_c  |
|------------|-----|-----|------|------|----------------------|--------|
| Basis      | 2.0 | 3.8 |  1.0 |  8.0 | Labyrinthine stripes |  1.15  |
| SK\_Spots  | 3.0 | 5.5 |  1.0 |  8.0 | Hexagonal spot array |  1.69  |
| SK\_Hopf   | 1.0 | 2.5 |  1.0 |  1.0 | Temporal Hopf cycle  |  n/a   |
| SK\_Dense  | 2.0 | 4.5 |  0.5 |  8.0 | Dense fine labyrinth |  3.25  |

## Files

| File                        | Purpose                       |
|-----------------------------|-------------------------------|
| `blueprint.py`              | Blender 5.1 scripting script  |
| `record.py`                 | EEVEE Next viewport recorder  |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture guide  |

## Outside sources

- Prigogine I & Lefever R (1968) *Symmetry Breaking Instabilities in
  Dissipative Systems.* J Chem Phys **48**(4):1695–1700.
  DOI: 10.1063/1.1668896. Equations: Public Domain.
- NumPy Developers — BSD-3-Clause — <https://numpy.org>
