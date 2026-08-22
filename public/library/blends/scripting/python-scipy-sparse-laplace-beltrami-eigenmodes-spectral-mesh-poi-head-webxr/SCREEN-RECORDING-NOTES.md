# Screen Recording Notes — LBO Eigenmodes Poi Head

Target file: `public/library/videos/scripting/python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Encoder | x264 CRF 18 (or NVENC H.264 High Quality) |
| Container | MP4 |

## What to capture

1. **Scripting workspace open** — paste `blueprint.py` into the text editor.
2. **Run the script** (Alt+P). Briefly show the Info header so viewers can see
   the progress prints ("Mesh: 162 vertices", eigenvalue list).
3. **Switch to Material Preview** (Z → Material Preview or numpad shortcut).
   The poi-head sphere is visible glowing under Bloom.
4. **Open Properties → Object Data → Shape Keys**. Show the eight
   `Mode_01` – `Mode_08` keys with their eigenvalue labels.
5. **Scrub through shape keys** manually by setting each `Value` slider from 0
   to 1. Show how mode 1 (Fiedler vector) cleanly splits the sphere into two
   hemispheres; mode 3 and 4 show fourfold patterns; mode 8 has fine
   chessboard-like ripples.
6. **Highlight the colour pattern** — warm red for mode 1, blue for mode 2, etc.
7. **Run `record.py`** (paste in text editor, Alt+P). Show Blender rendering
   the animated shape-key sequence.

## Approximate duration

10–12 minutes of screen recording, trimmed to 6–8 minutes for the tutorial video.

## Tips

- Set the HDRI to a plain black world before recording so the sphere pops.
- In the 3D viewport, use **Numpad 1** (front ortho) then orbit slightly to a
  three-quarter view to show the eigenvector patterns clearly.
- If the sphere appears flat (no Bloom), confirm `scene.eevee.bloom_threshold`
  is set and the viewport is in **Material Preview** (not Solid).
