# Screen Recording Notes — Lenia Continuous Cellular Automaton

Tutorial: **Python numpy — Lenia: Continuous CA, FFT Convolution & Self-Organising Solitons for WebXR**
Output file: `public/library/videos/scripting/python-numpy-lenia-continuous-cellular-automaton-fft-soliton-webxr/screen.mp4`

---

## OBS / Windows Game Bar Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no narration needed) |
| Output format | MP4 (H.264, CRF 18) |

---

## What to Record

### Part 1 — Script execution (~90 s)
1. Open Blender 5.1, new general file.
2. Switch to **Scripting** workspace.
3. Paste `blueprint.py` into the Text Editor.
4. Press **Run Script** (Alt+P or the ▶ button).
5. Watch the Python Console: snapshot progress prints each 50 steps.
6. After ~15 s the mesh appears in the 3D Viewport — pause here.

### Part 2 — Shape-key timeline scrub (~30 s)
1. Switch to the **Layout** workspace.
2. Open **Properties → Object Data → Shape Keys** to show the `State_XX` keys.
3. Press **Space** to play — the Lenia surface morphs between snapshots.
4. Solitons (glowing blobs) should be visible translating across the plane.

### Part 3 — Viewport shading inspection (~30 s)
1. In the 3D Viewport press **Z → Material Preview**.
2. Slowly orbit around the mesh — show the hot colourmap (black→red→white).
3. Zoom into a cluster of soliton structures to show their internal gradient.

### Part 4 — FFT kernel visualisation (optional, 20 s)
1. Pause the timeline on any mid-sequence frame.
2. Select the mesh, open **Geometry Nodes** or **Scripting** workspace.
3. Add a quick `print(K.sum(), K.max())` to blueprint.py to confirm normalisation.

---

## Recommended Blender viewport state before recording
- Viewport shading: **Material Preview** (Z → Material Preview)
- Camera: Numpad 0 to enter camera view
- Overlay: hide grid floor, axes, cursor (N panel → View Overlay)
- Timeline scrub bar visible at bottom

---

## Notes
- The solitons are brightest in frames 2–7 — this is the most photogenic range.
- For a dramatic close-up: set camera to ortho, zoom to a quarter of the grid.
- Target duration for `screen.mp4`: 3–4 minutes.
