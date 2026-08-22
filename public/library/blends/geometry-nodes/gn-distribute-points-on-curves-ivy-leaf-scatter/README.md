# GN Distribute Points on Curves — Ivy Leaf Scatter

**Blender 5.1 | Geometry Nodes | CC0 | Holoflow Studio**

Stochastic density-based leaf instancing along a climbing Bézier vine, built entirely in Geometry Nodes.  `Distribute Points on Curves` places leaf attachment points randomly — unlike the equal-interval `Curve to Points` — using a Poisson-disk minimum distance to prevent leaves from overlapping.  The vine stem runs as a parallel branch via `Curve to Mesh`.  Leaf size tapers from base to tip via the node's `Parameter` output.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene builder + GLB exporter |
| `record.py` | 120-frame viewport animation (density grow-in) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Expected output

`output/ivy_leaf_scatter.glb` — vine stem + ~12 leaf quads, ~128 verts, ~10 KB (Draco 6, Y-up, WEBP)

## Key nodes

| Node | Role |
|---|---|
| `GeometryNodeDistributePointsOnCurves` | Random density scatter on curve |
| `GeometryNodeCurveToMesh` | Vine stem tube |
| `GeometryNodeMeshGrid` | Single leaf quad per instance |
| `FunctionNodeAlignEulerToVector` | Orient leaf face to curve Normal |
| `FunctionNodeRotateEuler` | Add random spin around Tangent axis |
| `ShaderNodeMapRange` | Taper leaf scale via Parameter 0→1 |
| `GeometryNodeRealizeInstances` | Flatten before GLB export |

## Parameters (modifier sockets)

| Socket | Default | Effect |
|---|---|---|
| `Leaf Density` | 5.0 | Leaves per metre of vine |
| `Min Distance` | 0.13 m | Poisson-disk guard (prevent overlap) |
| `Seed` | 42 | Distribution randomness seed |
| `Leaf Width` | 0.18 m | Quad width at base (tapers to tip) |
| `Leaf Height` | 0.12 m | Quad height |

## WebXR integration

```js
// Three.js r160+ (Draco loader required)
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader }  from 'three/examples/jsm/loaders/GLTFLoader.js'

const draco = new DRACOLoader()
draco.setDecoderPath('/draco/')
const loader = new GLTFLoader()
loader.setDRACOLoader(draco)
loader.load('/library/glbs/geometry-nodes/gn-distribute-points-on-curves-ivy-leaf-scatter/ivy_leaf_scatter.glb', gltf => {
  scene.add(gltf.scene)
})
```

`holoflow:facet` flag: set to `false` for this prop (leaf quads should shade smoothly).

## Licence

All authored files in this directory are released under CC0.
Outside references credited in `.expected-artefacts.json` and in the tutorial component.
