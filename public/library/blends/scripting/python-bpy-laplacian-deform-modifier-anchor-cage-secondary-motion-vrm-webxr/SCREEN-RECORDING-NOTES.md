# Screen Recording Notes — LaplacianDeform Tail Tutorial

## Software
OBS Studio (any recent version) or Windows Game Bar (`Win + G`).

## OBS Settings
| Setting | Value |
|---|---|
| Source | Window Capture → `Blender 5.1` |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | **Disabled** (no microphone for automated capture) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-bpy-laplacian-deform-modifier-anchor-cage-secondary-motion-vrm-webxr/screen.mp4` |

## Scene to Record

1. Open `hf_lapdeform_tail.blend` in Blender 5.1.
2. In the **Properties panel → Modifiers**, show the modifier stack:
   - `TipHook` at index 0
   - `LaplacianDeform` at index 1
3. Press **Space** in the Timeline to play the animation (frames 1–50).
   The tail sweeps from straight to 35° deflection and back.
4. Scrub to frame 25 and show the modifier panel — point out `is_bind = True`.
5. In the **Sidebar (N panel) → Item**, show the Empty `hf_tail_handle` location
   changing as you scrub frames.
6. End at frame 1 (rest pose).

## Suggested Takes

| Take | Content |
|---|---|
| A | Modifier panel — stack order (Hook above LaplacianDeform) |
| B | Full animation playback — tail arc |
| C | Vertex Groups panel — ANCHOR weight gradient |
| D | Scrub frame 25 → export GLB via `File → Export → glTF 2.0` |

## Post-production
Trim to ≤ 90 s. No music. Add text overlays for step labels if desired.
Render to `screen.mp4` alongside the auto-generated `viewport.mp4`.
