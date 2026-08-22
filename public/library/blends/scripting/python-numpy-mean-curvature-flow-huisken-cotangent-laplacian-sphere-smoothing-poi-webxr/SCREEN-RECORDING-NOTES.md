# Screen-Recording Notes — MCF Sphere

## Objective

Two recordings for the library entry:

| File | Contents |
|------|----------|
| `viewport.mp4` | 30-second Blender viewport walkthrough — shape key scrub + vertex colour |
| `screen.mp4` | 60-second screen recording showing blueprint.py running in the scripting workspace |

---

## OBS Studio (recommended)

### Setup
1. **Source** → Window Capture → select the Blender window.
2. **Output** → MP4, H.264, CRF 18, 1920 × 1080, 60 fps.
3. **Audio** — mute or add narration track.

### `viewport.mp4` — viewport walkthrough (~30 s)

1. Open the saved `.blend` (after running `blueprint.py`).
2. Switch to **Material Preview** (Z → Material Preview) so the cobalt–amber vertex colour is visible.
3. Orbit slowly around the sphere (middle-mouse drag) for ~10 seconds.
4. Open the **Properties → Object Data → Shape Keys** panel.
5. Scrub `SK_Step050` from 0 → 1 over 5 seconds — watch high-frequency noise disappear.
6. Return SK_Step050 to 0, then slowly ramp `SK_Step200` → 0.5 → 1 over 10 seconds.
7. Briefly show `SK_Step800` at value 1 — nearly perfect sphere.
8. Return all keys to 0 (Basis) and orbit once more.

### `screen.mp4` — scripting workspace run (~60 s)

1. Open a fresh Blender session (no prior .blend).
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` via Text Editor → Open.
4. Press **Run Script** and let it execute (≈ 2–5 minutes on a mid-range CPU).
5. Once complete, switch to **3D Viewport** and record the result for 10 seconds.
6. Trim to ≤ 60 s before saving.

---

## Windows Game Bar (Win + G)

- Press **Win + G**, select **Capture**, then **Record**.
- Only the foreground window is captured; ensure Blender is focused throughout.
- Output goes to `Videos\Captures\`; re-encode to H.264 MP4 if needed.

---

## macOS Screenshot (Cmd + Shift + 5)

- Select **Record Selected Portion** and drag a rect around the Blender window.
- Output is `.mov`; convert with `ffmpeg -i recording.mov -c:v libx264 -crf 18 output.mp4`.

---

## FFmpeg trim / re-encode

```bash
# Trim 00:05–00:35 and encode at CRF 18
ffmpeg -ss 00:05 -i raw.mp4 -t 00:30 -c:v libx264 -crf 18 -pix_fmt yuv420p viewport.mp4
```
