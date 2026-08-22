# FFT Epicycles — Fourier-Series Phasor Chain for Poi Light-Painting

**Blender 5.1 · Python scripting · CC0 · Holoflow Studio**

Decomposes a poi figure-eight (Lemniscate of Bernoulli) into a chain of rotating
circles using the Discrete Fourier Transform. Each circle (phasor) is a parented
Empty animated at a constant angular velocity; the tip traces the reconstructed
path, which is extracted as a glowing Bevel Curve for the light-painting trail.

---

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy + numpy implementation — run in Blender Scripting workspace |
| `record.py` | Viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` recording |
| `.expected-artefacts.json` | Artefact manifest and cross-reference catalogue |

**Generated artefacts** (appear in `public/library/blends/scripting/<slug>/` after running):

- `hf_epicycle_chain.blend` — the saved scene (phasor chain + trail + camera)
- `hf_epicycle_trail.glb` — trail curve only, ready for WebXR (export manually via File → Export → glTF 2.0)

**Video artefacts** (appear in `public/library/videos/scripting/<slug>/` after running):

- `viewport.mp4` — rendered animation (from `record.py`)
- `screen.mp4` — OBS screen recording (captured manually per notes above)

---

## Quick start

```bash
# Open Blender 5.1, then in the Scripting workspace:
# 1. Open blueprint.py
# 2. Press ▶ Run Script
# 3. Switch to 3D Viewport → press Spacebar to preview the animation
# 4. (Optional) Run record.py for a rendered viewport.mp4
```

The script prints the top-4 dominant frequencies to the terminal:
```
Top-4 freqs: [ 1 -1  3 -3]   amps: [0.2387 0.2387 0.0265 0.0265]
```
Frequencies ±1 carry the bulk of the lemniscate's energy; ±3 correct the crossing
point. All higher terms contribute less than 1 % each.

---

## Mathematical background

The Lemniscate of Bernoulli in complex form:
```
z(t) = cos t / (1 + sin²t)  +  i · sin t · cos t / (1 + sin²t)
```
Its DFT coefficient at bin k:
```
C[k] = Σ_{n=0}^{N-1}  z[n] · e^{-2πi·k·n/N}
```
Reconstruction (IDFT):
```
z[n] = (1/N) · Σ_k  C[k] · e^{+2πi·k·n/N}
```
Each term is a phasor: a circle of radius `|C[k]|/N` that starts at angle
`arg(C[k])` at frame 1 and completes `k` revolutions over `N` frames.

---

## Licence

All scripts and assets in this directory are released under **CC0 1.0** — no
rights reserved. Attribution is appreciated but not required.
