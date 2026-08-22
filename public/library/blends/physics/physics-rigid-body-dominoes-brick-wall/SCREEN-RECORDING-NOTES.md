# Screen Recording Notes — Rigid Body: Domino Chain + Brick Wall

OBS Studio / Windows Game Bar instructions for capturing `screen.mp4`.

## Window Source

- Application: **Blender 5.1**
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **off**

## Prerequisites — Bake the Simulation First

The rigid body cache **must be baked** before physics plays back correctly during scrub:

1. Open `domino_chain.blend`.
2. Select any domino in the viewport (e.g. `domino_00`).
3. Go to **Properties** → **Scene** (camera icon) → **Rigid Body World** → **Cache**.
4. Confirm the cache path is set (default: `//cache/`).
5. Click **Bake All**.  At SUBSTEPS=20 and 120 frames, baking takes 15–45 s depending on CPU.
6. Scrub the timeline to frame 40: the domino wave should be mid-chain.

## Setup Before Recording

1. Set Viewport Shading to **Material Preview** (second sphere from right in header).
   EEVEE rendered mode is fine too but heavier — material preview is smooth at 30 fps.
2. Open a **Timeline** editor in the bottom strip; set range **1–120**.
3. Press **Numpad 1** for front view, then **Numpad 5** to toggle orthographic off (perspective on).
4. Orbit slightly to a 3/4 view: `Numpad 4` twice, then `Numpad 8` once.
5. Press **Space** once to confirm physics plays back; pause and rewind with **Shift + Left Arrow**.

## What to Capture

| Time | Frames | Event |
|------|--------|-------|
| 0:00 – 0:10 | 1 – 25 | First domino tips (tilted 15°); impacts second; chain begins |
| 0:10 – 0:30 | 25 – 72 | Wave propagates down the chain; 2–3 dominoes in motion simultaneously |
| 0:30 – 0:44 | 72 – 106 | Last domino strikes brick wall; first row collapses |
| 0:44 – 0:50 | 106 – 120 | Wall rubble settles; running-bond interlock drags rear rows forward |

## Suggested Narration Points (for voiceover or cut titles)

- **Frame 1–5**: "The first domino is pre-tilted 15° — past the 11° balance point."
- **Frame 40**: "Each domino sweeps 68 mm — matching the 68 mm spacing."
- **Frame 80**: "Impact on the running-bond wall — odd rows offset by 30 mm."
- **Frame 110**: "Rubble settles. SUBSTEPS=20 keeps the stack stable throughout."

## Export Spec

- Container: **MP4 / H.264**
- Resolution: **1920 × 1080** (downscale to 1280 × 720 if file size is a concern)
- Frame rate: **30 fps**
- Output: `public/library/videos/physics/physics-rigid-body-dominoes-brick-wall/screen.mp4`
