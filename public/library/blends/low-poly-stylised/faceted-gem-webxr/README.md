# Faceted Gem — WebXR-ready GLB

**Library path:** `public/library/blends/low-poly-stylised/faceted-gem-webxr/`  
**Topic:** Low-Poly Stylised  
**Engine:** Blender 5.1 · EEVEE Next  
**Licence:** CC0 (all files in this directory)

---

## What this produces

A 25-face octagonal brilliant-cut gem mesh with a cel-refraction material —
cobalt glass that snaps to hard highlight bands rather than blending
continuously. Exports to a WebXR-ready GLB at roughly 4 KB after Draco
compression.

The topology — table → crown quads → upper pavilion quads → pavilion
triangles → culet — mirrors the vocabulary of a real brilliant cut.
Each ring is a separate set of bmesh vertices so the geometry is readable
and modifiable without touching the material.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender to build the mesh + material + export to GLB |
| `record.py` | Runs `blueprint.py`, then renders a 5 s turntable to `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest — what this entry should produce |

---

## Running

```
# inside Blender Text Editor (Alt+P)
# open blueprint.py → Run Script
# gem appears in viewport; gem_cobalt.glb is written next to the .blend
```

Headless (CI / batch):

```bash
blender --background --python public/library/blends/low-poly-stylised/faceted-gem-webxr/blueprint.py
```

---

## Key technique notes

**Flat shading via `poly.use_smooth = False`** — this is the single line
that makes the faceted aesthetic work. Smooth shading blends normals across
edges, smearing specular highlights between facets. Flat shading locks each
face to its geometric normal.

**`surface_render_method = 'FORWARD'`** — the EEVEE Next (4.2+) replacement
for `blend_method = 'BLEND'`. Required for the Principled BSDF's transmission
and alpha to render correctly.

**`bmesh.ops.recalc_face_normals`** — called after face construction because
the lower pavilion triangles can end up with inward normals depending on
vertex winding order. The recalc pass makes all normals point outward without
manual winding fixes.

---

## Outside sources

| Source | Licence | Author |
|--------|---------|--------|
| Blender Python API Reference — `docs.blender.org/api/current` | CC BY-SA 4.0 | Blender Foundation |
| `SebLague/Coding-Adventures` — crystal / refraction shader research | MIT | Sebastian Lague |

Related OSS projects:
- `blender/blender` — Blender source (GPL-2.0+)
- `SebLague/Procedural-Stochastic-Texturing` — same author, sibling project
