# GN Sample Index — Echo-Grid Interference Deformation

**Blender 5.1 | Geometry Nodes | CC0 | Holoflow Studio**

## What this is

A 15 × 15 grid mesh deformed by a wave-interference pattern built entirely
in Geometry Nodes using a single noise evaluation.  The **Sample Index** node
reads a field value at an *arbitrary* element index rather than the current
element's index — this makes it possible to look up the noise amplitude of
a neighbouring row and add it as a second "echo" displacement phase.

The result: constructive peaks where the two phases align, destructive troughs
where they cancel.  A live **Echo Scale** socket controls the blend in real
time from the modifier panel.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script — run once in Blender to produce `echo_grid.blend` and `echo_grid.glb` |
| `record.py` | Viewport animation render — keyframes Echo Scale 0 → 1 → 0 over 120 frames |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the screen.mp4 capture |

## Key concepts

- **Sample Index** (`GeometryNodeSampleIndex`): reads the `src_z` attribute
  at vertex `(i + ROW_OFFSET) % TOTAL`, one grid row ahead of the current
  vertex.
- **StoreNamedAttribute freeze**: noise values must be frozen before
  SetPosition so both the own-Z and echo-Z lookups reference the
  pre-deformation flat-grid coordinates.
- **Modulo wrapping**: ensures the last row wraps back to row 0, giving a
  seamless periodic tiling.
- **Wave interference**: `final_Z = own_Z + echo_Z × ECHO_SCALE` —
  ECHO_SCALE < 1 keeps the base noise dominant; ECHO_SCALE > 1 can invert
  the dominant phase.

## Running blueprint.py

```bash
blender --background --python blueprint.py
```

Outputs: `echo_grid.blend` and `echo_grid.glb` next to this file.

## Running record.py

```bash
blender --background echo_grid.blend --python record.py
```

Renders `public/library/videos/geometry-nodes/gn-sample-index-echo-grid/viewport.mp4`.

## Export notes

The GLB uses `export_apply=True` (required — runtimes don't evaluate GN
modifiers), Draco level 6 compression, and WebP textures.  The `src_z`
attribute is baked into vertex positions at export time; it is *not*
present as a custom attribute in the GLB accessor unless you add
`export_attributes=True` to the export call.

## Tutorial

`/tutorials/blender-tutorial-gn-sample-index-echo-grid`
