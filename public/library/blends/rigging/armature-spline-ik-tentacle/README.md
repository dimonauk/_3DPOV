# Armature Spline IK — Flexible Tentacle / Tendril Rig

**Blender 5.1 | CC0 | Holoflow Studio**

## What this builds

A ten-bone armature chain constrained to a Bezier curve via **Spline IK**.
A tapered tubular skin mesh with manual vertex-group weights deforms to follow
the chain.  The rig animates through three poses over 60 frames: rest S-curve,
prey-reach (lateral extension), and coiled curl.

## Why Spline IK

Spline IK is the correct tool whenever you need a chain of bones to conform to
an arbitrary curve shape — tentacles, hair strands, tails, spines, hoses, cables.
It distributes N bones along the curve's arc length, so the curve itself becomes
the animation control: move a Bezier handle and the entire chain follows.

Regular IK (CCD/iTaSC) solves for a single goal point; it cannot produce
smooth complex curvature without many intermediate target objects.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — creates rig, skin, material, animation, exports GLB |
| `record.py` | EEVEE render script — outputs `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |
| `tentacle_spline_ik.blend` | Saved by blueprint.py at runtime |
| `tentacle_skin.glb` | Draco-compressed static pose export |

## Running blueprint.py

```
blender --background --python blueprint.py
```

Or from inside Blender: Text Editor → Open → `blueprint.py` → Run Script.

## Expected outputs

- `tentacle_spline_ik.blend`
- `tentacle_skin.glb`
- `public/library/videos/rigging/armature-spline-ik-tentacle/viewport.mp4` (after record.py)
- `public/library/videos/rigging/armature-spline-ik-tentacle/screen.mp4` (after OBS session)

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `BONE_COUNT` | 10 | Joints in chain |
| `BONE_LENGTH` | 0.12 m | Length per segment |
| `BASE_RADIUS` | 0.042 m | Cross-section at root |
| `TIP_RADIUS` | 0.006 m | Cross-section at tip |
| `SKIN_RINGS` | 30 | Mesh loops for deformation |
| `CTRL_DIST` | 0.50 m | Bezier handle offset |

## Troubleshooting

**Chain doesn't follow the curve** — confirm the Spline IK constraint `target`
points to the Curve object (not the Armature or the skin mesh).  Check
`chain_count` equals `BONE_COUNT` (10).

**Mesh tears at bone junctions** — increase `SKIN_RINGS`.  Fewer than 2 rings
per bone causes visible pinching at every joint.

**GLB is T-pose** — expected.  Spline IK is a real-time constraint; it has no
glTF equivalent.  Use the depsgraph-snapshot approach in `export_glb()` for a
static deformed pose, or bake to keyframes for animation.

## Licence
CC0 — no rights reserved.
