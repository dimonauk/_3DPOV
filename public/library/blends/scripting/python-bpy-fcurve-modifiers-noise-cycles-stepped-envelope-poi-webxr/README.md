# Python bpy FCurve Modifiers — Noise Flutter, Cycles Loop, Stepped Stop-Motion & Generator Drift (Blender 5.1)

**Slug**: `python-bpy-fcurve-modifiers-noise-cycles-stepped-envelope-poi-webxr`  
**Category**: scripting  
**Blender version**: 5.1  
**Licence**: CC0

## What this builds

Two poi balls share a base circular orbit built from 16 pre-allocated keyframes.
Four FCurve modifier types are stacked on top and then baked to LINEAR keyframes
for GLB/WebXR export.

| Ball | Modifiers applied | Visual result |
|------|-------------------|---------------|
| A — cyan | CYCLES + NOISE (all 3 axes) | Continuous organic flutter, loops forever |
| B — amber | CYCLES + STEPPED (Y) + GENERATOR (Z) | Stop-motion orbit quantised every 3 frames, lifted 0.20 m |

## Key techniques

| API | Purpose |
|-----|---------|
| `fc.modifiers.new(type='NOISE')` | Perlin noise additive flutter — `scale`, `strength`, `phase`, `depth` |
| `fc.modifiers.new(type='CYCLES')` | Infinite looping of a base keyframe range — `REPEAT` vs `REPEAT_OFFSET` |
| `fc.modifiers.new(type='STEPPED')` | Stop-motion quantisation via `frame_step` |
| `fc.modifiers.new(type='GENERATOR')` | Polynomial drift — constant / linear / quadratic via `coefficients` |
| `fc.evaluate(frame)` | Sample evaluated (modifier-applied) float for baking |
| `keyframe_points.add(N)` | Pre-allocate keyframe array before filling — avoids O(N²) re-sort |

## Why bake before export?

FCurve modifiers live in Blender's runtime evaluator.  GLB/glTF stores only
discrete keyframe data — there is no glTF equivalent of a noise or cycles
modifier.  Sampling `fc.evaluate(frame)` at every export frame and writing
the result as a LINEAR keyframe captures the modifier stack faithfully, then
the modifiers are removed so the action is portable to any renderer.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full pipeline — orbit, modifiers, bake, scene dressing |
| `record.py` | Runs blueprint then renders to `viewport.mp4` via EEVEE Next |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact registry with cross-references |

## Running

Open Blender 5.1 → Scripting workspace → open `blueprint.py` → Run Script (Alt+P).
The script mutates the current scene.  Press Space to play the timeline.
Save as `hf_fcurve_mod_poi.blend` once you have inspected the result.

For the viewport recording: open `record.py` and run it instead — it calls the
blueprint first, then renders `viewport.mp4` to the videos directory.

## Outside sources

- **Blender Manual — F-Curve Modifiers**  
  https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/modifiers.html  
  Licence: CC-BY-SA 4.0 · Author: Blender Foundation  
  Related: Blender Python API `bpy.types.FModifier`, Blender Manual Graph Editor

- **Blender Python API — FModifierNoise**  
  https://docs.blender.org/api/current/bpy.types.FModifierNoise.html  
  Licence: CC-BY-SA 4.0 · Author: Blender Foundation  
  Related: `bpy.types.FCurve.evaluate()`, `bpy.types.FModifierCycles`, `bpy.types.FModifierStepped`
