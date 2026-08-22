# Screen-Recording Notes — VSE Screen-Recording to Tutorial Export

## What to capture

This tutorial is meta: you record yourself using Blender's Video Sequence
Editor to assemble a tutorial clip. The screen.mp4 for this entry shows:

1. Opening Blender → switching to the **Video Editing** workspace (top
   workspace tab row)
2. Running `blueprint.py` in the Text Editor (Alt+R)
3. The VSE timeline populating with colour and text strips across channels 1–5
4. Scrubbing the playhead through the title card (frames 1–90)
5. The Preview panel showing the composite title card in real time
6. Expanding the Strip Properties sidebar (N key in VSE) to show the Color
   Balance modifier on the main video channel
7. Setting Render Output path → Ctrl+F12 to trigger animation render
8. The Output Properties panel showing FFMPEG / H.264 / AAC settings

## OBS / Xbox Game Bar settings

| Setting          | Value                         |
|------------------|-------------------------------|
| Source           | Window Capture → Blender      |
| Resolution       | 1920 × 1080                   |
| Frame rate       | 30 fps                        |
| Audio            | Off (tutorial VO added in VSE)|
| Output format    | MP4 (H.264)                   |
| Output path      | `public/library/videos/video-editing/vse-screen-recording-to-tutorial-export/screen.mp4` |

## Viewport.mp4 (automated)

Run `record.py` from Blender's Text Editor to build the synthetic VSE
scene, then render with Ctrl+F12. Stitch the resulting PNG frames:

```bash
ffmpeg -framerate 30 -i frames/%04d.png -c:v libx264 -crf 22 \
  public/library/videos/video-editing/vse-screen-recording-to-tutorial-export/viewport.mp4
```

Duration target: 5 seconds (150 frames). Demonstrates the title card +
lower-third composite without requiring the real screen recording.

## Editing the screen.mp4 with this tutorial's own pipeline

Appropriately: once you have `screen.mp4`, use this tutorial's own
`blueprint.py` (with `PLACEHOLDER_VIDEO_PATH = "//screen.mp4"`) to edit
and export the final `screen_edited.mp4`. The pipeline eats its own output.
