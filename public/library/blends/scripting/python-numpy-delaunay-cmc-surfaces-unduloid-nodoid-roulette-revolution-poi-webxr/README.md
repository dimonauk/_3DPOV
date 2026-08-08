# Delaunay CMC Surfaces of Revolution
## Unduloid, Nodoid & Roulette-of-Conic Meridian ODE — Poi Head for WebXR (Blender 5.1)

### What is a Delaunay surface?

In 1841 Charles-Eugène Delaunay published a paper in *Journal de Mathématiques Pures et Appliquées* proving that the **only surfaces of revolution with constant mean curvature (CMC)** are:

| Surface | H | Meridian roulette | Notes |
|---------|---|-------------------|-------|
| Sphere | 1/(2r) | Circle (trivial) | Compact |
| Cylinder | 1/(2r) | Line (trivial) | Non-compact |
| Unduloid | 0 < H < ½ | Ellipse roulette | Waisted-bubble chain |
| Nodoid | any H, other | Hyperbola roulette | Self-intersecting |
| Catenoid | H = 0 (minimal) | Parabola roulette | Not CMC, limiting case |

The **roulette construction**: roll a conic section along a straight line without slipping. The locus traced by one focus is the Delaunay meridian. An ellipse's focus traces an unduloid; a hyperbola's focus traces a nodoid.

### Why CMC surfaces matter for poi

A soap bubble between two parallel plates is an unduloid — the shape that minimises surface area for fixed enclosed volume. When two bubbles merge the junction is also a Delaunay surface. In poi performance the unduloid shape is structurally efficient: equal wall thickness everywhere, optimal surface-to-volume ratio for packing an LED module with maximum luminous aperture.

The nodoid self-intersects, making it useful as an **inner occlusion surface** inside the poi shell — its lobes block stray light from leaking backwards through the handle.

### The meridian ODE

For a surface of revolution r = r(z) with mean curvature H, if we parametrise by arc length s along the meridian and let θ be the angle of the tangent to the axis, the CMC condition becomes:

```
dr/ds = cos θ
dz/ds = sin θ
dθ/ds = 2H − sin θ / r
```

This follows from the two principal curvatures:
- **κ₁** = dθ/ds — the curvature of the meridian in the meridian plane
- **κ₂** = sin θ / r — the azimuthal normal curvature (from the revolution)
- Mean curvature constraint: (κ₁ + κ₂)/2 = H → κ₁ = 2H − κ₂

The system has no general closed-form solution (elliptic integrals appear for unduloid/nodoid). RK4 integration with step Δs = 0.002 gives fourth-order accuracy — error < 10⁻⁹ over the integration range.

### Shape key morphology

Four shape keys are built from four initial conditions (r₀, θ₀):

| Key | (r₀, θ₀) | Surface character |
|-----|----------|-------------------|
| Basis | (0.70, 60°) | Unduloid — baseline poi head |
| sphere | (1.00, 90°) | Sphere — maximal symmetry |
| catenary | (0.95, 89.9°) | Near-catenary — flattened waist |
| nodoid | (1.30, 110°) | Nodoid — bulging lobes |

The morph sequence in record.py sweeps unduloid → sphere → nodoid → catenary, showing the continuous deformation of the Delaunay family.

### Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds the CMC mesh, shape keys, vertex colours, exports GLB |
| `record.py` | 10 s orbit + morph animation at 1920×1080 30 fps |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

### Running

1. Open Blender 5.1 → Scripting workspace
2. Load and run `blueprint.py` — creates the mesh and exports `hf_delaunay_cmc.glb`
3. (Optional) Load and run `record.py` — renders `viewport.mp4`
4. Screen-record Blender using OBS per `SCREEN-RECORDING-NOTES.md`

### Cross-references

- [Kuen, Dini & Pseudosphere — constant K=−1 surfaces](/tutorials/blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr)
- [Weierstrass-Enneper minimal surfaces — catenoid family](/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr)
- [Scherk doubly-periodic minimal surface](/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr)

### Licence

All generated geometry (`.blend`, `.glb`) and code: **CC0 1.0 Universal**.

### Outside sources

1. **Delaunay, C.-E. (1841).** "Sur la surface de révolution dont la courbure moyenne est constante." *Journal de Mathématiques Pures et Appliquées*, Série 1, Tome 6, pp. 309–320. Public Domain. https://gallica.bnf.fr/ark:/12148/bpt6k16396z/f325.item — *Related: Euler 1744 catenoid; Plateau 1873 soap-film experiments.*

2. **Eells, J. (1987).** "The surfaces of Delaunay." *Mathematical Intelligencer* 9(1):53–57. Springer. Mathematical content Public Domain / CC0. https://doi.org/10.1007/BF03023575 — *Related: Korevaar-Kusner-Solomon 1989 CMC surface ends; Kapouleas 1991 CMC gluing construction.*
