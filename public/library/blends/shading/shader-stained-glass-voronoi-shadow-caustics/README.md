# Shader — Procedural Stained Glass: Voronoi Cell Tint + Lead Lines + EEVEE Shadow Caustics

**Category**: shading  
**Blender version**: 5.1  
**Licence**: CC0  
**Tutorial page**: `/tutorials/blender-tutorial-shader-stained-glass-voronoi-shadow-caustics`

---

## What this builds

A full stained-glass window material built from a **single Voronoi Texture node** that
simultaneously provides:

- **Lead-line geometry** via the `DISTANCE_TO_EDGE` output (remapped through a
  ColorRamp to a sharp black-or-white mask)
- **Per-cell colour tint** via the `Color` output (random hue hash per cell, boosted
  to vivid church-window saturation via HueSaturation)

The two closures — an opaque oxidised-lead BSDF and a transmissive coloured-glass
BSDF — are blended using a **Mix Shader** (not Mix RGB), preserving the energy budget
of each closure.

The scene also demonstrates **EEVEE Next Shadow Caustics**: a Sun light set to
`shadow_caustics=True` projects a coloured tinted-light pattern on a stone floor
below the panel, approximating the warm colour pools that form on the nave floor of
a real cathedral on a sunny day.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene, material, light, camera, GLB export |
| `record.py` | Viewport animation: camera dolly + sun orbit (240 frames, EEVEE) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the human screen-recording pass |
| `.expected-artefacts.json` | Artefact manifest + cross-reference registry |

---

## How to run

Open Blender 5.1. In the Text Editor, open `blueprint.py` and press **Run Script**.
The script creates the scene and writes `stained_glass_panel.glb` alongside the blend.

For the viewport recording, run `record.py` after `blueprint.py`.  The 240-frame
animation renders at 1920 × 1080 using EEVEE Next.

---

## GLB export notes

The exported GLB uses **KHR_materials_transmission** (automatically included by the
Blender glTF exporter when `Transmission Weight > 0`).  Viewer support:

- Three.js r152+: requires `MeshPhysicalMaterial` with `transmission` and
  `KHR_materials_transmission` loader.
- Babylon.js 6.x+: supported natively.
- model-viewer 1.12+: supported.

For WebXR deployment, test in the target viewer — some runtimes disable transmission
for performance.  A baked-texture fallback (flat tinted RGBA texture) is recommended
for mobile XR headsets.

---

## Variants

- **Circular rose window**: change the Voronoi coordinate source from UV to a
  polar-mapped version (`atan2(y, x)` + `sqrt(x²+y²)`) for concentric ring cells.
- **Gothic lancet arch**: Boolean-subtract an arch profile from the panel mesh before
  applying the material — the lead pattern continues through the Boolean seamlessly.
- **Cathedral interior scene**: duplicate the panel 6× into pointed arches, add an
  interior stone room, set the Sun to a low winter angle, and let the caustics paint
  long coloured shafts across the floor.

---

## Studio connections

This material complements the studio's faceted/cel-shading aesthetic — the hard
lead lines visually rhyme with flat-shaded facet edges.  For WebXR, the
KHR_materials_transmission export path is the same as used in the faceted gem pipeline.
