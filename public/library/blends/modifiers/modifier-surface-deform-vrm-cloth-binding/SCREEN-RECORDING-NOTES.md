# Screen Recording Notes — Surface Deform VRM Cloth Binding

**Target file:** `public/library/videos/modifiers/modifier-surface-deform-vrm-cloth-binding/screen.mp4`

## Setup

1. Run `blueprint.py` in Blender's Script editor to build the scene.
2. Switch to **Layout** workspace.
3. Set viewport shading to **Solid** with **MatCap** (grey clay) so both meshes are visible.
4. Enable **Overlays → Wireframe** at about 30% opacity so the bind relationship reads clearly.
5. Position camera: numpad 1 (front), then orbit 38° right and tilt up slightly.
6. Set timeline to frame 1–60, playback at 24 fps.

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| CRF | 18 |

## Recording script

1. **[Record]** — Start capture.
2. Press **Space** to play the 60-frame animation.
3. Watch the tunic follow the leaning body without sliding.
4. Pause at frame 30 (peak lean), show the Surface Deform modifier panel.
5. Click **Unbind** button in the modifier panel to show the garment snapping back to its unbound position.
6. Click **Bind** to re-bind.
7. **[Stop]** — End capture.

## Post-processing

Trim to the key moments using Blender's VSE (see the VSE screen-recording tutorial).
Target duration: 45–90 seconds.

## Upload path

Copy the finished file to:
```
public/library/videos/modifiers/modifier-surface-deform-vrm-cloth-binding/screen.mp4
```
