# Principled Hair BSDF — Stylised VRM Hair

**Blender 5.1 · CC0 · Holoflow Studio**

Builds a particle-hair head cap on a UV sphere scalp, wires a Principled Hair
BSDF with anime-blue tint, and sets up 3-point lighting with a boosted back
light to reveal all three scattering lobes (R, TT, TRT).

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the full scene; exports `vrm_hair.blend` + `vrm_hair.glb` (scalp mesh) |
| `record.py` | 5-second camera orbit; outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen-capture tutorial |
| `.expected-artefacts.json` | CI manifest of expected outputs |

## How to run

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py`, click **Run Script**.
4. The scene builds, `vrm_hair.blend` and `vrm_hair.glb` are written alongside this file.
5. Optionally open `record.py` and run it in the same session to render `viewport.mp4`.

## Hair-card bake workflow (WebXR)

The Principled Hair BSDF has no glTF material equivalent. To ship hair in a
WebXR GLB:

1. **Bake diffuse**: UV-unwrap the scalp. In the UV Editor create a 1024×1024
   image (transparent background). In Cycles, set Bake type = `Diffuse`. Bake
   with a contribution = `Color` only — this captures the tinted hair colour
   including the Tint override.
2. **Hair cards**: create flat ribbon planes aligned to major hair flow directions.
   UVs on each card map to a row in the atlas.
3. **Assign atlas**: apply a `Principled BSDF` with the baked PNG as Base Color,
   Alpha = `Alpha` channel, Blend Mode = `Alpha Clip`. Set Metallic = 0,
   Roughness = 0.3 for a reasonable screen-space approximation.
4. **Export**: `export_apply=True`, `export_image_format='WEBP'`,
   `export_draco_mesh_compression_level=6`.

## Licence

All files in this directory are released under CC0 1.0 Universal.
