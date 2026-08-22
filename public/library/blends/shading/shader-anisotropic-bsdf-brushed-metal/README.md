# Shader — Anisotropic BSDF: Brushed Metal & Circular-Titanium Disc

**Blender version:** 5.1  
**Licence:** CC0  
**Topic:** Shading  
**Difficulty:** Intermediate–Advanced  
**Estimated time:** 1–2 hours

## What this teaches

`ShaderNodeBsdfAnisotropic` stretches the GGX micro-facet distribution along a tangent
axis so that the specular highlight elongates perpendicular to the surface scratch
direction — the signature of brushed metal, vinyl records, machined titanium, and
aerospace panel stock.

The `ShaderNodeTangent` node controls which direction that axis points:
- **UV_MAP mode** anchors the tangent to the UV U direction — useful for panels,
  bar stock, or any object where the brushing follows a straight axis.
- **RADIAL / Z mode** makes the tangent orbit the Z axis at every surface point —
  producing concentric ring highlights on discs, cylinders, and coin faces.

A `Noise Texture` feeds a small roughness perturbation into the `Roughness` socket,
breaking up the single-frequency highlight band into the subtly irregular streak of
a real hand-brushed surface.

## Files in this entry

| File | Description |
|---|---|
| `blueprint.py` | Full scene, materials, and lighting. Run in Blender 5.1 Scripting workspace. |
| `record.py` | 270° camera orbit render → `viewport.mp4`. Run after blueprint.py. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4`. |
| `anisotropic_brushed_metal.blend` | Saved blend (generate via blueprint.py then File → Save). |
| `anisotropic_brushed_metal.glb` | Geometry export (uncomment `export_glb()` in blueprint.py). |
| `.expected-artefacts.json` | Machine-readable manifest and cross-reference list. |

## Key constants to tune

| Constant | Default | Effect |
|---|---|---|
| `ANISO_ROUGHNESS` | 0.14 | Base roughness — lower = thinner, more mirror-like streak |
| `ANISO_AMOUNT` | 0.88 | Stretch factor: 0 = round highlight, 1 = thread-thin line |
| `DISTRIBUTION` | `'GGX'` | `'MULTI_GGX'` gives energy-preserving multiple scattering |
| `NOISE_SCALE` | 85.0 | Controls scratch pitch simulation — higher = finer bands |
| `NOISE_ROUGH_GAIN` | 0.06 | Perturbation amplitude — raise carefully to avoid muddy look |

## Tangent gotchas

- **UV_MAP tangent on a primitive cube:** Blender's default cube UV layout places
  every face independently.  The U direction differs per face.  For a directional
  linear brush, use Smart Project or manually UV-unwrap so all faces share a
  consistent U axis before assigning the material.
- **RADIAL tangent on a flat square:** the tangent is undefined at the centre
  (the denominator of the normalised radial vector is zero).  A small black dot
  appears at the origin.  Use the disc/cylinder geometry which avoids a centre vertex.
- **Anisotropy = −1.0:** negative values rotate the stretch axis by 90° —
  the highlight runs parallel to the tangent instead of perpendicular.  This can
  be intentional (mimicking cross-hatch brushing) but surprises newcomers.

## GLB export and KHR_materials_anisotropy

`ShaderNodeBsdfAnisotropic` does **not** automatically export to the
`KHR_materials_anisotropy` glTF extension.  The Blender glTF exporter reads
`Anisotropic` and `Anisotropic Rotation` from the **Principled BSDF** only.

For WebXR delivery with real-time anisotropy in Three.js:
1. Duplicate the material.
2. Replace `ShaderNodeBsdfAnisotropic` with `ShaderNodeBsdfPrincipled`.
3. Set `Anisotropic = ANISO_AMOUNT`, `Anisotropic Rotation = 0.0`.
4. Export: the glTF file will include `KHR_materials_anisotropy`.
5. In Three.js, `MeshPhysicalMaterial.anisotropy` and `.anisotropyRotation` map
   directly to those values.

## Outside sources

1. Blender Manual — Anisotropic BSDF (CC-BY-SA 4.0, Blender Documentation Team)  
   <https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/anisotropic.html>

2. KHR_materials_anisotropy — glTF Extension Specification (Apache-2.0, Khronos Group)  
   <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_anisotropy/README.md>  
   Related: `glTF-Sample-Models` repo (same org); Three.js `MeshPhysicalMaterial.anisotropy`.
