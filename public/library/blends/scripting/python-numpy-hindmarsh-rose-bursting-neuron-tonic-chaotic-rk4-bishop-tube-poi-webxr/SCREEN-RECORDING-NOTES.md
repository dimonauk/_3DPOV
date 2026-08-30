# Screen Recording Notes — Hindmarsh-Rose Bursting Neuron

## Goal

Capture `screen.mp4`: Dimona running `blueprint.py` in the Blender 5.1
Text Editor, then navigating the 3D Viewport to show the completed poi head
under EEVEE_NEXT lighting, with a manual shape-key transition demonstrating
the tonic → bursting regime shift.

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
| Output path | `public/library/videos/scripting/python-numpy-hindmarsh-rose-bursting-neuron-tonic-chaotic-rk4-bishop-tube-poi-webxr/screen.mp4` |

## Recording script

1. Open Blender 5.1. Start OBS recording.
2. Open `blueprint.py` in the **Text Editor** workspace.  
   Scroll slowly through the file — pause on `_hr_deriv` (the ODE right-
   hand side) and `_bishop_frame` (the parallel-transport loop).
3. Press **Run Script** (Alt + P or the ▶ button in the header).  
   The integration runs for ~30–90 s depending on hardware.  
   Watch the Info header for the "Done" print message.
4. Switch to the **3D Viewport**. Press Numpad 0 (camera view) or simply
   orbit with middle-mouse — one slow 360° pass, ~15 seconds.
5. Open **Properties → Data → Shape Keys** (the green mesh icon).  
   Drag `SK_Tonic` value: 0 → 1 → 0 (tonic spiking — tight periodic loops).  
   Drag `SK_Chaotic` value: 0 → 1 → 0 (chaotic bursting — irregular spread).
6. Stop OBS recording.

## Viewport tips

- Render engine: **EEVEE Next** (Properties → Render → Render Engine).
  Enable **Bloom** for the cobalt-amber glow effect.
- Viewport background: Preferences → Themes → 3D Viewport → Gradient /
  High angle colour → `#000000`.
- Show **Overlays → Statistics** OFF for a clean viewport.
- Keep the Blender title bar visible so the 5.1 version is readable.

## Target duration

90–120 seconds total.
