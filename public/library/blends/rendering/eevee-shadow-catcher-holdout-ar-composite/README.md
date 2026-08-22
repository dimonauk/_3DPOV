# EEVEE Next Shadow Catcher + Holdout: AR-Ready Composite Ground Pass

**Blender version:** 5.1  
**Renderer:** EEVEE Next  
**Slug:** `eevee-shadow-catcher-holdout-ar-composite`  
**Topic:** rendering  
**Licence:** CC0

## What this teaches

How to set up a shadow catcher ground plane and a holdout crop card in EEVEE Next
so that a rendered PNG carries only the cast shadow in its alpha channel — ready
to composite over any background photo in post without needing a separate CG ground.

This is the standard pipeline for AR product visualisation: render the object + its
shadow as a single RGBA image, then composite it over a real photograph in the Compositor,
an image editor, or a WebXR scene.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds `ar_composite.blend` from scratch via bpy |
| `record.py` | Renders a 120-frame gem rotation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest for expected outputs |

## Quick start

```bash
# Build the .blend
blender --background --python blueprint.py

# Render the rotation video
blender --background ar_composite.blend --python record.py
```

## Key concepts

- `obj.is_shadow_catcher = True` — marks the ground plane in EEVEE Next
- `scene.render.film_transparent = True` — world alpha = 0; shadow alpha > 0
- `obj.is_holdout = True` — punches a matte hole for the crop card
- Compositor Alpha Over node composites the RGBA render over a background plate

## External sources

- [Blender Manual — Shadow Catcher](https://docs.blender.org/manual/en/latest/render/cycles/object_settings/visibility.html)
  © Blender Foundation, CC-BY-SA 4.0
- [Blender Manual — Holdout Material](https://docs.blender.org/manual/en/latest/render/cycles/object_settings/visibility.html#holdout)
  © Blender Foundation, CC-BY-SA 4.0
