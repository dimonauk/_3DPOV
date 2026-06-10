# Cloth Simulation: Stylised Waving Flag on a Mast

**Blender 5.1 · Physics · CC0 · Holoflow Studio**

A low-poly (20 × 12) flag on an 8-sided mast, driven by a turbulent Wind force
field.  The cloth solver uses implicit Backwards Euler integration — structural,
shear, and bending springs combined with a pinned left-edge vertex group —
producing the characteristic sinusoidal flutter without any hand-keyframing.
The wind-blown pose at frame 72 is extracted via depsgraph for GLB export,
bypassing the full point-cache bake: ideal for headless CI runners.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene, exports `waving_flag.blend` + `waving_flag.glb` |
| `record.py` | Orbiting 360° camera render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
blender --background --python blueprint.py
blender --background waving_flag.blend --python record.py
```

## Key Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `CLOTH_QUALITY` | 10 | Sub-steps/frame — prevents coarse-mesh self-penetration |
| `CLOTH_STRUCT` | 40 N/m | Structural stiffness — resists edge stretch |
| `CLOTH_BEND` | 5 N·m/rad | Bending stiffness — lower = more dramatic flutter |
| `WIND_NOISE` | 2.5 | Turbulence amplitude — seeds standing-wave instability |
| `EXPORT_FRAME` | 72 | Frame 3 s — flag fully extended for GLB snapshot |

## Tutorial

[/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag](/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag)

## Outside Sources

- [Blender Manual — Cloth Physics](https://docs.blender.org/manual/en/latest/physics/cloth/settings/physics.html) — CC-BY-SA 4.0 · Blender Foundation
- [blender-scripting](https://github.com/njanakiev/blender-scripting) — MIT · Nicolas Janakiev
- [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) — Apache-2.0 · Khronos Group
