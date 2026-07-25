# Screen Recording Notes — DFT Epicycles Poi Path Phasors

**Tool**: OBS Studio 30+ / Windows Game Bar / macOS Screenshot  
**Window source**: Blender 5.1 (full application, not just viewport)  
**Resolution**: 1920 × 1080  
**Frame rate**: 30 fps  
**Audio**: OFF — viewport animation has no audio track

## Setup Checklist

1. Run `blueprint.py` in the Scripting workspace. Verify "Scene ready — 10 epicycles, 180 frames" prints in the console.
2. Switch to the **Layout** workspace. Set viewport shading to **Material Preview** (Z key → Material Preview, or the sphere icon in the viewport header).
3. Set Timeline range: Start = 1, End = 180.
4. In OBS: Add > Window Capture > select "Blender". Crop to 1920 × 1080 if needed.
5. Set OBS output: Recording → MP4, H.264, 30 fps, CRF 18 (high quality).

## What to Capture

**Take 1 — Scrub preview (30 s)**  
Scrub the timeline slowly (drag the playhead) from frame 1 to 180. Show the arms rotating and the trace curve building up. Good for thumbnail generation.

**Take 2 — Real-time playback (6 s)**  
Press **Space** to play at real time. The epicycle chain rotates, each arm at its DFT frequency, and the orange trace ribbon follows the tip. Should loop cleanly after 180 frames.

**Take 3 — Node tree close-up (20 s)**  
Pan to the Python console / Text Editor showing `blueprint.py`. Highlight the `compute_dft_bins` and `build` functions. Useful for the tutorial overlay.

## OBS Scene Layout (recommended)

```
[Blender viewport crop, full screen]
[Overlay: small text "DFT Epicycles | Holoflow Studio | Blender 5.1"]
```

## Post-processing

- Encode final cut with Handbrake: H.264, RF 20, 1080p 30fps
- Save as `screen.mp4` alongside `viewport.mp4`
- Both files go under `public/library/videos/scripting/python-dft-epicycles-poi-path-phasors-webxr/`
