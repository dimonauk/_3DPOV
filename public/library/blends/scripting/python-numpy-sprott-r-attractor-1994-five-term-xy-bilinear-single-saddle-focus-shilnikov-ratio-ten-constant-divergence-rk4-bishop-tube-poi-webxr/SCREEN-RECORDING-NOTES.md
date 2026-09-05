# Screen Recording Notes — Sprott R Attractor

**Target file:** `public/library/videos/scripting/<slug>/screen.mp4`

---

## OBS Studio (recommended)

1. **Source** → Add → **Window Capture** → select `Blender 5.1`.
2. **Settings → Output**:
   - Format: MP4
   - Encoder: H.264 (NVENC or x264)
   - Rate control: CRF 18
3. **Settings → Video**:
   - Base resolution: 1920×1080
   - Output resolution: 1920×1080
   - FPS: 30
4. **Audio** — disable all audio tracks (no narration needed).
5. Start recording **before** clicking Run Script.

---

## Windows Game Bar (quick option)

Press `Win + G` to open Game Bar, make sure Blender is the active window,
then **Start Recording** (`Win + Alt + R`).  Output lands in
`%USERPROFILE%\Videos\Captures`.

---

## What to record

| Sequence | Action |
|---|---|
| 0–10 s | Show `blueprint.py` open in the Scripting workspace |
| 10–15 s | Scroll to the `PARAM_SETS` dict — point out a=0.9, b=0.4 |
| 15–20 s | Click **Run Script** — watch the tube appear in viewport |
| 20–30 s | Orbit the viewport with middle-mouse to reveal the winding tube |
| 30–40 s | Open Shape Keys panel (Properties → Object Data → Shape Keys) |
| 40–55 s | Drag SK_HighA slider 0→1→0, then SK_LowA 0→1 |
| 55–75 s | Open `record.py`, Run Script, show the render progress bar |
| 75–90 s | Show completed `viewport.mp4` playing in Blender's Video Sequence Editor |

---

## Tips

- Set viewport shading to **Material Preview** (Z → Material) before recording
  to show the cobalt–amber speed gradient.
- Enable **N panel → View → Camera to View** during the orbit section so the
  viewer sees the camera perspective rather than the user perspective.
- Keep the Blender window **maximised** — 1920×1080 fills the frame cleanly.
