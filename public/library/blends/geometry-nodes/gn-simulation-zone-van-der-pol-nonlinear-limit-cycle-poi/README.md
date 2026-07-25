# GN Simulation Zone — Van der Pol Nonlinear Limit Cycle

**Blender 5.1 · CC0 · Holoflow Studio**

Implements the Van der Pol oscillator (1926) on a 40×40 vertex grid using a
Geometry Nodes Simulation Zone.  Each vertex carries displacement `vdp_x` and
velocity `vdp_v` as FLOAT attributes; the Sim Zone advances them by one explicit
Euler step each frame using the Van der Pol RHS `ẍ = μ(1−x²)ẋ − x`.

BlurAttribute couples neighbouring oscillators (Huygens entrainment), and
SetPosition lifts vertex Z by `vdp_x × Z_SCALE` so the oscillation is visible
as a rolling 3-D surface — red hills (positive), white nodes (zero), blue valleys
(negative).

## Run

1. Open Blender 5.1, switch to **Scripting** workspace.
2. Paste and run `blueprint.py` — creates `hf_vdp` object with GN modifier.
3. Switch to **Rendered** shading (EEVEE Next).
4. Press **Space** in the Timeline to watch the oscillations spread.
5. Optionally run `record.py` to render `viewport.mp4`.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds grid, GN tree, material, camera |
| `record.py` | Renders 300-frame EEVEE Next video |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `N` | 40 | Grid side — N² oscillators total |
| `MU` | 1.5 | Nonlinearity: 0 = harmonic, »1 = relaxation |
| `DT` | 0.06 | Time step per frame |
| `COUPLING` | 0.12 | Huygens coupling strength |
| `BLUR_ITER` | 1 | Coupling radius (1 = 4 neighbours) |
| `Z_SCALE` | 0.22 | Visual amplitude of surface ripple |

## Physics notes

- μ = 0: pure harmonic oscillator, circular phase portrait.
- μ = 0.1–1: mild limit cycle, nearly circular phase portrait.
- μ = 1.5: clear limit cycle, slightly relaxed (egg-shaped phase portrait).
- μ ≥ 5: strong relaxation oscillator, sawtooth waveform, slow-fast dynamics.
- Stability criterion for explicit Euler: DT < 2 / (frequency) ≈ 2/(2π) ≈ 0.32.
  DT=0.06 is conservative; raise to 0.15 for faster visual convergence.

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi`
