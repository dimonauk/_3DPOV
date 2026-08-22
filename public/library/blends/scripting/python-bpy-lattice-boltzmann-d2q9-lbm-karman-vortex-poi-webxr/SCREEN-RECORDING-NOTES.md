# Screen Recording Notes — LBM Kármán Vortex Street

Target file: `public/library/videos/scripting/python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic, no desktop audio) |
| Encoder | H.264 (NVENC or x264) |
| Output format | MP4 |

## What to Record

1. **Scripting workspace** — open `blueprint.py`, read through the header
   and the `lbm_step` docstring. Point out the BGK collision line
   (`f - (f - feq) / TAU`) and the nine `np.roll` streaming lines.
2. **Run Script** — show the 160×80 quad grid appear in the 3D viewport
   with the initial blue-white-red colour pattern (uniform inflow at
   frame 0, so all white with a dark obstacle disc).
3. **Switch to Rendered shading** (Z → Rendered, or press the sphere icon
   in the viewport header). The emission material makes the colours glow.
4. **Spacebar to play** — scrub slowly through frames 1–100. The flow is
   initially symmetric above and below the cylinder. Around frame 80 the
   symmetry breaks: a red blob (clockwise vortex) detaches from one side.
5. **Frames 100–180** — alternating red and blue vortices peel off and
   drift downstream. This is the Kármán vortex street: the shedding
   frequency is governed by the Strouhal number St ≈ 0.2 for Re ≈ 96,
   meaning one full shed cycle takes ≈ NX / (U_INFLOW × St) ≈ 80 frames.
6. **Frames 180–300** — the fully developed periodic street fills the domain
   to the right boundary. Zoom into the near-wake region to show the tight
   counter-rotating vortex pair close behind the cylinder.
7. **Overlay the Spreadsheet editor** — select the mesh, open Spreadsheet,
   filter to `Col` attribute. Scrub two frames and show the RGBA values
   change live as the handler writes new colours.

## Narration Cues (Workshop-Dimona register)

- "Each frame the handler calls `lbm_step`, which runs BGK collision then
  nine roll operations — one per lattice velocity direction."
- "The colours are not painted — they're computed from vorticity:
  ∂uy/∂x − ∂ux/∂y, finite-differenced right from the velocity field
  we derive from the distributions."
- "Watch the wake: symmetric at first because the inflow is perfectly
  uniform, then a tiny numerical noise seed breaks it around frame 80."
- "That's the same break-of-symmetry that makes a poi head wobble when
  you change speed — a Reynolds-number crossing."
