# Nishita Sky Texture + Sun Position — Physically-Based Outdoor Lighting Rig

**Blender 5.1** · CC0 · Topic: World Shader / Atmospheric Sky

## What this is

The `ShaderNodeTexSky` node in Nishita mode simulates atmospheric Rayleigh scattering
(the blue sky), Mie scattering (haze and the white horizon band), and ozone absorption
(the slight greenish suppression in the upper sky) along the actual optical path from
the sun to each sky-dome direction.  The result is a physically accurate sky chromaticity
that shifts from twilight violet at −5° elevation through deep orange at 10° through
saturated blue at 70° — without a single HDRI texture file.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene build + animation + GLB export |
| `record.py` | OpenGL viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |
| `sky_nishita_hdri_rig.blend` | Saved file (run blueprint.py first) |
| `sky_nishita_hdri_rig.glb` | Golden-hour snapshot for WebXR |

## Quick start

```bash
# In Blender 5.1 Scripting workspace:
# Text → Open → public/library/blends/shading/shader-sky-nishita-sun-position-hdri-rig/blueprint.py
# Run Script
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `AIR_DENSITY` | 1.0 | Rayleigh scattering depth. >2 = deep-space blue. <0.5 = washed out |
| `DUST_DENSITY` | 0.5 | Mie aerosol / haze. 0 = crystal clear. 3 = Los Angeles smog |
| `OZONE_DENSITY` | 1.0 | Ozone absorption (green suppression). Rarely needs changing |
| `SUN_ELEVATION` | 5° | Latitude + season determine real noon elevation |
| `SKY_TYPE` | NISHITA | PREETHAM: simpler, faster. HOSEK_WILKIE: ground-level accurate |

## Sky type comparison

| Model | Strengths | Weaknesses |
|---|---|---|
| `NISHITA` | Full sky + sun disc. Altitude parameter. Best horizon band | Slightly slower to evaluate |
| `HOSEK_WILKIE` | Analytically fitted to measurements. Very stable colours | No sun disc. No altitude |
| `PREETHAM` | Simple. Classic 2002 model. Fast | Inaccurate at low elevation angles |

## WebXR sky

The Nishita sky cannot be embedded in a GLB — it has no UV and is infinite.
For WebXR, use Three.js `Sky.js` (MIT) which implements the Preetham model,
or author a TSL shader using `uniform` nodes to drive turbidity and sun direction.
The golden-hour GLB snapshot exported by `blueprint.py` can be lit in Three.js
using `PMREMGenerator` with a `CubeCamera` pre-render of the Blender-authored sky.

## Cross-references

- Tutorial page: `/tutorials/blender-tutorial-shader-sky-nishita-sun-position-hdri-rig`
- Indirect lighting complement: `/tutorials/blender-tutorial-eevee-next-irradiance-sphere-probe`
- Cycles render setup: `/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh`
- Post-processing the sky render: `/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping`
