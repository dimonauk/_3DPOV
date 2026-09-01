# Screen-Recording Notes — Abelian Sandpile SOC Stage Floor

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

1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py` in the Text Editor. Press **Run Script**.
   Watch the console — it prints progress for each of the four shape keys.
   Computation takes 5–30 seconds depending on hardware.
3. Switch to **Layout** workspace. Select `Sandpile_SOC`.
4. Open **Properties → Object Data → Shape Keys** panel.
   Confirm four keys: `Basis`, `SK_Sparse`, `SK_Dense`, `SK_Cross`.
5. Press **Numpad 7** (top view) → **Numpad 5** (orthographic toggle).
6. **Start OBS recording.**
7. Show the Basis shape (cobalt-amber diamond fractal overhead) for 3 seconds.
   — Point out the four-fold D₄ symmetry and the nested diamond zones.
8. Slowly drag `SK_Dense` influence from 0 → 1 over 5 seconds.
   — The pile grows outward; near the edges it is **truncated** by the grid
     boundary (chips fall into the absorbing sink). Explain finite-size effects.
9. Drag `SK_Dense` back to 0. Drag `SK_Cross` influence from 0 → 1.
   — Four circular piles appear at ±20 cells from centre. Where they overlap,
     interference fringes form — the Abelian property guarantees the overlap
     zone equals the sum of the two independent piles (mod toppling).
10. Press **Numpad 4** a few times to orbit left and show 3-D height relief.
11. **Stop OBS recording.**
12. Trim to ≤ 20 seconds and export as H.264 MP4.

## What to Highlight While Recording

- **Basis** — four-fold symmetry: rotate the view and show that the pattern
  looks identical under 90° rotation. Point out the alternating cobalt /
  amber concentric diamond rings (they mark integer chip-count boundaries).
- **SK_Dense** — growing pile hits the grid edge: the pile is cut off sharply
  at the boundary. Chips that would have continued outward are absorbed. This
  is the physical "finite-size" effect — in an infinite grid the pile would
  keep growing as a smooth disc.
- **SK_Cross** — overlapping piles: hold `SK_Dense` at 0, raise `SK_Cross` to
  1. Show the four circular piles meeting in the middle. The contact zone shows
  interference because both piles try to share the same cells — the stable
  resolution is computed exactly by the Abelian toppling rule.

## Voiceover Cue Cards (optional)

> "This is the Abelian Sandpile, discovered in 1987 by Bak, Tang and Wiesenfeld.
> Every time a cell accumulates four grains it fires — passing one grain to each
> neighbour. The remarkable thing: the system never needs tuning to reach this
> fractal state. It finds criticality on its own."

> "The pattern has exact four-fold symmetry — rotate it 90 degrees and it looks
> the same. The boundary between 2-chip and 3-chip regions forms a fractal with
> Hausdorff dimension about 1.78 — halfway between a curve and a surface."

> "When I switch to SK_Cross — four separate piles — you can see them interact
> at the edges. The overlap is mathematically precise: the Abelian property
> guarantees the result is identical regardless of the order in which the
> grains toppled."
