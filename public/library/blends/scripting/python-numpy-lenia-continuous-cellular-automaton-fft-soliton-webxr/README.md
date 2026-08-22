# Lenia — Continuous Cellular Automaton with FFT Convolution

**Blender 5.1 | Scripting | CC0**
Tutorial: [holoflow.co.uk/tutorials/blender-tutorial-python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr](https://holoflow.co.uk/tutorials/blender-tutorial-python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr)

---

## What This Is

Lenia (Bert Chan, 2019) generalises Conway's Game of Life to a continuous domain:
cell states are real values in [0, 1], the neighbourhood is a smooth radial kernel,
and the update is a Gaussian growth function rather than a rule table.  The result
is a field that self-organises into stable, translating "solitons" — biological-looking
entities that move, rotate, and occasionally reproduce.

This blueprint runs Lenia on a 128×128 toroidal grid using numpy FFT convolution,
snapshots 8 frames of the evolving field, maps each to a Blender shape key with
Z-displacement and a "hot" vertex colour ramp, then exports an animated GLB for WebXR.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Simulation + mesh build + shape keys + GLB export |
| `record.py` | Viewport animation renderer (OpenGL sequence → viewport.mp4) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Generated Outputs

- `hf_lenia.glb` — Draco-compressed GLB with 8 morph targets and vertex colours

---

## Quick Start

1. Open Blender 5.1, new general file.
2. Open the Scripting workspace, paste `blueprint.py`, press **Run Script**.
3. After ~15 s the mesh appears. Press **Space** to play the shape-key timeline.
4. Optionally run `record.py` in the same session to generate `viewport.mp4`.

---

## Parameters (top of blueprint.py)

| Constant | Default | Effect |
|---|---|---|
| `N` | 128 | Grid side (power-of-2) |
| `R` | 13 | Kernel radius — controls soliton body size |
| `MU` | 0.135 | Growth peak — shift ±0.01 for different creature classes |
| `SIGMA` | 0.015 | Growth width — wider = softer boundaries |
| `BETA` | 4.0 | Kernel ring sharpness |
| `SEED` | 7 | Change for different initial soliton arrangements |
