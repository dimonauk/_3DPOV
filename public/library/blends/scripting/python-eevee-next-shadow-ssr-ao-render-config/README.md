# EEVEE Next Render Configuration via Python

**Blender version:** 5.1  
**Topic:** `scripting`  
**Licence:** CC0  
**Tutorial:** `/tutorials/blender-tutorial-python-eevee-next-shadow-ssr-ao-render-config`

## What this does

`blueprint.py` builds a `make_preset()` / `apply_eevee_preset()` / `save_preset_json()` pattern
for the full `bpy.types.SceneEEVEE` API, then creates a six-sphere metallic/roughness
calibration grid to exercise each subsystem visually:

- Shadows (virtual shadow map atlas, sun disc penumbra)
- Screen-Space Reflections (SSR — chrome mirror → brushed steel → probe fallback boundary)
- GTAO ambient occlusion (ground contact crease on chalk sphere)
- TAA render samples (64 for stills, 8 for interactive viewport)
- Hardware RT switch (`use_raytracing` + `ray_tracing_method`)

A JSON preset sidecar (`eevee_preset_holoflow_webxr_preview.json`) is written next to
the `.blend` file for use in batch render CI pipelines.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full EEVEE Next config script + calibration scene |
| `record.py` | 60-frame orbit render for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Run order

1. Open Blender 5.1, new General file.
2. Open the Scripting workspace.
3. Run `blueprint.py`.
4. Press **Z → Rendered** — verify the six-sphere grid with SSR floor reflections.
5. Run `record.py` — writes `viewport.mp4`.
