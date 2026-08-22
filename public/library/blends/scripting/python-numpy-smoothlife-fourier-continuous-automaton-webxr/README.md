# SmoothLife — Fourier-Domain Continuous Cellular Automaton

**Blender 5.1 | Scripting | CC0**
Tutorial: [holoflow.co.uk/tutorials/blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr](https://holoflow.co.uk/tutorials/blender-tutorial-python-numpy-smoothlife-fourier-continuous-automaton-webxr)

---

## What This Is

SmoothLife (Stephan Rafler, 2011) extends Conway's Game of Life to a continuous domain: cell states are real values in [0, 1], neighbourhood is two concentric disks, and the transition is a smooth sigmoid instead of a rule table. The result is a perpetually animated field of glider-like blobs, pulsing rings, and organic wave structures — nothing like the discrete, binary patterns of Game of Life.

This blueprint simulates SmoothLife on a 128×128 toroidal grid using numpy FFT convolution, then maps each snapshot to Blender shape keys so the evolution can be scrubbed on the timeline and exported as an animated GLB.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full simulation + mesh build + GLB export |
| `record.py` | Viewport animation renderer (OpenGL sequence) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Generated Outputs

- `hf_smoothlife.blend` — Blender scene with shape-key animated mesh
- `hf_smoothlife.glb` — Draco-compressed GLB, morph targets, vertex colours

---

## Quick Start

1. Open Blender 5.1, new general file.
2. Open the Scripting workspace, paste `blueprint.py`, press **Run Script**.
3. After ~20 s the SmoothLife mesh appears. Press **Space** to play the shape-key timeline.
4. Optionally run `record.py` in the same session to generate `viewport.mp4`.

---

## Parameters to Explore

| Parameter | Effect |
|---|---|
| `RI` / `RA_FACTOR` | Disk radii — larger RI = slower, bigger structures |
| `B1, B2` | Birth threshold — narrow window = sparse structures |
| `S1, S2` | Survival window — wider = denser, more stable forms |
| `DT` | Euler step — reduce if patterns explode to all-1 or all-0 |
| `SEED` | Changes initial blob positions |

---

## Licence

All code CC0. Algorithm: Rafler (2011) arXiv:1111.1567 (public domain).
