# Screen Recording Notes — Rigid Body Domino Chain

**Target file:** `public/library/videos/physics/physics-rigid-body-domino-chain/screen.mp4`

## Before you start

1. Run blueprint.py to generate `domino_chain.blend`:
   ```
   blender --background --python blueprint.py
   ```
2. Open `domino_chain.blend` in Blender 5.1.
3. **Bake the simulation** — Object menu > Rigid Body > Bake to Keyframes,
   Frame range 1–120.  This converts the Bullet cache to per-object keyframes so
   playback is instant and scrubbing works.
4. Press **Space** to verify the chain topples cleanly in the viewport.
5. Set the 3D viewport to **Material Preview** (Z) or **Rendered** (Z then R) shading.

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture → Blender |
| Resolution | 1920 × 1080 (match Blender window) |
| Frame rate | 30 fps |
| Encoder | x264 or NVENC — quality preset Medium |
| Audio | **Off** |
| Output file | `screen.mp4` |

## What to capture

1. **Set frame to 1** (first domino tilted, rest standing).  Hold 2 seconds.
2. **Press Space** — play the animation.
3. Record the full topple: 120 frames ≈ 5 s.  Let playback finish.
4. **Replay once more** (Shift+Left to reset, Space to play) at the same wide angle.
5. Stop OBS recording.

## Suggested viewport framing

- View: **Front Ortho** (Numpad 1) gives a clean side-on view of the chain.
- Or use **camera view** (Numpad 0) for the 3/4 angle set up by record.py.

## Trim notes

- Trim the start to the moment the first domino visibly begins to accelerate.
- Keep a 0.5 s still hold at the end showing all dominos flat.
- Final target duration: 6–8 s (include one reset-and-play if you have room).
