# Screen Recording Notes — Arnold's Cat Map Poi Disc

## Setup before recording

1. Run `blueprint.py` in the Blender Scripting editor (Run Script).
2. Switch to **Layout** workspace. Select the `hf_arnold_cat` disc object.
3. Set viewport shading to **Material Preview** (sphere icon in header, or Z → Material).
4. Set 3D viewport to the top-left quadrant of a **Quad View** (Numpad 5 → toggle Perspective).
5. Set the main viewport to **Camera** view (Numpad 0) and tumble to a 3/4 top-down view.

## OBS / Game Bar settings

| Setting        | Value                        |
|----------------|------------------------------|
| Window source  | Blender (application window) |
| Resolution     | 1920 × 1080                  |
| Frame rate     | 30 fps                       |
| Audio          | OFF                          |
| Output         | `screen.mp4`                 |

## What to capture (≈ 90 seconds)

### Part 1 — The flat torus (0:00–0:20)
- Start with all shape keys at 0 (Basis — flat disc).
- In the **Item** panel (N panel), drag `SK_Step1 → 0 → 1` slowly.
- Narrate: "This is K=1 — one application of M = [[2,1],[1,1]]."

### Part 2 — Scrambling deepens (0:20–0:55)
- Return SK_Step1 to 0. Fade up SK_Step2 (Fibonacci matrix M² = [[5,3],[3,2]]).
- Then SK_Step3 (M³ = [[13,8],[8,5]]) — pause here; the golden-ratio ridge pattern is clearest.
- Pan camera to look straight down (Numpad 7 → Orthographic).

### Part 3 — Fibonacci in the matrices (0:55–1:10)
- Cut to the Scripting editor; scroll to the FIBONACCI CONNECTION docstring.
- Highlight the M^k row: 1→1→2→3→5→8→13→55→89…

### Part 4 — Unstable manifold curve (1:10–1:30)
- Back to Layout. Select `hf_arnold_cat_unstable_mfd` (the amber curve object).
- Rotate viewport to show the golden-ratio lines wrapping the disc.
- Narrate: "Every line has slope 1/φ; it is dense on the torus."

## Naming

Save the recording as `screen.mp4` in the same folder as this file.
