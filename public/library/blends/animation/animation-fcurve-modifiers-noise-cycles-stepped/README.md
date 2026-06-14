# F-Curve Modifiers — Noise + Cycles + Stepped

**Blender 5.1 · CC0 · Holoflow Studio**

F-Curve modifiers are waveform post-processors that run during the depsgraph
traversal — after keyframe evaluation, before the result writes to the
datablock. Three modifier types demonstrated here cover the most common
practical needs.

## What this file builds

| Object | Modifier | Effect |
|---|---|---|
| `BounceSphere` | CYCLES | Loops a 24-frame bounce bounce indefinitely |
| `BounceSphere` | NOISE (rot.Z) | Adds ±0.18 rad organic wobble each loop |
| `RatchetDisc` | STEPPED | Snaps continuous rotation to 15° / 4-frame holds |
| `Camera` | NOISE (loc.X, loc.Y) | Handheld shake ±0.04 m, independent axes |

## Run

```bash
blender --background --python blueprint.py
blender --background --python record.py   # renders viewport.mp4
```

## Key API

```python
fc = action.fcurves[i]
cycles  = fc.modifiers.new(type="CYCLES")   # FModifierCycles
noise   = fc.modifiers.new(type="NOISE")    # FModifierNoise
stepped = fc.modifiers.new(type="STEPPED")  # FModifierStepped

# Modifier evaluated in index order; index 0 first.
# Cycles must precede Noise to loop before noise is added.
```

## Export to GLB

F-Curve modifiers are not exported to glTF. Materialise first:

```
Object ▸ Animation ▸ Bake Action
  ✓ Visual Keying   ✓ Clear Modifiers   Step: 1
```

## Sources

- Blender Manual — F-Curve Modifiers: https://docs.blender.org/manual/en/latest/editors/graph_editor/fcurves/modifiers.html (CC-BY-SA 4.0, Blender Foundation)
- bpy.types.FModifierNoise API: https://docs.blender.org/api/current/bpy.types.FModifierNoise.html (CC-BY-SA 4.0, Blender Foundation)
- njanakiev/blender-scripting: https://github.com/njanakiev/blender-scripting (MIT, Nicolas Janakiev)
