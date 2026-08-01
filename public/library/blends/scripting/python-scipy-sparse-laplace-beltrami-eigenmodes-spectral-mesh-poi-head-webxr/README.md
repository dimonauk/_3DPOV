# Laplace-Beltrami Eigenmodes — Spectral Mesh Poi Head

**Topic**: Spectral geometry — cotangent Laplacian, generalised eigenvalue problem  
**Blender version**: 5.1  
**Licence**: CC0  
**Output**: `hf_lbo_poi.blend` + `hf_lbo_poi.glb`

## What this does

Assembles the discrete Laplace-Beltrami operator on an icosphere (162 vertices,
subdivision level 3) using cotangent edge weights, pairs it with a lumped
barycentric mass matrix, and solves the symmetric generalised eigenvalue problem

    L φ = λ M_lump φ

for the eight lowest-frequency shape harmonics using `scipy.sparse.linalg.eigsh`.
Each eigenvector is stored as a morph-target shape key, displacing vertices along
their sphere normals. The result is a WebXR GLB with eight labelled morph targets
ready for `THREE.AnimationMixer` or manual slider control.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender Scripting tab — builds mesh, LBO, eigenmodes, shape keys, GLB |
| `record.py` | Run after blueprint — renders viewport.mp4 cycling through all 8 modes |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Manifest of expected output files |

## Running

1. Open Blender 5.1, Scripting workspace.
2. New text block, paste or open `blueprint.py`.
3. Run Script (Alt+P). Takes ~5 s: pip install check + LBO assembly + eigsh.
4. Switch to Material Preview. Eight shape keys visible in Properties panel.
5. Optionally run `record.py` for the animation render.

## Mathematical background

The cotangent Laplacian weight for edge (i,j) is:

    w_ij = (cot α_ij + cot β_ij) / 2

where α_ij and β_ij are the angles in the two triangles sharing that edge,
*opposite* to the edge. The lumped mass M_ii is one-third of the total area
of all triangles adjacent to vertex i.

Mode 1 (the Fiedler vector) minimises the Rayleigh quotient φᵀLφ / φᵀMφ subject
to orthogonality with the constant mode. Geometrically, it defines the direction
of maximum variation across the surface — on a sphere it bisects into two
hemispheres; on a more complex mesh it finds the "narrowest waist".

## Cross-references

- Cotangent Laplacian smoothing: `/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr`
- Surface RD with umbrella Laplacian: `/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr`
- Geodesic sphere (same base mesh): `/tutorials/blender-tutorial-python-bmesh-ops-geodesic-sphere-icosahedron-frequency-subdivision-vrm-webxr`
- Spherical harmonics shape keys: `/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr`
