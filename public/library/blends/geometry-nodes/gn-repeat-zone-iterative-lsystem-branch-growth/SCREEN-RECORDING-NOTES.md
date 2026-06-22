# Screen Recording Notes — GN Repeat Zone: Iterative Branch Growth

**Target file:** `public/library/videos/geometry-nodes/gn-repeat-zone-iterative-lsystem-branch-growth/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (or Windows Game Bar Win+G) | Window capture |
| Source | Blender 5.1 (full window, 1920 × 1080) |
| Frame rate | 30 fps |
| Audio | Off (silent capture) |
| Output | MP4 / H.264, CRF ~22 |

## What to record

### Part 1 — Fresh scene + run blueprint.py (0:00 – 0:45)

1. Open Blender 5.1 → File → New → General.
2. Delete default cube.
3. Open Text Editor (Shift + F11 in main area).
4. Click **Open** → navigate to `blueprint.py` → open.
5. Click **Run Script**. Viewport shows the spiked icosphere. Pause 3 s.

### Part 2 — Inspect the Geometry Node tree (0:45 – 1:30)

1. Select `branch_ball`. Properties → Modifier → HF_RepeatBranch → **Edit**.
2. Node Editor opens. Pan left-to-right:
   - Group Input → Store Named Attribute (is_tip = True) →
   - **Repeat Input** (blue header) → Named Attribute → Extrude Mesh →
   - Store Named Attribute (is_tip = Top) → Math Multiply →
   - **Repeat Output** (blue header) → Set Shade Smooth → Group Output
3. Zoom in on the Repeat Input / Repeat Output pair. Point out the blue zone frame.
4. Click Iterations socket on Group Input → drag to a higher number to show growth. Undo.

### Part 3 — Live iteration stepping (1:30 – 2:15)

1. Back in 3D Viewport, Properties → Modifier panel.
2. Set **Iterations** slider: 0 (bare icosphere) → 1 → 2 → 3 → 4 → 5.
3. Show mesh face count growing in the Properties header (N panel → Item).
4. Set **Shrink** to 0.9 for longer spines → 0.5 for stubby spikes. Note real-time feedback.
5. Set **Branch Scale** to 1.0, Iterations to 3 for a cleaner three-level spike.

### Part 4 — run record.py to bake animation (2:15 – 2:45)

1. Text Editor → Open record.py → Run Script.
2. Timeline shows 90 frames with Constant keyframes on Iterations.
3. Press Space to play — watch spike ball grow step-by-step in viewport.

### Part 5 — GLB export check (2:45 – 3:00)

1. File → Import → glTF 2.0 → open `branch_ball.glb`.
2. Rotate the imported object to confirm spikes are baked.

## Editing notes

- Cut between Parts 2 and 3 (no gap needed).
- Speed-ramp Part 5 to 2× for brevity.
- Add lower-third title card: **"GN Repeat Zone — Iterative Branch Growth | Blender 5.1 | Holoflow Studio"**
- No music. Subtitles optional.
