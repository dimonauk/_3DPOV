# hf_shrinkwrap_decal — ShrinkwrapModifier Surface Project & Decal Conform

## What this is

A Python blueprint (`blueprint.py`) that conforms a flat UV-mapped quad to an
irregular noise-displaced dome surface using `bpy.types.ShrinkwrapModifier` in
PROJECT mode.  The result is a WebXR ground-marker decal that sits flush against
any curved surface, lifted 0.002 m along the local hit normal to prevent
Z-fighting in Three.js or Babylon.js.

## Technique in brief

| Step | What happens |
|------|-------------|
| 1 | Icosphere half-dome built, CLOUDS noise displacement applied. |
| 2 | Flat quad (8×8 subdivisions, 81 verts) placed above dome apex. |
| 3 | `ShrinkwrapModifier(PROJECT, -Z, ABOVE_SURFACE, offset=0.002)` applied. |
| 4 | `recalc_face_normals` corrects post-conform normals. |
| 5 | Emissive teal material added (blend_method='BLEND', shadow='NONE'). |
| 6 | Both objects exported as Draco-compressed GLB. |

## Why subdivide the decal before shrinkwrap

PROJECT mode projects each vertex independently.  A flat quad has only 4 verts;
interior faces stay flat even after the corners are projected.  Eight subdivisions
per side give 81 verts — each is projected to its own hit point — producing a
smoothly draped surface over any curvature within the 0.32 m decal extent.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full runnable bpy script (Blender 5.1) |
| `record.py` | Viewport turntable animation render |
| `SCREEN-RECORDING-NOTES.md` | OBS setup + capture steps |
| `.expected-artefacts.json` | Artefact + cross-reference manifest |

## Artefacts produced

- `hf_shrinkwrap_decal.blend` — saved scene (dome + conformed decal)
- `hf_shrinkwrap_decal.glb` — WebXR-ready GLB (Draco L6, WebP, +Y up)
- `videos/scripting/…/viewport.mp4` — Workbench turntable, 1920×1080 24 fps

## Licence

CC0 — public domain.  Outside attribution in tutorial tsx.
