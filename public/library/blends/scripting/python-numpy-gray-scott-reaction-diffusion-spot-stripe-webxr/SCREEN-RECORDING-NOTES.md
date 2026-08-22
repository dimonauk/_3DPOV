# Screen Recording Notes — Gray-Scott Reaction-Diffusion

**Target file:** `public/library/videos/scripting/python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr/screen.mp4`

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 — Scripting workspace |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (silent recording) |
| Output format | MP4 / H.264 |

## What to Record

**Duration target:** 90–120 seconds

1. **Open Blender** — Scripting workspace. Open `blueprint.py` in the Text Editor.
2. **Narrate the parameters** — pan camera over the constant block. Point out:
   - `DU = 0.16, DV = 0.08` — substrate vs activator diffusivity (ratio 2:1)
   - `F_RATE = 0.060, K_RATE = 0.062` — Turing-spot regime
3. **Run the script** — Click ▶ Run Script. The terminal overlay should show:
   ```
   Running Gray-Scott simulation …
      V ∈ [0.0000, 0.2341]
   ✓  //hf_gray_scott.glb written
   ```
   Note: 10 000 steps on a 128×128 grid takes 8–20 s on a modern CPU.
4. **Switch to 3D Viewport** — orbiting around the displaced mesh. Toggle between
   Solid (flat-shaded facets) and Material Preview (vertex colour) to show the
   spot pattern in two displays.
5. **Show parameter variant** — change `F_RATE = 0.035` and `K_RATE = 0.060`,
   re-run, note the pattern shift from spots to stripe labyrinths.
6. **Export confirmation** — File → Export → glTF 2.0, verify `hf_gray_scott.glb`
   appears in the output path.

## Editing Notes

- Cut the simulation wait time to 3 s using a jump-cut (crossfade or smash cut).
- Add a lower-third title card: "Gray-Scott Reaction-Diffusion | Blender 5.1"
- Final frame: orbit around the finished mesh, fade to black.
