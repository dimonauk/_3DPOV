# Python FCurve API — Procedural Keyframe Authoring
## Turntable · Hover Oscillation · Elastic Entrance → Baked GLB

**Blender version:** 5.1  
**Topic:** Scripting / Animation  
**Licence:** CC0

---

## What this does

`blueprint.py` builds three animation channels entirely via the bpy data API —
no timeline scrubbing, no UI operators — then pushes the combined action to an
NLA strip and bakes it to per-frame keyframes before exporting a self-contained
GLB for WebXR playback.

| Channel | API path | Technique |
|---------|----------|-----------|
| Turntable rotation | `rotation_euler[2]` | 2 LINEAR keyframes + FModifierCycles REPEAT_OFFSET |
| Hover oscillation | `location[2]` | Sine wave sampled every 2 frames, BEZIER AUTO_CLAMPED handles |
| Elastic entrance | `scale[0,1,2]` | 3-point curve, ELASTIC easing, explicit overshoot peak |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene, materials, and all FCurve channels; exports `turntable_prop.glb` |
| `record.py` | EEVEE OpenGL render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

---

## Usage

```bash
blender --background --python blueprint.py
```

Or open Blender 5.1 → Text Editor → Open `blueprint.py` → Run Script.

The GLB appears alongside the `.blend` at the path set in `OUTPUT_GLB`.

---

## Key concepts

- `keyframe_points.insert(..., options={'FAST'})` + `fc.update()` — the mandatory two-step for bulk keyframe insertion.
- `FModifierCycles(mode_before='REPEAT_OFFSET', mode_after='REPEAT_OFFSET')` — infinite looping with accumulating value (correct for rotation; wrong for position).
- `bpy.ops.nla.bake(visual_keying=True)` — collapses FCurve modifiers into explicit samples for glTF export.

---

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable`
- Related: `/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped`
- Related: `/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push`
- Exporter docs: `tools/blender-addon/README.md`

---

## Sources

- Blender Foundation Python API docs — CC-BY-SA 4.0 — https://docs.blender.org/api/5.1/bpy.types.FCurve.html
- `njankowski/blender-scripting` — MIT — https://github.com/njankowski/blender-scripting
