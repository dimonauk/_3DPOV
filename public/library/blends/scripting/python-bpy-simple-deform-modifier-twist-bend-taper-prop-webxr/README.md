# Python bpy.types.SimpleDeformModifier — TWIST / BEND / TAPER / STRETCH (Blender 5.1)

Holoflow Studio library entry. Builds three stylised props in a single GLB for WebXR
using stacked `SimpleDeformModifier` instances scripted entirely in Python.

## What this builds

| Prop | Modes stacked | Output |
|---|---|---|
| Twisted Column | TAPER (lower 60%) + TWIST (full) | Hexagonal faceted column, 270° spiral |
| Bent Horn | TAPER (full) + BEND (via Empty pivot) | Curved spike, 80° arc |
| Stretched Spike | TAPER (full) + STRETCH (upper 40%) | Pulled crystal form |

All three export to `hf_deform_props.glb` — Draco-compressed, WebP textures, faceted shading.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Production script — run in Blender 5.1 Scripting workspace |
| `record.py` | Animates TWIST and BEND angles 0→max, renders viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar steps for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Key learnings

- `angle` is **radians** — `math.radians(270)` not `270`.
- `factor` (TAPER / STRETCH) is a signed float, not radians.
- `limits` maps to the **local bounding-box** extent along the deformation axis.
- Stacking order matters: TAPER first, TWIST/BEND second.
- Use an Empty as `origin` to redirect the deformation frame without rotating the mesh.
- Headless bake: `evaluated_get(depsgraph)` + `bpy.data.meshes.new_from_object()`.

## Tutorial

`/tutorials/blender-tutorial-python-bpy-simple-deform-modifier-twist-bend-taper-prop-webxr`

## Licence

CC0 — Holoflow Studio original content.
