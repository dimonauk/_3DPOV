# Face-Push Panel Stamp — GN Node Tool

**Blender 5.1 · CC0 · Holoflow Studio**

A Geometry Nodes tree registered as a Blender 5.1 Node Tool that pushes
selected faces outward along their individual normals. Designed for
procedural sci-fi / hard-surface panel detailing on WebXR props.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds both the tool tree (`GN_FacePush_Tool`, `is_tool=True`) and a modifier preview clone; exports GLB |
| `record.py` | Animates Amount 0→0.12→0 over 60 frames; renders PNG sequence for `viewport.mp4` |
| `face_push_panel_stamp.blend` | Demo scene with 4×4 grid and modifier preview |
| `face_push_panel_stamp.glb` | Draco + WebP GLB for WebXR |

## Quick Start

1. Open Blender 5.1. Go to **Scripting** workspace.
2. Open `blueprint.py` → **Run Script**. This creates both node trees and saves
   `face_push_panel_stamp.blend` in the same directory.
3. In the **Geometry Node Editor**, select `GN_FacePush_Tool`. Confirm the
   header chip reads **Tool** (not Modifier). This confirms `is_tool = True`.
4. Select your mesh. Enter **Edit Mode** → **Face Select** (3). Select the
   faces you want to stamp.
5. Open the left **Toolbar** (T). Find the Node Tool under your custom tab.
   Adjust Amount and Randomness, then click **Apply**.

## Tool Parameters

| Socket | Type | Default | Range | Notes |
|--------|------|---------|-------|-------|
| Selection | Bool (FACE) | True | — | Auto-maps to edit-mode face selection when `is_tool=True` |
| Amount | Float (Distance) | 0.06 m | −0.5 → 0.5 | Outward push distance |
| Randomness | Float | 0.0 | 0 → 1 | 0 = uniform, 1 = ±50 % per-face variation |

## Node Network

```
GroupInput ──→ SetPosition ──→ StoreNamedAttribute ──→ GroupOutput
                  ▲                  ▲
  Normal ──→ VectorMath(SCALE)    Selection
                  ▲
             Math(MULTIPLY) ← Amount
                  ▲
             Math(ADD, 1.0) ← Math(MULTIPLY) ← Randomness
                                    ▲
                             RandomValue(FLOAT) ← Index
```

## WebXR / GLB Notes

- `holoflow:facet = 1.0` is stored on every moved face so the Holoflow
  exporter applies flat shading to the stamped panels.
- Export with `export_attributes=True` to preserve the named attribute in GLB.
- Draco level 6 compresses the grid geometry aggressively; reduce to 4 if
  the mesh has very high vertex density.

## Licence

All files in this directory are released under **CC0 1.0 Universal**.
