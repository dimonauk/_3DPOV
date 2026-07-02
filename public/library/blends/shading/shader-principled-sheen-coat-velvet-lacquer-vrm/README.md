# Shader — Principled BSDF v2: Sheen & Coat

**Blender 5.1 · Holoflow Studio · CC0**

Deep-dive into two composite layers that are almost always left at defaults:
the **Sheen** retroreflective lobe (velvet / microfibre physics) and the
**Coat** attenuated two-layer BSDF (lacquer / clear-coat physics).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene + both materials from scratch, exports GLB |
| `record.py` | Keyframes Sheen/Coat reveal, renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |

## Materials

| Material | Sheen W | Sheen R | Coat W | Coat R | Coat IOR |
|----------|---------|---------|--------|--------|---------|
| VelvetJacket_Navy | 0.93 | 0.21 | 0.0 | — | — |
| LacquerBelt_Black | 0.11 | 0.80 | 0.87 | 0.04 | 1.49 |

## glTF extensions fired

- `KHR_materials_sheen` — fired when Sheen Weight > 0
- `KHR_materials_clearcoat` — fired when Coat Weight > 0

Verify in the [Khronos glTF Sample Viewer](https://github.khronos.org/glTF-Sample-Viewer-Release/).

## Outside sources

- Blender Manual — Principled BSDF (CC BY):
  <https://docs.blender.org/manual/en/5.1/render/shader_nodes/shader/principled.html>
- KHR_materials_sheen spec (MIT — KhronosGroup/glTF):
  <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_sheen/README.md>
- KHR_materials_clearcoat spec (MIT — KhronosGroup/glTF):
  <https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_clearcoat/README.md>
