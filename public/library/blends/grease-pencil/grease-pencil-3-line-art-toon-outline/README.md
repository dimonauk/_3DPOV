# Grease Pencil 3 — Line Art Modifier + Toon Ink Outline

**Blender 5.1 | Licence: CC0**

Automatic ink stroke generation from 3D geometry edges using the GP3 Line Art
modifier, combined with an EEVEE Shader-to-RGB cel-shading material.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the complete scene: gem mesh + cel material + GP3 ink object + Line Art modifier |
| `record.py` | Renders a 90-frame 360° rotation to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for a manual screen-recording session |
| `.expected-artefacts.json` | Expected on-disk outputs |

## Quick start

1. Open Blender 5.1 — Scripting workspace
2. Load and run `blueprint.py`
3. Render Properties → Render Engine: **EEVEE Next**
4. Viewport Overlays → tick **Grease Pencil**
5. Press `Ctrl+Shift+Q` in the 3D viewport if ink strokes are absent
6. (Optional) Run `record.py` to render `viewport.mp4`

## Tunable constants

| Constant | Default | Effect |
|----------|---------|--------|
| `GEM_SUBDIVS` | `2` | Face count: 1=20 tris, 2=80 tris, 3=320 tris |
| `CREASE_ANGLE_DEG` | `25.0` | Minimum dihedral angle (deg) to fire a crease stroke |
| `INK_THICKNESS` | `15` | Stroke width in thousandths of a pixel at render height |
| `TONE_MID` | `0.45` | Shadow→midtone transition threshold |
| `TONE_HIGHLIGHT` | `0.80` | Midtone→highlight transition threshold |

## GP3 data hierarchy

```
GreasePencilv3  (gp_obj.data)
  └── Layer "Ink Outlines"
        └── Frame 1  ← populated by GREASE_PENCIL_LINEART at evaluation time
              └── Strokes[]  (CONTOUR + CREASE edges from gem mesh)
```

## Output locations

- `.blend`: save manually from File → Save As → `gem_ink.blend` in this folder
- `viewport.mp4`: rendered by `record.py` → `public/library/videos/grease-pencil/grease-pencil-3-line-art-toon-outline/viewport.mp4`
- `screen.mp4`: captured manually per `SCREEN-RECORDING-NOTES.md`
