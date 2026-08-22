# Screen Recording Notes — Zernike Poi Disc

## Software
OBS Studio (≥ 30.0) or Windows Game Bar (Win+G).

## Source setup
- **Window Capture** — source = Blender (not Display Capture)
- Resolution: 1920×1080, Base 1920×1080, Output 1920×1080
- FPS: 30
- Audio: off (no mic, no desktop audio)
- Format: MP4 / H.264, CRF 18 (high quality)

## Output file
Save to: `public/library/videos/scripting/python-numpy-zernike-polynomials-noll-wavefront-aberration-disc-poi-webxr/screen.mp4`

## Recording script (~5 minutes)

### 1. Opening — theory (60 s)
Open Blender 5.1 with a fresh default scene.  Switch to **Scripting** workspace.
Talk through what Zernike polynomials are: the unit disc, orthonormality, Noll ordering.
Show the `NOLL` table in blueprint.py and point to the four morph modes.

### 2. Blueprint run (60 s)
Load blueprint.py into the text editor.  Press **Alt+P**.
Watch the console: should print the mesh stats and `✓ exported //hf_zernike_poi.glb`.
Switch to **3D Viewport → Material Preview** (Z → Material Preview).

### 3. Mesh inspection — basis mode (45 s)
The basis is spherical aberration (j=11): a "volcano" ring — high at the rim,
depressed at the centre, C∞ rotationally symmetric.  Press **Numpad 7** (top-down)
to see the teal rim and white central zero.  Press **Numpad 1** (front) to see the
cross-section depth.

### 4. Shape key morphs (90 s)
Open **Object Properties → Shape Keys**.  Drag each weight 0→1→0 in sequence:
- **defocus** (j=4): parabolic dome/bowl — no angular variation, pure ρ²
- **astigmatism_0** (j=5): saddle shape — two positive lobes, two negative,
  cos(2θ) angular dependence
- **coma_x** (j=7): comet shape — one large positive lobe trailing to negative,
  cos(θ) angular dependence, breaks rotational symmetry
- **trefoil_x** (j=9): three equal lobes at 120° — cos(3θ), D₃ symmetry

Pause on each to let the viewer read the topology.

### 5. record.py render (30 s)
Load record.py.  Press **Alt+P**.  Wait for the render to complete (~30 s on a
mid-range machine).  Play back the resulting viewport.mp4 in the video sequence
editor to confirm smooth morph animation.

### 6. GLB export and Three.js note (30 s)
Open the exported hf_zernike_poi.glb in a browser via Three.js or
model-viewer.  Show `mesh.morphTargetInfluences[0]` (defocus) set to 0.8 to
demonstrate in-browser morph.  End recording.

## OBS quick-start commands
```
Start recording: Alt+F9
Stop recording:  Alt+F9
```
