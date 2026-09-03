# Screen-Recording Notes — Sprott F Attractor (Blender 5.1)

Target file: `public/library/videos/scripting/.../screen.mp4`

## Software

| Tool | Settings |
|------|----------|
| OBS Studio ≥ 30 / Xbox Game Bar | Window capture: **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (tutorial voice is added in post) |
| Encoder | x264 / NVENC — CRF 18 or equivalent |

## What to record (approx. 5–8 min)

### Part 1 — Theory (2 min)
1. Open a fresh Blender 5.1 project.
2. In Scripting workspace, show the `blueprint.py` file open.
3. Walk through the docstring maths:
   - Show the three equations on screen.
   - Highlight the constant divergence line (`∇·F = a − 1 = −0.5`).
   - Point out the two equilibria: O and P = (−2, −4, 4).
   - Read out the Shilnikov condition: |λ_r| = 1.0 > Re(λ_c) = 0.25.

### Part 2 — Blueprint run (2 min)
4. Click **Run Script** (`Alt+P`).
5. Show the Console panel — progress prints appear.
6. Switch to 3D Viewport, Render Preview (Z).
7. Tumble around the attractor to show the cobalt–amber tube.

### Part 3 — Shape-key sweep (2 min)
8. In Properties → Object Data → Shape Keys, scrub through:
   - `Basis` (a=0.50): two-wing writhing orbit.
   - `SK_LoA` (a=0.25): broader, slower windings.
   - `SK_HiA` (a=0.75): tighter, faster spiral near origin.
   - `SK_NearCons` (a=0.92): near-conservative loosening.
9. Play the timeline while a shape key is active to show animation.

### Part 4 — Export for WebXR (1 min)
10. File → Export → glTF 2.0.
11. Check: **Apply Modifiers**, **Include Shape Keys**, Draco level 6, WebP.
12. Save as `hf_sprott_f_poi.glb`.

## Editing notes
- Add B-roll: the rendered `viewport.mp4` can be shown picture-in-picture
  during the theory section.
- Recommended title card: "Sprott F Attractor — Blender 5.1 Python scripting"
- No background music needed; the focus is the technique.
