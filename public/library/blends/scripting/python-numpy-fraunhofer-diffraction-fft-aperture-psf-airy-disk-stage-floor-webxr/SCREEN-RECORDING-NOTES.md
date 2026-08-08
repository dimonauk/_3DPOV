# Screen Recording Notes — Fraunhofer Diffraction PSF Height Field

Use these notes to capture `screen.mp4` with OBS Studio (Windows/macOS/Linux)
or Xbox Game Bar (Windows) alongside the automated `viewport.mp4` from record.py.

---

## Target Clip: 2–3 minutes

### What to capture
1. **Script execution** — show `blueprint.py` running in Blender's Scripting workspace.
2. **Top-down viewport** — overhead orthographic view of the height field after the script finishes.
3. **Shape key scrubbing** — in Properties → Object Data → Shape Keys, manually drag
   the `Hexagonal_Spikes` and `Annular_Sharpened` values from 0 → 1 while watching
   the mesh morph in the viewport.
4. **Shading toggle** — switch from Solid (white) to Vertex Paint mode to reveal the
   blue-white PSF intensity colour map.
5. **Playback** — press Space to play the keyframed animation (record.py must have
   run) and show the full Circular → Hexagonal → Annular morph sequence.

---

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (screen recording only) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |
| Recording path | `public/library/videos/scripting/python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr/screen.mp4` |

## Blender Workspace Sequence

1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py` → click **Run Script** (or press Alt+P in the text editor).
3. Switch to **3D Viewport** → numpad `7` (top view) → numpad `5` (orthographic).
4. Set viewport shading to **Material Preview** (the sphere icon in the header) to
   see the emission material.
5. Open the **N-panel** (press N) → **Item** → **Shape Keys** — or go to
   Properties → Object Data Properties (green triangle icon) → **Shape Keys**.
6. Slowly drag `Hexagonal_Spikes` value 0 → 1 while recording.  Pause on 1.0 to
   show the 6-spike diffraction pattern clearly.
7. Return `Hexagonal_Spikes` to 0, then drag `Annular_Sharpened` 0 → 1 to compare
   the sharpened central peak.
8. Press `Space` to play the full animation (Circular → Hexagonal → Annular morph).

## Notes for the Video Edit

- Overlay text suggestion: "1.22λ/D — Airy disk first dark ring" when showing the
  circular aperture PSF.
- Overlay text suggestion: "6 diffraction spikes — same mechanism as JWST star images"
  when showing the hexagonal aperture PSF.
- Good B-roll: a real JWST or Hubble starfield screenshot (check CC licence) beside
  the Blender viewport to compare spike patterns.
- Keep the top-down view as the primary angle — rotating 3D views can obscure the
  concentric ring structure.

## Xbox Game Bar (Windows alternative)

Win + Alt + R to start/stop recording.  Clips saved to `Videos/Captures/`.
Rename and move to the path above.
