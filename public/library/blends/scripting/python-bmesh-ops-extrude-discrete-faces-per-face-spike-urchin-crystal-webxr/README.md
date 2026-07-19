# bmesh.ops.extrude_discrete_faces — Per-Face Spike & Crystal Urchin

**Blender 5.1 · Holoflow Studio · CC0**

Extrudes every face of an icosphere as a fully independent solid, then tapers
each cap to a pyramidal point, producing a faceted crystal urchin suitable for
WebXR environments.

## What this demonstrates

| Concept | Details |
|---------|---------|
| `bmesh.ops.extrude_discrete_faces` | Per-face extrusion with no shared boundary between adjacent spikes |
| Contrast with `extrude_face_region` | Region op merges adjacent face boundaries; discrete op isolates every face |
| Cap-normal translate | Read `face.normal` before mutating verts; translate along it for spike height |
| Cap-centroid scale | `bmesh.ops.scale` with inverted `Matrix.Translation(centroid)` as pivot |
| Sharp-edge tagging | `e.smooth = False` writes `sharp_edge` attribute → split normals in GLB |
| `bmesh.ops.create_icosphere` | Even face distribution (no polar pinch) vs UV sphere |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless build + GLB export |
| `record.py` | Cycles viewport turntable render (5 s @ 30 fps) |
| `SCREEN-RECORDING-NOTES.md` | OBS window-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# GLB export only
blender --background --python blueprint.py

# Viewport render → viewport.mp4
blender --background --python record.py
```

## Artefacts

- `hf_spike_urchin.glb` — Draco-compressed, Y-up, ~320-face crystal urchin

## Cross-references

- [extrude_face_region (panel push, control deck)](/tutorials/blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr)
- [poke (crystal boss, raised diamond lattice)](/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr)
- [inset_faces (panel lines, button recesses)](/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr)
