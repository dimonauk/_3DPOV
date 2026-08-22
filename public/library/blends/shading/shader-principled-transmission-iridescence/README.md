# Holographic Gem — Principled BSDF v2 Transmission + Iridescence

**Blender version:** 5.1  
**Category:** shading  
**Licence:** CC0  
**Tutorial:** `/tutorials/blender-tutorial-shader-principled-transmission-iridescence`

---

## What this does

Builds a holographic sapphire-blue gem material using three Principled BSDF v2
capabilities introduced or renamed in Blender 4.0:

| Feature | Socket name (5.1) | Old name (3.x) |
|---|---|---|
| Glass refraction | `Transmission Weight` | `Transmission` |
| Thin-film rainbow | `Iridescence Thickness` | *(new in 4.0)* |
| Polish overcoat | `Coat Weight` | `Clearcoat` |

The rainbow pattern is driven by a **Wave Texture → Map Range → Iridescence
Thickness** chain: each band maps to a different nm value, which constructively
reinforces a different spectral wavelength — physically correct thin-film
interference, not a fake colour-ramp trick.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full bpy script — creates mesh, material, lights, camera, exports GLB |
| `record.py` | Viewport animation — keyframes Wave Scale + camera orbit, renders MP4 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the screen.mp4 tutorial video |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Running

```bash
# Headless execution
blender --background --python blueprint.py

# With GUI (opens scene for inspection)
blender blueprint.py
```

## Outputs

- `holographic_gem.blend` — source scene with material
- `../../glbs/shading/shader-principled-transmission-iridescence/holographic_gem.glb`
  — Draco-compressed GLB with `KHR_materials_transmission` and
  `KHR_materials_iridescence` extensions
- `../../../videos/shading/shader-principled-transmission-iridescence/viewport.mp4`
  — 3-second iridescence sweep render (after `record.py`)
- `screen.mp4` — screen recording (Dimona records manually, see SCREEN-RECORDING-NOTES.md)

## Key parameters

```python
IOR                 = 1.77   # 1.33 water, 1.52 glass, 1.77 sapphire, 2.42 diamond
ROUGHNESS           = 0.04   # < 0.08 reads as polished gem; > 0.15 = frosted glass
TRANSMISSION        = 0.92   # 0 = opaque, 1 = fully transmissive
IRIDESCENCE_THK_MIN = 270.0  # nm — blue end of visible spectrum
IRIDESCENCE_THK_MAX = 680.0  # nm — red end
WAVE_SCALE          = 7.0    # higher = tighter rainbow bands
```

## glTF compatibility

| Extension | Three.js | Babylon.js | PlayCanvas |
|---|---|---|---|
| `KHR_materials_transmission` | r150+ | 5.x | ✓ |
| `KHR_materials_iridescence` | r152+ | 6.x | partial |
| `KHR_materials_ior` | r152+ | 6.x | ✓ |
