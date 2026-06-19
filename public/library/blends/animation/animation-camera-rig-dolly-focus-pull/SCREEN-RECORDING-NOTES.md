# Screen Recording Notes — Camera Dolly Rig + Rack Focus

## Software
- OBS Studio (or Windows Game Bar `Win+G`)
- Blender 5.1

## Capture settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (tutorial voice-over added in post) |
| Output format | MP4 / H.264 |
| Output path | `public/library/videos/animation/animation-camera-rig-dolly-focus-pull/screen.mp4` |

## What to record

### Pass 1 — Scene setup (~2 min)
1. Open a new Blender 5.1 file.
2. Open the Scripting workspace. Paste `blueprint.py` (or open it from disk).
3. Run the script. Show the 3-D viewport as the rig appears.
4. Switch to Camera view (`Numpad 0`) and press Play — show the dolly in motion.

### Pass 2 — Constraint walkthrough (~3 min)
1. Select the camera. Open Properties ▸ Object Constraints.
2. Point at **Follow Path** — highlight `offset_factor`, show F-Curve in Graph Editor.
3. Point at **Track To** — show `track_axis = TRACK_NEGATIVE_Z`.
4. Temporarily disable Track To to show the camera snapping to path tangent, then re-enable.

### Pass 3 — Rack focus reveal (~2 min)
1. Switch to Camera view. Scrub timeline to frame 80 (dolly end).
2. Open Properties ▸ Camera ▸ Depth of Field — show `Focus Distance`.
3. Scrub frames 80→120. Foreground crystal snaps into focus, subject softens.
4. Show the F-Curve for `dof.focus_distance` in the Graph Editor.

### Pass 4 — Blueprint.py tour (~3 min)
1. Walk through `blueprint.py` in the Scripting workspace.
2. Highlight: constants block, `build_dolly_path()`, `wire_constraints()`, `animate()`.
3. Explain the `use_curve_follow = False` decision aloud.
4. Explain SINE EASE_IN_OUT vs LINEAR on the offset_factor curve.

## Editing notes
- Cut to a 9–12 minute final video.
- Add chapter markers at: 00:00 Intro / 01:30 Scene setup / 04:00 Constraints /
  07:00 Rack focus / 09:30 Blueprint walkthrough.
- No background music during code sections (focus on terminal output reading).
