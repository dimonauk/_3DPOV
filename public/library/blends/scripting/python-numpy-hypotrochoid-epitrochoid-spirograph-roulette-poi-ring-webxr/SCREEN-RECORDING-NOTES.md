# Screen-Recording Notes — Hypotrochoid / Epitrochoid Spirograph Poi Ring

**Target file:** `public/library/videos/scripting/python-numpy-hypotrochoid-epitrochoid-spirograph-roulette-poi-ring-webxr/screen.mp4`

---

## Software

- **OBS Studio** (Windows/macOS/Linux) or **Xbox Game Bar** (Win 11)
- Blender 5.1 open in the Scripting workspace

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Output resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Disabled** (no mic/system audio needed) |
| Encoder | x264, CRF 23 |
| Container | MP4 |

## Capture sequence

1. **Open Blender 5.1.** Ensure the Scripting workspace is active.
2. **Open `blueprint.py`** in the Text Editor panel (top-left of Scripting workspace).
3. Start recording in OBS.
4. **Press ▶ Run Script.** Pause; let the camera settle on the completed poi ring.
5. **Switch to 3D Viewport.** Press `Z → Material Preview` to see vertex colours.
6. Open the N-Panel (`N` key) → Object Properties → Shape Keys section.
7. **Scrub the `Spirograph_5_3` key from 0 → 1.** Hold for 2 s, then return to 0.
8. **Scrub `Astroid` from 0 → 1.** Hold for 2 s, return to 0.
9. **Scrub `Cardioid` from 0 → 1.** Hold for 2 s, return to 0.
10. Orbit with Middle-Mouse to show the tube cross-section from the side.
11. Stop recording.

## Post-processing

- Trim head/tail silence in any video editor.
- No colour grading needed — Workbench flat-colour shading reads clearly without it.
- Rename output to `screen.mp4` and place in the target folder above.

## Thumbnail

Use the frame where `Spirograph_5_3` is at value 1.0 — the 5-petalled loopy ring
with rainbow vertex colours is the most immediately recognisable form.
