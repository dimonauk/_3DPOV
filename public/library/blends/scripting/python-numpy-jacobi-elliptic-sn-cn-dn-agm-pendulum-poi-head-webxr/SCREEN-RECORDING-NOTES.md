# Screen Recording Notes — Jacobi Elliptic Poi Head

These notes are for capturing `screen.mp4` (the human-at-keyboard workflow)
using OBS Studio or Windows Game Bar.  The separate `viewport.mp4` is rendered
automatically by `record.py`.

## OBS Studio Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → **Blender 5.1** |
| Base resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Encoder | x264 (CRF 18) or NVENC if GPU available |
| Audio | **Off** — no microphone needed |
| Output format | MP4 |

## What to Capture (approx. 8 min)

1. **30 s** — Open Blender 5.1, switch to Scripting workspace.
2. **60 s** — Open `blueprint.py`, walk through the header docstring in the text
   editor; briefly explain the AGM line and the dn-modulation idea.
3. **90 s** — Hit ▶ **Run Script**.  Pan/zoom the viewport to show the resulting
   sphere as the script executes.
4. **60 s** — Open Properties → Object Data → Shape Keys.  Scrub the `k_080`
   slider and watch the sphere pinch into an hourglass.
5. **60 s** — Open the Material node tree; explain the Attribute→Emission path
   and why the colour tracks dn not vertex position.
6. **30 s** — Open `record.py`, Run Script.  Wait for the render to complete.
7. **30 s** — Close; show the exported `hf_jacobi_poi.glb` in the file browser.
8. **Final** — Stop OBS, rename output to `screen.mp4`.

## Output Path

```
public/library/videos/scripting/
  python-numpy-jacobi-elliptic-sn-cn-dn-agm-pendulum-poi-head-webxr/
  screen.mp4
```

Create the folder before stopping the recording so the file lands in the right
place from the OBS output dialog.
