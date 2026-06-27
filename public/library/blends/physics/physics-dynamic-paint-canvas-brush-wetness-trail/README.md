# Dynamic Paint — Canvas + Brush: Wetness Trail

**Blender 5.1 · Physics · CC0 · Holoflow Studio**

A moving sphere drags a wet cobalt-blue trail across a dense grid plane.
Dynamic Paint manages the two-map state (colour + wetness), spreading paint
laterally as it dries — no custom shader logic required.

## What you get

| File | Description |
|------|-------------|
| `blueprint.py` | Full scene setup: canvas plane, brush sphere, DP modifiers, material, bake |
| `record.py` | Renders 90-frame dolly animation to `videos/…/viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the companion screen recording |
| `.expected-artefacts.json` | CI artefact manifest |

## Run order

```bash
# 1. Build + bake (takes ~20 s on M-series Mac, ~1 min on mid-range CPU)
blender --background --python blueprint.py

# 2. Render the video (EEVEE, ~3 min)
blender --background dynamic_paint_trail.blend --python record.py
```

> **Headless note**: `bpy.ops.dpaint.bake()` requires a window context in older
> Blender builds.  If it raises a `RuntimeError`, open the saved `.blend` and
> click **Bake** in the Dynamic Paint panel under Physics Properties.

## Key concepts

- **CANVAS** modifier (plane) — accumulates paint per vertex in the `dp_paint`
  colour attribute.  Also writes a secondary `dp_paint_wet` attribute.
- **BRUSH** modifier (sphere) — deposits paint wherever its volume overlaps the
  canvas.  `paint_source = 'VOLUME'` means full coverage inside the mesh;
  switch to `'DISTANCE'` for a soft proximity halo.
- **Wet map** — the secondary attribute.  Wet pixels spread laterally at
  `spread_speed`.  As they dry (`dry_speed` frames), spreading stops and
  colour is locked in place.
- **Vertex format** — chosen here for instant viewport feedback.  Switch to
  `surface_format = 'IMAGE'` + `image_resolution = 512` for UV-space output
  suitable for GLB export baking.

## Studio cross-references

- [Vertex Colour Attributes](/tutorials/blender-tutorial-vertex-colour-attributes)
- [Texture Baking: Normal + AO](/tutorials/blender-tutorial-texture-baking-normal-ao)
- [Particle Emitter + Force Field GLB Snapshot](/tutorials/blender-tutorial-particle-emitter-force-field-glb-snapshot)

## Outside sources

- Blender Manual — Dynamic Paint:
  <https://docs.blender.org/manual/en/latest/physics/dynamic_paint/index.html>
  CC-BY-SA 4.0, The Blender Foundation & Contributors
- Blender Developer Blog — "Dynamic Paint" (original integration writeup, Miika Hämäläinen, 2011):
  <https://code.blender.org/2011/06/dynamic-paint/>
  (informational reference; code in Blender is GPL, writeup is Blender Foundation)
