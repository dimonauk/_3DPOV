# Screen Recording Notes — SolidifyModifier VRM Pauldron

## Goal
Capture `screen.mp4`: a full Blender session walkthrough showing SolidifyModifier
properties being adjusted on the pauldron, rim caps visible, material preview active.

## Software
- **OBS Studio** (Windows/macOS/Linux) or Xbox Game Bar (Windows)
- Source: Window Capture → select the Blender window
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: OFF

## Setup Steps

1. Open `hf_pauldron_shell.blend` (run `blueprint.py` first if not present).
2. Set viewport to **Material Preview** (Z → Material Preview shortcut or header button).
3. Select the pauldron object. Open **Properties → Modifier** tab.
4. Ensure the modifier stack shows: **Solidify → WNorm** in that order.

## Recording Sequence (~90 seconds)

### Act 1 — Outer face (0–20 s)
- Orbit around the outer steel-blue face.
- Show the gold rim visible at both arc ends.

### Act 2 — Rim inspection (20–40 s)
- Zoom to the left arc rim.
- In the Solidify modifier panel, toggle `Use Rim` on/off twice — watch the
  gold cap appear and disappear.
- Set `Material Offset Rim` from 1 → 0 → back to 1, watching the rim switch
  between blue and gold.

### Act 3 — Even thickness (40–65 s)
- Set viewport to **Solid + Overlays → Wireframe ON** (Alt+Z).
- Toggle `Even Thickness` off then on — observe the inner-shell vertex positions
  shift at the curved ends.
- Restore Even Thickness = ON.

### Act 4 — Simple vs Complex mode (65–85 s)
- In Solidify: switch `Mode` from Simple → Complex.
- Show that for this flat-faced mesh the result is identical; narrate why Complex
  mode matters for sculpted geometry (NON_MANIFOLD boundary tracing).
- Switch back to Simple mode.

### Act 5 — GLB result (85–90 s)
- Run blueprint.py (Text Editor → Run Script or drag-drop the file).
- Show the file browser confirming `hf_pauldron_shell.glb` was written.

## Tips
- Keep the Properties → Modifier panel visible throughout Acts 2–4.
- Use **Numpad 1** (front view) for Act 2, **Numpad 0** (camera) for Act 5.
- Crop or trim the OBS recording to remove setup time before the pauldron appears.
