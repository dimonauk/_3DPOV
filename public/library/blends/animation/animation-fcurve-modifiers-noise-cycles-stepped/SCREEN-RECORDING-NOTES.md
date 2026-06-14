# Screen Recording Notes — F-Curve Modifiers

**Target file**: `public/library/videos/animation/animation-fcurve-modifiers-noise-cycles-stepped/screen.mp4`

## Setup

- **OBS Studio**: Source → Window Capture → Blender (full window)
- Resolution: 1920×1080 · Frame rate: 30 fps · Audio: OFF
- Output: MP4 / H.264

## What to capture (in order)

1. **Run blueprint.py** (60 s)
   Open Blender ▸ Scripting workspace. Paste or load `blueprint.py`. Run.
   Pan the 3D viewport to see the sphere, ratchet disc, and camera clearly.

2. **Graph Editor — show FCurve modifiers** (45 s)
   Split viewport: Graph Editor on one side, 3D Viewport on the other.
   Select `BounceSphere`. In Graph Editor, click the F-Curve Modifiers panel
   (Properties sidebar → N panel → Modifiers). Show CYCLES (on loc.Z) and
   NOISE (on rot.Z) panels expanded, with values visible.

3. **Play animation — sphere + ratchet** (30 s)
   Press Space in 3D Viewport. Let two loops play.
   - Watch sphere bounce smoothly (CYCLES looping the 24-frame arc)
   - Watch sphere spin erratically at apex (NOISE wobble)
   - Watch RatchetDisc snap to discrete angles (STEPPED, 4-frame hold)

4. **Select RatchetDisc — show STEPPED** (30 s)
   Click RatchetDisc. In Graph Editor, show the rot.Z FCurve. Zoom in to
   show the characteristic "step" shape the modifier produces on a
   linear keyframe curve. Point out frame_step = 4 in the sidebar.

5. **Camera shake — switch to Camera view** (20 s)
   Press Numpad 0 for Camera view. Play animation. The subtle handheld drift
   from the NOISE modifiers on loc.X and loc.Y should be visible against
   fixed reference points on the ground plane.

6. **Bake action demo** (30 s)
   With BounceSphere selected, Object ▸ Animation ▸ Bake Action. Enable
   Visual Keying, Step 1. Show the resulting dense keyframe trace in the
   Graph Editor — this is what goes into the GLB.

## Tips

- Dark theme looks better in recordings; enable in Preferences ▸ Themes.
- Keep timeline scrubber visible at the bottom while playing.
- After recording, trim to 3–5 minutes for the tutorial cut.
