# GN Curve Spiral — Parametric Helical Spring (Blender 5.1)

**Topic:** Geometry Nodes — Curve Primitives  
**Slug:** `gn-curve-spiral-helical-spring-webxr`  
**Licence:** CC0  
**Blender version:** 5.1  

---

## What this teaches

The `Spiral` curve node (`GeometryNodeCurveSpiral`) generates a helix directly in
Geometry Nodes from six scalar parameters. Piped through `Curve to Mesh` with a circle
profile it produces a solid spring wire in three to five nodes — no Screw modifier, no
manual Bezier coiling, no add-on.

Three spring archetypes share the same GN tree, differing only in parameter values:

| Archetype       | Start Radius | End Radius | Height    |
|-----------------|-------------|-----------|-----------|
| Compression     | 1.0         | 1.0       | natural   |
| Volute/conical  | 1.2         | 0.4       | as needed |
| Tension         | 1.0         | 1.0       | × 1.5     |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy GN-tree build + GLB export |
| `record.py` | 360° rotation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `spring_coil.blend` | Saved Blender file (after running blueprint.py) |
| `spring_coil.glb` | WebXR-ready GLB with Draco compression |

## Run

```bash
# Generate blend + GLB
blender --background --python blueprint.py

# Record viewport animation
blender --background --python record.py
```

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `SPRING_ROTATIONS` | 8.0 | Coil count; float allows partial final turn |
| `SPRING_RESOLUTION` | 32 | Control points per rotation; 16 for draft, 64 for hero |
| `SPRING_START_R / END_R` | 1.0 | Helix radius; differ for conical spring |
| `SPRING_HEIGHT` | 4.0 | Total Z span (m) |
| `SPRING_REVERSE` | False | Left/right-hand chirality toggle |
| `WIRE_RADIUS` | 0.12 | Cross-section circle radius (wire gauge) |
| `WIRE_SEGMENTS` | 12 | Wire polygon sides; 12 looks round in WebXR |

## Related tutorials

- `/tutorials/blender-tutorial-gn-curve-to-mesh` — Curve to Mesh profile extrusion
- `/tutorials/blender-tutorial-gn-fillet-curve-neon-sign` — rounding curve corners
- `/tutorials/blender-tutorial-modifier-screw-revolve-column` — modifier-based helix approach
- `/tutorials/blender-tutorial-vrm-spring-bones-hair-chain` — VRM spring bone application

## Outside sources

1. [Blender Manual — Spiral Node](https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/primitives/spiral.html) — CC-BY-SA 4.0 · Blender Documentation Team
2. [Wikipedia — Helix](https://en.wikipedia.org/wiki/Helix) — CC-BY-SA 3.0 · Wikipedia contributors
3. [Three.js CatmullRomCurve3](https://github.com/mrdoob/three.js/blob/dev/src/extras/curves/CatmullRomCurve3.js) — MIT · mrdoob / three.js contributors
