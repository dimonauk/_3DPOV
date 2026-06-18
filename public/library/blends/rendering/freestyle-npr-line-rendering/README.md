# Freestyle NPR Line Rendering — Blender 5.1

Demonstrates Blender's Freestyle post-process line engine: three line
sets (silhouette, crease, material boundary) driving a hexagonal gem
prism with colour-graduated strokes, camera-distance alpha fade, and
Perlin-noise wobble for a hand-drawn quality.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Builds the full scene and Freestyle setup |
| `record.py` | 150-frame Cycles turntable → `viewport.mp4` |
| `freestyle_npr_lines.blend` | Generated after running blueprint.py |
| `freestyle_npr_lines.png` | Single rendered frame (1280×720) |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for screen.mp4 |

## Quick Start

```bash
# Build scene + save .blend
blender --background --python blueprint.py

# Render turntable (generates viewport.mp4)
blender --background freestyle_npr_lines.blend --python record.py

# Render single still
blender --background freestyle_npr_lines.blend --render-output //freestyle_npr_lines.png --render-frame 1
```

## Freestyle vs Grease Pencil Line Art

| | Freestyle | GP Line Art modifier |
|---|---|---|
| Render engines | Cycles only | EEVEE + Cycles |
| Edge detection | Post-process image-space | 3-D modifier (pre-render) |
| Stroke modifiers | Along-stroke: colour, alpha, thickness, geometry | GP material + modifier stack |
| SVG export | Yes (Freestyle SVG Exporter add-on) | Limited |
| Animation | Per-frame re-detection | Can cache to GP strokes |

## Line Set Summary

- **silhouette** — outer profile, 2.8 px, along-stroke gradient (dark blue → amber), Perlin wobble, calligraphic taper
- **crease** — facet edges at < 22°, 1.3 px, warm grey, light wobble
- **material_boundary** — seam between gem_body and gem_cap materials, 1.0 px gold, dashed (8 on / 4 off)

## Blender 5.1 Notes

- `view_layer.freestyle_settings.crease_angle` — global crease threshold for the view layer (not per line set)
- `freestyle_settings.linesets.new(name)` — direct data API, works headlessly (no `bpy.ops.scene.freestyle_lineset_add()` required)
- `bpy.data.linestyles.new(name)` — create a named line style; assign to `lineset.linestyle`
- `FreestyleLineStyle.geometry_modifiers.new(name, type='PERLIN_NOISE_2D')` — screen-space wobble
