# Shader — Reoriented Normal Mapping (RNM) Detail Overlay

**Blender 5.1 · CC0 · Holoflow Studio Library**

Composites two independently-generated normal layers — a low-frequency base panel undulation and a tiling high-frequency rivet/bolt detail — using the Reoriented Normal Mapping (RNM) formula, which correctly preserves the cosine relationship between both layers at all angles.

## Why not Mix?

Simple lerp (Mix Color) of two decoded normals is wrong because normal vectors do not lie on a flat plane — averaging (0,0,1) and (0.5,0.5,0.707) produces a vector shorter than 1 that points in the wrong direction at 45°. The artefacts are worst at grazing angles and are visible as flattening and incorrect specular highlights.

## RNM Formula

```
T = decode(base_normal_map)    # Bump node output, unit vector
D = decode(detail_normal_map)  # Bump node output, unit vector

Rx = Tx + Dx
Ry = Ty + Dy
Rz = Tz × Dz          # multiply Z — not add
R  = normalize(Rx, Ry, Rz)
```

The Z-multiply keeps the composite normal close to the hemisphere intersection of T and D; re-normalizing restores unit length.

## Node Graph

```
TexCoord.UV → Mapping(Scale=2.5)  → Noise(Fac)   → Bump(Base,   0.8) → T
TexCoord.UV → Mapping(Scale=14.0) → Voronoi(Dist) → Invert → Bump(Detail, 0.35) → D

SepXYZ(T) → Tx, Ty, Tz
SepXYZ(D) → Dx, Dy, Dz

Add(Tx, Dx) → Rx   Add(Ty, Dy) → Ry   Multiply(Tz, Dz) → Rz
CombineXYZ(Rx, Ry, Rz) → VectorMath(NORMALIZE) → blended_N

PrincipledBSDF(Normal=blended_N, Metallic=0.85, Roughness=0.38)
```

## Files

| File | Description |
|---|---|
| `blueprint.py` | Builds scene + material + exports `output/rnm_panel.glb` |
| `record.py` | 60-frame viewport render: orbit + detail blend |
| `output/rnm_panel.glb` | GLB, Draco 6, Y-up |

## Running

```bash
blender --background --python blueprint.py
blender rnm_panel.blend --python record.py
```

## Cross-References

- [Shader — Principled BSDF v2 full parameter map](/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr)
- [Texture Baking — Normal Map + AO](/tutorials/blender-tutorial-texture-baking-normal-ao)
- [Shader — POM: Parallax Occlusion Mapping](/tutorials/blender-tutorial-shader-parallax-occlusion-mapping-wall-tile-webxr)
- [Shader — AO + Pointiness Edge Highlight](/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight)
