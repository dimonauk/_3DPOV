# Compositor — Keying Node: Chroma Key, Despill & Edge Matte (Blender 5.1)

**Library path**: `blends/compositing/compositor-keying-green-screen-despill/`  
**Blender**: 5.1  
**Licence**: CC0

## What this demonstrates

The Blender Compositor Keying node removes a solid-colour backdrop by
converting each pixel to a luminance-weighted opponent-colour difference
against a chosen screen colour.  The result is a floating-point matte (0 =
foreground, 1 = background) that is thresholded by **Clip Black** and
**Clip White** into a soft alpha.  The built-in **Despill** pass then
corrects the green-channel contamination bounced from the screen surface
onto the subject's near edges.

Key parameters covered: `screen_color`, `screen_balance`, `clip_black`,
`clip_white`, `despill_factor`, `despill_balance`, `blur_pre`, `blur_post`,
`dilate_distance`, `edge_kernel_radius`.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene setup + compositor Keying node chain |
| `record.py` | Animated render: Suzanne slides across frame over 150 frames |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for screen.mp4 |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Expected artefacts

- `keying_demo.blend` — saved after running blueprint.py + F12
- `viewport.mp4` — written by record.py
- `screen.mp4` — captured by Dimona following SCREEN-RECORDING-NOTES.md

## Quick start

1. Open Blender 5.1 › File › New › General
2. Open Text Editor (Shift+F11), paste `blueprint.py`, press Alt+P
3. Press F12 — Cycles renders the green-screen scene and the compositor
   applies the Keying node automatically
4. Switch to the Compositing workspace to inspect node values live
5. Change `KEY_CLIP_BLACK` / `KEY_CLIP_WHITE` constants, press F12 again
   to see the matte harden or soften

## Technique notes

- The green plane uses an **Emission shader** (strength 5.0) so it reads
  colour-accurate after AgX tone-mapping regardless of scene lighting.
- The **Spill Light** (green point at Y=+1) simulates screen-bounce spill on
  Suzanne's right ear — without it the despill has nothing to correct.
- `dilate_distance = -2` shrinks the matte by two pixels, pushing the key
  boundary inward past the residual green fringe that clings to flat edges.
- The **MatteViewer** compositor node lets you isolate the raw alpha mask:
  switch the UV/Image Editor to the Viewer socket to debug edge quality.

## Outside sources

- Blender Manual — Keying Node (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/compositing/types/matte/keying.html
- njanakiev/blender-scripting (MIT, Nicolas Janakiev)
  https://github.com/njanakiev/blender-scripting
