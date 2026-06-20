# Compositor — Chroma Key & Despill: Green-Screen Post-Production

**Blender 5.1 · CC0 · Holoflow Studio**

Extracts a foreground subject from a solid-colour (green) background using
Blender's built-in `Keying` compositor node, then composites the cleaned matte
over a replacement virtual background. Includes despill, edge erosion, matte
blur, and a subtle colour-match grade.

## Pipeline

```
RenderLayers
  └─ Keying (clip + despill)
       ├─ Image ──► SetAlpha ──► AlphaOver ──► ColourBalance ──► Composite
       └─ Matte ──► DilateErode ──► MatteBlur ──► (SetAlpha Alpha slot)
```

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene + compositor tree — run in Scripting workspace |
| `record.py` | 60-frame viewport animation showing 3 stages of keying |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the walkthrough video |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `GREEN_KEY_COLOR` | `(0.02, 0.86, 0.10)` | Linear sRGB key colour — must match World bg exactly |
| `CLIP_BLACK` | `0.02` | Alpha below → transparent (suppresses dark fringe) |
| `CLIP_WHITE` | `0.85` | Alpha above → opaque |
| `DESPILL_FACTOR` | `0.7` | Strength of green-spill removal on edges |
| `DESPILL_BALANCE` | `0.5` | 0=B-channel bias, 1=R-channel bias, 0.5=neutral |
| `FEATHER_DIST` | `−2` | Negative erodes matte inward; removes residual fringe |

## Usage

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → **Alt+R** to run
3. Press **F12** to render the composited frame (output → `output/frame_0001.png`)
4. Inspect: Compositor workspace → see the live node tree
5. Adjust `CLIP_BLACK` / `CLIP_WHITE` to taste, re-render
6. Open `record.py` → **Alt+R** → **Ctrl+F12** for the 60-frame demonstration animation

## Common failure modes

- **Grey halo on edges**: `CLIP_BLACK` too high — lower it to 0.01
- **Subject turning transparent in midtones**: `CLIP_WHITE` too low — raise to 0.92
- **Green tint on subject skin**: increase `DESPILL_FACTOR` towards 1.0
- **Dark fringe persists after erosion**: increase `FEATHER_DIST` magnitude (more negative)
- **AlphaOver produces dark outline**: straight vs premultiplied mismatch — keep `ao.premul = 0.0`
