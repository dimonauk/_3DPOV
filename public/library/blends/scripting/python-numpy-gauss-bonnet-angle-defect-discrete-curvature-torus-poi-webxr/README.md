# Discrete Gaussian Curvature & Gauss-Bonnet Theorem — Blender 5.1

**Category:** scripting  
**Blender:** 5.1  
**Licence:** CC0  
**Python deps:** `numpy` (bundled in Blender 4.1+ via Extensions Platform)

## What this builds

A parametric torus (R = 7 cm, r = 2.5 cm, 72 × 36 quad mesh) with every
vertex coloured by its **discrete Gaussian curvature** — computed as the
*angular defect* δ_v = 2π − Σᵢ θᵢ where θᵢ are the interior angles of all
surrounding faces.  The result:

| Region | Analytic K | Colour | Why |
|--------|------------|--------|-----|
| Outer equator (v ≈ 0) | K > 0 (max ≈ +62 m⁻²) | Red | Convex, like a sphere cap |
| Top/bottom arcs (v ≈ ±π/2) | K = 0 | White | Inflection — saddle meets sphere |
| Inner equator (v ≈ π) | K < 0 (min ≈ −22 m⁻²) | Blue | Saddle, like a horse saddle |

Σ δ_v is printed to the console and should read < 0.01% deviation from
zero — confirming the Gauss-Bonnet theorem: ∫ K dA = 2π · χ(torus) = 0.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build script — mesh, curvature computation, material, GLB export |
| `record.py` | Viewport-render animation (10 s turntable → `viewport.mp4`) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Artefacts produced

- `hf_gauss_bonnet_torus.blend` — Blender source (save after running blueprint)
- `hf_gauss_bonnet_torus.glb` — Draco-compressed WebXR GLB with curvature colours

## Mathematical background

The **Gauss-Bonnet theorem** (Bonnet 1848) is one of the deepest results in
differential geometry: the integral of Gaussian curvature over a closed smooth
surface equals 2π times the Euler characteristic, regardless of the surface's
shape.  For a torus (genus 1, χ = 0) this forces the red and blue zones to
cancel exactly — a result that remains true no matter how you deform the torus,
as long as you don't tear it.

The **discrete** (polyhedral) version — due to Descartes in the 1630s and
rediscovered by Euler — replaces the integral with a sum of angular defects and
remains exact at every resolution: Σ δ_v = 2π · χ.

### Analytic formula (torus)

For r(u,v) = ((R + r·cos v)·cos u, (R + r·cos v)·sin u, r·sin v):

    K(u,v) = cos(v) / (r · (R + r·cos(v)))

Positive for |v| < π/2, zero at v = ±π/2, negative for π/2 < |v| < 3π/2.

### Discrete angle defect

At each mesh vertex v:

    δ_v = 2π − Σᵢ θᵢ

where the sum runs over all face-corner angles touching v.  On a flat region
δ_v = 0; a pyramid tip gives δ_v > 0; a saddle region gives δ_v < 0.

## Running the script

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py`.
4. Press **Run Script** (▶) or Alt+P.
5. Check the console for `Σ δ_v ≈ 0.000` confirmation.
6. Switch to 3D viewport → Material Preview to see the colour map.
7. File → Save As → `hf_gauss_bonnet_torus.blend`.

## Related studio resources

- [Cotangent Laplacian Mesh Fairing](/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr) — cotangent weights are the discrete analogue of the Laplace-Beltrami operator, closely related to curvature flow.
- [Laplace-Beltrami Eigenmodes](/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr) — spectral mesh processing using the same operator whose spectrum encodes curvature information.
- [DEC Hodge Star & Harmonic 1-Forms](/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr) — Discrete Exterior Calculus framework that generalises both curvature and the Laplacian to differential forms.

## External sources

1. **Gauss, C.F. (1827). Disquisitiones generales circa superficies curvas.**  
   *Commentationes Societatis Regiae Scientiarum Gottingensis Recentiores*, 6.  
   Original work introducing Gaussian curvature and the intrinsic/extrinsic split.  
   Mathematical content public domain.  
   <https://gdz.sub.uni-goettingen.de/id/PPN35283028X_0006>

2. **Crane, Keenan et al. (2013). Robust fairing via conformal curvature flow.**  
   *ACM Transactions on Graphics* 32(4) (SIGGRAPH 2013).  
   Source code: MIT licence.  
   <https://www.cs.cmu.edu/~kmcrane/Projects/ConformalWillmoreFlow/>  
   Related: libigl (MPL-2.0) — <https://github.com/libigl/libigl>; geometry-central (MIT) — <https://github.com/nmwsharp/geometry-central>

## Licence

Blueprint and all authored files: **CC0 1.0 Universal** (public domain dedication).  
Mathematical results (Gauss-Bonnet theorem) are uncopyrightable facts.
