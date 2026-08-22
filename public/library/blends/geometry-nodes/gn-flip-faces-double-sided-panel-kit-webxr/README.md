# GN Flip Faces — Double-Sided Thin Panel Kit for WebXR

**Blender 5.1 | geometry-nodes | CC0 | holoflow studio**

Produces a two-sided banner/curtain/partition mesh from a single flat
grid using the `GeometryNodeFlipFaces` node.  Each side carries its own
material and correct outward-facing normals, so directional lighting is
accurate from both directions in WebXR.

## Output

| File | Description |
|------|-------------|
| `banner_panel.blend` | Source blend (GN modifier live) |
| `banner_panel.glb` | Draco-compressed export, WebP textures |
| `blueprint.py` | Blender Python reproducer — run in Scripting tab |
| `record.py` | 15 s viewport animation render (run after blueprint) |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for screen.mp4 |

## Quick start

```
# In Blender 5.1 Scripting tab:
bpy.ops.script.python_file_run(filepath="path/to/blueprint.py")
```

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `EPSILON` | 0.002 m | Inward offset on back panel to prevent z-fighting |
| `PANEL_W` / `PANEL_H` | 1.6 / 2.4 m | Banner dimensions |
| `SUBDIV_X` / `SUBDIV_Y` | 6 / 10 | Grid resolution for cloth-sim curvature |

## When to use Flip Faces vs `doubleSided` flag

| | Flip Faces | `doubleSided` material |
|---|---|---|
| Triangle count | 2× | 1× |
| Per-side lighting | Correct (separate normals) | Mirrored (same normal) |
| Per-side material | Yes | No |
| Shadow accuracy | Both sides cast/receive | One side only |
| Use case | Cloth, banners, glass partitions | Budget cards, grass, leaves |

## Tutorial

`/tutorials/blender-tutorial-gn-flip-faces-double-sided-panel-kit-webxr`

## Licence

CC0 — all files in this folder are released to the public domain.  
Technique based on Blender 5.1 built-in GN nodes; no third-party code.
