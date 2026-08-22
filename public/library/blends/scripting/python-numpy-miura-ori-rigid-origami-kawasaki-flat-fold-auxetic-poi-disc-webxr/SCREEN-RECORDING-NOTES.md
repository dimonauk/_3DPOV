# Screen Recording Notes — Miura-Ori Rigid Origami Poi Disc

## Software
- **OBS Studio** (≥ 30.0) or Windows Game Bar (`Win + G`)
- **Blender 5.1** (Scripting workspace open)

## Session Setup

1. Open Blender → **File → Open** `hf_miura_ori_poi.blend`
2. Switch to **Scripting** workspace — the blueprint.py tab should be visible
3. In the top-right 3D-Viewport overlay menu:
   - Enable **Statistics** (shows face/vertex count)
   - Set **Shading → Flat** (not smooth) to see panel boundaries clearly

## OBS Window Source
| Setting | Value |
|---------|-------|
| Window | `Blender` |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic, no desktop) |
| Output format | MP4 / H.264 |
| Output file | `screen.mp4` next to `viewport.mp4` |

## Recording Sequence (~3–4 min)

### Part 1 — Theory walk (60 s)
- In the **Scripting** workspace, scroll through `blueprint.py`
- Pause on the `_lattice()` function docstring (Schenk–Guest equations)
- Pause on the `_panel_mask()` call (circular disc masking logic)
- Highlight the `FOLD_THETAS` list and explain the four fold states

### Part 2 — Run blueprint (30 s)
- Press **Run Script** (▶ button or `Alt+P`)
- Watch Blender's viewport: a flat amber/cobalt disc appears in the scene
- Switch to **Layout** workspace → orbit around the flat disc
- In the **Properties → Object Data → Shape Keys** panel, scrub the
  `SK_ThirdFold` slider from 0 to 1 — the disc folds in real time

### Part 3 — Fold state exploration (90 s)
- Set shape key sliders manually for each state:
  - `SK_ThirdFold = 1.0` → panels begin to tent, crease ridges appear
  - `SK_TwoThirdFold = 1.0` → strong fold, disc compresses visibly
  - `SK_Compact = 1.0` → nearly closed, amber peaks and cobalt troughs sharp
- Return to flat (`Basis`) — note the disc snaps back perfectly
- Zoom into the centre — point out the alternating amber/cobalt checkerboard

### Part 4 — Vertex colour channel (30 s)
- In the Shading workspace, show the `Fold_Phase` attribute driving Base Colour
- Toggle between `Material Preview` and `Rendered` view

### Part 5 — GLB export (20 s)
- Show the GLB file in the file browser at ~200–300 KB
- Optionally drag into a browser with a Three.js viewer to preview morphs live

## Output File
Save the recording as:
```
public/library/videos/scripting/
python-numpy-miura-ori-rigid-origami-kawasaki-flat-fold-auxetic-poi-disc-webxr/
screen.mp4
```

## Tips
- **DO** use the `Z → Material Preview` shading mode during folding — it shows
  amber/cobalt panels clearly without render times
- **DO** orbit to a ~30° elevation so viewers see the z-amplitude of the folds
- **DON'T** have the timeline open — the shape keys are driven manually in this
  take, not animated; the animation is in `record.py` / `viewport.mp4`
