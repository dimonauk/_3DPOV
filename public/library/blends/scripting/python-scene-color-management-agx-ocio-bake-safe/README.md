# Python scene.view_settings — AgX Colour Management & Bake-Safe Linear Pipeline

**Blender 5.1 | Holoflow Studio | CC0**

## What this teaches

`bpy.context.scene.view_settings` controls the OCIO display pipeline that
maps scene-linear light values to monitor-displayable pixels.  Getting this
right separates professional renders from amateur ones — and it has a direct
impact on WebXR asset quality because baked textures that use the wrong
colorspace deliver subtly but persistently wrong lighting in the browser.

### Key API surface

| Property | Type | Notes |
|---|---|---|
| `view_settings.view_transform` | `str` | `'AgX'`, `'Filmic'`, `'Standard'`, `'Raw'`, `'False Color'` |
| `view_settings.look` | `str` | Per-transform; AgX: `'None'`, `'Punchy'`, `'Greyscale'` |
| `view_settings.exposure` | `float` | Stops of pre-sigmoid boost/cut |
| `view_settings.gamma` | `float` | Post-display-transform gamma |
| `view_settings.use_curve_mapping` | `bool` | Enables custom S-curve post-stack |
| `display_settings.display_device` | `str` | `'sRGB'` in default OCIO config |
| `preferences.system.ocio_config_path` | `str` | Read-only in 5.1 |

### The bake-safe rule

| Bake pass | Image colorspace |
|---|---|
| Albedo / diffuse colour | `sRGB` |
| Normal map | `Non-Color` |
| Roughness / metallic / AO | `Non-Color` |
| Displacement / height | `Non-Color` |
| Emission (HDR) | `Linear` |

Setting the colorspace **before** the bake is mandatory — Blender reads it
when writing pixel data, not when displaying the result.  A normal map baked
to an `sRGB` image is silently gamma-decoded by the runtime shader, producing
a surface that looks correct in Blender but is subtly wrong in Three.js.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Build colour chart, configure AgX, snapshot/restore helpers, bake-safe image creation |
| `record.py` | 120-frame camera orbit render for viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Outside sources

- **Blender Foundation** — [Colour Management manual](https://docs.blender.org/manual/en/latest/render/color_management.html) (CC-BY-SA-4.0)
- **AcademySoftwareFoundation/OpenColorIO** — [GitHub](https://github.com/AcademySoftwareFoundation/OpenColorIO) (Apache-2.0); sibling: [AcademySoftwareFoundation/Imath](https://github.com/AcademySoftwareFoundation/Imath) (BSD-3-Clause)
