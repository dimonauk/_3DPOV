# Screen-Recording Notes — DLA Crystal Dendrite
**For OBS Studio / Windows Game Bar · 1920×1080 · 30 fps · audio off**

## OBS Settings

- **Video Capture Device:** Blender application window (Window Capture, not Display Capture)
- **Base Resolution:** 1920×1080
- **Output Resolution:** 1920×1080
- **FPS:** 30
- **Audio:** all tracks disabled — no commentary for the raw viewport capture
- **File:** `screen.mp4`, H.264, CRF 18

## Suggested recording workflow

1. Run `blueprint.py` so the `.blend` is ready and the modifier is applied.
2. Set Blender to **EEVEE Next** render, Solid shading OFF, **Material Preview ON** (shortcut Z → Material Preview).
3. Arrange the 3D Viewport to fill ≈ 80% of screen; keep the modifier panel visible on the right strip so viewers see the Simulation Zone modifier with its cache state.
4. Clear the simulation cache (X button on the modifier) — record the cache-clear moment; this shows the viewer the reset state.
5. Press **Space** to play. Record the full 1–140 frame growth. You should see the crystal build from one bright seed to a full dendritic cluster.
6. After playback, scrub to frame 120, orbit the viewport with **Middle Mouse** to show the 3-D branching from multiple angles (30 seconds of orbiting).
7. Stop recording. Trim the video in the VSE or any editor to ≈ 60–90 seconds.

## What to emphasise visually

- The **seed point** at frame 1 — single golden dot at origin.
- The first **branch fork** (usually around frame 10–20) where DLA's preference for tips becomes visible.
- The **colour gradient** from cobalt seed to gold tips — shows aggregation order.
- The **Simulation Zone modifier panel** — show the baked frame counter ticking up.
- The **geometry count** in the header increasing (top left in Viewport Overlays → Statistics).

## Thumbnail frame

Frame 80–100 gives the best visual: enough branching to be impressive, not yet so dense that individual branches merge. Use EEVEE render (not viewport) for the thumbnail to get the metallic specular.
