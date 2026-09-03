# Screen Recording Notes — Sprott G Attractor
**For screen.mp4 · OBS Studio / Windows Game Bar**

## Setup checklist

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration track needed) |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps (high motion — the tube morphs) |

## Blender window prep

1. Open `hf_sprott_g_poi.blend` (or run `blueprint.py` first to generate it).
2. Set **Viewport Shading → Material Preview** (shortcut: `Z → 5`).  
   The cobalt→amber gradient on the tube must be visible.
3. Maximise the 3D Viewport (`Numpad 5` for orthographic, then `Numpad 5` again
   for perspective; press `F11` or drag the corner to fill the screen).
4. Press `Numpad 0` to look through the default camera, or orbit to show the
   leaf-scroll from a 3/4 oblique angle (roughly 30° elevation, 45° azimuth).
   The poi head and the tube's tight inner loop should both be visible.
5. Turn off the header bar (`View → Show Header`) and the overlay gizmo
   (`Viewport Overlays → uncheck all`) so the video is clean.

## What to capture

| Segment | Frames | Action |
|---------|--------|--------|
| Static orbit | 0–5 s | Slow manual orbit around the Basis attractor |
| Shape key Basis | 5–8 s | Pause on the canonical a=0.40 leaf-scroll |
| Morph to SK_LowA | 8–12 s | Use Shape Keys panel: drag SK_LowA value 0→1 |
| Morph to SK_HighA | 12–16 s | Drag SK_HighA value 0→1; note wider orbit |
| SK_NearCons | 16–20 s | Drag SK_NearCons 0→1; show expanded near-conservative ring |
| Final zoom | 20–25 s | Dolly in on the poi head; end on cobalt-core close-up |

Total target: **25 s** (trim to taste).

## OBS scene collection

```
Scene: SprottG_Screen
  Sources:
    [1] Window Capture  — Blender  (top layer)
    [2] Text GDI+       — "Sprott G Attractor · Blender 5.1 · hf_sprott_g_poi"
                          (bottom-left corner, 24pt, white, 80% opacity)
```

## Post-processing (optional)

- Cut the first 1 s (OBS start lag).
- Colour-grade: slight S-curve to pop the cobalt against the dark background.
- Save to `public/library/videos/scripting/
  python-numpy-sprott-g-attractor-1994-leaf-scroll-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`.

## Troubleshooting

**Tube invisible in Material Preview** — check that `SprottG_Speed` colour
attribute is present (`Object Data Properties → Color Attributes`).

**Viewport stutters during shape key drag** — the 3 000×8 = 24 000 vertex
mesh is heavy for real-time CPU deformation; reduce TUBE_SIDES to 6 in
`blueprint.py` and re-run for a lighter preview mesh.

**Wrong aspect ratio** — OBS canvas must be 16:9 before starting capture.
Go to `Settings → Video → Output Resolution → 1920×1080`.
