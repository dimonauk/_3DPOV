# Curves-Based Hair Grooming — Blender 5.1

**Topic**: rigging / character  
**Blender version**: 5.1  
**Licence**: CC0  
**Tutorial route**: `/tutorials/blender-tutorial-curves-hair-grooming`

## What this produces

| File | Description |
|------|-------------|
| `hair_grooming_head.blend` | Head mesh + 44 seeded hair strands (curves), EEVEE Next |
| `hair_grooming_head.glb` | Head shell GLB — Draco-6, WebP |
| `viewport.mp4` | 3 s camera orbit rendered in EEVEE Next (run `record.py`) |
| `screen.mp4` | OBS screen capture — see `SCREEN-RECORDING-NOTES.md` |

## Running the blueprint

```bash
blender --background --python blueprint.py
```

Or paste into Blender → Scripting workspace → Run Script.

## Why Curves, not Particle Hair

Blender's old **Particle System > Hair** stored hair as a point cache baked
to the particle system object.  The bpy API for editing that cache was
complex, the data did not survive modifier evaluation, and it could not be
fed into Geometry Nodes pipelines.

The new **Curves** object stores each strand as a polyline in the same
attribute system as mesh geometry — `POINT` and `CURVE` domain, editable
via `foreach_set`, compatible with GN field operations, and renderable
natively in EEVEE Next via the Principled Hair BSDF.

## Ribbon conversion for WebXR / GLB

The Blender 5.1 glTF exporter has no hair primitive type.  To include hair
in a GLB:

1. Add a Plane object.
2. Add a **Geometry Nodes** modifier.
3. Build this tree:

```
Object Info (hair_strands)
  └─ Curve to Mesh
       ├─ [Curve]   Object Info.Geometry
       └─ [Profile] Quadrilateral (Width 0.004 × Height 0.001)
  └─ Set Material (hair_mat)
  └─ Group Output
```

4. **Apply Modifiers** when exporting.

This produces flat mesh strips (ribbons) along each strand that GLB/Three.js
can render normally.

## Three WebXR delivery strategies

| Strategy | GLB compatible | Physics |
|----------|---------------|---------|
| Mesh ribbons (GN Curve to Mesh) | ✓ | None (static) |
| Line primitives (Convert to Mesh) | ✓ as LineSegments | None |
| @pixiv/three-vrm spring bones | ✓ with .vrm export | Runtime Verlet |

Spring bone physics are the correct choice for interactive characters — see
the [VRM Spring Bones tutorial](/tutorials/blender-tutorial-vrm-spring-bones-hair-chain).

## Cross-references

- [VRM Spring Bones — Bone Collections + Hair-Chain Physics](/tutorials/blender-tutorial-vrm-spring-bones-hair-chain)
- [Armature & Weight Paint](/tutorials/blender-tutorial-armature-weight-paint)
- [EEVEE Next Toon Cel-Shader](/tutorials/blender-tutorial-eevee-toon-cel-shader)
- [Shape Keys & Morph Targets](/tutorials/blender-tutorial-shape-keys-morph-targets)
- [NLA Action Clips — VRM Character Animation](/tutorials/blender-tutorial-nla-action-clips-vrm)

## Outside sources

- Blender Manual — Curves Sculpting:
  <https://docs.blender.org/manual/en/latest/sculpt_paint/curves_sculpting/index.html>
  Blender Foundation, CC-BY-SA 4.0

- @pixiv/three-vrm (MIT, pixiv Inc.):
  <https://github.com/pixiv/three-vrm>
  The runtime that evaluates VRMC_springBone physics for VRM hair at near-zero cost.
