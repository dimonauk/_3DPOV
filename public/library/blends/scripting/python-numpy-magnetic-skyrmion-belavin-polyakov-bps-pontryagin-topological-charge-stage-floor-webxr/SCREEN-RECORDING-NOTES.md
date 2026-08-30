# Screen Recording Notes — Magnetic Skyrmion Stage Floor

## OBS Studio (recommended)

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 or NVENC |
| Bitrate | 8000 kbps (CRF 18 for x264) |
| Audio | Disabled |
| Output | `screen.mp4` alongside `viewport.mp4` |

## Windows Game Bar (quick option)

1. Open Blender, load the `.blend` file, run `blueprint.py` via the
   Scripting workspace.
2. Press **Win + G** → **Start Recording** (or Win + Alt + R).
3. Demonstrate in the viewport:
   - Frame the floor from above-left at ~45°.
   - Press **Tab** (Edit Mode) and back to show the mesh structure.
   - In the Properties panel → Object Data → Shape Keys, scrub each key:
     **Basis** → **SK_Q2** → **SK_Anti** → **SK_Large**.
   - In the Shader Editor, show the `Skyrmion_Nz` attribute node driving
     both Base Color and Emission.
   - Back in 3D Viewport: press **Z** → Rendered and slowly orbit to show
     the cobalt core glowing against the amber background.
4. Stop recording. Rename to `screen.mp4`.

## Key Blender moments to capture

1. **Scripting workspace** — script running, console output showing vertex
   and quad counts.
2. **Shape key comparison** — shape-key value slider at 1.0 for each:
   Basis (deep hollow), SK_Q2 (sharper narrower hollow), SK_Anti (inverted
   dome / bump), SK_Large (wide gentle hollow).
3. **Rendered viewport** — EEVEE Next, bloom on, dark world. The cobalt
   emission at the skyrmion core should glow visibly.
4. **Material nodes** — `ShaderNodeAttribute` → `Skyrmion_Nz` wired to
   Base Color and Emission Color of the Principled BSDF.

## Tips

- Use a **dark HDRI** (or a plain dark world colour) so the cobalt/amber
  emission reads clearly.
- If the core looks too dark, increase Emission Strength from 2.0 to 2.5
  in the Principled BSDF node.
- For the screen recording, disable the Blender splash screen
  (Edit → Preferences → Interface → uncheck Splash Screen).
