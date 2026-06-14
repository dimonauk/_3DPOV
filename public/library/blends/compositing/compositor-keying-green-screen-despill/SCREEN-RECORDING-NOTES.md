# SCREEN-RECORDING-NOTES — Compositor Keying Tutorial

**Target file**: `public/library/videos/compositor/compositor-keying-green-screen-despill/screen.mp4`

## OBS Studio setup

| Setting | Value |
|---------|-------|
| Source | Window Capture — Blender 5.1 |
| Canvas resolution | 1920 × 1080 |
| Output resolution | 1920 × 1080 |
| FPS | 30 |
| Encoder | x264 / NVENC |
| Audio | OFF (no microphone) |
| Output format | MP4 |

## What to record

### Part 1 — The green-screen scene (≈ 90 s)

1. Open Blender with `keying_demo.blend` loaded (run blueprint.py first)
2. Pan the viewport: show Suzanne against the green plane from various angles
3. Point at the Spill Light in the Outliner — orbit to show the green tint on
   Suzanne's right ear before the compositor is applied
4. Press F12 — show the render progress and the compositor activating

### Part 2 — Compositor walkthrough (≈ 120 s)

5. Switch to the Compositing workspace
6. Hover over the **Keying** node and press **M** to mute it — show the raw
   render with the green plane intact
7. Unmute (M) — show the keyed result composited over the navy background
8. Click `Clip Black`, drag left to 0.0 — the matte goes fully transparent
   (Suzanne disappears into the background). Explain: clip_black too low =
   foreground lost
9. Drag `Clip Black` right to 0.50 — the matte hardens, ears get cut off.
   Explain: clip_black too high = soft edges clipped
10. Reset to 0.20 — ideal soft zone
11. Do the same A/B on `Despill Factor`: drag to 0 (green fringe visible on
    ears), drag to 1.0 (clean edges), reset to 0.80

### Part 3 — Matte debug view (≈ 60 s)

12. In the Compositing workspace, click the **MatteViewer** node
13. Open a UV/Image Editor in one of the panels, set to "Render Result"
14. In the Viewer dropdown, switch to the MatteViewer node's output
15. Show the greyscale matte — white = foreground, black = background, grey
    zone = soft edge around ears and outline
16. Change `dilate_distance` from -2 to 0 — matte grows back to the green
    fringe; change to -4 — ears start clipping
17. Reset to -2

### Part 4 — Final render (≈ 30 s)

18. Set Frame Range to 1–150 (or just play from record.py)
19. Press Ctrl+F12 to render animation — show progress bar
20. Press Esc when a few frames are done (or let it complete if time allows)

## Editing notes for the final screen.mp4

- Trim to the five key moments:
  1. The first F12 render completing (green scene → keyed composite)
  2. Mute/unmute the Keying node (A/B comparison)
  3. Clip Black slider sweep
  4. Despill Factor slider sweep
  5. Matte debug view with dilate slider
- Total target length: 3–5 minutes at normal speed, sped up for repetitive
  render waits
- No titles or voiceover required — tutorial text provides context
