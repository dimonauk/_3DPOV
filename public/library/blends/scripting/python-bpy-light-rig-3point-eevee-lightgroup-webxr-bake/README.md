# Python bpy.types.Light — Scripted 3-Point Lighting Rig
## Key Area / Fill Disk / Rim Spot + EEVEE Next Light Groups for WebXR Bake

**Blender 5.1 · Holoflow Studio · Licence: CC0**

## What this is

A production blueprint for assembling a three-point portrait lighting rig
entirely via `bpy.data.lights.new()`, with no operator or active-object
context required. Key (`AREA RECTANGLE`), fill (`AREA DISK`), and rim
(`SPOT`) lights are positioned using spherical coordinates relative to a
shared parent Empty, so rotating the Empty repoints all three lights
simultaneously. Each is assigned to a named EEVEE Next `LightGroup` for
per-source render passes. A `light_rig.json` manifest describes the rig
in Three.js coordinates for WebXR runtime light reconstruction.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full production script |
| `record.py` | Viewport orbit animation (4 s, 24 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Library manifest entry |

## Quick start

1. Open Blender 5.1 → New General file
2. Switch to the Scripting workspace
3. Open `blueprint.py` → Run Script
4. Switch to Layout — three lights + sphere appear
5. `subject_sphere.glb` and `light_rig.json` are written next to the .blend file

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `SUBJECT_RADIUS` | 1.0 | Bounding radius of the lit subject; scales all distances |
| `KEY_ENERGY` | 800 W | Key light power (total watts into hemisphere) |
| `KEY_SIZE_X / _Y` | 1.2 / 0.6 m | Rectangle dimensions; larger = softer shadow |
| `FILL_ENERGY` | 300 W | Fill energy — keep 0.2–0.5× key for natural ratio |
| `RIM_CONE_DEG` | 28° | Full cone angle; narrower = tighter silhouette halo |
| `KEY_AZ_DEG` | 45° | Key azimuth; 30–60° is the classic portrait range |

## Outside sources

- **Blender Foundation — bpy.types.AreaLight API** (CC-BY-SA-4.0)
  https://docs.blender.org/api/5.1/bpy.types.AreaLight.html
- **Blender Manual — Light Object** (CC-BY-SA-4.0)
  https://docs.blender.org/manual/en/latest/render/lights/light_object.html
- **Three.js — RectAreaLight** (MIT, Mr.doob et al.)
  https://threejs.org/docs/#api/en/lights/RectAreaLight

## Studio cross-references

- `/tutorials/blender-tutorial-python-world-node-tree-hdri-environment-lighting-rig`
- `/tutorials/blender-tutorial-cycles-light-groups-non-destructive-relight`
- `/tutorials/blender-tutorial-eevee-light-probes-sphere-reflection-irradiance-webxr`
- `/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable`
