# Screen Recording Notes — KdV Soliton Height-Field

**Target file:** `public/library/videos/scripting/python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr/screen.mp4`

## Software

OBS Studio (Windows/Linux) or Xbox Game Bar (Win 11).

## OBS Setup

1. **New Scene** → name it `KdV-Soliton`.
2. **Sources → Add → Window Capture** → select `Blender 5.1`.
3. **Settings → Video**: Base resolution `1920×1080`, Output `1920×1080`, FPS `30`.
4. **Settings → Output → Recording**:
   - Format: MP4
   - Encoder: x264 (or NVENC if available)
   - CRF: 18 (near-lossless; reduce to 22 to save space)
5. **Settings → Audio**: Mute all sources (tutorial needs no audio).

## Blender Preparation

1. Open the saved `.blend` file produced by `blueprint.py`.
2. Switch to the **Scripting** workspace; the shape-key mesh should be visible.
3. In **Viewport Shading** press `Z` → **Rendered** (EEVEE Next).
4. Set the **Timeline** to frame 1, frame range 1–150.
5. In **Viewport Overlay** enable **Statistics** (helps convey live data).
6. Maximise the 3D viewport to fill the screen.

## Narrative Shot List (5 seconds, 30 fps)

| Frames  | Action |
|---------|--------|
| 1–30    | Pan to overhead view showing flat t=−5 stage (solitons far apart). |
| 31–60   | Scrub timeline; solitons approach. Pause at frame ~50 to inspect amplitude difference. |
| 61–90   | Continue to frame 90 — interaction peak at t=0 (two humps merge/pass). |
| 91–120  | Post-collision: faster soliton ahead, slower soliton behind — phase shift visible. |
| 121–150 | Orbit camera 90° to side profile; solitons visibly separated at t=+5. |

## Workflow

1. Start OBS recording.
2. In Blender: play the animation (Spacebar) in Rendered shading.
3. After playback completes, stop OBS recording.
4. Trim any dead frames in the OBS video editor or DaVinci Resolve.
5. Export/save as `screen.mp4` at 1920×1080 30fps.
