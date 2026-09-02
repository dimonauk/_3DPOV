# Screen-Recording Notes — Peter de Jong Attractor

## OBS / Game Bar Setup

| Setting       | Value                                      |
|---------------|--------------------------------------------|
| Source        | Window Capture → Blender (exact window)    |
| Resolution    | 1920 × 1080                                |
| Frame rate    | 30 fps                                     |
| Audio         | **Off** — no audio for this session        |
| Output file   | `screen.mp4` (H.264, CRF 18)              |
| Output folder | `public/library/videos/scripting/python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr/` |

## Session Steps to Record

1. **Open Blender 5.1** — new General file, delete default cube.
2. Open the **Scripting** workspace.
3. Create a new text block, paste `blueprint.py`.
4. **Run Script** (▶). Watch the status bar — the 5 M-iteration loop takes
   roughly 3–5 seconds per shape key. The mesh appears in the 3-D viewport.
5. Switch to **Solid** shading, then **Material Preview** to show the
   cobalt-amber gradient across the height field.
6. In the Shape Keys panel, scrub the value sliders for `SK_Web`, `SK_Star`,
   `SK_Spiral` so the viewer sees the geometry morph.
7. Open a new text block, paste `record.py`, run it — the EEVEE-Next
   animation render starts. OBS can continue recording during the render.
8. Once render is done, **Save As** → `dejong_floor.blend`.

## Key Moments to Highlight On-Screen

- The 120 × 120 vertex grid populating (Frame 0 → mesh visible).
- Switching between shape keys to show parameter diversity.
- The EEVEE-Next bloom giving the cobalt edges their halo.
- The final orbit camera path sweeping around the floor.

## Post-Production (optional)

Trim to the interesting 60-90 second window showing: script run → mesh
appears → material preview → shape key scrub → render starts.
Export to `screen.mp4` alongside `viewport.mp4`.
