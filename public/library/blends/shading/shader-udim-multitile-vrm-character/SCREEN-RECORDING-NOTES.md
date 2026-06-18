# Screen Recording Notes — UDIM Multi-Tile UV Workflow

## Session goal
Capture a narrated walkthrough of the UDIM unwrap-to-atlas pipeline in
Blender 5.1, demonstrating:
1. UV Editor showing three tiles side-by-side (1001 / 1002 / 1003)
2. Image Texture node with `source = TILED` selected in the Shader Editor
3. Painting a brush stroke on the front tile — tile-specific isolation
4. Bake operation collapsing the tiles into the single 4K atlas
5. Final GLB export dialog confirming one UV channel and one texture

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender (not fullscreen capture) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (add commentary in post) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/shading/shader-udim-multitile-vrm-character/screen.mp4` |

## Workspace layout for the recording

Split the Blender window into three areas before starting OBS:

```
┌──────────────────────┬──────────────────────┐
│   3D Viewport        │   UV Editor           │
│   (Rendered shading) │   (show all tiles)    │
├──────────────────────┴──────────────────────┤
│   Shader Editor  (show udim_skin material)  │
└─────────────────────────────────────────────┘
```

In the UV Editor header: **Image > Show UDIM Tiles** must be enabled so
all three tile grids appear in the editor — this is the visual centrepiece.

## Shot list (approx. 3–4 minutes)

1. **Intro pan** — orbit around the torso in Rendered shading (30 s)
2. **UV overview** — show UV Editor with all three tiles labelled; zoom into
   the front-tile island, then the back tile (30 s)
3. **Node setup** — click the Image Texture node; show `source = TILED` and
   the Tiles list with 1001, 1002, 1003 (20 s)
4. **Painting demo** — switch to Texture Paint mode; paint a red brush stroke
   on tile 1001 only, confirming no bleed to adjacent tiles (40 s)
5. **Bake walkthrough** — select torso, Properties › Render › Bake, show the
   settings (`Diffuse`, `Color` only), press **Bake**; watch atlas fill in (60 s)
6. **Atlas inspect** — open the udim_atlas image in the Image Editor; zoom into
   the seam boundary between the tile columns (20 s)
7. **GLB export** — File › Export › glTF 2.0; show UV Layers = atlas_uv only;
   confirm single texture slot in the GLB Viewer or glTF Validator (30 s)

## Common mistakes to avoid on camera

- Forgetting to set `me.uv_layers.active = atlas_uv` before baking — Blender
  bakes onto whichever UV channel is **active**, not whichever the node uses.
- Leaving the bake ImageTexture node selected (not just active) — Blender
  bakes FROM the selected node's image if you accidentally link it.
- Setting View Transform to AgX before baking — bake always uses scene-linear
  regardless of view transform, but the on-screen preview may look washed out.
  Explain to viewers that the bake file is correct even if the viewport looks off.
