# Screen Recording Notes — GP3 Layer Modifier Build Reveal

**Target file:** `public/library/videos/grease-pencil/gp3-layer-modifier-build-reveal-animated-ink-diagram/screen.mp4`

## OBS / Game Bar setup

- Source: Window Capture → Blender 5.1
- Resolution: 1920 × 1080 (downscale to 1280 × 720 on export)
- Frame rate: 30 fps
- Audio: **off** (narration added in post via VSE)
- Format: MP4 / H.264

## Essential takes (in order)

### Take 1 — Modifier Properties panel walkthrough (60 s)
1. Select `pipeline_diagram` object.
2. Open **Properties** → **Modifier** (wrench icon).
3. Scroll slowly through all five modifiers: BuildBoxes, BuildArrows, BuildLabels, InkWobble, EdgeSmooth.
4. Expand each → hover over key properties so tooltips appear: `mode`, `transition`, `frame_start`, `frame_end`, `layer_filter`.
5. Narration cue: explain that layer_filter is a plain string matching the layer name exactly — a common gotcha.

### Take 2 — Layer list in GP3 Object Data (30 s)
1. Switch to **Object Data** panel (green line icon).
2. Show three layers: "boxes", "arrows", "labels".
3. Click each → note how the layer colour indicator matches the stroke material tint in the viewport.

### Take 3 — Build animation playback (45 s)
1. Set frame to 1. Press **Space** to play.
2. Let it run through to frame 100.
3. Rewind → play again at 0.5× speed via Timeline → Playback → Speed.
4. Narration cue: point out the overlap between boxes finishing (~frame 42) and arrows starting (~frame 36).

### Take 4 — Noise modifier live tweak (30 s)
1. In Modifier Properties, expand **InkWobble**.
2. Drag `Factor` from 0.03 → 0.15 → back to 0.03 while timeline is playing.
3. Show how higher Factor makes the ink jitter visibly vs the calm 0.03 baseline.

### Take 5 — Node tree (N/A) + Spreadsheet POINT domain (30 s)
1. Open **Spreadsheet** editor, set object to `pipeline_diagram`.
2. Set Domain to **POINT** — observe position, radius, opacity columns.
3. Step through frames 1, 25, 60, 90 and note how point count grows as Build reveals new strokes.

## Post-production
- Trim dead silence at start/end.
- Add chapter markers at each Take boundary using VSE markers.
- See `/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export` for the full VSE pipeline.
