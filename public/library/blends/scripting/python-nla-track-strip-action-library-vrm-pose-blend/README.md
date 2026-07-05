# Python bpy.types.NlaTrack + NlaStrip — Non-Linear Animation Pose Library for VRM (Blender 5.1)

**Technique:** Build a multi-pose NLA library entirely via the Python API — no operator context required. Three `bpy.types.Action` objects (idle, raise, reach) are pushed onto independent `NlaTrack` layers. The `COMBINE` blend type composes rotations via quaternion multiplication so partial poses add together without gimbal lock. A `frame_change_pre` handler drives `strip.influence` per-frame to crossfade between poses, and `bpy.ops.nla.bake()` flattens the result to a single exportable Action.

## Quick start

```bash
# 1. Open Blender 5.1
# 2. Scripting workspace → open blueprint.py → Alt+P (Run Script)
# 3. Inspect the NLA Editor: three tracks, each holding one pose strip
# 4. Open record.py → Alt+P to render viewport.mp4
```

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full production script — builds armature, actions, NLA tracks, bakes and exports GLB |
| `record.py` | Viewport animation renderer — writes viewport.mp4 via EEVEE Next |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the tutorial screen capture |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Key concepts

- `arm_ob.animation_data_create()` — must call before any NLA operation; returns or creates the AnimData block
- `ad.nla_tracks.new()` — appends a track; new tracks are muted by default until a strip is added
- `track.strips.new(name, start, action)` — `start` is an **integer** frame; auto-sets `frame_end` from action length
- Single-frame Actions produce zero-length strips — always set `strip.frame_end` explicitly and `strip.extrapolation = 'HOLD'`
- `ad.action = None` — clear the action slot before relying on NLA; otherwise the slot evaluates in **addition** to the NLA stack
- `strip.blend_type = 'COMBINE'` — quaternion-multiplies rotations; use on all additive/layered tracks above the base

## Blender version

5.1 — NLA Python API unchanged from 4.x but `bpy.ops.nla.bake()` gains `channel_types` keyword in 4.3+.

## Licence

CC0 — no rights reserved.
