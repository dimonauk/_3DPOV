# WarpModifier — Two-Object Space Warp for VRM Sleeve Cuff Drape
**Blender 5.1 · holoflow studio · scripting**

## What this is

`blueprint.py` builds a faceted VRM sleeve accessory whose cuff end is shaped
by two stacked `bpy.types.WarpModifier` instances — one for lateral drape
(cuff swings forward as a real sleeve does under gravity), one for axial twist
(cuff edge spirals around the wrist axis). The deformation is baked into the
mesh before Solidify and GLB export, so the WebXR runtime sees a clean
single-mesh node with no modifier overhead.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Production script — geometry, vertex group, WarpModifiers, apply, export |
| `record.py` | Viewport-animation render script for tutorial video |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |
| `.expected-artefacts.json` | CI manifest of expected output files |

## Output

```
public/library/glbs/scripting/
└── python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr/
    └── hf_warp_sleeve.glb

public/library/videos/scripting/
└── python-bpy-warp-modifier-object-space-deform-magnet-vrm-webxr/
    ├── viewport.mp4   (from record.py)
    └── screen.mp4     (from OBS)
```

## How to run

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` and press **Run Script** (Alt+P).
4. The sleeve geometry appears in the viewport; the GLB is written to
   `public/library/glbs/scripting/…/hf_warp_sleeve.glb`.
5. For the tutorial video, open `record.py` in a second script slot and run it,
   then press Ctrl+F12 to render the animation.

## Key concepts

- `WarpModifier.object_from` / `object_to` — the two empties that define the
  deformation space. Setting only `object_to` leaves `object_from` as the
  world origin.
- `falloff_type` — controls the weight attenuation profile with distance from
  `object_from`: `SMOOTH` (cubic), `SPHERE` (√), `SHARP` (quadratic inverse),
  `LINEAR`, `CONSTANT`.
- `falloff_radius` — radius in object space within which any deformation occurs.
  Vertices beyond this distance are unaffected regardless of strength.
- `vertex_group` — masks the modifier to a subset of vertices. Essential to
  isolate the cuff from the upper sleeve.
- `strength` > 1.0 overshoots the To transform; < 0.0 deforms in the opposite
  direction. Both are valid for cartoon squash-and-stretch.

## Sources

- Blender Foundation — bpy.types.WarpModifier API, CC-BY-SA-4.0
  <https://docs.blender.org/api/5.1/bpy.types.WarpModifier.html>
- Blender Manual — Warp Modifier, CC-BY-SA-4.0
  <https://docs.blender.org/manual/en/5.1/modeling/modifiers/deform/warp.html>
- Khronos Group — glTF-Blender-IO, Apache-2.0
  <https://github.com/KhronosGroup/glTF-Blender-IO>
