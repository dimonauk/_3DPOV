# Screen-Recording Notes — Zaslavsky Stochastic Web

**Target file**: `public/library/videos/scripting/<slug>/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 / NVENC H.264 |
| Rate control | CRF 18 |
| Audio | Disabled |

## Recording Procedure

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Load `blueprint.py` in the Text Editor. Press **Run Script**
   (Blender prints "Done — 32 400 vertices, 4 shape keys." to the Info bar).
3. Switch to the **Layout** workspace. Select `Zaslavsky_Web`.
4. Open the **Properties → Object Data → Shape Keys** panel.
   You will see: `Basis`, `SK_Q3`, `SK_Q6`, `SK_Q5`.
5. **Start OBS recording.**
6. In the Blender viewport:
   - Numpad 7 → top view. Numpad 5 → orthographic toggle.
   - Hold the stage floor in view for ~3 seconds
     (this is the q=4 square web — note four-fold crossing arms).
   - Slowly scrub the `SK_Q3` influence from 0 → 1 over 5 seconds
     (triangular corridors replace the square grid).
   - Hold for 2 seconds.
   - Scrub `SK_Q5` from 0 → 1 over 5 seconds
     (aperiodic quasi-crystal web appears — five arms, no translational repeat).
   - Press Numpad 4 a few times to orbit left, showing the height relief.
7. **Stop OBS recording.**
8. Trim the clip to 15–20 seconds and export as H.264 MP4.

## What to Highlight While Recording

- **q=4 (Basis)**: four straight corridors at 90° — point at the cross-shaped
  intersections that tile the plane like a square lattice.
- **SK_Q3**: three corridors at 120° — the floor shifts from square to
  triangular symmetry (Y-shaped junctions tile like a honeycomb dual).
- **SK_Q5**: five-arm stars with NO repeating unit cell — draw the viewer's
  attention to the fact that following any arm never brings you back
  to the exact same pattern. This is the same non-periodicity as a Penrose tiling,
  arising here from dynamics rather than geometry.

## Voiceover Cue Cards (optional)

> "This is the Zaslavsky stochastic web. A tiny particle kicked periodically in
> a magnetic field traces out exactly this fractal corridor network — and can
> diffuse through it forever without repeating its path."

> "When I change q from 4 to 5, the square symmetry breaks and a genuine
> quasi-crystal pattern emerges. No unit cell, no periodicity — exactly like
> the Penrose tiling but arising from chaos, not geometry."
