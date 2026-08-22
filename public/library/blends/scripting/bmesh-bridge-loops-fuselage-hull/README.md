# bmesh bridge_loops — Fuselage Hull from Stacked Profile Rings
## Blender 5.1 · CC0

Builds a low-poly sci-fi fuselage hull entirely in Python using
`bmesh.ops.bridge_loops`.  The technique is data-driven: eight `(z, radius)`
tuples in `PROFILE` define the silhouette; bridge_loops fills each adjacent
pair with a quad strip.  Change the profile and re-run — no viewport editing
required.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Build + export script (run in Blender 5.1 Scripting workspace) |
| `record.py` | 60-frame EEVEE turntable render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `fuselage_hull.blend` | Generated scene (created by `blueprint.py`) |
| `fuselage_hull.glb` | WebXR-ready export (Draco L6, WebP, +Y up) |

---

## Quickstart

```
1. Open Blender 5.1.
2. Scripting workspace → Open → blueprint.py → Run Script.
3. [holoflow] .blend and GLB paths printed in the console.
4. Open record.py → Run Script to render viewport.mp4.
```

---

## Key parameters

| Constant | Default | Effect |
|---|---|---|
| `PROFILE` | 8-ring fuselage | `(z, radius)` tuples — edit to reshape silhouette |
| `SEGMENTS` | 16 | Vertices per ring — identical across all rings |
| `COL_HULL` | dark gunmetal | Base colour of the Principled BSDF |
| `EMIT_STR` | 2.5 | Engine-glow emission strength |

---

## Blender 5.1 API notes

- `bmesh.ops.create_circle(cap_ends=False)` — produces an open ring on the XY
  plane at origin; translate `verts` along Z immediately after creation.
- `bmesh.ops.bridge_loops(use_cyclic=True)` — **must** be True for closed
  rings; without it, bridge_loops treats each ring as an open chain and leaves
  a single quad-wide gap.
- `bmesh.ops.recalc_face_normals` — run once after all bridging and capping to
  unify outward normals across hull seams.

---

## Licence

CC0 — no rights reserved.  Outside references:
- Blender Python API docs — CC-BY-SA-4.0 — https://docs.blender.org/api/current/bmesh.ops.html
- blender-scripting by Nicolas Janakiev — MIT — https://github.com/njanakiev/blender-scripting
- glTF-Blender-IO — Apache-2.0 — https://github.com/KhronosGroup/glTF-Blender-IO
