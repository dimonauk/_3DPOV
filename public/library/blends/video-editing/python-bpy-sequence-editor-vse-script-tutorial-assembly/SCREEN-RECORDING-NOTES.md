# Screen Recording Notes
## python-bpy-sequence-editor-vse-script-tutorial-assembly

Target file: `public/library/videos/video-editing/python-bpy-sequence-editor-vse-script-tutorial-assembly/screen.mp4`

---

### Software

| Tool | Setting |
|------|---------|
| OBS Studio (recommended) or Windows Game Bar (Win+G) | — |
| Capture source | Window Capture → Blender |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no narration track needed) |
| Encoder | H.264 (x264) or NVENC |
| Output format | MP4 |

---

### Preparation

1. Open Blender 5.1. Set workspace to **Scripting**.
2. Open `blueprint.py` in the Text Editor panel.
3. Resize Blender to fill the 1920 × 1080 window. Remove any secondary monitors from the capture if possible.
4. Set OBS source → Window Capture → select the Blender window.
5. Crop OBS canvas to exactly 1920 × 1080 to exclude taskbar/title bar.

---

### What to record

**Segment 1 — Script overview (≈ 30 s)**
- Scroll through `blueprint.py` slowly from top to bottom.
- Pause 2 s on the `CONFIGURATION` block (slugs and paths).
- Pause 2 s on the `build_assembly()` function signature and channel plan comment.

**Segment 2 — Run the script (≈ 20 s)**
- Click **Run Script** (or Alt+P with cursor in text area).
- Wait for the console to print the assembly summary line.
- Switch to the **Info** editor to show the operator log.

**Segment 3 — VSE workspace review (≈ 40 s)**
- Switch workspace to **Video Editing** (top bar).
- The `holoflow_vse_assembly` scene should be active.
- Scroll the VSE timeline so all strips are visible.
- Press N to open the N-panel and show strip properties for one movie strip.
- Expand the **Modifiers** tab to show the `colour_grade` COLOR_BALANCE modifier.

**Segment 4 — Preview a frame (≈ 10 s)**
- Press Space to scrub through the timeline.
- Position the playhead over a GAMMA_CROSS dissolve region.
- Show the dissolve frame in the preview pane.

---

### Total duration target

**≈ 100 seconds** — trim in the VSE using `blueprint.py` itself.

---

### After recording

1. Trim head/tail silence in OBS or Blender VSE.
2. Export as MP4 H.264, CRF 23, 1920 × 1080 @ 30 fps.
3. Save to: `public/library/videos/video-editing/python-bpy-sequence-editor-vse-script-tutorial-assembly/screen.mp4`
4. Run `blueprint.py` to assemble `viewport.mp4` + `screen.mp4` into `tutorial_assembled.mp4`.
