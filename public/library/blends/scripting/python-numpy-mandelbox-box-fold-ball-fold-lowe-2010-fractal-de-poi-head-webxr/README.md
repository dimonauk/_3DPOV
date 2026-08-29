# Mandelbox — Box-Fold / Ball-Fold Fractal Poi Head (Blender 5.1)

**Tom Lowe 2010 · scale=−1.5 / −2.0 / −1.25 shape keys · Cobalt–Amber Mandelbox_DE FLOAT_COLOR · WebXR poi-head**

The Mandelbox is a 3-D fractal defined by two Cartesian operations applied at each orbit step: a *box fold* that reflects each axis component about ±1, and a *ball fold* that inverts the vector within a unit sphere. Unlike the Mandelbulb (which uses spherical-coordinate power scaling), the Mandelbox has strict octahedral / cubic symmetry, producing spiky, cathedral-like structures reminiscent of Gothic architecture or coral reef formations.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Blender 5.1 Python script — builds mesh, shape keys, vertex colour, exports GLB |
| `record.py` | Viewport animation renderer (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `mandelbox_poi.blend` | Saved blend file (run blueprint.py to regenerate) |
| `mandelbox_poi.glb` | Draco-6 compressed WebXR-ready GLB |

## Key parameters

```python
SCALE_BASIS = -1.5   # classic Lowe 2010 (coral-reef structure)
SCALE_SK2   = -2.0   # SK_Scale2: longer dendritic spines
SCALE_SK125 = -1.25  # SK_Scale125: compact, gentler boundary
FOLD        = 1.0    # boxFold threshold
MIN_R       = 0.5    # ballFold inner radius
MAX_ITER    = 20     # orbit cap
THETA_N, PHI_N = 80, 120   # lat-lon grid → 9,600 vertices
```

## Shape keys

| Key | Scale | Visual character |
|-----|-------|-----------------|
| Basis | −1.5 | Classic Mandelbox; coral-like outer surface with sharp spines |
| SK_Scale2 | −2.0 | Longer, more elaborate spines; boundary moves outward |
| SK_Scale125 | −1.25 | Rounder, more compact; spines shortened |

## Cross-references

- Tutorial: `/tutorials/blender-tutorial-python-numpy-mandelbox-box-fold-ball-fold-lowe-2010-fractal-de-poi-head-webxr`
- Related: Mandelbulb power-8 (spherical DE, same radial-scan method)
- Related: Apollonian gasket (inversion geometry, similar recursive structure)
- Related: Gray-Scott reaction-diffusion (coral-like morphogenesis)
