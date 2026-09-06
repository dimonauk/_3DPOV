# Screen Recording Notes — Anishchenko–Astakhov Oscillator

## Goal
Capture `screen.mp4`: a 1080p 30 fps screen recording of Blender's 3D viewport
showing the attractor tube being built and the shape-key morphs applied.

---

## OBS Setup

| Setting               | Value                          |
|-----------------------|-------------------------------|
| Source type           | Window Capture → Blender       |
| Resolution            | 1920 × 1080                    |
| Frame rate            | 30 fps                         |
| Encoder               | x264 (CRF 18) or NVENC         |
| Audio                 | OFF (no audio needed)           |
| Output format         | MP4 (H.264)                    |

---

## Blender Viewport Settings

1. Open `hf_aa_poi.blend`.
2. Set viewport shading → **Material Preview** (Sphere icon, hotkey `Z → 3`).
3. Enable **Viewport Bloom**: Overlays dropdown → tick "Bloom".
4. Zoom to fit the attractor (numpad `.` with object selected).
5. Set viewport background to **Very Dark Grey** (Viewport Shading → Background → 0.05).

---

## Recording Script

1. **Seconds 0–5** — Scrub through the timeline slowly (drag playhead from frame 1 to
   240) to show the shape-key morph: chaotic → ordered → large chaotic → flat.
2. **Seconds 5–8** — Manually orbit the viewport (middle-mouse drag) to show the 3D
   structure of the attractor from side, top, and 45° views.
3. **Seconds 8–12** — Open the Properties panel (N key), expand Shape Keys, and click
   between Basis / SK_LowM / SK_HighM / SK_LowG to show discrete morph steps.
4. **Seconds 12–15** — Return to Basis, do a slow orbit to end.

---

## Editing Notes

- Trim to exactly 15 s; 30 fps → 450 frames.
- No fade-in/out needed; the raw viewport recording is sufficient.
- Export filename: `screen.mp4`, place in the `videos/` folder alongside `viewport.mp4`.

---

## Output Path

```
public/library/videos/scripting/
  python-numpy-anishchenko-astakhov-oscillator-1983-self-excited-inertial-nonlinearity-heaviside-chaos-rk4-bishop-tube-poi-webxr/
    screen.mp4
```
