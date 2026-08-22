# Retopology — Poly Build + Shrinkwrap (Blender 5.1)

Manual quad retopology: draw edge loops directly over a dense sculpt using the
Poly Build tool, with every vertex snapping automatically to the sculpt surface
via a live Shrinkwrap modifier.

## What is retopology?

A sculpt produced by Dyntopo or Multires is dense (tens of thousands of
triangles, irregular edge flow).  Retopology replaces that mesh with a clean,
low-poly quad cage whose edge loops follow the form — around the eye socket,
along the lip border, down the jawline.  The clean cage deforms predictably
under armature weights, accepts UV seams along natural boundaries, and exports
as a compact GLB.  The high-frequency surface detail is recovered as a baked
normal map at the end of the pipeline.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the scene: sculpt reference + retopo scaffold |
| `record.py` | Renders a 5-second viewport animation of the fade-in |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the screen.mp4 recording |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick Start

1. Open Blender 5.1 → **Scripting** workspace.
2. Open `blueprint.py` → **Run Script**.
3. Switch to **Layout** workspace.
4. Select `retopo_mesh` → **Edit Mode** (Tab).
5. T-panel → **Poly Build** tool.
6. Enable **Face Snap** in the header snap menu.
7. Click/drag on the surface to place quads — Shrinkwrap snaps each vertex.
8. When topology is complete:
   - Properties → Modifiers → apply **Mirror** (top first)
   - Apply **Shrinkwrap** next
   - UV unwrap → bake normal map from `sculpt_ref` to `retopo_mesh`

## Modifier Stack

```
retopo_mesh modifiers (top = applied first):
  [0] Mirror      use_axis X, use_bisect X, use_clip = True
  [1] Shrinkwrap  target=sculpt_ref, mode=PROJECT, ±Z, offset=0.001
```

## Blender Version

5.1 — tested with `bpy` 4.4.  The `temp_override` idiom for `modifier_apply`
is required on 3.x+ (direct `bpy.ops.object.modifier_apply` without a context
override raises a `RuntimeError: Operator poll failed` in background/scripted
contexts).

## Outside Sources

- Blender Foundation — *Retopology*, Blender Manual v5.1.
  URL: <https://docs.blender.org/manual/en/latest/modeling/meshes/retopology.html>
  Licence: CC-BY-SA 4.0 (linked as reference, not reproduced).

- Blender Studio — Open character production files (Sprite Fright, Charge).
  URL: <https://studio.blender.org/characters/>
  Licence: CC0.

## Cross-References

- Tutorial: `/tutorials/blender-tutorial-sculpt-dyntopo-voxel-remesh`
- Tutorial: `/tutorials/blender-tutorial-sculpt-multires-normal-bake-lowpoly-glb`
- Tutorial: `/tutorials/blender-tutorial-armature-weight-paint`
- Tutorial: `/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised`
