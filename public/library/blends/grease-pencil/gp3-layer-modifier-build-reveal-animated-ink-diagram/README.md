# GP3 Layer Modifier Stack — Build + Noise + Smooth

**Blender version:** 5.1  
**Licence:** CC0 — no rights reserved  
**Topic:** Grease Pencil 3, modifier stack, animated ink diagram  

## What this builds

A Grease Pencil 3 object containing a three-stage pipeline diagram
(Blender → GLB → WebXR) that draws itself over 90 frames using the GP3
**Build** modifier.  Two additional modifiers — **Noise** and **Smooth** —
give the ink an organic, hand-drawn character.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Creates scene, GP3 strokes, all five modifiers |
| `record.py` | Renders 100 PNG frames + prints ffmpeg assembly command |
| `SCREEN-RECORDING-NOTES.md` | OBS takes list for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

1. Open Blender 5.1 → Scripting workspace.
2. **Run** `blueprint.py` — the diagram appears with all modifiers active.
3. Press **Space** to preview the build animation (frames 1–100).
4. **Run** `record.py` to render PNG frames.
5. Execute the printed ffmpeg command to produce `viewport.mp4`.
6. Follow `SCREEN-RECORDING-NOTES.md` to capture `screen.mp4`.

## Key concepts

- **GP3 Build modifier** `layer_filter` property: string matching exact layer name,
  restricts the modifier to one layer so each stage gets independent timing.
- **Transition = GROW**: stroke tip advances from the first point — mimics a
  real pen moving across the page.
- **Mode = SEQUENTIAL**: strokes reveal one at a time within the frame window;
  `CONCURRENT` reveals all simultaneously (useful for fills or star bursts).
- **Noise `use_random`**: re-evaluates the noise field each frame — the ink
  jitters gently even after the build completes, preventing a static freeze.

## Related tutorials

- `/tutorials/blender-tutorial-gn-gp3-noise-stroke-wave` — GN noise on GP3 strokes (field approach vs modifier approach)
- `/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline` — Line Art modifier generating GP3 strokes from mesh silhouettes
- `/tutorials/blender-tutorial-gp3-frame-by-frame-cel-animation` — GP3 layer/frame/drawing data model in depth
