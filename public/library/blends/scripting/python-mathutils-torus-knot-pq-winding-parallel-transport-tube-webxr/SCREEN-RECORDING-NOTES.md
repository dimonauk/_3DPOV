# Screen Recording Notes — Torus Knot T(p,q) Parallel-Transport Tube

## Setup

1. Open Blender 5.1.  Open the file `hf_torus_knot.blend` (or run `blueprint.py` first).
2. Switch to **Material Preview** shading (Z → Material Preview).  Confirm the bloom glow is visible on the electric-blue strand.
3. Set viewport background to **black**: Viewport Overlays → uncheck all gradient options if the background is grey.

## OBS / Game Bar settings

| Field | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic or desktop audio) |
| Output | `screen.mp4`, MP4/H.264, CRF 23 |

## Shot list

**Shot A — Static hero (0–4 s)**
- Camera is at the default position (front-right quarter, slight elevation).
- Frame: torus knot fills about 80 % of the frame with the glow halo visible.
- Hold steady for 4 seconds.

**Shot B — Slow orbit (4–10 s)**
- Hold RMB + drag to orbit slowly left → right.
- Show the under-belly of the trefoil (the three lobes become visible from below).
- Target: viewer sees the strand cross over itself three times (T(2,3) trefoil crossings).

**Shot C — Parameter swap (10–14 s)**
- In the Scripting workspace, change `P = 2; Q = 5` and press ▶ Run Script.
- The knot rebuilds in <1 second — the cinquefoil appears (5 crossings).
- Cut back to 3D viewport showing the new shape.

**Shot D — Topology closeup (14–18 s)**
- Navigate Blender to Viewport Overlays → Face Normals (0.04 m length).
- Slowly orbit to show the normals pointing uniformly outward — confirming orientability.
- Then disable Face Normals.

## Editing tips

- Use a 0.5 s fade-in from black at the start.
- Add a text caption at frame 1: `T(2,3) Trefoil — parallel-transport tube`.
- At Shot C show the `P/Q` parameter block in the script briefly before running.
- Keep total length under 60 seconds.
