# Compositor — Kuwahara Anisotropic Filter: Painterly Oil-Paint Stylisation

**Blender 5.1 · Compositing · CC0**

Transforms a Cycles render of a faceted celadon vessel into an oil-paint
style by applying Blender's **Kuwahara Anisotropic** compositor node (added in
Blender 4.3). The filter partitions each pixel's neighbourhood into directional
sectors aligned to local image flow, selects the most-uniform sector's mean
colour, and traces brush strokes that follow surface contours rather than
cutting across them.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene + compositor node tree — run in Blender Text Editor or headless |
| `record.py` | 3-second orbital viewport animation (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Canonical output file list |

## Quick start

```bash
blender --background --python blueprint.py
# then open .blend, F12 to render, inspect Compositor Viewer
```

Or open Blender → Text Editor → Open `blueprint.py` → Run Script → F12.

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|---|---|---|
| `KUW_SIZE` | 4 | Kernel half-radius in pixels (2–8 for 720p) |
| `KUW_UNIFORMITY` | 4 | Gaussian σ for sector weighting — lower = more adaptive |
| `KUW_SHARPNESS` | 0.55 | Stroke-boundary crispness [0–1] |
| `MIX_FACTOR` | 0.75 | Kuwahara : clean denoised blend ratio |

## Pipeline

```
RenderLayers → OIDN Denoise → Kuwahara (Anisotropic, Size 4)
             → Mix RGB 75% → Film Grain (0.05) → Tone Map → Composite
```

## Outside sources

- **Kyprianidis, J.E. et al.** "Image and Video Abstraction by Anisotropic Kuwahara Filtering" — *Computer Graphics Forum* 28(7), 2009.  
  DOI: 10.1111/j.1467-8659.2009.01574.x (academic reference, not a code source)

- **Blender Compositor Nodes reference** — https://docs.blender.org/manual/en/latest/compositing/ (CC-BY-SA)
