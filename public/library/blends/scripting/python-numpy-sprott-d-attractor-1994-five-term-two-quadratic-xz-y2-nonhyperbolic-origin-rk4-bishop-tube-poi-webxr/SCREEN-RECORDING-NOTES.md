# Screen-Recording Notes — Sprott D Attractor (Blender 5.1)

Target file: `public/library/videos/scripting/python-numpy-sprott-d-attractor-1994-five-term-two-quadratic-xz-y2-nonhyperbolic-origin-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software

| Tool | Settings |
|------|----------|
| OBS Studio ≥ 30 / Xbox Game Bar | Window capture: **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (voice-over added in post) |
| Encoder | x264 / NVENC — CRF 18 or equivalent |

## What to record (approx. 6–8 min)

### Part 1 — The key idea (2 min)
1. Open a fresh Blender 5.1 project.
2. In the Scripting workspace, open `blueprint.py`.
3. Scroll to the fixed-point analysis in the docstring.
4. Point out: **eigenvalues are 0, +i, −i** — not a Shilnikov saddle-focus.
   Compare verbally to Sprott F (which has λ = −1, 0.25 ± 0.968i).
5. Highlight the position-dependent divergence: `∇·F = x`.
   Explain that this means the system breathes — expanding where x > 0,
   contracting where x < 0 — unlike the constant-divergence Sprott B or F.

### Part 2 — Blueprint run (2 min)
6. Press **Run Script** (`Alt+P`).
7. Watch the console for `[SprottD] Integrating Basis…` progress lines.
8. Switch to 3D Viewport → Render Preview (Z key).
9. Tumble around the attractor.  Note how space-filling it looks compared
   to Sprott F or Sprott C — this reflects the high D_KY ≈ 2.669.

### Part 3 — Shape-key sweep (2 min)
10. Properties → Object Data → Shape Keys.
11. Scrub through:
    - `Basis` (b=3.0): canonical attractor — writhing, space-filling.
    - `SK_LoB` (b=1.5): orbit pulls inward, becomes more regular.
    - `SK_HiB` (b=5.0): orbit expands, longer excursions in y and z.
    - `SK_ExB` (b=8.0): very large orbit — note the long lobes in z.
12. Linger on SK_ExB and explain that large b amplifies the y²-restoring
    force, driving the orbit further from the origin each cycle.

### Part 4 — Export for WebXR (1 min)
13. File → Export → glTF 2.0.
14. Enable: Apply Modifiers, Include Shape Keys, Draco compression level 6,
    WebP textures.
15. Save as `hf_sprott_d_poi.glb`.

## Editing notes
- Title card: "Sprott D Attractor — Non-Hyperbolic Origin · Blender 5.1"
- B-roll: use `viewport.mp4` picture-in-picture during the theory section.
- A comparison cut to Sprott F's Shilnikov eigenvalue table (from its
  tutorial) makes the contrast tangible.
- No background music required; the technique focus carries the video.
