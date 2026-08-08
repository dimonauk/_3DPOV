# Screen Recording Notes — Costa Minimal Surface

Capture the Blender session while running the blueprint and exploring the result.

## Setup

| Setting | Value |
|---|---|
| Window source | Blender (fullscreen) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `public/library/videos/scripting/python-numpy-costa-minimal-surface-weierstrass-enneper-elliptic-three-ends-poi-webxr/screen.mp4` |

## Recording sequence (approx. 4 min)

### 1 — Script and theory (0:00 – 0:40)
- Open `blueprint.py` in Blender's Script Editor.
- Read the module docstring aloud; point to the three WE integrals on screen.
- Briefly explain: "℘(z) is the Weierstrass elliptic function for the square lattice.  The three punctures — the ends — sit on the boundary of our integration domain, so the interior is clean."

### 2 — Run blueprint (0:40 – 1:30)
- Press **Run Script**.  The Eisenstein-series summation is the slow step (~30 s at N=74, M=16).
- As the script runs, point at the progress in the Python console.
- Once done, the mesh appears in the 3D viewport.

### 3 — Explore the geometry (1:30 – 2:30)
- Switch to **Solid mode → Vertex Colour**.
- Orbit around the surface: show the catenoid neck, the two flat wing-like ends, and the characteristic 3-fold layout.
- Zoom into the neck region: "this is where K (Gaussian curvature) is most negative — the blue region."
- Show the colour gradient: "cool blue = high |K|, warm orange = near-zero curvature at the wing tips."

### 4 — Shape keys (2:30 – 3:10)
- Select the object, open **Properties > Object Data > Shape Keys**.
- Scrub **Costa_Wide** from 0 → 1: watch the wings flatten and the neck widen.
- Return to Basis; scrub **Costa_Tall** from 0 → 1: the catenoid end stretches vertically.
- Say: "A controls the amplitude of the Gauss map — lower A gives flatter ends, higher A makes them more spherical."

### 5 — GLB check (3:10 – 3:45)
- Open a File Browser panel, navigate to `public/library/glbs/scripting/.../`.
- Show the exported `hf_costa_surface.glb` file.
- Optionally drag into Three.js Viewer or the Holoflow WebXR stage.

### 6 — Outro (3:45 – 4:00)
- Say: "One command, one script — a 1982 mathematical landmark running in Blender 5.1."
- Stop recording.

## OBS / Game Bar

**OBS Studio:**
1. Source → Window Capture → select Blender.
2. Video → Output Resolution 1920×1080, FPS 30.
3. Output → Recording → MP4, CRF 18.
4. Start Recording before step 1 above.

**Windows Game Bar (Win+G):**
1. Open Blender fullscreen.
2. Win+Alt+R to start, Win+Alt+R to stop.
3. Move clip from `Videos/Captures/` to the path above.
