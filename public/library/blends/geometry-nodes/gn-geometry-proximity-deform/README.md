# GN Geometry Proximity — Proximity-Driven Deformation Field

**Blender 5.1 · CC0 · Holoflow Studio**

A Geometry Nodes modifier that deforms a subdivided grid by querying the
nearest-surface distance to a secondary object.  No simulation zone, no bake —
the displacement dome evaluates analytically at every scrub position.

---

## Technique

The `GeometryNodeProximity` node (target_element = `FACES`) computes two outputs
for every vertex in the input mesh:

| Output | Type | Meaning |
|---|---|---|
| Position | Vector | Nearest point on the target's surface |
| Distance | Float | Euclidean distance to that point |

The **Distance** scalar drives a `MapRange` node (SMOOTHERSTEP,
from_min = 0, from_max = Influence Radius, to_min = 1, to_max = 0).
The resulting falloff is multiplied by **Max Depress**, negated, and packed into
a `(0, 0, −depress)` offset vector fed to `SetPosition`.

The influence sphere is a separate scene object referenced via `GeometryNodeObjectInfo`
(transform_space = RELATIVE) — meaning you can simply move the sphere in the
3D viewport to shift the deformation field in real time.

### Why SMOOTHERSTEP?

SMOOTHERSTEP uses a degree-5 polynomial with zero first *and* second derivatives
at both the 0 and 1 boundaries (C² continuity).  Vertices entering or leaving
the field boundary have zero velocity AND zero acceleration — no visible pop or
crease in the mesh surface even at coarse subdivision.  LINEAR interpolation
would produce a perfectly sharp tent seam at the boundary distance.

### Proximity vs Simulation Zone

| | Proximity Field | Simulation Zone |
|---|---|---|
| Memory of previous positions | ✗ none | ✓ per-frame state |
| Scrub-safe without baking | ✓ always | ✗ requires frame-by-frame advance |
| Real-time WebXR suitability | ✓ direct | ✗ export static snapshot only |
| Accumulating effects | ✗ | ✓ |

---

## Files

| File | Description |
|---|---|
| `blueprint.py` | Full bpy.data GN tree construction + GLB export |
| `record.py` | Sphere-descent animation + OpenGL viewport render |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `proximity_deform.blend` | Generated scene (run blueprint.py first) |
| `proximity_deform.glb` | Baked snapshot of the deformed grid (Draco 6) |

---

## Running

```bash
# Generate the .blend and .glb
blender --background --python blueprint.py

# Generate viewport.mp4 (requires proximity_deform.blend)
blender --background proximity_deform.blend --python record.py
```

---

## Parameters (modifier panel)

| Parameter | Default | Effect |
|---|---|---|
| Max Depress | 0.55 m | Peak −Z displacement at the sphere centre |
| Influence Radius | 1.10 m | Distance at which deform falls to zero |

Both are keyframable on the modifier panel.

---

## Cross-references

### Studio
- [GN Simulation Zone — Wave Reveal](/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal) — the stateful counterpart to this tutorial
- [VRM Spring Bones — Hair-Chain Physics](/tutorials/blender-tutorial-vrm-spring-bones-hair-chain) — a use case where proximity deform replaces spring simulation for WebXR cloth
- [Animation Drivers — Parametric Shader](/tutorials/blender-tutorial-animation-drivers-parametric-shader) — how to link object properties to shader sockets, complementing proximity fields
- [Cohesive Low-Poly, Cell-Shaded VRM Worlds](/articles/cohesive-low-poly-cell-shaded-vrm-worlds) — the studio aesthetic this deform technique serves

### Outside sources
- [Blender Manual: Geometry Proximity Node](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/geometry_proximity.html)
  CC-BY-SA 4.0 · Blender Documentation Team · [Blender source](https://projects.blender.org/blender/blender)
- [Blender Manual: Set Position Node](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/write/set_position.html)
  CC-BY-SA 4.0 · Blender Documentation Team
- [KhronosGroup/glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO)
  Apache-2.0 · Khronos Group · Related: [glTF 2.0 Specification](https://github.com/KhronosGroup/glTF)
