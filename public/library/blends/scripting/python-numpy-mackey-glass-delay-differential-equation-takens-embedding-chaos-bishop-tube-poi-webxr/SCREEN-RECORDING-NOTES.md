# Screen-Recording Notes — Mackey–Glass DDE

## Goal
Capture a 1920 × 1080 @ 30 fps screen recording of the Blender 5.1 session as
you run `blueprint.py`, scrub the timeline, and toggle shape keys — this
becomes `screen.mp4` alongside the automated `viewport.mp4`.

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Capture source | Window capture → **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no voiceover needed) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-numpy-mackey-glass-delay-differential-equation-takens-embedding-chaos-bishop-tube-poi-webxr/screen.mp4` |

---

## Recording sequence (≈ 2–3 minutes)

1. **Open Blender 5.1.** New → General. Resize to fill your 1920 × 1080 monitor.
2. **Start recording.**
3. Open the **Scripting** workspace.  Load `blueprint.py`.
4. Press **Run Script** and let it finish (watch the terminal for "blueprint complete").
5. Switch to the **Layout** workspace.  The poi head appears in the viewport.
6. Orbit the viewport slowly with middle-mouse-drag to show the attractor shape.
7. Open the **Properties** panel → Object Data → **Shape Keys**.  
   - Set `SK_HighTau` to 1.0 and back to 0.0 — notice how the orbit becomes more complex.
   - Set `SK_VeryHiTau` to 1.0 — the attractor fills more volume (D_KY ≈ 3.4).
   - Set `SK_Periodic` to 1.0 — the orbit collapses to a limit cycle (τ = 8).
   - Return `Basis` to 1.0.
8. Switch to **Material Preview** shading mode (Z → Material Preview) so the
   cobalt-to-amber gradient is visible.
9. **Stop recording.**

---

## Post-processing
No colour grading required.  Trim 2–3 s of dead air at start/end.
Target final duration: 90–150 s.
