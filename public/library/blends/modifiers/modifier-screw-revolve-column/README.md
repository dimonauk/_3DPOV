# Modifier — Screw: Lathe-Style Revolution Surface
**Blender 5.1 | CC0 | Topic: modifiers**

Creates a Doric column (base torus → entasis shaft → echinus capital → abacus
slab) by sweeping a 10-vertex edge-chain profile 360° around the Z axis with
the Screw modifier. The same parameters, with `SCREW_PITCH > 0`, produce a
helical spring without changing anything else.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene construction — run in Blender Text Editor |
| `record.py` | Automated viewport animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `column_capital.blend` | Saved .blend (run blueprint.py to regenerate) |
| `column_capital.glb` | Draco 6, Y-up, WebP — ready for WebXR |

## Technique summary

```
Profile (edge chain in XZ plane)
  ↓  Screw modifier  (axis=Z, steps=48, merge=True, pitch=0)
Solid of revolution mesh
  ↓  SubDiv (Catmull-Clark, levels=2)
Smooth column geometry
  ↓  export_scene.gltf (export_apply=True)
column_capital.glb
```

The Screw modifier parameter `steps` is the primary LOD control — 12 for
background/distant objects, 48 for foreground or print-ready. SubDiv is
additive smoothness on top; the two are independent knobs.

## Helix mode

Set `SCREW_PITCH = 0.06` and `HELIX_TURNS = 4` (modify `scr.screw_offset`
and `scr.iterations` in the modifier) to convert the column into a helical
coil. The profile shape is preserved; only the offset along the axis changes
as the revolution proceeds.

## Proportions

Doric proportions from Vitruvius *De Architectura* Book III:
- Base diameter D = 0.44 m (2 × `BASE_RADIUS`)
- Shaft height ≈ 5.5D = 2.4 m (`COLUMN_HEIGHT`)
- Entasis peak at 1/3 height, +7% of shaft radius

## Cross-references

- [Modifier SubDiv + Crease + Bevel Weight](/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface)
- [Shader — Procedural Marble Veins](/tutorials/blender-tutorial-shader-procedural-marble-veins)
- [GN Curve to Mesh](/tutorials/blender-tutorial-gn-curve-to-mesh)
- [Python Batch GLB Exporter](/tutorials/blender-tutorial-python-batch-glb-exporter)

## Outside sources

- [Blender Manual — Screw Modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/screw.html)
  CC-BY-SA-4.0 — Blender Documentation Team
- [blender-scripting](https://github.com/njanakiev/blender-scripting)
  MIT — Nikolai Janakiev
