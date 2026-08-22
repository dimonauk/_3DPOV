# GN Fillet Curve — Procedural Rounded-Corner Neon Star Sign

**Blender 5.1 | CC0 | Geometry Nodes**

Demonstrates the **Fillet Curve** node: it inserts a smooth circular arc at every
kink of a spline. BEZIER mode creates proper bezier handles; POLY mode subdivides
around the corner. This blueprint uses a 6-point star (12 corners total) — the sharp
inner valleys and outer spikes become smooth neon-tube arcs after filleting.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — builds GN tree, material, camera, saves `.blend` + `.glb` |
| `record.py` | Animates `Fillet_Radius` 0→0.22→0 for the viewport `.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen recording |
| `.expected-artefacts.json` | CI manifest: expected output files + cross-references |

## Pipeline

```
Star primitive (6pt)
  └─ Fillet Curve (BEZIER, Radius=0.22)
       └─ Resample Curve (COUNT=160)
            └─ Curve to Mesh + Circle profile (r=0.028)
                 └─ Set Shade Smooth
                      └─ Set Material (neon_emissive_mat)
```

## Running

```bash
blender --background --python blueprint.py
# Outputs: neon_sign.blend, neon_sign.glb

# Then, in Blender with the .blend open:
blender neon_sign.blend --background --python record.py
# Outputs: public/library/videos/.../viewport.mp4
```

## Key parameters

| Socket | Default | Effect |
|---|---|---|
| `Fillet_Radius` | 0.22 | Corner arc radius — 0 = sharp kinks, 0.42 = fully rounded |
| `Resample_Count` | 160 | Evaluated points — raise for smoother tube silhouette |
| `Tube_Radius` | 0.028 | Neon tube cross-section radius |

## Outside sources

- **Blender Manual — Fillet Curve node**
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/fillet_curve.html
  Licence: CC-BY-SA 4.0 — Blender Documentation Team

- **njanakiev/blender-scripting**
  https://github.com/njanakiev/blender-scripting
  Licence: MIT — Nicolas Janakiev

- **KhronosGroup/glTF-Blender-IO**
  https://github.com/KhronosGroup/glTF-Blender-IO
  Licence: Apache-2.0 — Khronos Group

## Tutorial

`/tutorials/blender-tutorial-gn-fillet-curve-neon-sign`
