# GN Simulation Zone — 2D Ising Model: Ferromagnetic Spin Lattice

**Blender 5.1 · CC0 · Holoflow Studio**

A 32×32 quad-face grid carries one binary spin per face (σ ∈ {0,1} stored as a `FLOAT` named attribute on the `FACE` domain). A Geometry Nodes Simulation Zone runs a parallel Metropolis update every frame: each spin samples its four periodic neighbours, computes the energy cost ΔE of flipping, and accepts the flip with probability min(1, exp(−ΔE/T)). The temperature cools linearly from T=4.5 (disordered) to T=0.8 (strongly ordered) over 200 frames, crossing the ferromagnetic phase transition at T_c ≈ 2.269 J/k_B.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds lattice mesh, GN simulation zone, emission material |
| `record.py` | Renders 200-frame EEVEE animation to `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

1. Open Blender 5.1 → **Scripting** workspace
2. Open `blueprint.py` → **Run Script**
3. Press **Space** to play the simulation
4. Open `record.py` → **Run Script** to render `viewport.mp4`
5. Follow `SCREEN-RECORDING-NOTES.md` to record `screen.mp4` via OBS

## Physics summary

```
H = −J Σ⟨ij⟩ σᵢσⱼ          ferromagnetic Hamiltonian (J=1)
T_c = 2/ln(1+√2) ≈ 2.269   Onsager exact critical temperature
ΔE  = 2J σᵢ Σⱼ σⱼ          single-flip energy cost
P(accept) = min(1, exp(−ΔE/T))  Metropolis criterion
```

## GN node summary

```
Index → col(Modulo N) / row(Floor Divide N)
→ 4× periodic neigh_idx  →  4× SampleIndex(spin, FACE)
→ pm1(σ)×5  →  ΔE = 2J·s_self·nsum
→ min(1, exp(−max(0,ΔE)/T))  →  acceptance
SceneTime.Frame → FunctionNodeRandomValue(Float)
→ Compare(LESS_THAN) → Switch → StoreNamedAttribute(spin, FACE)
```

## Expected output

- `hf_ising_model.blend` — scene file with GN modifier and emission material
- `viewport.mp4` — 200-frame render showing disordered → domain formation → ordered
- `screen.mp4` — OBS recording of walkthrough and node tree explanation

## Licence

CC0. The blueprint is an original implementation inspired by the Ising (1925)
and Onsager (1944) papers, both in the public domain.
