# Screen Recording Notes — CorrectiveSmoothModifier Joint Pinch Mitigation

## OBS / Game Bar Setup

**Window source:** Blender 5.1 (3D Viewport)
**Resolution:** 1920 × 1080
**Frame rate:** 30 fps
**Audio:** OFF (no voice, no system sounds)
**Output format:** MP4 → H.264

Save to: `public/library/videos/scripting/python-bpy-corrective-smooth-modifier-joint-pinch-vrm-glb-webxr/screen.mp4`

---

## Scene Prep Before Recording

1. Run `blueprint.py` (Text Editor → Run Script).
2. Open the N-panel (N key) → Object Data Properties → Modifier Properties.
3. Set viewport shading to **Material Preview** (Z → Material).
4. In Overlays (top-right header): disable Grid, disable Origin, enable Face Orientation.
5. Frame the arm tube in the 3D Viewport — medium zoom, side view (Numpad 3).

---

## Recording Sequence (~3 min)

### Segment 1 — Modifier Stack Walk-through (0:00–0:45)

- Pan to the Properties panel → Modifier Properties.
- Point out the stack order: **Armature** (top) → **CorrectiveSmooth** (below).
- Click each modifier header, narrate its role. No changes yet.

### Segment 2 — Before / After Comparison (0:45–1:30)

- Go to frame 24 (scrub timeline to peak bend).
- Temporarily set `cs.factor = 0.0` in Python console (or slide UI to 0).
- Show the pinch bulge at the elbow — the classic artefact.
- Reset factor to `0.9`. Show the smooth fold — same frame.

### Segment 3 — Vertex Group Mask in Weight Paint (1:30–2:15)

- Select the arm object, switch to **Weight Paint** mode.
- Change active vertex group to `elbow_zone`.
- Show the blue-to-red gradient centred on the elbow.
- Explain: red = full CS effect, blue = zero effect.

### Segment 4 — Live Playback (2:15–3:00)

- Exit Weight Paint, go to Object Mode.
- Press Space (play animation, frames 1–48).
- Let 2–3 loops run so viewers see the smooth bend-and-return cycle.
- Stop playback. End recording.

---

## Export from OBS

1. Stop Recording.
2. Remux Recording (if MKV): Tools → Remux Recordings → convert to MP4.
3. Move/rename to `screen.mp4` in the video output path above.
