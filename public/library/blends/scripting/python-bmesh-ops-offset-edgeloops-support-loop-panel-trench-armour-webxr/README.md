# bmesh.ops.offset_edgeloops — Support Loops, Panel Trench & Bevel Prep

**Blender 5.1 · Holoflow Studio · CC0**

`bmesh.ops.offset_edgeloops` takes a connected set of edges (a loop or open
path) and inserts two new parallel loops flanking the input on either side,
sliding new vertices along adjacent quad faces.  It is the headless-Python
equivalent of Blender's Offset Edge Loop Slide operator — with no active Object,
no Mode switch, and no undo-stack overhead.

Studio prop: a **2.4 × 1.6 m Sci-Fi Armour Plate** with a raised central boss,
two horizontal panel-line trenches, and a solidified backing shell.

## What this demonstrates

| Concept | Details |
|---------|---------|
| `bmesh.ops.offset_edgeloops` | Core API: inserts flanking edge loops from input path |
| `use_cap_endpoint=False` | Closed loop mode — boss perimeter; no dangling ends |
| `use_cap_endpoint=True` | Open path mode — groove row spanning plate width |
| Support loop pattern | Closed boss perimeter → pinch-free SubD and BevelModifier |
| Panel-line trench | Open groove row → extrude narrow face strip down to form groove |
| Boss perimeter detection | `link_faces` boundary condition: exactly 1 adjacent boss face |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Headless build + GLB export |
| `record.py` | EEVEE 360° turntable → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS window-capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
blender --background --python blueprint.py
```

Outputs `hf_armour_plate.glb` next to the script — Draco-compressed,
WebP-textured, +Y-up, WebXR-ready.

## Grid topology (SEG_X=4, SEG_Y=8)

```
x vertex cols: ±1.2, ±0.6, 0.0   (step 0.6 m)
y vertex rows: ±0.8, ±0.6, ±0.4, ±0.2, 0.0   (step 0.2 m)

Boss faces (2×2 patch): centres at (±0.3, ±0.1) — 4 faces
Boss perimeter: 8 edges at x=±0.6 y-span, y=±0.2 x-span
Groove rows:   edges at y=±0.4  (safely between boss ±0.2 and boundary ±0.6)
```

## offset_edgeloops return value

```python
result = bmesh.ops.offset_edgeloops(bm, edges=edge_list, use_cap_endpoint=False)
new_edges = result['edges']   # list[BMEdge] — the newly inserted parallel loops
```

The original input edges REMAIN in place; `result['edges']` contains only the
newly created offsets.  The faces adjacent to each input edge are split by the
new geometry, so `ensure_lookup_table()` is needed before further index-based
access.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty `result['edges']` | Input edges not a connected path | Check all edges share vertices into a loop/chain |
| Offset distance too large/small | Adjacent face width determines slide extent | Use finer grid or pre-inset faces |
| Groove faces not found after offset | `calc_center_median()` shifted beyond tolerance | Increase EPS in `groove_faces` filter |
| `ensure_lookup_table()` error | Stale index after topology change | Call after every `offset_edgeloops` / `extrude_face_region` |

## Outside sources

- Blender Foundation — [bmesh.ops API Reference](https://docs.blender.org/api/5.1/bmesh.ops.html) — CC-BY-SA-4.0
- KhronosGroup — [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) — Apache-2.0
