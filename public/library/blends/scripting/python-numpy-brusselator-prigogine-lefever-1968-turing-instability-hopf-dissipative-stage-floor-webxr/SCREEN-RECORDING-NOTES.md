# Screen-Recording Notes — Brusselator Stage Floor

Capture `screen.mp4` with OBS Studio or Windows Game Bar.

## OBS / Game Bar settings

| Setting       | Value                              |
|---------------|------------------------------------|
| Source        | Window capture → Blender 5.1       |
| Resolution    | 1920 × 1080                        |
| Frame rate    | 30 fps                             |
| Audio         | Off                                |
| Output format | MP4 / H.264                        |

## Recording steps

1. Open **Blender 5.1** → Scripting workspace → Text → Open `blueprint.py` → ▶ **Run Script**.
   - Integration: ~15–40 s on a modern CPU (7 000 steps per shape key × 4 keys).
   - Console will print `✓ Brussel_Floor: 6400V 6241Q …` when complete.
2. Switch to the **3D Viewport** workspace.
   - Press `Z` → Rendered (EEVEE Next) to see cobalt–amber emission.
3. Press `Numpad 0` (camera view). Optional: orbit with middle-mouse to frame the disc.
4. **Start recording** in OBS / Game Bar.
5. In the **Object Data Properties → Shape Keys** panel, slowly drag each key:
   - **SK_Spots** → hexagonal dot array emerges from the labyrinthine stripes
   - **SK_Dense** → fine-wavelength labyrinth (higher wavenumber)
   - **SK_Hopf** → temporal-oscillation snapshot (spatially uniform modulation)
   - Back to **Basis** to complete the loop
6. **Stop recording** after ~90 seconds.

## Output path

```
public/library/videos/scripting/
  python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr/
    screen.mp4
```

## Notes

- The `record.py` script renders `viewport.mp4` automatically via EEVEE Next;
  `screen.mp4` captures the interactive session described above.
- Longer morph transitions look better on camera — hold each key at full value
  for ~5 seconds before transitioning.
