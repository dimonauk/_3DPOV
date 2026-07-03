# GN Self Object — World-Height Proximity Crystal
**Blender 5.1 · Geometry Nodes · CC0**

A faceted icosphere whose face scale and emission colour are driven by
each face's *world-space height* — computed live inside the GN tree using
`GeometryNodeSelfObject`.  Move the object up or down in the scene and the
glow band slides through it in real-time, no bake required.

## Key technique

`GeometryNodeSelfObject` outputs a reference to the modifier's own object.
Feeding that into `GeometryNodeObjectInfo(transform_space='ORIGINAL')` gives
the object's world-space `Location`.  Adding local `Position.Z` (from
`GeometryNodeInputPosition`) yields an approximate world Z per face centre —
valid for objects with zero rotation.

The resulting scalar is stored as a named float attribute `proximity_t` on the
`POINT` domain, then read back in the emission material via
`ShaderNodeAttribute(attribute_name='proximity_t', attribute_type='GEOMETRY')`.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python build script — run in Scripting workspace |
| `record.py` | Viewport animation render (run after blueprint.py) |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS screen-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Expected GLB output

`crystal_proximity.glb` — Draco 6, +Y up, WebP textures, ~30 KB.
The `proximity_t` vertex attribute is preserved in the GLB via
`export_attributes=True`; Three.js reads it as
`geometry.attributes['proximity_t']`.

## Rotation caveat

The `local_z + obj.location.z` approximation breaks when the object is
rotated.  For a fully correct world-space position transform, use:

```
Self Object → Object Info(ORIGINAL).Matrix → FunctionNodeTransformPoint(pos, matrix)
```

`FunctionNodeTransformPoint` is available in Blender 5.1 under
*Utilities → Matrix → Transform Point*.  The blueprint uses the approximation
intentionally — it keeps the node graph readable while covering the correct
Self Object → Object Info → Location chain.

## Outside sources

- Blender Manual — Self Object node  
  <https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/self_object.html>  
  CC-BY-SA 4.0 · Blender Foundation · sibling: github.com/blender/blender

- njanakiev/blender-scripting — object-transform examples  
  <https://github.com/njanakiev/blender-scripting>  
  MIT · Nikolai Janakiev · siblings: njanakiev/scikit-spatial, njanakiev/python-snippets
