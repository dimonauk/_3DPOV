# Screen-Recording Notes — Chirikov Standard Map

## Target file
`public/library/videos/scripting/python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr/screen.mp4`

## OBS settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off (no mic, no desktop audio) |
| Encoder | x264, CRF 20 |
| Output | screen.mp4 |

## Suggested takes

### Take 1 — Basis (K_critical)
1. Open blueprint.py in the Scripting workspace; run it.
2. Switch to Material Preview (Z → Material Preview).
3. Position viewport: numpad 7 (top), scroll to fit floor in frame, tilt to ~45° by MMB-drag.
4. Record: show the critical-threshold height-field rotating slowly (middle-mouse turntable).
5. Pause at angles where the golden-ratio KAM ridge is visible as a high spine.

### Take 2 — Shape-key sweep in Properties → Object Data → Shape Keys
1. With the object selected, open the Properties panel → Object Data (green icon).
2. Scroll to Shape Keys.  Show SK_Integrable value slider dragging from 0 → 1.
3. The tall parallel ridges (intact tori) rise from the uniform Basis landscape.
4. Then drag SK_Chaotic from 0 → 1 — ridges flatten into the stochastic sea.

### Take 3 — Script run (for tutorial B-roll)
1. Maximise the Scripting workspace.
2. Show blueprint.py open, then hit Run Script.
3. Show the Python console output scrolling as densities compute.
4. Cut to the finished 3D view with the floor lit.

## Duration
Target: 60–90 seconds per take, cut together to ~3 minutes total.
