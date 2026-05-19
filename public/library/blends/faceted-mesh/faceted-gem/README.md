# Faceted Gem — Library Entry

**Topic:** faceted-mesh · **Blender:** 5.1 · **Technique:** bmesh + flat normals + EEVEE Next glass

An 8-sided gem polyhedron built entirely from the `bmesh` API, flat-shaded so every facet reads as its own light-catching plane. The technique is the foundation of the Holoflow high-facet aesthetic: the same flat-normals pass that makes this gem sparkle is what makes every low-poly sculpture in the studio read as deliberate geometry rather than an unfinished smooth blob.

## Flat Normals — the one-line explanation

When smooth shading is on, Blender interpolates each vertex's normal across adjacent faces. Every face blends into its neighbour — the mesh reads as a smooth surface. When flat shading is on (`poly.use_smooth = False`), each face carries exactly one normal perpendicular to its own plane. Adjacent faces diverge; every facet catches light at its own angle. That divergence is the fire of a gemstone.

## Files in this entry

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene: gem mesh, EEVEE Next material, 3-point lighting, GLB export |
| `record.py` | Headless render: 150-frame rotation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` walkthrough |
| `.expected-artefacts.json` | Declares all expected outputs for CI artefact checks |

## Outputs

Running `blueprint.py` produces:
- `faceted_gem.blend` — Blender scene, saved alongside the script
- `faceted_gem.glb` — WebXR-ready binary glTF, Draco level 6, +Y up

Running `record.py` produces:
- `public/library/videos/faceted-mesh/faceted-gem/viewport.mp4`

## How to Run

```bash
# Interactive (opens Blender UI, runs script on startup)
blender --python blueprint.py

# Headless
blender --background --python blueprint.py

# Render the rotation video
blender --background --python record.py
```

## Blender 5.1 Specifics

- `mesh.use_auto_smooth` was removed in Blender 4.1. Flat shading in 5.x is set via `poly.use_smooth = False` directly on each polygon, or via the "Smooth by Angle" modifier for mixed surfaces.
- EEVEE Next (default renderer since 5.0) supports proper refractive transmission via `Transmission Weight` on the Principled BSDF. No workarounds needed.
- The `bmesh` API is context-independent — the script runs identically in the UI, in headless `--background` mode, and inside a Geometry Nodes Python Script node.

## Cross-references

### Studio

- [Low-poly high-facet shading — Article](/articles/low-poly-high-facet-shading) — the aesthetic theory behind flat normals
- [Cohesive low-poly cell-shaded VRM worlds — Article](/articles/cohesive-low-poly-cell-shaded-vrm-worlds) — where faceted meshes sit in the studio art direction
- [Blender to site asset pipeline — Tutorial](/tutorials/blender-to-site-asset-pipeline) — how the `.glb` from this entry moves into the WebXR scene
- [3D Print Toolbox — Tutorial](/tutorials/blender-addon-3d-print-toolbox) — add wall-thickness checks to this gem blueprint for print prep
- Studio WebXR exporter: `tools/blender-addon/holoflow_webxr_exporter/`
- Macro version: `tools/blender-addon/holoflow_macros/faceted_gem.py`

### External Sources

- **Blender Manual — bmesh API** · <https://docs.blender.org/api/current/bmesh.html>  
  Author: Blender Foundation · Licence: CC-BY-SA-4.0
- **Blender Manual — Mesh Normals** · <https://docs.blender.org/manual/en/latest/modeling/meshes/properties/object_data.html#normals>  
  Author: Blender Foundation · Licence: CC-BY-SA-4.0  
  Documents the removal of `use_auto_smooth` and the shift to the Smooth by Angle modifier.
- **Blender Manual source on GitHub** · <https://github.com/dfelinto/blender-manual>  
  Author: Blender Foundation contributors · Licence: CC-BY-SA-4.0  
  Useful for diffing what changed between 4.x and 5.x in the normals pipeline.
