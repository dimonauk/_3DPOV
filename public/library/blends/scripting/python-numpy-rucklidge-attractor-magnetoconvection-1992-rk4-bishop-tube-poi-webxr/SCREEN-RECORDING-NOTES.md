# Screen Recording Notes — Rucklidge Attractor

## Goal

Capture `screen.mp4`: running `blueprint.py` in the Blender 5.1 Text Editor,
then navigating the 3D Viewport to show the completed poi head under EEVEE Next
lighting, with a manual shape-key transition demonstrating the lobe-switching
between limit-cycle and chaotic regimes.

## Software

- **OBS Studio** (any recent release) or Windows **Game Bar** (Win + G)
- **Blender 5.1**

## OBS settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Format | MP4 / H.264 |
| Output path | `public/library/videos/scripting/python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr/screen.mp4` |

## Recording script

1. Open Blender 5.1. Start OBS recording.
2. Open `blueprint.py` in the **Text Editor** workspace.  
   Scroll slowly through the file — pause on `_rucklidge_deriv` (the three
   ODE lines) and the `_bishop_frame` parallel-transport loop.
3. Press **Run Script** (Alt + P or the ▶ button in the header).  
   Integration runs for ~15–60 s depending on hardware.  
   Watch the Info header for "Done" print.
4. Switch to the **3D Viewport**. Press Numpad 0 (camera view) or orbit with
   middle-mouse — one slow 360° pass, ~15 seconds.  The cobalt-amber gradient
   traces the figure-of-eight lobe structure.
5. Open **Properties → Data → Shape Keys** (green mesh icon).  
   Drag `SK_Hopf` value: 0 → 1 (the orbit collapses to a clean periodic loop
   around one focus) → 0.  
   Drag `SK_Dense` value: 0 → 1 (lobes spread wider with lower κ damping) → 0.
6. Stop OBS recording.

## Viewport tips

- Render engine: **EEVEE Next** (Properties → Render → Render Engine).  
  Enable **Bloom** — the cobalt-amber glow is central to the effect.
- Background: Preferences → Themes → 3D Viewport → Gradient /
  High angle colour → `#000000`.
- Disable Overlays → Statistics for a clean viewport.
- Keep the Blender title bar visible so the 5.1 version reads clearly.

## Target duration

90–120 seconds total.
