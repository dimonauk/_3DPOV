# Screen Recording Notes — Python numpy STFT Audio Spectrum (Blender 5.1)

## Goal
Capture a 90-second screen recording of the spectrum visualiser being built and
played back, ending with the 3D bar graph animating and the poi sphere arcing
across the peak-frequency path.

## Setup (before recording)

1. Open `hf_spectrum.blend` in Blender 5.1.
2. Set viewport shading → **Rendered** (Z → Rendered).
3. Set world background to pure black (Properties → World → Colour → `#000d1e`).
4. Press **Numpad 1** (front view), then **View → Frame All** (`Home`).
5. In the Timeline, set **End Frame** to 120.

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Source type | Window Capture → `Blender` |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Output format | MP4 (H.264) |
| Audio | OFF (synthetic audio is implied, not present in .blend) |

## Recording sequence (90 s)

| Time | Action |
|---|---|
| 0:00–0:15 | Show the Scripting workspace with `blueprint.py` open; scroll to the `generate_signal()` and `compute_stft_frames()` functions |
| 0:15–0:30 | Switch to 3D Viewport (rendered); show the 32 bar columns at frame 1 (quiet drone) |
| 0:30–0:55 | Drag the timeline playhead from frame 1 to 120; watch bars ripple as the chirp sweeps frequency |
| 0:55–1:10 | Select the poi sphere, open Graph Editor, show the X and Z F-Curves — two sinuous paths tracking peak bin and RMS power |
| 1:10–1:30 | Press Space to play; let it run through all 120 frames at 24 fps |

## Saving

Save as:
```
public/library/videos/scripting/python-numpy-stft-audio-spectrum-3d-bars-poi-webxr/screen.mp4
```

Trim to 90 seconds maximum. No colour correction needed — the dark background
and emissive bars look vivid out of the box.
