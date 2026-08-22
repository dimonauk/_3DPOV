# Screen Recording Notes — Procedural Wood Grain Shader

## Setup

**Software:** OBS Studio (free) or Windows Game Bar (`Win + G`)
**Source:** Window Capture → select the Blender 5.1 window
**Resolution:** 1920 × 1080
**Frame rate:** 30 fps
**Audio:** Off (no mic needed unless narrating)

---

## What to record

### Part 1 — Running the blueprint (2–3 min)

1. Open Blender 5.1. Close the splash screen.
2. Switch to the **Scripting** workspace (top menu bar).
3. Create a new text block, paste `blueprint.py`, click **Run Script**.
4. Switch to the **3D Viewport**, set shading to **Material Preview** (press `Z` → Material
   Preview, or click the sphere icon top-right of viewport).
5. You should see a long rectangular plank with visible wood grain rings and a soft
   sheen along the grain direction.

### Part 2 — Demonstrating the anisotropic highlight (4–5 min)

The most striking effect is the **anisotropic highlight band** — a bright stripe that
runs parallel to the grain and sweeps as you change the viewing angle.

6. Hold **middle mouse** and orbit the viewport slowly from directly overhead (numpad 7)
   down to a nearly side-on view (numpad 1 then tilt slightly up).
7. As you approach the grazing angle, you should see a bright band appear across the
   plank surface — this is the Principled BSDF v2 Anisotropic highlight.
8. Move your cursor left/right while holding middle mouse (azimuth orbit) — the bright
   band shifts from one side of the grain to the other.
9. Explain: on an isotropic material (Anisotropic=0), the highlight forms a radially
   symmetric blob.  On an anisotropic material (Anisotropic=0.68), it flattens into a
   band aligned with the tangent direction — the grain axis.

### Part 3 — Face grain, edge grain, end grain comparison (3 min)

10. Rotate the plank view to show the three cross-sections:
    - **Numpad 1** (front): face-grain view — long wavy horizontal grain lines.
    - **Numpad 3** (side): edge-grain view — tight nearly-straight grain lines.
    - **Numpad 7** (top): top view — edge grain from above; note the grain lines
      appear very close together and nearly parallel.
    - **Numpad Ctrl+3**: end-grain view — the cut end of the plank; grain appears
      as short arcs (the ring pattern on the small face).
11. Explain the difference: face grain shows wide, wavy rings; end grain shows
    the annual ring cross-section; edge grain shows tight parallel lines.

### Part 4 — Shader Editor walkthrough (5–6 min)

12. Open the **Shader Editor** alongside the 3D viewport (drag the viewport border or
    use the `+` icon in the top bar to add a new editor area).
13. Walk through the node graph left to right:
    - **TexCoord → Object**: why Object space and not UV — scale-invariant, consistent
      across all faces.
    - **VectorMath MULTIPLY** (scale node): show how changing the Z component of the
      scale vector (currently ~0.84 = 14 × 0.06) compresses the Z axis and stretches
      the ring pattern into grain lines.  Change Z scale to 14.0 (no compression) —
      you get round blobs instead of grain.  Restore it.
    - **Noise (distortion)** + **VectorMath SCALE** + **VectorMath ADD**: the coordinate
      perturbation chain.  Change DISTORT_STRENGTH from 0.38 to 0.0 — perfectly straight
      parallel bands (unrealistic, machine-cut look).  Set it to 0.8 — chaotic, grain
      folds back on itself.  Restore.
    - **Wave Texture (BANDS, X)**: the ring generator.  Change `bands_direction` from
      `X` to `Y` — grain runs perpendicular (wrong for the plank's long axis).  Change
      `wave_profile` from `SIN` to `TRI` — flatter-topped rings, denser look.  Restore both.
    - **ColorRamp**: the dark/light/mid/dark cycle.  Change earlywood colour from amber
      to greenish to show the ramp controls the wood species look.
    - **Noise (fibre)** + **MapRange**: roughness variation.  Disconnect MapRange from
      PBSDF Roughness and plug in a constant 0.3 — the plank looks uniformly smooth,
      no fibre texture.  Reconnect.
    - **Tangent (UV_MAP)** → **Principled BSDF Tangent**: disconnect Tangent — the
      anisotropic highlight becomes circular (no preferred direction).  Reconnect and
      the highlight band reappears along the grain axis.

### Part 5 — Live parameter tuning (3 min)

14. Change `ROUGHNESS_BASE` in the parameters block from 0.30 to 0.15 — polished
    lacquered parquet look.
15. Change `ANISOTROPY` from 0.68 to 0.90 — very pronounced grain highlight, almost
    like a mirror band.
16. Change `RING_FREQ` from 14.0 to 6.0 — coarser ring pattern (old-growth oak with
    wide annual rings).  Re-run script.

### Part 6 — GLB export note (1 min)

17. Explain that the GLB export writes `KHR_materials_anisotropy`.  Open the exported
    GLB in a model viewer that supports KHR_materials_anisotropy (e.g. model-viewer or
    Three.js r153+ demo) to show the anisotropy is preserved in real-time 3D.

---

## File naming

```
public/library/videos/shading/shader-procedural-wood-grain/screen.mp4
```

---

## Duration target

14–18 minutes.  The anisotropic highlight demonstration and the shader walkthrough are the
core sections — spend at least 4 minutes on each.  Viewers will scrub back repeatedly to
compare with/without Tangent and with/without distortion.
