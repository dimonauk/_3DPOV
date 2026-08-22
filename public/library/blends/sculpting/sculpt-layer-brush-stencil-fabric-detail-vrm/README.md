# Sculpt Layer Brush + Stencil — Fabric Weave Detail on VRM Clothing

**Blender 5.1** · Sculpting · CC0

Adds a uniform-depth fabric weave micro-detail pass to a VRM clothing torso
using the Layer brush's floor-clamping property together with a Clouds texture
mapped in Stencil mode. The Layer brush's `height` parameter acts as a hard
ceiling on displacement: the weave pattern reaches exactly `LAYER_HEIGHT`
(6 mm) across the entire garment regardless of how long the stroke lingers.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates cylinder torso, Multires level 3, simulates Layer+Stencil via Displace+multires_reshape, bakes 1K normal map, exports GLB |
| `record.py` | 120-frame viewport animation: zoom-in → 360° orbit → Multires level ramp 1→3 |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for the interactive sculpt session capture |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Quick start

1. Open Blender 5.1 → Scripting workspace
2. Load and Run `blueprint.py` — creates `VRM_Jacket` with normal map baked
3. Switch to Sculpt Mode on `VRM_Jacket`
4. The **Layer** brush is pre-loaded with the `FabricWeave` stencil texture
5. Set Brush > Texture > Mapping to `Stencil` (should already be set)
6. Paint over the jacket surface; depth is clamped at 6 mm automatically
7. Position stencil with **RMB drag** · scale with **Shift+RMB** · rotate with **Ctrl+RMB**
8. Use **Auto-Mask by Face Set** (Sculpt > Options panel) to isolate zones

## Key parameters

| Constant | Value | Meaning |
|----------|-------|---------|
| `LAYER_HEIGHT` | 0.006 m | Brush height floor — the maximum displacement depth |
| `NOISE_SCALE` | 0.07 | Clouds scale — smaller → finer weave repeat |
| `NOISE_DEPTH` | 6 | Clouds octaves — higher → sub-thread fibre detail |
| `MULTIRES_LEVEL` | 3 | 64× level-0 face count (the sculpt canvas resolution) |

## Output

- `vrm_fabric_jacket.glb` — Draco 6 + WebP, +Y up, ~80 KB with normal map
- `public/library/videos/sculpting/sculpt-layer-brush-stencil-fabric-detail-vrm/viewport.mp4`

## Cross-references

- [Multires Normal Bake Pipeline](/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb)
- [Sculpt Face Sets Zone Masking](/tutorials/blender-tutorial-sculpt-face-sets-zone-masking-vrm-retopo)
- [Dyntopo vs Voxel Remesh](/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh)
- [Velvet Fabric Shader (Principled Sheen)](/tutorials/blender-tutorial-shader-principled-sheen-coat-velvet-lacquer-vrm)
- [Cycles Batch Bake Pipeline](/tutorials/blender-tutorial-python-cycles-batch-bake-normal-ao-emission-webxr)
