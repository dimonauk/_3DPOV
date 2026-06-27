# Sculpt Face Sets — Zone Masking & Pre-Retopology Planning (Blender 5.1)

**Category:** sculpting  
**Blender:** 5.1  
**Licence:** CC0  
**Export:** `sculpt_face_sets_zones.glb`

---

## What this is

A programmatic demonstration of Blender 5.1's **Sculpt Face Sets** system:
the `.sculpt_face_set` INT attribute on the FACE domain that partitions a
sculpted mesh into colour-coded regions for masking, hide/show, and retopology
zone planning.

The blueprint assigns four anatomical bands to a head-proxy UV sphere, derives
vertex colours from those zones, converts them to vertex groups for weight-paint
integration, and exports a GLB with the colour data intact for Three.js.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless-safe setup: zone assignment, vertex colours, vertex groups, GLB export |
| `record.py` | Orbiting viewport render (120 frames, 24 fps) → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the interactive `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

---

## Zone scheme

| ID | Name | Z range | Colour | Anatomy |
|----|------|---------|--------|---------|
| 1 | Cranial cap | Z > 0.20 m | red | Skull top |
| 2 | Facial plane | 0.025–0.20 m | green | Brow to upper lip |
| 3 | Jaw / neck | −0.15–0.025 m | blue | Jaw to lower neck |
| 4 | Base cap | Z < −0.15 m | amber | Occipital / base |

---

## How to run

```
blender --background --python blueprint.py
```

The script runs headless; it does not require a running Blender window.
The exported GLB is written to the same directory as the `.blend` file
(resolved via `//` prefix in the export path).

---

## Three.js consumption

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader = new GLTFLoader()
loader.load('sculpt_face_sets_zones.glb', (gltf) => {
  gltf.scene.traverse((child) => {
    if (child.isMesh) {
      // COLOR_0 accessor → geometry.attributes.color (Vector3)
      child.material = new THREE.MeshStandardMaterial({ vertexColors: true })
    }
  })
})
```

---

## Related tutorials

- [`/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh`](https://holoflow.co.uk/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh) — Dynamic Topology + Voxel Remesh
- [`/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb`](https://holoflow.co.uk/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb) — Multires normal baking
- [`/tutorials/blender-tutorial-retopology-polybuild-shrinkwrap`](https://holoflow.co.uk/tutorials/blender-tutorial-retopology-polybuild-shrinkwrap) — PolyBuild retopology
- [`/tutorials/blender-tutorial-vertex-colour-attributes`](https://holoflow.co.uk/tutorials/blender-tutorial-vertex-colour-attributes) — Vertex colour attributes
