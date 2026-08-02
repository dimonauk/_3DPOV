# Screen Recording Notes — Thompson's Problem Tutorial

## Software
- OBS Studio (any recent version) or Windows Game Bar (Win+G)

## Setup
| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `screen.mp4`, H.264, CRF 23 |

## Sequence to record (≈ 10–12 minutes)

1. **Problem context (2 min)**
   - Open a browser tab to the Wikipedia article on Thomson's problem.
   - Draw or sketch on a shared whiteboard (or narrate):
     - N=4 charges → tetrahedron (the only stable arrangement for 4 equal repellers)
     - N=6 → octahedron
     - N=12 → icosahedron (this is the origin story of why icosahedra appear in
       virology: spherical virus capsids arrange protein subunits by minimising
       repulsion)
   - Mention J.J. Thomson's 1904 plum-pudding model of the atom — this is where
     the problem comes from, before the nuclear model.

2. **Mathematics (2 min)**
   - Open blueprint.py in the Scripting workspace.
   - Walk through the energy formula: E = Σᵢ<ⱼ 1/|pᵢ−pⱼ|
   - Show the gradient derivation:
     ∂E/∂pᵢ = Σⱼ≠ᵢ −(pᵢ−pⱼ)/|pᵢ−pⱼ|³
   - Explain why you project onto the tangent plane before stepping:
     a gradient on a curved manifold must be kept tangent to the manifold,
     otherwise the step moves off the sphere.
   - Show the `fibonacci_sphere()` function — explain why Fibonacci/golden-angle
     beats pure random as an initialiser (no spoke clustering, each point
     occupies ≈ equal area).

3. **Run blueprint.py (2 min)**
   - Press Alt+P. Console should print:
     ```
     [thompson] N=32 on S²
     [thompson] E(random)    = ...
     [thompson] E(fibonacci) = ...
     [thompson] E(mid @1200) = ...
     [thompson] E(optimal)   = ...
     [thompson] GLB → //hf_thompson_poi.glb
     [thompson] Done — poi head hf_thompson_poi.glb written.
     ```
   - Switch to the 3D Viewport. Enable Material Preview (Z). The poi head appears
     as a faceted sphere with cyan-to-magenta vertex colours showing per-vertex
     Coulomb energy (cyan = well-spaced, magenta = crowded).

4. **Shape key demonstration (2 min)**
   - Object Properties → Shape Keys panel.
   - Drag **Mid_Energy** to 1.0: vertices shift to the partially converged state —
     the facets are less regular, energy higher.
   - Return to 0; drag **Random** to 1.0: the mesh distorts to the initial random
     scatter — clearly irregular and asymmetric.
   - Scrub back and forth to demonstrate the continuous morph.
   - Point out how some vertices clump in the Random state — that clumping is what
     the repulsion force resolves.

5. **Run record.py and inspect .blend (2 min)**
   - Load record.py in the text editor; press Alt+P.
   - When the render finishes, show the viewport.mp4 in the VSE or file explorer.
   - Save the .blend: File → Save As → `hf_thompson_poi.blend`.

6. **Wrap-up (1 min)**
   - Mention applications: virus capsid geometry, geodesic dome strut placement,
     optimal satellite constellations, blue-noise texture point sampling.
   - Link to the Fibonacci sphere and CVT tutorials for related sphere-packing
     techniques in the studio library.
