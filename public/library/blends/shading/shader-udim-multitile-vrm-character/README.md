# UDIM Multi-Tile UV Layout — VRM Character Torso

**Blender 5.1 · Shading / UV · CC0**

## What this is

A complete demonstration of the UDIM (U-Dimension Image Map) workflow
in Blender 5.1, applied to a low-poly VRM humanoid torso.  UDIMs are
a film-VFX standard for distributing UV islands across numbered texture
tiles rather than cramming everything into a single 0–1 UV space.

The blend file contains:
- A 12-segment, 9-ring torso mesh with a manual three-tile UV layout
- An `Image Texture` node set to `source = TILED` (the Blender flag for
  UDIM sampling)
- Three 1K base-colour images for tiles 1001 / 1002 / 1003
- A second UV channel `atlas_uv` with the three tiles remapped to [0, 1]
- A baked 4K atlas (`udim_character_torso_atlas.png`) ready for GLB export

## UDIM tile layout

```
U range    Tile   Content
0 – 1      1001   Front torso hemisphere
1 – 2      1002   Back torso hemisphere
2 – 3      1003   Neck / top cap
```

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — builds mesh, UV, material, bakes atlas |
| `record.py` | 300-frame orbit animation for viewport recording |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `udim_character_torso.blend` | Output of blueprint.py (run to generate) |
| `textures/udim_character_torso.1001.png` | Front tile base colour |
| `textures/udim_character_torso.1002.png` | Back tile base colour |
| `textures/udim_character_torso.1003.png` | Neck tile base colour |
| `textures/udim_character_torso_atlas.png` | Baked 4K atlas (GLB target) |

## Running the blueprint

```bash
blender --background --python blueprint.py
```

The script opens a headless Blender session, builds the scene, runs the
bake, and saves `udim_character_torso.blend` in the same directory.

## Why not Smart UV Project?

`bpy.ops.uv.smart_project()` always places all islands in tile 1001 and
provides no multi-tile placement control.  The blueprint assigns UV
coordinates directly via the bmesh loops layer — giving exact, predictable
tile placement that is robust to mesh topology changes.

## Exporting to GLB

GLTF 2.0 has no UDIM support.  Before exporting:
1. Select the `atlas_uv` UV layer as active in Mesh Data › UV Maps.
2. File › Export › glTF 2.0 — the single atlas texture is embedded.
3. Confirm in the glTF Validator that `accessors` lists one UV buffer.

## Outside sources

- **Blender Manual — Multi-Tile UVs (UDIM)**
  https://docs.blender.org/manual/en/latest/modeling/meshes/editing/uv/uv_mapping/udim.html
  Licence: CC BY-SA 4.0 — Blender Foundation
- **OpenImageIO UDIM Specification** (the originating spec)
  https://github.com/AcademySoftwareFoundation/OpenImageIO/blob/main/src/doc/imageioproc.rst
  Licence: Apache-2.0 — Academy Software Foundation (ASWF)
