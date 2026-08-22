# Ocean Modifier + Water Surface Shader — Fourier Sea with Jacobian Foam

**Blender 5.1 | CC0 | Holoflow Studio**

Synthesises a physically-based open-ocean surface using Blender's iFFT-driven
Ocean modifier, paired with a Principled BSDF water material that reads the
built-in Jacobian foam vertex attribute via `ShaderNodeAttribute`.

## Technique summary

| Element | Detail |
|---|---|
| Spectrum | MAXJORNER (Max-Jonswap open-ocean) |
| Resolution | 7 → 128 × 128 vertex iFFT grid |
| Choppiness | 1.5 — Jacobian XY deformation toward crests; foam at det(J) < 0 |
| Time driver | `frame / 25` scripted expression — wave motion tied to frame counter |
| Water BSDF | Principled, IOR=1.333, Transmission=0.92, Coat Weight=0.45 |
| Foam mask | `ShaderNodeAttribute(foam)` → Mix Shader → white Emission × 2.2 |
| Micro-ripple | Noise Texture Scale=14 → Bump node (sub-metre wind ripples) |
| EEVEE Next | SSR + SSR refraction; GTAO for trough depth |
| GLB export | `export_apply=True` at frame 60; `foam` → `_FOAM` vertex accessor |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene build — Ocean modifier, water material, camera, sun |
| `record.py` | EEVEE animation render → `viewport.mp4` (300 frames / 12 s) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest with cross-reference links |

## Quickstart

```bash
# 1. Run blueprint to build the scene
blender --python blueprint.py

# 2. Then inside the Blender session, uncomment export_glb() and re-run
#    to write ocean_surface.glb

# 3. Render the viewport animation:
blender --python record.py
```

## Outside sources

| Source | Licence | Author |
|---|---|---|
| [Blender Manual — Ocean Simulation](https://docs.blender.org/manual/en/latest/physics/ocean_simulation.html) | CC-BY-SA 4.0 | Blender Documentation Team |
| [Three.js webgl_shaders_ocean.html](https://github.com/mrdoob/three.js/blob/dev/examples/webgl_shaders_ocean.html) | MIT | mrdoob et al. |
| [David Li — GLSL fluid / ocean](http://david.li/fluid) | MIT | David Li (upstream GLSL ocean shader referenced by Three.js) |

## Cross-references (internal)

- [Cycles Adaptive Subdivision + Displacement](/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision)
- [GN Raycast Terrain Decal Scatter](/tutorials/blender-tutorial-gn-raycast-terrain-decal-scatter)
- [EEVEE Next Reflection Plane Mirror Floor](/tutorials/blender-tutorial-eevee-next-reflection-plane-mirror-floor)
- [Mantaflow FLIP Liquid Dam Break](/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break)
- [Shader — Principled Volume Fog Column](/tutorials/blender-tutorial-shader-principled-volume-fog-column)
