# Grease Pencil Line Art — View-Dependent Ink Silhouette and Crease Outlines

**Blender 5.1 | CC0 | Shading + Grease Pencil**

Demonstrates the **GP_LINEART modifier** (GPv2 API): it raycasts the scene from the
camera's position to trace the silhouette (contour) and internal crease edges of a 3D mesh,
then writes those paths as Grease Pencil strokes.  The strokes update every frame as the
camera moves — ink outlines are view-dependent, not baked UV data.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — icosphere + toon material + GP object + Line Art modifier, saves `.blend` + `.glb` |
| `record.py` | Orbits camera 360° to show silhouette rolling around the sphere in viewport render |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen recording |
| `.expected-artefacts.json` | CI manifest: expected output files + cross-references |

## Pipeline

```
IcoSphere (subdivisions=2, flat-shaded)
  └── toon_body_mat (Diffuse BSDF, warm salmon)

GPENCIL object (lineart_ink)
  ├── layer: "Lines"
  ├── material: ink_stroke_mat (black SOLID stroke, no fill)
  └── GP_LINEART modifier
        ├── source_type = OBJECT → toon_sphere
        ├── use_contour = True   (silhouette edges)
        ├── use_crease  = True   (dihedral > 30°)
        └── thickness   = 3 px
```

## Running

```bash
# Build the .blend and static GLB
blender --background --python blueprint.py

# Record the viewport animation (open .blend first)
blender grease_pencil_lineart.blend --background --python record.py
# → public/library/videos/shading/grease-pencil-lineart-toon-outline/viewport.mp4
```

## Key parameters

| Parameter | Default | Effect |
|---|---|---|
| `CREASE_DEG` | 30° | Min dihedral for a crease stroke; raise → fewer edge lines |
| `STROKE_THICKNESS` | 3 px | Ink line width at 1080p; scale with render resolution |
| `ICO_SUBDIVISIONS` | 2 | Facet count (320 tris); level 1 = 80 tris for more dramatic edges |

## Outside sources

- **Blender Manual — Line Art Modifier**
  https://docs.blender.org/manual/en/latest/grease_pencil/modifiers/generate/line_art.html
  Licence: CC-BY-SA 4.0 — Blender Documentation Team

- **njanakiev/blender-scripting**
  https://github.com/njanakiev/blender-scripting
  Licence: MIT — Nicolas Janakiev

- **KhronosGroup/glTF-Blender-IO**
  https://github.com/KhronosGroup/glTF-Blender-IO
  Licence: Apache-2.0 — Khronos Group

## Tutorial

`/tutorials/blender-tutorial-grease-pencil-lineart-toon-outline`
