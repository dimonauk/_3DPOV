# Cycles Light Linking — Receiver & Blocker Collections, Selective Lightmap Bake for WebXR

**Blender 5.1 · Python · Cycles · CC0**

## What this is

A complete studio blueprint for using Blender 5.1's Cycles Light Linking API to create per-light illumination masks, then baking the selective arrangement into a UV lightmap for WebXR delivery.

Light Linking lets you assign each light its own *receiver collection* (which objects does this light illuminate?) and *blocker collection* (which objects cast shadows for this light?). An unassigned collection restores the default all-objects behaviour.

## Scene

| Object | Role |
|--------|------|
| `hero_faceted_gem` | Main prop — receives key + fill + rim, baked lightmap |
| `accent_orb` | Secondary prop — receives key + rim only (fill excluded) |
| `floor_plane` | Ground — receives key only (rim excluded from receivers) |

| Light | Receiver | Blocker |
|-------|----------|---------|
| `light_key` (Area 400 W) | All (default) | All (default) |
| `light_fill` (Area 200 W) | `hero_faceted_gem` only | All (default) |
| `light_rim` (Spot 300 W) | `hero_faceted_gem` + `accent_orb` | `hero_faceted_gem` only |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build, light linking setup, Cycles bake, GLB export |
| `record.py` | EEVEE turntable render for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture script |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Running

1. Open Blender 5.1, new empty file.
2. Open `blueprint.py` in the Text Editor.
3. Set the output path to your library directory (edit `OUT_WEBP`, `OUT_GLB`, `OUT_META`).
4. **Run Script** (`Alt+P`).
5. Verify `hero_prop_lightmap.webp` and `light_linking_export.glb` are written.
6. Run `record.py` in the same session to produce `viewport.mp4`.

## Key API facts

- `light.light_linking.receiver_collection` — inclusive set; empty = all objects.
- `light.light_linking.blocker_collection` — inclusive set; empty = all casters.
- Collections used here are **orphaned data-blocks** — do NOT link them into the scene collection hierarchy.
- Bake type `'DIFFUSE'` captures the light-linked arrangement; `'COMBINED'` includes specular, which is inappropriate for lightmaps on low-poly WebXR geometry.
- EEVEE Next has partial Light Linking support (4.2+); for a guaranteed correct bake, use Cycles.

## Licence

CC0 1.0 Universal — place in the public domain.
