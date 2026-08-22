# VSE Screen-Recording to Tutorial Export

**Blender 5.1 · Video Sequence Editor · CC0**

Assembles a raw screen-recording clip into a published tutorial video using
Blender's built-in Video Sequence Editor (VSE): title card (Color strip +
Text strips), main clip with Color Balance correction, lower-third
watermark, and H.264/AAC render to MP4.

This is the post-production stage of the Holoflow tutorial-recording pipeline —
the point where the raw OBS/Game Bar `screen.mp4` becomes a viewable tutorial.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full VSE scene build + output configuration |
| `record.py` | Synthetic VSE preview render (no external video required) |
| `SCREEN-RECORDING-NOTES.md` | OBS settings + stitch commands |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

1. Open Blender → switch to the **Video Editing** workspace
2. Open `blueprint.py` in the Text Editor
3. Set `PLACEHOLDER_VIDEO_PATH` to your OBS recording path
4. Alt+R to run the script
5. Ctrl+F12 to export

## Render output

- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Codec: H.264 (CRF Medium ≈ 23), AAC 192 kbps
- Output: `//output/tutorial_export.mp4`

## Tutorial page

`/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export`
