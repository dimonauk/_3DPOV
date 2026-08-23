# Screen-Recording Notes — Sinai Billiard Stage Floor

Capture a human-readable screen recording of the stage-floor GLB in Blender's
viewport so the tutorial has a real `.mp4` companion to the procedural
`viewport.mp4` produced by `record.py`.

---

## Software

| Tool | Setting |
|------|---------|
| **OBS Studio** (preferred) or Xbox Game Bar | Window source = Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (capture is visual only) |
| Output format | `.mp4` / H.264 CRF 23 |

---

## File destination

Place the finished file at:

```
public/library/videos/scripting/
  python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr/
  screen.mp4
```

---

## What to capture (suggested script, ~90 s)

1. **0–10 s** Open `sinai_floor.blend`. In the Outliner show the
   `sinai_floor` mesh. Hover over it so the name reads clearly.

2. **10–25 s** Enter **Solid** viewport shading; orbit the stage floor
   slowly 360°. Point out: the surface is nearly flat (Sinai billiard
   has a uniform ergodic measure) with small density fluctuations visible
   as subtle hills and valleys.

3. **25–45 s** Switch to **Material Preview** (HDRI ball icon). The
   cobalt-to-amber gradient appears. Slowly orbit again — note where
   amber peaks cluster (high-density arcs) vs cobalt plains (low-density
   channels between resonances).

4. **45–60 s** Open the **Properties panel → Object Data → Attributes**.
   Show the `SinaiDensity` FLOAT\_COLOR POINT attribute. Explain: each
   vertex colour is interpolated from the Birkhoff-coordinate density
   histogram.

5. **60–80 s** Switch to the **Spreadsheet Editor** (top-right corner of a
   split viewport). Filter to Vertex → show the Z column. Highlight the
   dynamic range: `z ≈ 0.0` (empty cells) up to `z = 0.38 m` (densest arc).

6. **80–90 s** Back to Material Preview, quick final 180° orbit, then pause
   on the angled view used in the thumbnail.

---

## OBS settings reminder

- Source: **Window Capture** → Blender 5.1
- Audio: **Muted** (no mic, no desktop audio)
- Hotkeys: Start `Ctrl+Alt+R`, Stop `Ctrl+Alt+S` (OBS defaults)
- Bitrate: 8 000 kbps or CRF 23 (whichever encoder you use)

---

*Refer to `/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export`
for the full VSE workflow that turns this `.mp4` into a polished tutorial clip.*
