# Screen Recording Notes — Alpha Clip vs Alpha Blend

**OBS Studio / Windows Game Bar instructions for capturing `screen.mp4`**

## Setup

- **Source**: Window Capture → Blender (not Game Capture)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no mic, no system audio)
- **Output format**: MP4 (H.264)
- **Output path**: `public/library/videos/shading/shader-alpha-clip-blend-foliage-decal-webxr/screen.mp4`

## Scene to record

1. Open `blueprint.py` in the Blender Scripting workspace.
2. Run it (Alt+P). Note the three leaf planes and the hologram decal in the
   3D Viewport.
3. Switch to **Solid** shading, then **Material Preview**, then **Rendered**
   (EEVEE). Pause 3 seconds at each mode to show the alpha mask activating.
4. In the **Material Properties** panel, select the `hs_leaf_clip` material.
   Show `blend_method = CLIP` and `alpha_threshold = 0.42` in the Settings
   section. Hover to highlight each field.
5. Select the `holo_decal` object. Show `hs_holo_blend` material with
   `blend_method = BLEND` and `shadow_method = NONE`.
6. Orbit the camera (middle-mouse drag) around the leaf cluster to show the
   clipped shadow shape on the dark floor. Pause for 4 seconds.
7. Orbit to the hologram. Note it casts no shadow. Pause 3 seconds.
8. Open the **Shader Editor** (switch top-left workspace drop-down). Show the
   node graph for `hs_leaf_clip` — highlight the Gradient → Noise → Multiply
   → Alpha chain. Hover over the Multiply node and show its output value
   (should be near 0 or 1, never in between when threshold met).
9. Switch to `hs_holo_blend`. Show the inverted SPHERICAL gradient chain
   feeding Alpha and the Emission socket value.
10. End recording.

## Suggested edit cuts (for tutorial video)

| Time | Action |
|---|---|
| 0:00 | Title card: "Alpha Clip vs Alpha Blend — Blender 5.1" |
| 0:04 | Blueprint.py run — show terminal output `[blueprint] GLB →` |
| 0:12 | Material Preview showing leaf silhouette vs hologram glow |
| 0:25 | Material properties panel — blend_method settings |
| 0:40 | Orbit around leaf + shadow on floor |
| 0:55 | Orbit to hologram — no shadow |
| 1:05 | Shader Editor — leaf node graph |
| 1:25 | Shader Editor — hologram node graph |
| 1:40 | End card: link to tutorial page |

Total target duration: 1 minute 45 seconds.
