# Screen Recording Notes — Boid Flock Simulation

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-boid-flock/screen.mp4`

## Software

- OBS Studio (free, any platform) **or** Windows Game Bar (`Win + G`)
- Blender 5.1

## OBS Setup

1. **Source → Window Capture** → select the Blender window.
2. Set canvas to **1920 × 1080**, downscale output to **1280 × 720** in
   `Settings → Video`.
3. Output: `Settings → Output → Recording → mp4 / H.264 / CRF 18`.
4. Audio: **mute all inputs** (this is a silent screen-capture).

## What to record (approx. 3–5 minutes)

### Part 1 — Scene walkthrough (~30 s)
- Open `boid_flock.blend`.
- In the 3-D viewport: orbit around the boid cloud at frame 1.
- Press **Space** to play — let the simulation run for ~30 frames so the
  flock begins to cluster.

### Part 2 — GN tree tour (~90 s)
- Switch to **Geometry Node Editor** (`Shift + F3`).
- Select the `boid_flock` object and expand the `BoidFlockGN` tree.
- Walk through from left to right:
  1. `SimulationInput` — explain "this is last frame's state".
  2. `IndexOfNearest` + two `SampleIndex` nodes — "finding my neighbour".
  3. Three VectorMath chains (sep / align / coh forces) — label each.
  4. Speed-clamp chain (NORMALIZE → SCALE) — "this stops tunnelling".
  5. `SetPosition` + `StoreNamedAttribute` + `SimulationOutput` — "write
     new state for next frame".
  6. `InstanceOnPoints` + `AlignEulerToVector` outside the zone — "render
     a cone facing the travel direction".

### Part 3 — Parameter tweaking live (~60 s)
- Open the GN tree's `SCALE` node for `SEP_WEIGHT`; change from `0.06` to
  `0.15`. Play back — flock scatters.
- Change back to `0.06`, increase `COH_WEIGHT` SCALE to `0.02`. Play —
  flock collapses tightly.
- Reset to defaults.

### Part 4 — Spreadsheet editor (~30 s)
- Open the **Spreadsheet Editor** (`Shift + F4`), set domain to `Point`.
- Scrub the timeline — watch `vel` attribute values change each frame.
- Point out: "each row is one boid; X/Y/Z columns are the velocity vector."

### Part 5 — Playback hero shot (~20 s)
- Return to 3-D viewport, frame 1.
- Set viewport shading to **Rendered** (EEVEE; blue glow on cones).
- Press **Space** and record the flock flying together for 30+ frames.

## Export
- Stop recording, trim handles in OBS replay buffer.
- Name the output file `screen.mp4` and move to
  `public/library/videos/geometry-nodes/gn-simulation-zone-boid-flock/`.
