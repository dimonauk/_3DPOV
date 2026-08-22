# WireframeModifier — Toon Ink Geometry Bake for WebXR

**Blender 5.1 · bpy.types.WireframeModifier · CC0**

Converts every edge of a mesh into a flat quad tube using Blender's built-in
`WireframeModifier`, then exports both the fill mesh and the wire mesh as
separate objects in one GLB.  The result renders as cel-animation ink lines in
any WebXR runtime without requiring Freestyle, line rendering passes, or GPU
extensions.

## Why bake to geometry

Three.js, Babylon.js, and PlayCanvas have no Freestyle equivalent.  Line
rendering in WebXR historically uses `THREE.EdgesGeometry` or `THREE.LineSegments`,
which are 1-pixel thick and ignore depth-bias — they vanish at oblique angles.
WireframeModifier produces real quads: they have normals, they accept materials,
they respect depth, and they travel cleanly through GLB → Draco compression.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Headless bpy script — builds fill + wire objects, exports `hf_wireframe_toon.glb` |
| `record.py` | Orbiting camera render — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Key parameters

- `WIRE_THICKNESS = 0.0095` — absolute tube half-width in metres (~1.6 % of object radius)
- `use_even_offset = True` — uniform line weight regardless of local edge length variation
- `material_offset = 1` — wire quads land in material slot 1 (mat_wire)
- `use_boundary = True` — include open boundary edges for clean mesh borders

## Export

```
hf_wireframe_toon.glb
  └─ hf_fill   (mat: hf_fill, slot 0)
  └─ hf_wire   (mat: hf_wire, slot 1)
```

In Three.js, prevent Z-fighting on the wire mesh with:
```js
wireMesh.material.polygonOffset        = true;
wireMesh.material.polygonOffsetFactor  = -1;
wireMesh.material.polygonOffsetUnits   = -1;
```

## Licence

Blueprint, record script, and all authored files: **CC0 1.0 Universal**.
Outside technique reference: Blender Manual Wireframe Modifier, CC-BY-SA 4.0,
Blender Foundation — https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/wireframe.html
