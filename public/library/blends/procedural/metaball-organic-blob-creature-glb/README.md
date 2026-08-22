# Metaball Organic Blob Creature — Library Entry

**Topic:** Procedural  
**Blender version:** 5.1  
**Licence:** CC0  
**Slug:** `metaball-organic-blob-creature-glb`

---

## What this builds

A five-element metaball creature — body, head, two capsule arms, and two
negative eye sockets — demonstrating every major metaball feature in a single
self-contained Python blueprint:

- `BALL` and `CAPSULE` element types
- `use_negative=True` for subtractive carving
- `stiffness` control per element
- `threshold` animation (in `record.py`)
- Conversion to mesh + Draco-compressed GLB export

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the creature, adds SSS material, exports `.blend` + `.glb` |
| `record.py` | Viewport orbit + threshold-pulse animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` walkthrough |
| `README.md` | This file |
| `.expected-artefacts.json` | CI artefact manifest |

**Generated outputs** (after running `blueprint.py`):
- `blob_creature.blend`
- `blob_creature.glb`

**Generated outputs** (after running `record.py` in Blender with a display):
- `public/library/videos/procedural/metaball-organic-blob-creature-glb/viewport.mp4`

---

## Quick start

```bash
blender --background --python blueprint.py
```

Or open Blender, paste `blueprint.py` into the Scripting workspace, and run.

---

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `THRESHOLD` | 0.60 | Lower = elements merge sooner |
| `RESOLUTION` | 0.06 m | Viewport grid cell size |
| `RENDER_RESOLUTION` | 0.025 m | Export mesh fineness |
| `EYE_STIFFNESS` | 3.2 | Sharpness of eye socket edge |
| `ARM_EXTENSION` | 0.52 m | Capsule half-length |

---

## Studio connections

- Tutorial: `/tutorials/blender-tutorial-metaball-organic-blob-creature-glb`
- Related: [GN Points to Volume — Organic Coral](/tutorials/blender-tutorial-gn-points-to-volume-organic-coral)
- Related: [Multires Sculpt → Normal Bake → Low-Poly GLB](/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb)
