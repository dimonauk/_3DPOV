# hf_poi_performance — Python bpy Action & NLA Editor

**Blender 5.1 | CC0-1.0 | Holoflow Studio**

## What this is

Three poi spin patterns authored as independent Blender Actions using the
direct FCurve data API — no operator calls, no depsgraph flush per keyframe —
then sequenced as NLA strips on a single poi ball object and exported to an
animated GLB for WebXR playback.

## Patterns

| NLA frames | Pattern | Path geometry |
|---|---|---|
| 1 – 80 | Butterfly | Lissajous 2:1 figure-8, 2 cycles |
| 81 – 160 | Helicopter | Horizontal circle, 3 revolutions |
| 161 – 240 | Weave | 3-beat lateral pendulum arc |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Run in Blender's Scripting workspace — builds scene + bakes animation |
| `record.py` | Viewport render to `viewport.mp4` (run after blueprint + save) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `hf_poi_performance.blend` | Saved after running `blueprint.py` |
| `hf_poi_performance.glb` | Animated GLB with 240-frame NLA-baked performance |

## Usage

```
1. Open Blender 5.1 — start from the default scene.
2. Scripting workspace → New → paste blueprint.py → Run Script (Alt+P).
3. File → Save As → hf_poi_performance.blend
4. Scripting workspace → Open record.py → Run Script to produce viewport.mp4
5. Use hf_poi_performance.glb in three.js / A-Frame / Babylon.js WebXR projects.
```

## Key API facts

- `bpy.data.actions.new()` creates an Action data-block (not bound to any object yet).
- `action.fcurves.new(data_path, index, action_group)` creates one channel curve.
- `keyframe_points.add(n)` + direct `.co` assignment is 3–5× faster than repeated `keyframe_points.insert()` for large key counts.
- `fc.update()` must be called once after batch assignment to sort keys and recalculate Bézier handles.
- `action.frame_range = (start, end)` tells the NLA editor the strip's natural length.
- `nla_tracks.new()` + `track.strips.new(name, start, action)` places the action in NLA time.
- `strip.blend_type = 'REPLACE'` ensures each pattern plays cleanly without leakage from adjacent strips.
- `export_nla_strips=True` in `bpy.ops.export_scene.gltf()` bakes all NLA strips into the GLB animation tracks.

## Cross-references

- [Spring-Pendulum Poi Lissajous light-painting](/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting)
- [Kuramoto phase-sync foi fcurve baking](/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr)
- [GN Points-to-Curves Poi Trail Ribbon](/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr)
