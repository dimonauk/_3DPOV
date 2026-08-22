# Principled BSDF v2 — Full Parameter Map to glTF 2.0 PBR for WebXR

**Blender 5.1 · Topic: Shading · Licence: CC0**

## What this builds

A faceted sci-fi panel shard (asymmetric twisted hexagonal prism) with a
Principled BSDF v2 material whose every socket is set explicitly, then
exported as a GLB with the full `KHR_materials_*` extension suite active.

The goal is not to produce the best-looking shard — it is to produce a
material that demonstrates every exportable PBR parameter so you can audit
the `.glb` JSON side-by-side with the Blender node.

## Principled BSDF v2 socket → glTF export map

| BSDF socket | glTF destination | Note |
|---|---|---|
| Base Color | `pbrMetallicRoughness.baseColorFactor` | RGB + alpha |
| Metallic | `pbrMetallicRoughness.metallicFactor` | |
| Roughness | `pbrMetallicRoughness.roughnessFactor` | |
| IOR | `KHR_materials_ior.ior` | default 1.5 |
| Alpha | `material.alphaMode` | OPAQUE / BLEND / MASK |
| Specular IOR Level | `KHR_materials_specular.specularFactor` | approx; see note |
| Coat Weight | `KHR_materials_clearcoat.clearcoatFactor` | renamed Clearcoat |
| Coat Roughness | `KHR_materials_clearcoat.clearcoatRoughnessFactor` | |
| Sheen Weight + Tint | `KHR_materials_sheen.sheenColorFactor` | |
| Emission + Strength | `emissiveFactor` + `KHR_materials_emissive_strength` | |
| Transmission Weight | `KHR_materials_transmission.transmissionFactor` | 0 = omitted |
| **Subsurface** | **NOT exported** | bake to Base Color texture |
| Anisotropic | `KHR_materials_anisotropy` | Blender 5.x exporter |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Create shard mesh + PBSDF v2 material + export GLB |
| `record.py` | Animate parameter sweep + render viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Expected output

After running `blueprint.py`:
- `hs_control_shard.glb` — the prop with full KHR extension suite

After running `record.py`:
- `public/library/videos/shading/shader-principled-bsdf-v2-gltf-pbr-webxr/viewport.mp4`

## Holoflow pipeline note

The Holoflow WebXR export convention uses +Y up, transforms applied, Draco
level 6, and WebP textures. These are set in the `export_glb()` call. The
`KHR_materials_*` extensions are emitted automatically by Blender's glTF
I/O add-on when the corresponding BSDF socket value is non-zero.

## Sources

- Blender glTF I/O add-on (Apache-2.0): https://github.com/KhronosGroup/glTF-Blender-IO
- Khronos glTF 2.0 Material Spec (Apache-2.0): https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html
