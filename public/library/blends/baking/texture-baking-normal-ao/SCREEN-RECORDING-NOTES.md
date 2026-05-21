# Screen Recording Notes — Texture Baking: Normal Map + AO

**Target:** `public/library/videos/baking/texture-baking-normal-ao/screen.mp4`

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Format | MP4, H.264, CRF 22 |

## Pre-recording setup

1. Open Blender 5.1. Start from the default scene.
2. Switch workspace to **Scripting**. Open `blueprint.py`.
3. In a terminal alongside, confirm `TEX_SIZE = 512` and `BAKE_SAMPLES = 8`
   so the bake completes during recording (< 90 s on most CPUs).
4. Split the Blender window: **3D Viewport** on the left, **Scripting** on
   the right. The INFO header at the top will print bake progress.

## Shot list

| # | Workspace | Action | Hold |
|---|-----------|--------|------|
| 1 | Scripting | Scroll through `blueprint.py` — pause on the `EXTRUSION` constant | 3 s |
| 2 | Scripting | Pause on `scene.render.bake.use_selected_to_active = True` — explain the selected/active direction verbally | 4 s |
| 3 | Scripting | Pause on the `_bake()` helper — highlight `nodes.active = target_node` | 3 s |
| 4 | Scripting | Press **Run Script** (or Alt+P). Watch the INFO bar for bake progress | live |
| 5 | Scripting | INFO bar shows `[bake] NORMAL ✓` and `[bake] AO ✓`. Pause on both | 2 s each |
| 6 | Shading workspace | Select `lp_target`. Open Shader Editor. Show the full material graph | 4 s |
| 7 | Shading | Click `BakeTargetNormal` node. Press N → Image panel → show image | 5 s |
| 8 | Shading | Click `BakeTargetAO` node. Show AO map — dark poles, lighter equator | 5 s |
| 9 | UV Editing | Select `lp_target`. Show Smart UV Project island layout | 3 s |
| 10 | 3D Viewport — Material Preview | Tumble slowly around the low-poly sphere | 5 s |
| 11 | 3D Viewport — Rendered (EEVEE) | Show catch-light responding as you rotate the key light | 5 s |
| 12 | Properties → Render | Switch to Cycles. Show Bake panel: samples, use_selected_to_active, cage_extrusion | 4 s |
| 13 | File → Export → glTF 2.0 | Show export dialog with Normals + Materials + Draco ticked | 3 s |

## Tips

- Keep the Blender console open (Window → Toggle System Console on Windows)
  so `[saved]` print statements are visible during the recording.
- If the bake stalls, check that `obj_h` and `obj_l` are in the same
  collection and that Cycles is the active render engine.
- Use **Colour Management → Display Device: sRGB** and **Exposure 0** so
  the rendered viewport matches what the GLB viewer shows.
