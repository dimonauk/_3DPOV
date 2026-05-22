# EEVEE Next Toon / Cel-Shader Node Group
**Blender 5.1 | Holoflow Studio | CC0**

A reusable `ShaderNodeTree` node group (`HoloflowToonShader`) implementing a
two-band + rim-light cel shader driven entirely by EEVEE Next's analytical
shading pipeline.

## What this produces

| File | Description |
|---|---|
| `toon_demo.blend` | Source scene with live toon material and node group |
| `toon_demo.glb` | Exported GLB (Emission-based, no Draco — 20-face icosphere) |
| `blueprint.py` | Full bpy.data API script — builds everything headlessly |
| `record.py` | 150-frame viewport render — Z-rotation animation |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |

## Core technique

```
Diffuse BSDF → Shader to RGB → ColorRamp (CONSTANT) → two-band toon colour
Geometry.Incoming · Normal → +1 shift → ColorRamp (CONSTANT) → rim mask
MixRGB (fac=rim_mask) → Emission → Material Output
```

## Run headless

```bash
blender --background --python blueprint.py
```

## Parameters (top of blueprint.py)

| Name | Default | Effect |
|---|---|---|
| `SHADOW_COLOUR` | deep navy | Band colour when diffuse factor < TOON_STEP |
| `LIT_COLOUR` | bright cobalt | Band colour when diffuse factor ≥ TOON_STEP |
| `RIM_COLOUR` | near-white | Silhouette highlight colour |
| `TOON_STEP` | 0.45 | Shadow/lit boundary position (0–1) |
| `RIM_THRESHOLD` | 0.25 | Rim band width along silhouette (0=thin) |

## glTF / WebXR note

EEVEE toon materials export via `KHR_materials_emissive_strength` — the GLB
renders flat in Three.js without responding to scene lights. For WebXR
delivery, bake the EEVEE render to a colour texture and apply it with
`Emission Weight = 1.0` on a Principled BSDF. See the texture-baking tutorial
in the Holoflow library for the full pipeline.

## Licence

Blueprint, record script, and notes are CC0. Outside sources credited in
the tutorial page at `/tutorials/blender-tutorial-eevee-toon-cel-shader`.
