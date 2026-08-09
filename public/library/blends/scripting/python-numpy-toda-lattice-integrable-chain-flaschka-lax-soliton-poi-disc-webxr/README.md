# Toda Lattice — Integrable Chain, Flaschka Variables & Soliton Poi Disc

**Category:** scripting · Blender 5.1 · CC0  
**Library path:** `public/library/blends/scripting/python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr/`  
**Tutorial:** `/tutorials/blender-tutorial-python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr`

---

## What this is

A 120 mm poi disc whose surface is a **spacetime diagram of the Toda lattice**:
32 particles arranged in a ring, each interacting with its neighbours through
the exponential potential V(r) = e⁻ʳ + r − 1. Time runs radially outward; the
azimuth is the particle index.

Solitons — non-dispersive localised waves — appear as **gold ridges spiralling
outward** from the hub. The 2-soliton basis shows two ridges that merge and
re-emerge with a phase shift. Shape key `SK_1sol` reduces to a single spiral;
`SK_phonon` shows the linearised regime (sinusoidal ring waves).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Generates mesh, integrates dynamics, exports GLB |
| `record.py` | Renders 144-frame viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_toda_disc.blend` | *(saved by blueprint.py)* |
| `hf_toda_disc.glb` | *(saved by blueprint.py; Draco-6, WebP, +Y-up)* |

## Running

```python
# In Blender 5.1 Scripting tab:
exec(open("blueprint.py").read())   # step 1 — mesh + GLB
exec(open("record.py").read())      # step 2 — viewport.mp4
```

`numpy` is bundled with Blender 5.1; no pip install required.

## Mathematical depth

| Concept | Detail |
|---------|--------|
| Potential | V(r) = e⁻ʳ + r − 1; Taylor: r²/2 − r³/6 + … (harmonic + anharmonic) |
| Dispersion | Linear phonons: ω_k = 2·\|sin(πk/N)\| → ω ≈ k for small k |
| Flaschka | aₙ = ½e^{−(q_{n+1}−qₙ)/2}, bₙ = −½pₙ; aₙ > 0 always |
| Lax pair | L (Jacobi), B (antisymmetric); L̇ = [B,L] → isospectral |
| Soliton speed | v ≈ 2sinh(κ/2) ≈ κ for small κ |
| Collision | Solitons pass through; phase shift Δ = (1/κ)log\|tanh((κ₁−κ₂)/2)/tanh((κ₁+κ₂)/2)\| |
| Conservation | N conserved quantities: Tr(Lᵏ), k=1…N |

## Poi connection

In contact-staff and poi spinning, energy travels along the chain of weighted
segments in a pattern that is **exactly the Toda soliton regime** for small
amplitudes. The exponential repulsion models the mechanical stops; the soliton
phase shift corresponds to the "pass-through" of two spinning nodes at different
frequencies — each preserves its identity after the interaction.

## External sources

1. **Toda M (1967)** "Vibration of a chain with nonlinear interaction", J. Phys. Soc. Japan 22, 431–436. [DOI: 10.1143/JPSJ.22.431](https://doi.org/10.1143/JPSJ.22.431). Public Domain. — original Toda lattice paper; introduces exponential potential and exact solutions.
2. **Flaschka H (1974)** "On the Toda Lattice, I: Existence of integrals", Phys. Rev. B 9, 1924. [DOI: 10.1103/PhysRevB.9.1924](https://doi.org/10.1103/PhysRevB.9.1924). Public Domain (mathematical content). — introduces Flaschka variables and the Lax pair.
3. **NumPy** BSD-3-Clause — https://numpy.org
