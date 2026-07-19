# bmesh.ops.convex_hull — Crystal Gem & Collision Proxy

**Blender 5.1 · Python API · CC0**

Three demonstrations of `bmesh.ops.convex_hull`:

| Object | Technique | Studio use |
|---|---|---|
| `hf_crystal_gem` | 56-point fibonacci sphere → hull | Faceted gem props for WebXR |
| `hf_organic_hipoly` | Subdivided ico + sinusoidal normal displacement | Stand-in for sculpted hi-poly |
| `hf_collision_proxy` | Hull of organic source verts | Physics collider for Cannon.js / Rapier |

## Key Concepts

- **`geom_interior` must be deleted** after every `convex_hull` call or interior elements cause non-manifold edges and duplicate normals in the exported GLB.
- The `use_existing_faces=False` flag prevents the operator from reusing source topology — always set it when feeding a full mesh rather than a bare point cloud.
- Fibonacci sphere sampling gives uniform angular coverage without polar bunching; squish on Z shapes the gem habit (oblate vs prolate).
- Custom property `hf:collision_proxy = True` is written into the GLB's extras object so the Three.js loader can route it to a physics engine.

## Running

```
blender --background --python blueprint.py
```

Outputs `hf_convex_gem.blend` and `hf_convex_gem.glb` in the repo root under `public/library/blends/geometry/…`.

For the viewport render:

```
blender --background --python record.py
```

Outputs `viewport.mp4` under `public/library/videos/geometry/…`.

## External Sources

- Blender Python API — `bmesh.ops` reference: <https://docs.blender.org/api/5.1/bmesh.ops.html> (CC-BY-SA-4.0, Blender Foundation)
- Blender Manual — Convex Hull: <https://docs.blender.org/manual/en/latest/modeling/meshes/editing/edge/convex_hull.html> (CC-BY-SA-4.0, Blender Documentation Team)
- glTF-Blender-IO (Khronos): <https://github.com/KhronosGroup/glTF-Blender-IO> (Apache-2.0)
