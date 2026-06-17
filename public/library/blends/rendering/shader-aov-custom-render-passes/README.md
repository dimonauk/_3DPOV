# Shader AOV — Custom Render Passes (Blender 5.1)

Three named AOV passes (Glow, Rim, Normal) authored in a sapphire
gem material and recombined in the Compositor for per-effect grading.

## What is an AOV?

An Arbitrary Output Variable (AOV) is a shader-side write slot. While
standard render passes (Diffuse, Specular, Shadow) are post-filters
computed by the renderer on fixed geometry buffers, an AOV Output node
lets you write **any value or colour from inside your shader** directly
into a named EXR layer. The renderer stores it, the compositor reads it.

This means: Fresnel values, procedural mask outputs, custom IDs,
distance-field data, velocity fields — anything a shader can compute
can become a first-class EXR channel.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Python setup: gem mesh, material, AOV registration, compositor |
| `record.py` | 150-frame turntable → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

Expected outputs (created by blueprint.py + render):

- `aov_amulet.blend`
- `output/aov_passes_0001.exr` — multilayer EXR with Combined +
  AOV.GlowMask + AOV.RimMask + AOV.FlatNormal

## Quick start

```bash
blender --background --python blueprint.py
# Opens Blender with the amulet scene.
# Then in Blender: F12 to render.
```

## The three passes

| Pass | Type | Source | Compositor use |
|---|---|---|---|
| `GlowMask` | Value | Fresnel ^ RIM_POWER | Gates Glare (rim-only bloom) |
| `RimMask` | Color | Fresnel × cold-blue | Independent hue grading |
| `FlatNormal` | Color | World normal → [0,1] | Stylised normal overlay, debug |

## Blender version

Tested on Blender **5.1**. AOV support in EEVEE Next was introduced in
Blender 4.0. The same `view_layer.aovs` API works for both Cycles and
EEVEE Next.

## Licence

All files in this directory: **CC0 1.0** (public domain).
