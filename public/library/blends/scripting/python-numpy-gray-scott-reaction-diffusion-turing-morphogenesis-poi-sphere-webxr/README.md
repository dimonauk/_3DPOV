# Gray-Scott Reaction-Diffusion — Turing Morphogenesis Poi Head

**Topic**: Turing morphogenesis via Gray-Scott two-variable reaction-diffusion on a UV-sphere poi head  
**Blender version**: 5.1  
**Licence**: CC0 (independent Holoflow Studio authoring)  
**Date**: 2026-08-09  

---

## What this is

Alan Turing's 1952 paper "The Chemical Basis of Morphogenesis" proved that two
interacting chemicals diffusing at different rates can spontaneously break spatial
symmetry and form the regular patterns seen on leopard spots, zebrafish stripes,
seashell pigmentation, and fingerprints.  Gray & Scott (1983) provided the clean
two-variable formulation now used in virtually all computer demonstrations.

This library entry runs **five independent simulations** on a 128 × 128 periodic
grid — one per named parameter regime — then samples the inhibitor (v) concentration
field onto the vertices of a UV-sphere poi head via bilinear interpolation, displacing
each vertex outward along its normal.  The five morphologies are stored as
**GLTF morph targets** (shape keys) so the poi head can morph between pattern types
in a WebXR scene at runtime.

---

## Pattern Regimes

| Shape Key        | (F, k)         | Visual Character             |
|------------------|---------------|------------------------------|
| Base (spots)     | 0.035, 0.060  | α-pearls: isolated dot field |
| worm_stripes     | 0.037, 0.063  | β-stripes: connected worms   |
| labyrinthine     | 0.046, 0.059  | δ: maze-like corridors       |
| holes            | 0.022, 0.051  | ε: inverted spots (holes)    |
| fingerprints     | 0.014, 0.054  | λ-Turing: fine parallel arcs |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 script — simulation, mesh, shape keys, export |
| `record.py` | Viewport-animation recorder — renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/QuickTime instructions for `screen.mp4` |
| `README.md` | This file |
| `.expected-artefacts.json` | CI artefact manifest |

Expected output files (generated, not committed):

- `gs_morphogenesis_poi.blend` — saved blend
- `gs_morphogenesis_poi.glb` — Draco-compressed, WebP, morph targets

---

## Running

```bash
# From the Blender scripting workspace — paste and run blueprint.py
# Or from CLI:
blender --background --python blueprint.py

# To render the viewport animation:
blender gs_morphogenesis_poi.blend --python record.py --background
```

---

## Mathematics

The Gray-Scott PDEs on a 2D periodic torus:

```
∂u/∂t = D_u ∇²u  −  u·v²  +  F·(1 − u)
∂v/∂t = D_v ∇²v  +  u·v²  −  (F + k)·v
```

- **u** (activator / substrate): spontaneously generated, consumed when it meets v
- **v** (inhibitor / product): produced from the u–v reaction, removed at rate k
- **F** (feed): constant inflow of u from a reservoir
- **D_u, D_v**: diffusion constants; D_u/D_v ≈ 2 drives the instability

The 5-point stencil Laplacian on the discrete grid with periodic wrapping:

```
∇²f[i,j] = f[i+1,j] + f[i-1,j] + f[i,j+1] + f[i,j-1] − 4·f[i,j]
```

Forward-Euler integration is stable when `D_u · dt / dx² ≤ 0.25` — satisfied
with `D_u=0.2, dt=1.0, dx=1` (Von Neumann stability criterion).

---

## Cross-references

- [Barkley Excitable Medium tutorial](/tutorials/blender-tutorial-python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr) — the Barkley model is a fast approximation to the FitzHugh-Nagumo RD equations; compare the spiral wave topology with Gray-Scott worm stripes.
- [Ising Model tutorial](/tutorials/blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr) — another grid-based emergence of pattern from local rules, but via statistical mechanics rather than PDEs.
- [Chladni Figures tutorial](/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr) — eigenmodes of a resonant plate produce nodal patterns with superficial similarity to Turing spots; compare the origin (Helmholtz eigenvalue vs. RD fixed point).

---

## Sources

1. **Turing AM 1952** — "The Chemical Basis of Morphogenesis." *Phil Trans R Soc B* 237(641):37–72. Public domain.  
   https://royalsocietypublishing.org/doi/10.1098/rstb.1952.0012

2. **Pearson JE 1993** — "Complex Patterns in a Simple System." *Science* 261(5118):189–192.  
   Defines the five named regimes and the (F, k) phase diagram used in this implementation.

3. **Karl Sims** — "Reaction Diffusion Tutorial." Personal website.  
   http://www.karlsims.com/rd.html — Plain-English explanation of the parameter space.
