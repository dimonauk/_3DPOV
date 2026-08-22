# Modifier Simple Deform — Twist, Bend, Taper & Stretch (Blender 5.1)

Procedural candy-cane column and arch gateway using the Simple Deform modifier's
four modes. No rig, no shape keys — only stackable, keyframeable float parameters.

## Quick start

```bash
blender --background --python blueprint.py
# Produces: twisted_column.blend  +  twisted_column.glb
blender twisted_column.blend --background --python record.py
# Produces: public/library/videos/modifiers/…/viewport.mp4
```

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build script |
| `record.py` | Viewport animation capture |
| `twisted_column.blend` | Working Blender scene |
| `twisted_column.glb` | WebXR-ready export (Draco 6, WebP) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI manifest |

## Modifier stack

```
[0] Taper  — angle=0.60 rad, axis=Z, origin=ColumnBase empty
             tip radius ≈ 0.143 m (79% of 0.18 m base)
[1] Twist  — angle=270° (static) or 0→360° (animated), axis=Z
```

Order matters: TAPER before TWIST gives a baluster helix where the narrower
top winds tighter than the wider base. Reversing the stack applies the taper
to the post-twist bounding box and misaligns the taper axis.

## Modes reference

| Mode | Keyframeable param | Practical range |
|---|---|---|
| TWIST | `angle` (radians) | 0 → 4π (two revolutions) |
| BEND | `angle` (radians) | 0 → π (full U-arch) |
| TAPER | `angle` (radians) | 0 → π/2 (before singularity) |
| STRETCH | `angle` (ratio) | −0.5 → 2.0 |

## Studio integration

Tutorial page: `/tutorials/blender-tutorial-modifier-simple-deform-twist-bend-cartoon`
