# Cycles Panoramic Equirectangular Camera — 360° HDR Environment Map for WebXR
**Blender 5.1 · Licence: CC0**

## What this does
Renders a full-sphere 360° HDR environment map from a Cycles panoramic camera,
denoises it with Intel OIDN using albedo + normal feature buffers, and outputs
a 32-bit EXR ready for use as a WebXR skybox or IBL (image-based lighting) probe.

The equirectangular projection is the exact format expected by:
- `three.js` `EquirectangularReflectionMapping`
- `@react-three/drei` `<Environment files="panoramic_360.hdr" />`
- `KHR_lights_punctual` environment lighting in glTF 2.0

## Files
| File | Purpose |
|---|---|
| `blueprint.py` | Full automated pipeline — scene build + render settings + compositor |
| `record.py` | Viewport animation script for screen recording |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar recording instructions |
| `.expected-artefacts.json` | Machine-readable cross-reference registry |

## Key parameters (blueprint.py)
| Constant | Default | Notes |
|---|---|---|
| `RES_X, RES_Y` | 4096, 2048 | 2:1 aspect ratio is mandatory |
| `SAMPLES` | 128 | OIDN elevates effective quality to ~512+ |
| `CAMERA_Z` | 1.60 m | Eye-level; change for aerial capture |
| `LAT_MIN/MAX` | −90°/90° | Full sphere; crop for partial capture |
| `LON_MIN/MAX` | −180°/180° | Full sphere |
| `SKY_STRENGTH` | 0.6 | Reduce if scene is too bright in WebXR |

## Usage in three.js / WebXR
```js
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
const pmremGenerator = new THREE.PMREMGenerator(renderer)
pmremGenerator.compileEquirectangularShader()
new RGBELoader().load('panoramic_360.hdr', (texture) => {
  const env = pmremGenerator.fromEquirectangular(texture).texture
  scene.environment = env   // IBL lighting
  scene.background  = env   // visible skybox
  texture.dispose()
  pmremGenerator.dispose()
})
```

## Troubleshooting
| Symptom | Cause | Fix |
|---|---|---|
| Seam visible at ±180° longitude | Camera not at scene origin | Move camera to (0,0,CAMERA_Z) |
| Black poles in render | `latitude_min/max` set in degrees, not radians | Use `math.radians(±90)` in bpy |
| OIDN node produces no change | `use_hdr=True` not set | Enable HDR checkbox on Denoise node |
| three.js scene too bright | WebXR renderer tone-maps HDRI at full strength | Set `renderer.toneMapping = THREE.ACESFilmicToneMapping` |

## Outside sources
- [Blender Manual — Panoramic Camera](https://docs.blender.org/manual/en/5.1/render/cameras/camera_types.html) — CC-BY-SA 4.0, Blender Foundation
- [pmndrs/drei Environment](https://github.com/pmndrs/drei) — MIT licence, Paul Henschel et al.
- [mrdoob/three.js RGBELoader](https://github.com/mrdoob/three.js) — MIT licence, three.js authors
