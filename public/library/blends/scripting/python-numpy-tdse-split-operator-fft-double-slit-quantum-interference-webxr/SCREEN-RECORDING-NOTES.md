# Screen-Recording Notes — TDSE Double-Slit Quantum Interference

## OBS / Windows Game Bar setup

- Capture: Blender window only (not desktop — hides personal data)
- Resolution: 1920×1080 @ 60fps
- Codec: H264, CRF 18 (high quality for the coloured interference pattern)
- Audio: mute system audio; record voiceover separately

## Recording guide (7 steps)

1. **Open Blender** → Scripting workspace → load `blueprint.py`.
2. **Explain the split-operator method**: highlight the three `exp_*` arrays and
   the two-FFT2 structure in `step()`.  Show that DT = 0.01 is just a knob —
   not a stability limit.
3. **Run the script** (▶).  While the terminal logs norm values, point to them:
   "norm staying at 1.000… means no amplitude is leaking out — the method is
   exactly norm-conserving."
4. **Switch to 3D Viewport** → Material Preview.  Pan to see the flat displaced
   grid from above.  The horizontal bands behind the centre wall are the
   interference fringes.  Point to the barrier (grey strip) and the two open slits.
5. **Orbit to a 45° angle** to see the displacement — the probability density peak
   is where the wavepacket transmitted through the slits.
6. **Open record.py**, run, then press Ctrl+F12 (Render Animation) to produce
   `viewport.mp4`.  The animation shows the bright Gaussian blob approaching,
   splitting at the slits, and forming the fringe pattern.
7. **Inspect the GLB** in Three.js Viewer or Babylon.js playground:
   `material.vertexColors = true` — the phase-coloured fringes appear directly.

## Editing notes (post-production)

- Jump-cut the simulation wait (step 3) if runtime > 10 s.
- Add a lower-third title: "TDSE · Split-Operator FFT · Blender 5.1".
- Overlay Young's fringe spacing formula as a text card during step 4:
  `Δy = λD/d  ≈  1.57 (≈ 4 fringes in domain)`.
- Export two cuts: `viewport.mp4` (simulation run) and `screen.mp4` (full
  scripting walkthrough with voiceover).
