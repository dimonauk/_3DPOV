# Swift–Hohenberg PDE — Bénard Convection Stage Floor

**Blender 5.1 · Python + NumPy · Pseudo-spectral FFT · Stage Floor · WebXR**

---

## What this is

The Swift–Hohenberg equation is the canonical PDE for pattern formation near a
symmetry-breaking instability:

```
∂u/∂t = [ε − (∇² + k₀²)²]u − u³
```

It was derived by Jack Swift and Pierre Hohenberg in 1977 to model
Rayleigh–Bénard convection — the spontaneous convection cells that appear when
a horizontal fluid layer is heated from below strongly enough. The equation
distils the physics to its essentials: a preferred wavenumber `k₀` (the length
scale of Bénard cells), a bifurcation parameter `ε` (proportional to the
temperature difference above the onset threshold), and a cubic nonlinearity
that saturates the growth.

At `ε < 0` the flat state is stable. Cross zero and the first unstable Fourier
modes — those whose wavevector lies on the ring `|k| = k₀` — begin to grow.
Which pattern wins depends on ε and initial conditions:

| ε | Pattern |
|---|---------|
| ≈0.05 | Incipient — barely visible amplitude |
| ≈0.30 | Rolls (stripes) from random noise |
| ≈0.30 + hexagonal seed | Hexagonal cells |
| ≈0.60 | Labyrinthine — disorder-limited, long-run |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the 80×80 height-field mesh, integrates the PDE for each shape key, writes vertex colours and GLB |
| `record.py` | EEVEE Next animation: 180° orbit + shape-key morph sequence, outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for capturing `screen.mp4` |
| `.expected-artefacts.json` | Machine-readable artefact manifest |

---

## Algorithm: pseudo-spectral ETD integration

1. **Fourier transform** `u` → `û` (NumPy `rfft2` / `fft2`).
2. **Linear step**: multiply `û` by `exp(L̂·Δt)` where `L̂(k) = ε − (k₀²−k²)²`.
   This is exact — no approximation, no stability restriction from the
   bi-Laplacian.
3. **Transform back** → `u`.
4. **Nonlinear step**: subtract `u³ · Δt` in real space (Euler, first-order ETD).
5. Repeat for `n_steps`.

The unconditional stability of the linear step allows `Δt = 0.5` — far larger
than any explicit scheme can use for a fourth-order PDE.

---

## Shape keys

| Key | ε | IC | Steps | Pattern |
|-----|---|-----|-------|---------|
| Basis | 0.30 | random noise | 500 | Roll stripes |
| SK_Hex | 0.30 | 3-wave seed | 300 | Hexagonal cells |
| SK_Labyrinth | 0.60 | random noise | 800 | Dense labyrinth |
| SK_Onset | 0.05 | random noise | 200 | Near-bifurcation |

---

## Vertex colour attribute

`SH_Pattern` (FLOAT_COLOR, POINT domain) — cobalt `#081A95` → amber `#FFA500`
encodes the instantaneous field value `u(x,y)` normalised to `[0,1]`.

---

## Connections

- **Turing patterns** (Gray–Scott, Barkley) share the morphogenesis lineage
  but use two coupled reaction–diffusion fields rather than one PDE with a
  structural wavenumber selection.
- **Rayleigh–Bénard convection** is the physical system this PDE models;
  the real-world hexagonal Bénard cells are the analogue of `SK_Hex`.
- **Chirikov standard map** (another entry in this library) shows a very
  different route to spatial complexity — Hamiltonian chaos rather than
  dissipative pattern formation.

---

## Running

Open Blender 5.1. In the Scripting workspace:

```
1. New text → paste blueprint.py → Run Script   (~15 s on a modern CPU)
2. File → Save As → swift_hohenberg_floor.blend
3. New text → paste record.py → Run Script      (renders viewport.mp4)
4. OBS capture per SCREEN-RECORDING-NOTES.md
```
