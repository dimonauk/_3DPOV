# Screen Recording Notes — Moore-Spiegel Oscillator

## Target file
`public/library/videos/scripting/python-numpy-moore-spiegel-oscillator-1966-stellar-convection-nonlinear-jerk-chaos-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software
OBS Studio (Windows/macOS/Linux) or Xbox Game Bar (Windows 11, Win+G).

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Output format | MP4 (H.264) |
| Audio | **Off** (silent tutorial) |
| Bitrate | 8 000 kbps |

## What to record

### Part 1 — Blueprint walkthrough (~2 min)
1. Open Blender 5.1. New General scene.
2. Switch to the **Scripting** workspace.
3. Text Editor → Open → select `blueprint.py`.
4. Scroll through `msp_deriv` — pause on the sign-switching comment for
   the nonlinear damping term.  Explain the energy-injection / saturation split.
5. Press **Run Script** (▶). Integration takes 20–40 s on a mid-range CPU.
6. Switch to **3D Viewport** (Numpad 5, Middle-Mouse to orbit).
7. Switch Viewport Shading → **Vertex Colours** (sphere icon → Color: Vertex).
   The cobalt-to-amber gradient shows energy-injection vs saturation zones.

### Part 2 — Shape key demo (~90 s)
1. Select `MooreSpiegel_Amp`. Object Data Properties → Shape Keys.
2. Set `SK_Periodic` to 1.0 → attractor collapses to a clean limit cycle (R=12).
   Narrate: "Weaker convective drive — saturation wins, giving periodic oscillation."
3. Set to 0, `SK_Dense` to 1.0 → denser attractor (R=28, stronger drive).
4. Set to 0, `SK_HighT` to 1.0 → altered topology (T=9, stiffer thermal restoring).
5. Return all to 0 / Basis.

### Part 3 — GLB export (~45 s)
1. File → Export → glTF 2.0.
2. ✓ Draco Compression (level 6), ✓ WebP Textures,
   ✓ Include → Morph Targets, ✓ Include → Vertex Colors.
3. Export to `public/library/glbs/scripting/<slug>/hf_moore_spiegel_poi.glb`.

## Xbox Game Bar (quick option)
- Win+G → Start Recording. Focus Blender. Record parts 1-3 in one take.
- Win+G → Stop. Rename clip to `screen.mp4`, copy to target path above.

## After recording
Place both `viewport.mp4` (from `record.py`) and `screen.mp4` in:
`public/library/videos/scripting/<slug>/`
