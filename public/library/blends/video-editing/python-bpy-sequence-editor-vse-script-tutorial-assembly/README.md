# Python bpy.types.SequenceEditor — VSE Script-Based Tutorial Assembly

**Blender 5.1 · Python scripting · video-editing**

## What this does

`blueprint.py` ingests two source recordings produced by every Holoflow library entry —
`viewport.mp4` (3D viewport animation) and `screen.mp4` (OBS screen capture) — and
assembles them into a polished tutorial video entirely via the Blender Python API.

No manual strip dragging. The assembly is deterministic: re-run the script after
re-recording a single clip and the timeline rebuilds itself with correct timings.

## Key techniques

| Technique | API surface |
|-----------|-------------|
| Create VSE scene | `bpy.data.scenes.new()` + `scene.sequence_editor_create()` |
| Add movie clip | `se.sequences.new_movie(name, filepath, channel, frame_start)` |
| Add solid colour card | `se.sequences.new_effect(type='COLOR', …)` |
| Add text overlay | `se.sequences.new_effect(type='TEXT', …)` |
| Add dissolve transition | `se.sequences.new_effect(type='GAMMA_CROSS', seq1=…, seq2=…)` |
| Per-strip colour grade | `strip.modifiers.new(type='COLOR_BALANCE')` |
| H.264 export settings | `scene.render.ffmpeg.codec = 'H264'` |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main assembly script — run from Blender Scripting workspace |
| `record.py` | Viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the `screen.mp4` capture |
| `assembly_manifest.json` | Written by blueprint.py — timing + source paths |

## Running

1. Open Blender 5.1.
2. In **Scripting** workspace, open `blueprint.py`.
3. Ensure `viewport.mp4` and `screen.mp4` exist in `public/library/videos/video-editing/<slug>/`.
4. Press **Alt+P** to run. Console prints the frame count and output path.
5. Switch to **Video Editing** workspace, confirm the `holoflow_vse_assembly` scene is active.
6. Press **Ctrl+F12** to render the assembled tutorial.

## Blender 5.1 compatibility notes

- `TEXT` strips gained `use_shadow` and `shadow_color` in Blender 3.6; present in 5.1.
- `COLOR_BALANCE` modifier `lift`/`gamma`/`gain` tuples are 3-element RGB (not 4-element RGBA).
- `GAMMA_CROSS` requires `seq1` and `seq2` to have overlapping frame ranges; the script
  stages this by starting `clip_B` DISSOLVE frames before `clip_A` ends.
- `scene.eevee.use_bloom` → `True` for the `record.py` EEVEE bloom on emissive panels.

## Licence

CC0 1.0 Universal — scripts are released to the public domain by Holoflow Studio.
