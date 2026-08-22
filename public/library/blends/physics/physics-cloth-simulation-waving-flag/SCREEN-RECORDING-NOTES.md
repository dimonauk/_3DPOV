# Screen Recording Notes — Cloth Simulation: Stylised Waving Flag

OBS Studio / Windows Game Bar instructions for capturing `screen.mp4`.

## Window Source

- Application: **Blender 5.1**
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off**

## Setup Before Recording

1. Open `waving_flag.blend`.
2. Press `Numpad 1` (front view), then `Numpad 5` (perspective).
3. Set the Timeline range to **1 – 120** in the Timeline header.
4. Press `Space` to start playback once to warm the cloth cache (let it run to frame 120).
5. Rewind to frame 1 with `Shift + Left Arrow`.

## What to Capture

- **0:00 – 0:03** — Flag at near-rest (frames 1–30): pin holds left edge; free
  edge barely moving as wind builds.
- **0:03 – 0:06** — Flutter onset (frames 30–72): standing wave forms; two or
  three ripples visible across the flag width.
- **0:06 – 0:10** — Fully extended (frames 72–120): flag billows at maximum
  extension; turbulence drives visible chaotic secondary ripples.

## Camera Angle

- Use the **Camera** view (`Numpad 0`) to match the blueprint camera.
- Alternatively orbit the viewport so both the mast and waving free edge are
  simultaneously visible — a diagonal view from `(+X, +Y, slight +Z)` works well.

## Output

Save as: `public/library/videos/physics/physics-cloth-simulation-waving-flag/screen.mp4`
Recommended codec: **H.264**, CRF 23.
