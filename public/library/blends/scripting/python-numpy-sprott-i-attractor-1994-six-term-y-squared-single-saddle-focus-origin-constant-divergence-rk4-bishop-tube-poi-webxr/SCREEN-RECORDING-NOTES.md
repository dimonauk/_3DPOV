# Screen-Recording Notes — Sprott I Attractor

**Target file:** `public/library/videos/scripting/python-numpy-sprott-i-attractor-1994-six-term-y-squared-single-saddle-focus-origin-constant-divergence-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 | Window Capture → Blender 5.1 |
| Game Bar (Windows) | Win + Alt + R on Blender window |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** — no microphone needed for silent library capture |
| Encoding | x264, CRF 20, MP4 container |

## What to Capture

1. **Open Blender 5.1.** New file → scripting workspace.
2. **Load blueprint.py** in the Text Editor. Run script with Alt+P.
   - Wait for completion (~30–60 seconds depending on machine).
3. **Switch to 3D Viewport** — Workbench render mode, Vertex Colour shading.
   - The tube should appear as a deep-blue coil with amber highlights at the fast arcs.
4. **Start recording**, then:
   - Orbit the viewport with Middle-Mouse drag to show the 3-D structure.
   - Press N → Shape Keys → drag the SK_LowA value slider from 0→1, then back.
   - Drag SK_HighA 0→1 and back — observe the orbit tighten noticeably.
   - Drag SK_NearBif 0→1 — orbit compresses further.
5. **Stop recording** at roughly 60–90 seconds.
6. Trim to 10–15 seconds of the most interesting morph. Export as `screen.mp4`.

## Key Visual Moments to Catch

- The **initial coil** at Basis (a=0.20): a moderately-sized, asymmetric tube
  with an obvious near-origin passage visible as a deep-cobalt hairpin.
- The **wider orbit** at SK_LowA (a=0.10): the tube expands — lower coupling
  gives trajectories more room before the y² term folds them back.
- The **contracted orbit** at SK_HighA (a=0.35): the loop tightens, and the
  single fixed point at the origin becomes visually dominant.
- The **near-bifurcation** morphology at SK_NearBif (a=0.50): the orbit is
  noticeably smaller; one more shape-key step would approach the Hopf boundary.

## Notes

- The **Sprott I system has no second fixed point** (unlike Sprott C, O).
  The tube never self-intersects at a secondary focus — show this by panning
  slowly around the origin during recording.
- Cobalt → amber colour mapping encodes instantaneous speed: the **hairpin
  near the origin** is always dark blue (slow passage); fast arcs are amber.
- If the tube appears black, check that Workbench shading is set to
  **VERTEX** colour mode, not Material or Solid.
