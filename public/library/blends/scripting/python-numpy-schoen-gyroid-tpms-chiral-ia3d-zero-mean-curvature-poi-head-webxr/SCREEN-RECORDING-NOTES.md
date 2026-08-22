# Screen-Recording Notes — Schoen Gyroid TPMS

## Objective

Two recordings for the library entry:

| File | Contents |
|------|----------|
| `viewport.mp4` | 30-second Blender viewport walkthrough — orbit + shape-key sweep |
| `screen.mp4` | 60-second screen recording showing blueprint.py running in Scripting workspace |

---

## OBS Studio (recommended)

### Setup
1. **Source** → Window Capture → select the Blender window.
2. **Output** → MP4, H.264, CRF 18, 1920 × 1080, 60 fps.
3. **Audio** — mute or add a narration track.

### `viewport.mp4` — viewport walkthrough (~30 s)

1. Open the saved `.blend` (after running `blueprint.py`; expect ~60 s execution at N=60).
2. Switch to **Material Preview** (Z → Material Preview) so the cobalt–amber vertex colour is visible.
3. In the **Properties** panel → Object Data Properties → **Shape Keys**, open the list.
4. Orbit slowly around the gyroid (~180°) for 8 seconds — show both the chiral channel networks.
5. Ramp **SK_LevelP4** from 0 → 1 over 6 seconds, pause 2 seconds, return to 0.
   Point out: one channel system tightens as the level surface shifts.
6. Ramp **SK_LevelN4** from 0 → 1 over 6 seconds, pause 2 seconds, return to 0.
   Point out: the complementary (opposite handedness) channel tightens.
7. Return to Basis, orbit once more (~360° in 6 seconds).
8. Trim total to ≤ 30 s.

### `screen.mp4` — scripting workspace run (~60 s)

1. Open a fresh Blender session.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` via Text Editor → Open.
4. Press **Run Script**.  Blueprint executes in ~45–90 seconds (depends on CPU).
5. Once the console prints `Gyroid GLB exported →`, switch to the **3D Viewport**.
6. Record the result mesh for ~15 seconds (orbit slowly).
7. Trim to ≤ 60 s.

**Tip**: Run `record.py` instead for a fully automated 90-frame viewport render
that saves directly to `public/library/videos/…/viewport.mp4`.

---

## Windows Game Bar (Win + G)

- Press **Win + G**, select **Capture** → **Record**.
- Keep Blender focused throughout; only the foreground window is captured.
- Output goes to `Videos\Captures\`; re-encode to H.264 MP4 if needed.

---

## macOS Screenshot (Cmd + Shift + 5)

- Select **Record Selected Portion**, drag a rect around the Blender window.
- Output is `.mov`; convert: `ffmpeg -i recording.mov -c:v libx264 -crf 18 output.mp4`.

---

## FFmpeg trim / re-encode

```bash
# Trim 00:05–00:35 and re-encode at CRF 18
ffmpeg -ss 00:05 -i raw.mp4 -t 00:30 -c:v libx264 -crf 18 -pix_fmt yuv420p viewport.mp4
```
