# Geo-Nodes Low-Poly Terrain

**Topic:** Terrain · **Blender version:** 5.1  
**Technique:** Geometry Nodes procedural displacement + flat shading  
**Output:** `terrain_low_poly.glb` — 400 faces, Draco-compressed, +Y up  

---

## What this produces

A faceted 10 m × 10 m terrain tile displaced by 3D Perlin noise, flat-shaded
for the hard-edge look the studio uses across WebXR scenes and VRM environments.
The GN modifier stays live in the .blend — sliders in the modifier panel control
height amplitude, noise frequency, and fractal roughness in real time.

The GLB is ~18 KB Draco-compressed and loads cleanly in `three.js` / `@react-three/fiber`
with `GLTFLoader`. It does not carry a skeleton or morph targets.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the scene + GN modifier programmatically; run once |
| `record.py` | Viewport-animation recorder → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest for the holoflow content pipeline |

Generated artefacts (not in git):

| Artefact | Location |
|---|---|
| `terrain_low_poly.blend` | `public/library/blends/terrain/geo-nodes-low-poly-terrain/` |
| `terrain_low_poly.glb` | `public/library/glbs/terrain/geo-nodes-low-poly-terrain/` |
| `viewport.mp4` | `public/library/videos/terrain/geo-nodes-low-poly-terrain/` |
| `screen.mp4` | `public/library/videos/terrain/geo-nodes-low-poly-terrain/` |

---

## Running blueprint.py

```
Blender → Scripting workspace → Open → blueprint.py → Alt+R
```

Adjust the constants block at the top before running:

```python
GRID_SUBDIV      = 20    # increase for denser terrain; ≥40 slows Quest 3
HEIGHT_SCALE_DEF = 2.0   # metres; reduce for flatter plains
NOISE_SCALE_DEF  = 3.5   # raise for narrower ridges
NOISE_ROUGH_DEF  = 0.65  # 0.5 = gentle, 0.9 = crumpled
```

After running, tune interactively via Properties → Modifier Properties →
HoloflowTerrain panel sliders.  No re-run needed.

---

## Exporting the GLB

Uncomment the `export_glb(obj)` call at the bottom of `blueprint.py` and re-run,
**or** manually:

```
File → Export → glTF 2.0 (.glb/.gltf)
  ✓ Apply Modifiers
  ✓ Draco compression (level 6)
  ✓ +Y Up
  Format: GLB
  Selection only: ✓
```

Three.js usage:

```js
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
const draco = new DRACOLoader().setDecoderPath("/draco/");
const loader = new GLTFLoader().setDRACOLoader(draco);
const { scene } = await loader.loadAsync("/library/glbs/terrain/geo-nodes-low-poly-terrain/terrain_low_poly.glb");
```

---

## Outside sources

- **Blender Manual — Geometry Nodes / Set Position**  
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html  
  Licence: CC-BY-SA 4.0 · Authors: Blender Foundation

- **Blender Manual — Noise Texture (Shader / GN)**  
  https://docs.blender.org/manual/en/latest/render/shader_nodes/textures/noise.html  
  Licence: CC-BY-SA 4.0 · Authors: Blender Foundation

---

## Studio cross-references

- Tutorial: [Blender to Site Asset Pipeline](/tutorials/blender-to-site-asset-pipeline)
- Article: [Low-Poly High-Facet Shading](/articles/low-poly-high-facet-shading)
- Article: [Cohesive Low-Poly Cell-Shaded VRM Worlds](/articles/cohesive-low-poly-cell-shaded-vrm-worlds)
- Atelier: [Scene Stage Demo](/atelier/scene-stage-demo)
