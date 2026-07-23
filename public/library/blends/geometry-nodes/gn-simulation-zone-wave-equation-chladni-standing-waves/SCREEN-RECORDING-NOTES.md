# Screen Recording Notes — Chladni Wave / 2D Wave Equation

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-wave-equation-chladni-standing-waves/screen.mp4`

## OBS Studio settings

| Setting       | Value                                |
|---------------|--------------------------------------|
| Source        | Window Capture — Blender             |
| Resolution    | 1920 × 1080                          |
| FPS           | 30                                   |
| Encoder       | NVENC H.264 (or x264 CRF 18)        |
| Audio         | Disabled                             |

## Steps

1. Open `hf_chladni_wave.blend` in Blender 5.1.
2. Set the **Viewport Shading** to **Rendered** (EEVEE Next) so the emission
   glow and bloom are visible. Enable **Bloom** in the EEVEE render properties
   if not already on.
3. Switch the editor to a top-down **Camera** view (`Numpad 0`).
   The plate should fill most of the frame.
4. Scrub the timeline to **frame 1** (plate at maximum displacement, bright
   peaks and troughs, black nodal cross clearly visible).
5. Start OBS recording. Press **Space** to play the animation.
   Let it run to **frame 120** (~2.7 oscillation cycles).
6. Stop OBS recording. Trim to 120 frames if needed.

## What to capture

- **Frame 1:** Peak displacement — bright blue trough regions, bright
  orange/white peak regions, black cruciform nodal lines between them.
- **Frames 1–22:** First oscillation cycle. Plate glows blue, fades through
  black (nodal crossing ~frame 11), then re-emerges as orange/red. The nodal
  line positions never shift — only the sign of displacement reverses.
- **Frames 44–88:** Second and third cycles showing the standing wave is
  perfectly periodic with no drift.

## Troubleshooting

- If the plate is flat (no Z displacement), check that the Simulation Zone
  has been baked at least one step. Press **Space** to advance one frame first.
- If colours look wrong, verify that **Viewport Shading → Rendered** is active
  and the EEVEE engine is selected.
- Bloom not visible: Enable `Scene → EEVEE → Bloom` and set threshold ≤ 0.3,
  intensity ≥ 0.5.
