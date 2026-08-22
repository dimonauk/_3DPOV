# GN String to Curves — Procedural 3D Text Generator

**Blender:** 5.1 · **Topic:** Geometry Nodes · **Licence:** CC0

## What this builds

Solid, bevelled 3D letter geometry driven entirely by a Geometry Nodes group
input — no Text Object, no manual extrusion.  The modifier accepts a **Text**
string, an **em-height Size**, and a **Depth** value, and outputs a finished
mesh with chamfered edges ready for GLB export or WebXR embedding.

## Pipeline

```
GroupInput.Text  → StringToCurves → RealizeInstances → FillCurve
                                                           ↓
GroupInput.Depth → CombineXYZ (Z) → ExtrudeMesh (FACES, individual)
                                                           ↓
                                   BevelMesh (EDGES, 0.008 m, 2 segs)
                                                           ↓
                                   SetMaterial → GroupOutput.Geometry
```

## Key nodes

| Node | Role |
|---|---|
| `GeometryNodeStringToCurves` | Converts string → per-character curve instances |
| `GeometryNodeRealizeInstances` | Collapses character instances → flat curve geometry |
| `GeometryNodeFillCurve` | Triangulates / fills closed curve outlines → mesh faces |
| `GeometryNodeExtrudeMesh` | Extrudes each letter face individually along Z |
| `GeometryNodeBevelMesh` | Chamfers all edges for specular highlight rim |

## Important notes

- **Font**: `n_s2c.font` accepts a `bpy.types.VectorFont`.  Built-in BFont
  (Apache-2.0) loads via `bpy.data.fonts.load("<builtin>")`.  Custom .ttf
  fonts use `bpy.data.fonts.load("/path/to/font.ttf")`.
- **String animation**: the String socket type has no F-curve interpolation.
  Animate via a Python driver on a custom String object property instead.
- **3D print**: swap `n_fill.mode = "TRIANGLES"` for a fully triangulated
  manifold mesh before sending to a slicer.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — builds GN tree, scene, exports |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Usage

```bash
blender --background --python blueprint.py
blender procedural_text.blend --background --python record.py
```

## Cross-references

- Studio tutorial: `/tutorials/blender-tutorial-gn-string-to-curves-3d-text`
- Related: `/tutorials/blender-tutorial-gn-curve-to-mesh`
- Related: `/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines`
- Related: `/tutorials/blender-tutorial-gn-fillet-curve-neon-sign`
- Related: `/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb`

## Outside sources

- String to Curves Node — CC-BY-SA 4.0, Blender Foundation
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/text/string_to_curves.html
- Inter Typeface — OFL 1.1, Rasmus Andersson
  https://github.com/rsms/inter
