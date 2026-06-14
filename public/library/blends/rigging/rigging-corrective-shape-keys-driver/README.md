# Corrective Shape Keys + Rotation-Driven Driver

**Blender 5.1 | rigging | CC0**

---

## What this is

A two-bone cylindrical arm rig that demonstrates how to fix joint deformation
collapse with a corrective shape key driven by bone rotation.

Running `blueprint.py` builds:
- A cylindrical arm mesh with elbow-region loop cuts
- A two-bone armature (`upper_arm`, `forearm`) skinned with automatic weights
- A shape key (`elbow_corrective`) that pushes posterior-elbow vertices outward
  in rest space
- A TRANSFORMS driver wiring the forearm's local-X rotation angle (0° → −90°)
  to the shape key value (0 → 1)

---

## Why corrective shape keys exist

Automatic skinning linearly blends bone transformations per vertex.  At a
joint with two bones pulling in very different directions, the blended position
moves *inward* — toward the chord between the two bone endpoints — rather than
maintaining volume.  For an elbow at 90° this is roughly a 60-80% volume loss
visible as a pinch.

A corrective shape key is authored in **rest space** (before the armature
deforms the mesh).  It adds extra geometry volume in the region most affected.
When the bone bends, that extra volume is carried through the deformation,
compensating for the linear-blend collapse.

---

## Tuning parameters

| Constant | File | Effect |
|---|---|---|
| `CORRECTION_MAGNITUDE` | `blueprint.py` | How far elbow verts are pushed; increase if collapse persists at 90° |
| `BLEND_WEIGHT_BAND` | `blueprint.py` | Which blend fractions are considered "elbow"; narrow if correction bleeds too far |
| Driver expression | shape key driver | Replace `1.5708` (90°) with the angle (radians) at which collapse is worst |

---

## Expected artefacts

See `.expected-artefacts.json`.

---

## External references

- Blender Manual — Shape Keys: https://docs.blender.org/manual/en/latest/animation/shape_keys/introduction.html
- Blender Manual — Drivers: https://docs.blender.org/manual/en/latest/animation/drivers/introduction.html
- SkinningTools (MIT): https://github.com/nielsvaes/SkinningTools
