# Modifier — Wireframe: Edge-Tube Neon Skeleton

**Blender 5.1 · CC0-1.0 · Holoflow Studio**

Converts every edge of a mesh into a four-sided tube using the Wireframe
modifier. Demonstrates two modes: `use_replace=True` (pure geodesic skeleton)
and `use_replace=False` with `material_offset=1` (hybrid solid+wire panel).

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds two objects, exports `wire_skeleton.glb` |
| `record.py` | 8 s 180° orbit render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest + cross-references |

## Usage

```bash
# Build scene and export GLB
blender --background --python blueprint.py

# Record viewport animation (open .blend first)
blender wire_sphere.blend --python record.py
```

## Key parameters

```python
mod = obj.modifiers.new("Wireframe", 'WIREFRAME')
mod.thickness        = 0.04    # tube radius in world units
mod.use_even_offset  = True    # clean vertex joints (bisecting-plane clipping)
mod.use_relative     = False   # absolute thickness on every edge
mod.use_boundary     = True    # include open boundary edges
mod.use_replace      = True    # remove source faces (pure skeleton)
mod.material_offset  = 1       # shift tube faces to material slot N+1
```

## Cross-references

- [Solidify: wall thickness + rim material slots](/tutorials/blender-tutorial-modifier-solidify-shell-architecture-3d-print)
- [Boolean + modifier stack ordering](/tutorials/blender-tutorial-modifier-boolean-exact-hard-surface-trim)
- [Decimate LOD for WebXR](/tutorials/blender-tutorial-modifier-decimate-lod-webxr-planar-collapse)
- [Holographic Panel emission shader](/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel)
- [EEVEE Toon cel shading](/tutorials/blender-tutorial-eevee-toon-cel-shader)

## External sources

- **Blender Manual — Wireframe Modifier** · CC-BY-SA-4.0 · Blender Foundation
  <https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/wireframe.html>
- **three.js WireframeGeometry** · MIT · mrdoob
  <https://github.com/mrdoob/three.js/blob/dev/src/geometries/WireframeGeometry.js>
