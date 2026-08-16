# Screen Recording Notes — Butterfly Catastrophe A₅

**Target file**:
```
public/library/videos/scripting/
python-numpy-butterfly-catastrophe-a5-germ-thom-bifurcation-surface-poi-head-webxr/
screen.mp4
```

## OBS Setup

| Setting | Value |
|---------|-------|
| Scene name | `BlenderButterflyA5` |
| Source | Window Capture → **Blender** window |
| Canvas | 1920 × 1080, 30 fps |
| Audio | Disabled |
| Output | MP4 / H.264 / CRF 20 |

Save directly to the target path above.

## Recording Script

1. Open Blender 5.1 and run `blueprint.py` (or load `hf_butterfly_a5.blend`).
2. In the 3D Viewport: set shading to **Solid** → **Vertex** colour → **Flat** lighting (no shadows).
3. Press **Numpad 5** for orthographic view.  Press **Numpad 4** for a slight left-side angle showing all three wings.
4. **Start OBS recording.**
5. Slowly orbit (middle-mouse drag) for 12–15 seconds; pause at:
   - Front view (three wings clearly separated)
   - Side view (spine depth visible as a thin blade)
   - 20–30° elevation view (best overall showing of the wing-body junction)
6. In **Properties → Object Data Properties → Shape Keys**:
   - Slowly drag **Butterfly_Left** from 0 → 1 over ~5 seconds (left wing inflates).
   - Hold at 1 for 2 seconds.
   - Return to 0 over ~3 seconds.
   - Repeat with **Butterfly_Right** for 5 seconds.
7. Orbit back to the starting angle and **stop recording**.

## Colour Notes

The vertex colour gradient encodes the state variable `x`:
- **Blue** = outer left wing (`x ≈ −1.6`)
- **Teal-green** = body spine (`x ≈ 0`, the A₅ coalescence locus)
- **Amber** = outer right wing (`x ≈ +1.6`)

When both wings share the same projection region (self-intersection), the colour boundary is sharp — call this out in the recording as "the folding seam."

## Tips

- The three-wing structure is most legible from ~20° elevation.
- Zoom into the origin region (a = 0 coalescence point) for 2–3 seconds during the orbit to emphasise the A₅ singularity.
- Total recording target: 40–60 seconds.  Trim in a video editor before saving.
