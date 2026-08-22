# Compositor — Colour Grading: Exposure + RGB Curves + ASC-CDL + HSV

**Blender 5.1 · CC0 · Holoflow Studio**

A complete film-grade colour pipeline built entirely in Blender's compositor,
operating in scene-linear OCIO space before the Filmic display transform.

## Technique

The node order is load-bearing — each stage assumes the previous one has
already normalised the signal:

```
Render Layers
  └─ OIDN Denoise (Normal + Albedo guided)
       └─ Exposure (EV −0.2 headroom pull)
            └─ RGB Curves (S-contrast, linear space)
                 └─ Color Balance ASC-CDL (Offset/Power/Slope)
                      └─ Hue-Saturation-Value (secondary saturation)
                           └─ Vignette (EllipseMask + Blur + Multiply)
                                └─ Composite + Viewer
```

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene + full compositor tree; run in Scripting workspace |
| `record.py` | 90-frame viewport orbit animation → `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Pipeline checklist |

## Running

1. Open Blender 5.1. Scripting workspace → Open `blueprint.py` → Run Script.
2. F12 — renders the graded image (`output/colour_grade_0001.png`).
3. Run `record.py` from the Text Editor to produce `viewport.mp4`.
4. Follow `SCREEN-RECORDING-NOTES.md` to produce `screen.mp4`.

## Key numbers

| Parameter | Value | Notes |
|-----------|-------|-------|
| Exposure | −0.2 EV | headroom for specular above 1.0 |
| S-curve midpoints | (0.18→0.15), (0.82→0.88) | deepens shadows, opens highlights |
| CDL Slope | (1.05, 1.00, 0.96) | warm gain in highlights |
| CDL Offset | (0.01, 0.00, −0.01) | warm lift in shadows |
| CDL Power | (0.95, 0.95, 1.00) | bright-warm midtones |
| HSV Saturation | ×1.15 | +15 % chroma |
| Vignette | 35 % | corners at 65 % of centre brightness |

## Outside sources

- **Blender Compositor Docs** — CC-BY-SA-4.0 — Blender Foundation  
  https://docs.blender.org/manual/en/latest/compositing/
- **OpenColorIO** — Apache-2.0 — Academy Software Foundation  
  https://github.com/AcademySoftwareFoundation/OpenColorIO
