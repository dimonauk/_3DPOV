# Screen Recording Notes — Rössler Hyperchaos (1979)

OBS / Game Bar capture of the Blender viewport producing `screen.mp4`.

## Setup

| Setting         | Value                        |
|-----------------|------------------------------|
| Source          | Window Capture → Blender     |
| Resolution      | 1920 × 1080                  |
| Frame rate      | 30 fps                       |
| Audio           | Off (mute mic + desktop)     |
| Output format   | MP4 / H.264 / High quality   |
| Output filename | `screen.mp4`                 |

## Steps to record

1. Open Blender 5.1 and load `rossler_hyperchaos_poi.blend`
   (or run `blueprint.py` from the Blender scripting workspace first).
2. Set the viewport to **Solid** mode, theme **Dark**; turn on
   **MatCap → Clay** so the tube surface reads clearly.
3. Start OBS → **Start Recording**.
4. In Blender's 3D Viewport press **Numpad 0** (camera view).
5. Press **Spacebar** to play the timeline (frames 1–240 at 30 fps).
   - Watch the cobalt-to-amber colour gradient cycle through the
     three shape-key variants (Basis → SK_WeakHyper → SK_Regular → Basis).
   - Commentary cue-points:
     - **F001–060** "Canonical hyperchaos: two positive Lyapunov exponents
       simultaneously — λ₁ ≈ +0.135, λ₂ ≈ +0.032."
     - **F060–090** crossfade: attractor visibly thinning as d drops to 0.02.
     - **F090–140** "SK_WeakHyper — barely above the hyperchaos threshold.
       Second exponent λ₂ → 0; topology nearly collapses to a 3D set."
     - **F140–170** crossfade to SK_Regular (d=0): "ordinary chaos regime."
     - **F170–210** "SK_Regular — single positive LE like the 1976 Rössler.
       Compare the band: thinner, less spread in the w direction."
     - **F210–240** return to Basis; cobalt crown reappears.
6. Stop recording when the timeline reaches frame 240.
7. Save `screen.mp4` beside this file.

## Tip: show the fourth dimension

Before recording, open the `Hyper_W` FLOAT_COLOR attribute in the
**Spreadsheet** editor (Object Data Properties → Attributes) to demonstrate
the w-coordinate encoding.  Then switch to the **Vertex Paint** workspace
so the cobalt-amber gradient is visible in the viewport.
