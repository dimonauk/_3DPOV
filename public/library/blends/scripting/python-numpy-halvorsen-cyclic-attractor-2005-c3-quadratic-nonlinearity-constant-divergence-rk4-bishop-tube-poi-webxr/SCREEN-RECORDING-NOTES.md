# Screen Recording Notes — Halvorsen Cyclic Attractor

**Target file:** `public/library/videos/scripting/python-numpy-halvorsen-cyclic-attractor-2005-c3-quadratic-nonlinearity-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (≥30) or Windows Game Bar (Win+G) | Window capture — select Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no microphone, no desktop audio) |
| Output format | MP4 / H.264 CRF 23 |

## Blender viewport setup

1. Open Blender 5.1. New file → delete default cube.
2. Run `blueprint.py` via Scripting workspace → Run Script.
3. Wait for the console to print `Halvorsen blueprint complete.`
4. Switch to the **3D Viewport**.
5. Set shading mode to **Material Preview** (Z key → Material Preview, or click
   the sphere icon in the viewport header).
6. Viewport Overlays → **disable** Grid, Axes, Origins.
7. Viewport header: enable **Relationship Lines = off**.
8. Press **Numpad 0** to lock to camera, then **Numpad 4/6** to orbit slightly
   to see the trefoil structure from a diagonal angle (≈ (1,1,1) viewpoint
   shows the three-fold symmetry most clearly).

## What to capture

| Segment | Action | Duration |
|---------|--------|----------|
| 1 – Basis | Slowly orbit the viewport to show the three interlocked arms | ~30 s |
| 2 – Shape key demo | Open Properties → Object Data → Shape Keys. Drag SK_LowA value from 0→1 while orbiting | ~20 s |
| 3 – Colour detail | Zoom into one arm so the cobalt-to-amber speed gradient is visible | ~15 s |
| 4 – SK_HighA | Set SK_LowA=0, SK_HighA=1; show the compact contracted orbit | ~15 s |
| 5 – SK_NearP | Set SK_HighA=0, SK_NearP=1; show the near-periodic large loop | ~20 s |

**Total target:** ≈ 2 min (edit down in post; trim leading/trailing dead space).

## OBS scene setup

1. Sources → Add → Window Capture → select `Blender`.
2. Filters on the source → Crop/Pad to remove OS window chrome if needed.
3. Output → Recording → File Path → set to the `screen.mp4` target path above.
4. Start recording → perform the Blender demo steps above → Stop recording.

## Post-processing (optional but recommended)

```bash
ffmpeg -i screen_raw.mp4 \
  -vf "scale=1920:1080,fps=30" \
  -c:v libx264 -crf 23 -an \
  screen.mp4
```

Drop the `-an` flag and add `-c:a aac -b:a 128k` only if narration was added.
