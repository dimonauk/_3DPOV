# Screen Recording Notes — Hopf Fibration Light Sculpture

**Target file:** `public/library/videos/scripting/python-hopf-fibration-linked-tori-light-sculpture-webxr/screen.mp4`

---

## Software

| Platform | Tool |
|----------|------|
| Windows  | OBS Studio (recommended) or Xbox Game Bar (Win + G) |
| macOS    | OBS Studio or QuickTime Player → File → New Screen Recording |
| Linux    | OBS Studio or `simplescreenrecorder` |

---

## OBS Setup

1. **Add Scene** → name it `HopfFibration`.
2. **Sources** → `+` → **Window Capture** → select `Blender 5.1`.
3. **Output settings** (File → Settings → Output tab):
   - Format: `mp4`
   - Encoder: `x264` (or NVENC if GPU available)
   - Rate Control: `CRF`, Value: `18`
   - Resolution: `1920 × 1080`
   - FPS: `30`
4. **Audio**: mute all audio sources (Blender UI sounds are not needed).
5. **Start Recording** before pressing Run Script; **Stop** after the render completes.

---

## What to capture

### Part A — Blueprint run (≈ 30 s)
1. Open a fresh Blender 5.1 file; switch to **Scripting** workspace.
2. Click **New** to create a new text block, paste `blueprint.py`.
3. Press **Run Script**.
4. Let OBS capture the scene filling with coloured ring-curves.
5. After the build completes, orbit the viewport with **Middle Mouse** to show the linked rings.

### Part B — Material & Bloom preview (≈ 20 s)
1. Switch to **Rendered** shading (numpad `0` → `Rendered` overlay).
2. Slowly orbit the camera (hold MMB + drag) to show neon Bloom glow.
3. Hold for 5–10 s.

### Part C — record.py render (optional, long)
- Run `record.py` to produce the camera-orbit `viewport.mp4`.
- You can skip capturing this in OBS if render time is too long; the `viewport.mp4` file speaks for itself.

---

## Trim & Export

- Keep the final `screen.mp4` under **120 MB**.
- Trim to: run-start → orbit-pan → rendered view.
- Target runtime: **45–90 s**.
- No audio track required.

---

## File placement

```
public/library/videos/scripting/
└── python-hopf-fibration-linked-tori-light-sculpture-webxr/
    ├── viewport.mp4   ← rendered by record.py
    └── screen.mp4     ← your OBS capture
```
