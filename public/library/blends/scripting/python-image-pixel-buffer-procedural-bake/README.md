# Python — Image Pixel Buffer: Procedural Voronoi Bake via `foreach_set`

**Blender version:** 5.1  
**Topic:** Scripting / Texture Generation  
**Licence:** CC0  

## What this does

`blueprint.py` generates a 512 × 512 Voronoi cell pattern entirely in Python,
writes it to a `bpy.types.Image` datablock in a single bulk call via
`foreach_set`, packs the result into the .blend file, and wires it into a
Principled BSDF material ready for UV-mapped export.

`record.py` renders a 90-frame Eevee animation (viewport.mp4) where the
texture scrolls across a UV sphere — visually confirming the torus-wrap
tile logic produces seamless edges.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Expert annotated script — run once in Blender's Script editor |
| `record.py` | Self-contained animation render → `videos/.../viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Key concepts

- **`pixels.foreach_set(buf)`** — ~100× faster than per-element assignment
- **Bottom-left origin** — pixel (0,0) is at index 0 in the flat RGBA buffer
- **`Non-Color` colour space** — prevents Blender applying gamma twice for
  data textures (normal maps, roughness, height maps)
- **Torus-wrapped Voronoi** — distances computed modulo 1 so the tile is seamless

## Running

```bash
blender --background --python blueprint.py
```

Or paste into Blender → Scripting workspace → Run Script.

## Tutorial

`/tutorials/blender-tutorial-python-image-pixel-buffer-procedural-bake`
