# Python Cycles Batch Bake Pipeline

**Blender 5.1 · Scripting · CC0**

Automate the transfer of Cycles surface detail — normal relief, ambient occlusion
cavity shading, and emission maps — from hi-poly source meshes to lo-poly
WebXR-ready geometry via `bpy.ops.object.bake()`. Outputs WebP images sized and
compressed for the Holoflow Studio glTF / GLB pipeline.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full batch bake pipeline — paste into Blender Scripting workspace and run |
| `record.py` | Renders `viewport.mp4` (automated, no Blender GUI needed) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` walkthrough |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

1. Open or save a `.blend` file (the `//` output path resolves relative to it).
2. Name your lo-poly objects with the prefix `lo_` and hi-poly with `hi_`.
3. Paste `blueprint.py` into a Scripting workspace text block.
4. Press **Run Script** (Alt+P).
5. Find WebP maps in `<blend directory>/bake_output/`.

## Bake passes

| Pass | Bits | Colour Space | Filename Suffix |
|------|------|-------------|----------------|
| Normal | 32-bit float | Non-Color | `_nm.webp` |
| Ambient Occlusion | 8-bit | sRGB | `_ao.webp` |
| Emission | 8-bit | sRGB | `_em.webp` |

## Key constraints

- **Cycles only.** EEVEE Next does not support `bpy.ops.object.bake()`. The
  script overrides the engine temporarily and restores it on completion.
- **UV map required.** Every lo-poly object must have at least one UV layer.
  The script auto-creates a `BakeST` map if none exists, but the UVs will be
  trivially zero — run a Smart UV Project first.
- **Active Image Texture node rule.** The baker ignores the node graph's output
  chain; it writes into whichever `ShaderNodeTexImage` is currently *active*
  (highlighted blue) in the material's node editor. The script injects, uses,
  and removes this node automatically.

## Integration with the Holoflow pipeline

After baking, use [Blender's glTF 2.0 exporter](https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html)
with the baked maps wired into a new Principled BSDF: Normal Map → Normal socket,
AO mixed into Base Color, Emission into Emission. Draco compression level 6
keeps the GLB under 500 KB for most props.
