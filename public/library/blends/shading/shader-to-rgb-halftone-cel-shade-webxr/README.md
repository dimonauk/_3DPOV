# Shader to RGB — Amplitude-Modulated Halftone Cel-Shade

**Blender 5.1 · EEVEE Next · CC0**

Captures EEVEE's Principled BSDF evaluation as a colour (`ShaderToRGB`),
posterises it to two hard toon bands via a CONSTANT ColourRamp, then uses the
toon value to amplitude-modulate a UV halftone dot screen.  Shadow zones
receive large dots (heavy ink); lit zones receive small dots (open paper) —
the same encoding as commercial offset lithography.  The 45° screen angle
prevents moiré with axis-aligned UV edges.

## Prerequisites

- Blender 5.1 with EEVEE Next (default render engine)
- `pnpm` / Next.js site for tutorial page (optional)

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the full scene: mesh, EEVEE halftone material, baked-export material, sun lamp, camera |
| `record.py` | Renders a 120-frame animation sweeping the sun elevation from 80° → 12° to show AM dot growth |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial screen capture |
| `halftone_baked.webp` | 1024 × 1024 baked emission texture (generated at runtime) |
| `halftone_cel.blend` | Saved blend file |
| `halftone_cel.glb` | WebXR-ready GLB with baked emission |

## Running

```bash
# Build scene (interactive Blender session or headless):
blender --python blueprint.py

# Record viewport animation (requires existing blend file):
blender --background halftone_cel.blend --python record.py
```

## Bake workflow

1. In the EEVEE material (`HalftoneCel`), add an unlinked `Image Texture`
   node and select `halftone_baked`.
2. Switch render engine to **Cycles** (required — EEVEE bake is not available
   for Emit pass).
3. Properties → Render → Bake → Type = `Emit`, Margin = 16 px.
4. Run bake.  Save image as WebP.
5. Switch engine back to EEVEE Next, call `export_glb()` in the Python console.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `SCREEN_FREQ` | 18.0 | Dot cells per UV unit — increase for finer dots |
| `DOT_SHADOW` | 0.44 | Dot radius in shadow (0 = no dot, 0.5 = solid) |
| `DOT_LIT` | 0.16 | Dot radius in lit zone |
| `BAND_THRESH` | 0.45 | Toon band split point (0–1 in ramp space) |
| `SCREEN_ANGLE` | 45° | Rotation of the UV dot grid |

## Licence

All source code: CC0.  Blend file output: CC0.
