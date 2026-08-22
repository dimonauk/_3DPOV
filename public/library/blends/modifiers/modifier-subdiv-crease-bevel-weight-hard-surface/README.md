# Modifier Stack — SubDiv + Crease + Bevel Weight: Hard-Surface SubD Workflow
**Blender 5.1 · Holoflow Studio · CC0**

---

## What this is

Three sharpness controls act at three different levels of the Blender
modifier stack for a machined mount block:

| Tool | Where it lives | What it controls |
|---|---|---|
| **Support Loop Cuts** | Mesh data | Topology-based pull-back; adds edge density |
| **Edge Crease** | `crease_edge` attribute | Catmull-Clark algorithm pin per edge |
| **Bevel Weight** | `bevel_weight_edge` attribute | Bevel Modifier selection mask |

The mount block has a recessed panel groove on its top face. That geometry
creates T-junction topology that makes loop cuts impractical — exactly the
scenario where Crease + Bevel Weight shines.

---

## Modifier stack order

```
Mesh data  →  Bevel (Limit: Weight)  →  Subdivision Surface  →  Weighted Normal
```

**Bevel first** — the chamfer geometry must exist before SubDiv sees it;
reversing the order hides the chamfer inside the smoothed surface.

**SubDiv second** — subdivides the already-chamfered mesh. The `crease_edge`
attribute tells Catmull-Clark which edges to treat as fixed.

**Weighted Normal last** — corrects shading artefacts at the boundary between
the flat annulus (top rim band) and the curved side walls.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy scene construction — geometry, creases, bevel weights, modifiers, material, camera |
| `record.py` | Viewport animation: wireframe → Bevel on → SubDiv on → WeightedNormal on → orbit |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for the screen.mp4 |

---

## Expected artefacts

- `mount_block.blend` — saved after running blueprint.py (File → Save)
- `mount_block.glb` — apply modifiers, export with Draco level 6, +Y up
- `viewport.mp4` — rendered by record.py
- `screen.mp4` — captured per SCREEN-RECORDING-NOTES

---

## Key technique notes

**Edge Crease in Blender 5.1**
The `crease_edge` mesh attribute (float, edge domain) replaced the legacy
custom data layer in Blender 3.4. The bmesh `layers.crease.verify()` API
still works in 5.1 and maps to this attribute. Value 1.0 = fully pinned;
0.5 = half-tension (SubDiv still pulls the edge slightly toward a smooth
curve, useful for organic-to-hard transitions).

**Bevel Weight in Blender 5.1**
The `bevel_weight_edge` mesh attribute replaced `layers.bevel_weight` in
3.4. Set via `mesh.attributes["bevel_weight_edge"].data[idx].value`. The
Bevel modifier must have `limit_method = 'WEIGHT'` to read it.

**loop_slide = True**
Enables the Bevel modifier's loop-slide mode: bevel endpoints slide along
adjacent edge loops rather than clamping at vertex position. Prevents the
pinching artefact where bevel ends meet at a corner vertex.

**use_creases = True on SubDiv**
Enables reading of the `crease_edge` attribute. In Blender 4.x this
defaulted to True, but explicitly set for clarity.

---

## Tutorial

→ `/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface`
