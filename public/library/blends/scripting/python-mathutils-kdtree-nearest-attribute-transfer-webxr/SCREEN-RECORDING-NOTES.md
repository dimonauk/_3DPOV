# Screen Recording Notes — KDTree Attribute Transfer

**Target file:** `public/library/videos/scripting/python-mathutils-kdtree-nearest-attribute-transfer-webxr/screen.mp4`

## Setup

1. Open Blender 5.1. Load `attr_transfer.blend` (created by `blueprint.py`).
2. Switch to **Vertex Paint** shading in the viewport (`Viewport Shading → Vertex`).
3. Select `lores_proxy`. The transferred gradient should be visible — dark at the south pole, bright at the north.
4. Set OBS source: **Window Capture → Blender**. Resolution: 1920 × 1080. FPS: 30. Audio: off.

## Recording script

| Time | Action |
|------|--------|
| 0–3 s | Show `hires_source` selected. Open the Properties panel → Mesh → Attributes. Show `ao_value` (FLOAT, POINT domain). |
| 3–8 s | Open the Blender Text Editor. Open `blueprint.py`. Scroll to `_build_kdtree`. Highlight the `kd.balance()` call and the `foreach_get` block. |
| 8–14 s | Switch to `lores_proxy`. Show `ao_baked` in the Attributes panel (FLOAT_COLOR, POINT domain). |
| 14–22 s | Open the Scripting workspace. Run `blueprint.py` from scratch: clear the scene, watch both spheres appear side by side. |
| 22–30 s | With `lores_proxy` selected, orbit the viewport to show the smooth gradient baked from the hi-res mesh. |

## Export

File → Export → H.264 (or use OBS Stop Recording).  
Rename to `screen.mp4` and place in  
`public/library/videos/scripting/python-mathutils-kdtree-nearest-attribute-transfer-webxr/`.
