# Screen-Recording Notes — Double Pendulum Poi Head

These instructions produce the `screen.mp4` companion to the automated
`viewport.mp4`. Follow them with OBS Studio or Windows Game Bar.

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 29 | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no microphone, no desktop audio) |
| Output format | MP4 / H.264 CRF 18 |

## Target file

```
public/library/videos/scripting/
  python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr/
    screen.mp4
```

## Steps

1. Open a **new Blender 5.1 file** (File → New → General).
2. Switch to the **Scripting** workspace tab.
3. Click **New** in the text editor, paste the contents of `blueprint.py`.
4. **Before running**, resize the 3D Viewport panel so the geometry will be
   clearly visible in the lower-left quadrant of the screen.
5. Set Viewport Shading to **Material Preview** (sphere icon, shortcut Z → 3)
   and enable **Scene Lights** + **Scene World** in the shading popover.
6. Start OBS recording, then click **Run Script** (▶ in the text editor).
   - The script takes roughly 20–40 s (NumPy RK4 over 3600 steps × 3 ICs).
   - You will see the cobalt–amber tube appear in the viewport as it builds.
7. Once the script completes, pan/rotate the 3D Viewport to show the full
   butterfly-shaped poi head from a 30° elevated front-left angle.
8. In the **Properties** panel → **Object Data Properties** → **Shape Keys**:
   - Set `SK_Chaotic` value to 1.0, hold 3 s, return to 0.0.
   - Set `SK_WideSwing` value to 1.0, hold 3 s, return to 0.0.
   Record this manually by dragging the slider.
9. Stop OBS recording and save.

## Framing notes

- The poi head is roughly 164 mm across; keep it occupying ≥ 40 % of the
  viewport height.
- The Cobalt→Amber gradient should be clearly visible; increase Emission
  Strength in the material if the gradient reads flat (aim for gentle bloom).
- Show the **Outliner** with the object selected and the **Shape Keys** panel
  open in a sidebar — this contextualises the shape-key morph.

## Blender UI elements to show

1. Script text editor with `blueprint.py` visible and the run-script button.
2. 3D Viewport in Material Preview during and after execution.
3. Object Properties → Shape Keys (morph demo).
4. Optionally: Info editor showing `Exported → //hf_double_pendulum_poi.glb`.
