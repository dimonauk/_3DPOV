# GN Collection Info + Pick Instance — Multi-Asset Environmental Scatter
**Blender 5.1 · Geometry Nodes · CC0**

Scatter four distinct low-poly props across a terrain plane, each selected
statistically at random from a **Collection** palette.  The `Collection Info`
node with `separate_children = True` turns a Blender collection into an
ordered instance list; `Instance on Points` with `Pick Instance = True` and a
seeded integer random node selects from that list per scatter point.

The result: one GN modifier, one collection, four art-directable props —
no pre-combined meshes, no manual placement.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene: ground, 4 props, collection, GN tree, GLB export |
| `record.py` | 150-frame viewport animation: seed fan-out → orbit → density swell |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `prop_scatter.blend` | Saved scene (created by blueprint.py) |
| `../../glbs/.../prop_scatter.glb` | Realised scatter, Draco 6 + WebP |

---

## Quick start

1. Open Blender 5.1 → Scripting workspace → open `blueprint.py` → **Run Script** (Alt+P).
2. Switch to **Geometry Nodes** workspace.  Select `ground_scatter`.
3. Inspect the node tree: `Group Input → Distribute → Collection Info → Instance on Points`.
4. In the N-panel modifier inputs, scrub **Seed** to repopulate, **Min Distance** to tighten/loosen.
5. Open the Outliner and toggle the `scatter_kit` collection visibility to see individual props.
6. Run `record.py` to render `viewport.mp4`.

---

## Key technique

### Collection Info node
`separate_children = True` is the critical flag.  With it off, the node
returns the entire collection as a single instanced object — `Pick Instance`
cannot select individuals.  With it on, each collection child becomes its own
entry in the instances list, accessible by integer index.

`transform_space = ORIGINAL` keeps each prop at its own local pivot.
`RELATIVE` would apply the ground plane's world transform, displacing every
prop by the plane's position — wrong when the plane is at the origin, fatal
when it is not.

### Pick Instance + Random Value (INT)
The `Instance Index` socket on `Instance on Points` is a field — it is
evaluated once per scatter point.  Driving it with `Random Value (INT, min=0,
max=3, seed=N)` gives each point a statistically independent draw from the
four-entry palette.  Blender's field evaluator uses each point's implicit
`Index` attribute as the per-instance ID so the distribution is stable across
frames (same seed → same placement per point).

### GLB export with Realize Instances
glTF 2.0 has no collection-as-instanced-palette concept.  The blueprint
duplicates the ground, applies the GN modifier (which realises all instances
into a single mesh), and exports that copy — then deletes it, leaving the
live GN tree intact.  For large scenes consider exporting with
`export_format = 'GLTF_SEPARATE'` and `export_draco_mesh_compression_enable`
so the realised geometry compresses efficiently.

---

## Parameters

| Socket | Default | Range | Effect |
|--------|---------|-------|--------|
| `Seed` | 42 | 0–∞ | Global scatter seed — changes point layout and prop selection together |
| `Min Distance` | 0.55 m | 0.1–2.0 | Poisson disc gap — controls density |
| `Density Max` | 2.0 pts/m² | 0.1–20 | Upper density bound |
| `Scale Min` | 0.45 | 0.1–1.0 | Minimum uniform scale |
| `Scale Max` | 1.60 | 1.0–4.0 | Maximum uniform scale |

---

## Studio export notes

- Root names: `rock_a`, `crystal_b`, `pebble_c`, `mushroom_d` — snake_case per convention.
- `holoflow:facet = true` can be set per-prop for WebXR facet shader.
- Realise instances before GLB export; the glTF 2.0 spec supports EXT_mesh_gpu_instancing
  but Blender's exporter does not yet emit it for collection-scatter instances (5.1).
