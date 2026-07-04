# Screen Recording Notes
## python-fcurve-keyframe-insert-procedural-animation-turntable

Target file: `public/library/videos/scripting/python-fcurve-keyframe-insert-procedural-animation-turntable/screen.mp4`

---

### Software

- OBS Studio (or Windows Game Bar Win+G / macOS Screenshot toolbar)
- Blender 5.1

### OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264, CRF 20) |

---

### What to record

**Before recording:**
1. Open Blender 5.1 in a new session.
2. Load `blueprint.py` in the Text Editor (Shift+F11).
3. Ensure the viewport is in **Material Preview** shading (Z → Material Preview).
4. Position the 3D viewport camera to a slight front-left angle showing the full gem (Numpad 1, then orbit ~25° left, ~20° up).
5. Press **Play** (Spacebar) and confirm the turntable, hover, and elastic entrance all play correctly before recording.

**Shot list (record in one continuous take, ~90 seconds):**

1. **(0:00–0:10)** Show the empty scene — Title card in OBS overlay optional.
2. **(0:10–0:30)** In the Text Editor, scroll through `blueprint.py` slowly — pause on:
   - The `options={'FAST'}` + `fc.update()` comment block (~line 23)
   - `build_turntable_rotation()` — highlight `FModifierCycles` + `REPEAT_OFFSET`
   - `build_hover_oscillation()` — highlight the 2-frame sample density rationale
   - `build_elastic_entrance()` — highlight the three-point control logic
3. **(0:30–0:45)** Press **Run Script**. Camera switches to 3D viewport. Show:
   - The gem appearing (elastic entrance scale, frames 1–30)
   - The full turntable + hover loop playing for one complete revolution
4. **(0:45–0:70)** Open the **Graph Editor** (Shift+F6 in a panel). Show:
   - The `rotation_euler[2]` linear channel with the CYCLES modifier badge
   - The `location[2]` sinusoidal keyframe curve
   - The `scale[0]` elastic curve with the overshoot visible at mid frame
5. **(1:10–1:30)** Back in the 3D viewport: show the NLA editor (Shift+F12).
   Highlight the **Turntable** strip. Press Spacebar to play the looping strip.
6. **(1:30–end)** Show the terminal output confirming the GLB was written. Fade out.

---

### Post-processing

- Trim to ≤ 90 s.
- No colour grading required.
- Save as `screen.mp4` alongside `viewport.mp4` in the output directory.
