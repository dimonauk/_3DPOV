# Differential geometry — the calculus of curved things

The long-form companion to the codex entry
`differential-geometry-essentials`. Same material as the catalogue
gloss, the longer treatment: derivations, more worked examples, and
the bits that wouldn't fit on a single page.

Princess teaching register. British spelling. The intended reader is a
working engineer who already knows linear algebra and multivariable
calculus and wants the geometric pictures sharp enough to use on the
bench, not a graduate student preparing for a qualifying exam.

When this file goes over 300 lines it stays one document anyway,
because the topic is unitary — splitting it would force forward
references that defeat the point. Other math-essentials docs in the
same family follow the same rule of thumb.

---

## I. Why this doc exists

Differential geometry is the language in which a surprising fraction
of the studio's stack actually thinks. A gyroid lattice is not just an
implicit function; it is a minimal surface, the soap-film answer to a
variational problem, and the reason it does not buckle under print
load is the reason a soap film does not buckle under air pressure —
mean curvature is zero on both sides of the equation. A Gaussian splat
carries a 3×3 covariance whose eigenvectors and eigenvalues are a
local approximation to the surface's principal directions and
principal curvatures; the rasteriser is rendering little chunks of
intrinsic geometry, one ellipsoid at a time. A caustic lens is a
height-field solution to an optimal-transport problem on the surface
of the lens, and the sharp ridges in the caustic image are the fold
singularities of a Jacobian map. A smooth-shaded mesh interpolates
surface normals at vertices because Phong assumed, correctly, that
nearby triangles approximate a single smooth manifold.

Treat this file as the place to look up the language the rest of the
codex assumes. It does not replace do Carmo, Pressley, or Spivak; it
borrows their definitions and shows where the studio uses them.

## II. Curves: tangent, curvature, torsion

A smooth parametric curve in space is a map
`γ : I → ℝ³` where `I ⊂ ℝ` is an interval. We will assume `γ` is
regular (the tangent never vanishes) and reparameterise by arc length
`s` so that `|γ'(s)| = 1` everywhere. The arc-length parameterisation
is the one that makes the formulae cleanest; it is also the one a
caterpillar uses to crawl along the curve.

### The Frenet frame

At each point of the curve we attach an orthonormal frame:

- **Unit tangent** `T(s) = γ'(s)`. Length 1 by construction.
- **Principal normal** `N(s) = T'(s) / |T'(s)|`, defined wherever
  `T' ≠ 0` — that is, wherever the curve is genuinely curving.
- **Binormal** `B(s) = T(s) × N(s)`. Completes the right-handed frame.

The two scalar invariants are:

- **Curvature** `κ(s) = |T'(s)| ≥ 0`. How fast the tangent turns.
- **Torsion** `τ(s)`. How fast the curve leans out of its osculating
  plane (the plane spanned by `T` and `N`). The sign of `τ` matters
  here, unlike `κ`.

The Frenet-Serret formulas knit them together:

```text
T'(s) =  κ N
N'(s) = −κ T  +  τ B
B'(s) =          −τ N
```

The matrix on the right is skew-symmetric, which is what guarantees
the frame stays orthonormal as it travels along the curve.

### When curvature is zero, or torsion is zero

- `κ ≡ 0` ⇒ the curve is a **straight line**. Trivially, `T' = 0`, so
  the tangent never rotates.
- `τ ≡ 0` (with `κ > 0`) ⇒ the curve is a **plane curve**. The
  osculating plane is constant, so the curve lies in one plane.
- `κ` and `τ` both constant ⇒ the curve is a **circular helix**. Take
  `κ = a / (a² + b²)` and `τ = b / (a² + b²)` for a helix of radius
  `a` and pitch `2π b`.

The **fundamental theorem of curves** says that any two scalar
functions `κ(s) > 0` and `τ(s)` define a curve uniquely up to rigid
motion — translate or rotate two curves with matching invariants and
they will lie on top of each other. This is the same flavour of result
as the surface fundamental theorem we will meet later: the metric and
shape operator determine the surface up to ambient rigid motion.

### A worked curve: the circular helix

Take `γ(s) = (a cos(s/c), a sin(s/c), b s/c)` with `c = √(a² + b²)`.
Check arc length:

```text
γ'(s) = (−(a/c) sin(s/c), (a/c) cos(s/c), b/c)
|γ'(s)|² = a²/c² + b²/c² = (a² + b²)/c² = 1
```

So `s` really is arc length. Now compute `T' = γ''`:

```text
γ''(s) = (−(a/c²) cos(s/c), −(a/c²) sin(s/c), 0)
|γ''(s)| = a / c²
```

So `κ = a / (a² + b²)`, constant. A quick determinant calculation
gives `τ = b / (a² + b²)`, also constant. When `b → 0` the helix
flattens to a circle of radius `a` (`τ → 0`, `κ → 1/a`); when `a → 0`
it stretches to a straight line along `z` (`κ → 0`).

## III. Surfaces: tangent plane, normal, the first fundamental form

A smooth surface is a map `X : U ⊂ ℝ² → ℝ³` with parameters `(u, v)`.
Regularity here means the two partial derivatives `X_u` and `X_v` are
linearly independent at every point — the parameterisation is not
degenerate.

### Tangent plane and surface normal

`X_u` and `X_v` span the **tangent plane** at the point. The
**unit surface normal** is:

```text
n = (X_u × X_v) / |X_u × X_v|
```

Two normals, of course, of opposite signs; choosing one consistently
across the surface is **orientation**, and a surface that admits a
consistent choice is **orientable** (the Möbius band is the standard
counterexample).

The studio's mesh-shading paths sit on this object. **Flat shading**
uses the face normal `n` once per triangle: the surface inside the
triangle is treated as planar. **Smooth shading** interpolates the
**vertex normals** across the face, producing the illusion of a
curved surface across what is physically a polygonal patch. The
practical difference, on a low-poly model, is enormous; on a
1M-triangle scan, indistinguishable.

### The first fundamental form (the metric)

At each point of the surface, the inner product the tangent plane
inherits from `ℝ³` is a 2×2 positive-definite symmetric matrix:

```text
I = [[E, F], [F, G]]
E = X_u · X_u
F = X_u · X_v
G = X_v · X_v
```

The **squared length** of an infinitesimal step `(du, dv)` in
parameter space is:

```text
ds² = E du² + 2 F du dv + G dv²
```

This is the surface's own ruler. A creature confined to the surface,
unable to perceive the ambient `ℝ³`, can still measure lengths and
angles using `I`. Anything you compute from `I` alone is **intrinsic**.

### Computing on a sphere

Parameterise the sphere of radius `R` by latitude `θ ∈ (0, π)` and
longitude `φ ∈ [0, 2π)`:

```text
X(θ, φ) = (R sin θ cos φ, R sin θ sin φ, R cos θ)
```

Partials:

```text
X_θ = ( R cos θ cos φ,  R cos θ sin φ, −R sin θ)
X_φ = (−R sin θ sin φ,  R sin θ cos φ,        0)
```

Inner products:

```text
E = R²
F = 0
G = R² sin² θ
```

So an infinitesimal step has `ds² = R² dθ² + R² sin² θ dφ²` — the
familiar polar metric. The metric tells us that motion in latitude
moves `R` units per radian regardless of where you are, but motion in
longitude moves `R sin θ` units per radian — zero at the poles,
maximal at the equator. The equator is "longer" not because the sphere
is bigger there but because `sin θ` peaks there.

## IV. The second fundamental form and principal curvatures

The first fundamental form is intrinsic; the second fundamental form
is extrinsic. It records how the surface bends inside its ambient
space, and you cannot compute it without knowing which way the
surface is sitting in `ℝ³`.

### Definition

```text
II = [[L, M], [M, N]]
L = X_uu · n
M = X_uv · n
N = X_vv · n
```

The eigenvalues of the **shape operator** `S = I⁻¹ II` (a 2×2 matrix
acting on the tangent plane) are the **principal curvatures**
`κ₁, κ₂`. They are the maximum and minimum normal curvatures at the
point — the rate at which the surface curves away from the tangent
plane along the most-curved and least-curved directions, which are
always orthogonal in the tangent plane.

From `κ₁, κ₂`, two derived scalars do all the heavy lifting:

- **Mean curvature** `H = (κ₁ + κ₂) / 2`. The average. Extrinsic.
- **Gaussian curvature** `K = κ₁ · κ₂`. The product. Surprisingly,
  intrinsic — Gauss's Theorema Egregium.

### Sphere of radius R

The sphere bends the same amount in every direction at every point:
`κ₁ = κ₂ = 1/R` (with the outward normal). So:

```text
H = 1/R
K = 1/R²
```

A larger sphere is less curved in both senses. The Earth has
`R ≈ 6371 km`, so `K ≈ 2.5 × 10⁻¹⁴ m⁻²`, which is why a builder's
spirit level works at the human scale: over a metre, the Earth's
curvature contributes a deviation of order `K · L² / 2 ≈ 10⁻¹⁴ m`,
far below any tolerance.

### Plane

For `X(u, v) = (u, v, 0)`, the second fundamental form is identically
zero. Both principal curvatures vanish; `H = K = 0`. The plane is the
trivial minimal surface (`H = 0`) and the trivial flat surface
(`K = 0`).

### Cylinder of radius R

For `X(θ, z) = (R cos θ, R sin θ, z)`, the second fundamental form
has one non-zero eigenvalue: `κ₁ = 1/R` along the circumferential
direction, `κ₂ = 0` along the axial direction. So `H = 1/(2R)` and
`K = 0`. The cylinder is curved (extrinsically — `H ≠ 0`), but flat
(intrinsically — `K = 0`). That is why a piece of paper rolls cleanly
into a cylinder without tearing, but a piece of paper cannot wrap
around a sphere without distortion. The cone shares this property;
both are **developable** surfaces.

### Theorema Egregium and why paper does not wrap spheres

Gauss's 1827 result is that `K` is intrinsic: it can be expressed
entirely in terms of `E, F, G` and their derivatives. A creature
on the surface can measure `K` with string and a protractor — for
instance by checking how much the circumference of a small circle of
radius `r` falls short of `2π r`, which to leading order is
`C(r) ≈ 2π r (1 − K r² / 6)`.

The consequence is that any isometry (length-preserving deformation)
preserves `K`. A flat sheet of paper has `K ≡ 0`. A sphere has
`K = 1/R² > 0`. There is no way to map one to the other without
either stretching or tearing. This is the geometric content of "you
cannot make a flat map of the Earth without distortion" — and the
reason every map projection (Mercator, equal-area, equirectangular)
has to choose what to give up.

## V. Minimal surfaces and the variational setup

A **minimal surface** is one whose mean curvature is zero everywhere:
`H ≡ 0`. The name comes from the **calculus of variations**: among
all surfaces with a given fixed boundary, the surface of least area
is one with `H = 0`.

### The calculus-of-variations sketch

For a surface defined by a small height function `h(u, v)` over a
patch, the area is:

```text
A[h] = ∫∫ √(1 + |∇h|²) du dv
```

The first variation of `A` with respect to perturbations of `h` gives
the Euler-Lagrange equation, which (after some manipulation) is:

```text
H = (1/2) ∇·( ∇h / √(1 + |∇h|²) ) = 0
```

A critical point of the area functional is a surface with mean
curvature zero. Soap films are physical minimisers of area subject
to a fixed boundary wire frame; they realise mean-curvature-zero
surfaces. The studio's print-bench analogy is that a lattice with
`H = 0` everywhere is, in a load-bearing sense, the path of least
material commitment to a given topological shape.

### Triply periodic minimal surfaces (TPMS)

A **triply periodic minimal surface** is a minimal surface that fills
space with three independent translational symmetries — it tiles the
unit cube, repeats. The first examples were found by Schwarz in 1865
(the P, D, and H surfaces); Alan Schoen at NASA added seventeen more
in 1970 (the gyroid the most famous of them); Karcher and Polthier
gave the modern numerical recipes for building them in their 1996
*Construction of Triply Periodic Minimal Surfaces* paper.

The studio's three workhorses are:

| Surface   | Implicit (approximate)                                                  |
|-----------|--------------------------------------------------------------------------|
| Gyroid    | `sin x cos y + sin y cos z + sin z cos x = 0`                            |
| Schwarz P | `cos x + cos y + cos z = 0`                                              |
| Schwarz D | `sin x sin y sin z + sin x cos y cos z + cos x sin y cos z + cos x cos y sin z = 0` |

These are the **nodal-surface approximations** — they are not exactly
minimal but are close enough to evaluate cheaply on a grid and feed to
marching cubes. The exact gyroid can be expressed as a Weierstrass
parameterisation but cannot be written in closed form in `(x, y, z)`.

Because `H = 0` and `K ≤ 0` everywhere, a TPMS is **saddle-shaped at
every point**. The principal curvatures come in equal-and-opposite
pairs: `κ₁ = −κ₂`. There is no convex face, no concave bowl; the
surface is everywhere a Pringle. That saddle-everywhere character is
what produces the gyroid's uncanny look and (the load-bearing claim)
its isotropic stiffness as a structural lattice.

### A TPMS evaluation, by hand

Take the gyroid's implicit function and evaluate at a few points:

```text
f(x, y, z) = sin x cos y + sin y cos z + sin z cos x

f(0, 0, 0)            = 0 + 0 + 0          = 0     ← on the surface
f(π/2, 0, 0)          = 1·1 + 0·1 + 0·0   = 1     ← outside (or inside)
f(π/4, π/4, π/4)      = 3 · (√2/2)(√2/2)  = 3/2   ← off the surface
f(π/2, π/2, π/2)      = 0·0 + 0·0 + 0·0   = 0     ← on the surface
```

The gradient at the origin:

```text
∇f = (cos x cos y − sin z sin x,  −sin x sin y + cos y cos z,  −sin y sin z + cos z cos x)
∇f(0,0,0) = (1, 1, 1)
```

The surface normal at the origin points along the cube diagonal — a
visible feature of the gyroid that operators meet on the bench when
slicing a printed sample along the `(1,1,1)` plane and seeing the
self-symmetric face appear.

## VI. Geodesics: straight lines on a curved surface

A **geodesic** is a curve on the surface that is locally
length-minimising. The defining condition is that the geodesic
curvature vanishes — equivalently, the curve's acceleration vector
(as a curve in `ℝ³`) is everywhere normal to the surface, with no
tangential component.

### Examples

- **Plane.** Geodesics are straight lines.
- **Sphere.** Geodesics are great circles — the intersection of the
  sphere with any plane through the centre. The shortest path between
  two cities on the Earth is a great-circle arc, which is why
  long-haul flight paths drawn on a flat map look curved.
- **Cylinder.** Geodesics are helices. The cylinder is intrinsically
  flat (`K = 0`), so when you unroll it the helices straighten to
  ordinary lines — and conversely, you can find geodesics on a
  cylinder by unrolling, drawing a straight line, and rolling back up.
- **Cone with apex removed.** Likewise developable, so unroll, draw
  straight, roll back.

### The geodesic equation

In local coordinates, a geodesic `γ(s) = (u(s), v(s))` satisfies:

```text
d²uᵏ/ds² + Σᵢⱼ Γᵏᵢⱼ (duⁱ/ds)(duʲ/ds) = 0
```

where the `Γᵏᵢⱼ` are the Christoffel symbols, computable from the
first fundamental form `I` and its derivatives. The studio's WebXR
teleportation locomotion uses a small integrator on this equation
when the player teleports across uneven ground; the underlying mesh
is treated as a Riemannian manifold and a geodesic is shot from the
toe in the chosen direction.

## VII. Manifolds, charts, atlases

A **manifold** is a space that locally looks like `ℝⁿ`. A **chart** is
a pair `(U, φ)` with `U` an open patch of the manifold and `φ` a
homeomorphism from `U` to an open subset of `ℝⁿ`. An **atlas** is a
collection of charts that cover the manifold, with smooth transition
maps on the overlaps.

The sphere `S²` needs at least two charts (stereographic projection
from the north pole and from the south pole, say); a single chart
cannot cover it because no continuous map from `ℝ²` is bijective onto
a closed sphere. The torus `T²` needs at least three charts to be
covered by squares without seam ambiguity; in practice four are used.
The plane needs one. The Möbius band needs two and an orientation-
reversing transition map, which is what makes it non-orientable.

The working principle is **coordinate independence**: any computation
on the manifold must give the same answer regardless of which chart
is used to describe the same patch. Tensors are the objects that
transform correctly under chart changes; partial derivatives by
themselves do not, which is why covariant derivatives and Christoffel
symbols are needed once you leave the plane.

### Intrinsic versus extrinsic — the working list

| Property            | Intrinsic | Extrinsic |
|---------------------|-----------|-----------|
| Length of a curve   | yes       | yes       |
| Angle at a point    | yes       | yes       |
| Surface area        | yes       | yes       |
| Gaussian curvature `K` | yes    | yes       |
| Mean curvature `H`  | no        | yes       |
| Principal curvatures `κ₁, κ₂` | no | yes |
| Surface normal `n`  | no        | yes       |
| Geodesic distance   | yes       | yes       |

The intrinsic column is everything a flatlander can measure without
knowing they are on a curved surface. The extrinsic column is
everything that requires an ambient embedding. The studio leans on
the distinction every time it unrolls a developable surface for
sheet-cutting (intrinsic operation), or every time it computes a
surface normal for shading (extrinsic operation).

## VIII. The Riemann curvature tensor (briefly)

For a manifold of dimension `n`, the Gaussian curvature generalises
to a four-index tensor `Rⁱⱼₖₗ` measuring how parallel transport
around a small loop fails to bring a vector back to itself.

On a 2D surface the Riemann tensor has only one independent
component, and that component is `K` itself. On a 4D Lorentzian
manifold (general relativity's spacetime), the Riemann tensor has 20
independent components; contracting it once gives the Ricci tensor
`Rⱼₗ`, contracting again gives the Ricci scalar `R`, and assembling
the Einstein tensor `Gⱼₗ = Rⱼₗ − (R/2) gⱼₗ` gives the left-hand
side of Einstein's field equations.

The studio does not solve Einstein's equations on the bench. But the
machinery is the same machinery used to integrate geodesics on a
terrain mesh, and the same machinery used in general-purpose lens
ray-tracing through inhomogeneous-index media — anywhere "light, or a
particle, takes the locally-straightest path through curved
something" is the operating intuition, the Riemann tensor is the
operator on the other side.

## IX. Gauss-Bonnet (intuition only)

For a closed, orientable 2-manifold `M`, the integral of the
Gaussian curvature over the manifold is a topological invariant:

```text
∫∫_M K dA = 2π χ(M)
```

where `χ(M) = 2 − 2g` is the Euler characteristic and `g` is the
**genus** — the number of handles. The sphere has `g = 0` and
`χ = 2`; the torus has `g = 1` and `χ = 0`; the double torus has
`g = 2` and `χ = −2`; and so on.

Check on the sphere of radius `R`: `K = 1/R²` is constant, and the
area is `4π R²`. So `∫∫ K dA = (1/R²) · 4π R² = 4π = 2π · 2`. ✓

Check on the torus: the outer ring of the torus has positive
Gaussian curvature, the inner ring has negative Gaussian curvature,
the top and bottom have `K = 0` in between, and the integral exactly
cancels to zero. There is no globally curved-positive torus.

The slogan is **topology sets a budget that geometry must spend**.
You cannot reshape a sphere into something with `χ ≠ 2` without
either tearing it or gluing handles on. Conversely, given a topology,
the total curvature is fixed; the only freedom is in how the
curvature is distributed across the surface.

## X. Where this lives in the studio's stack

### TPMS surfaces (`lib/algorithms/gyroid.ts` and friends)

The gyroid, Schwarz P, and Schwarz D meshers all share the same
pipeline: evaluate the nodal-surface implicit on a regular grid,
extract the zero-level set with marching cubes, optionally offset to
produce a shell of given wall thickness, optionally cap the
boundaries. The `H = 0` property is the reason the resulting
structural lattices are stiff per unit mass; the `K < 0`
saddle-everywhere property is the reason the surface reads as organic
under raking light.

### Mesh shading

Flat shading: one normal per triangle, computed from the cross
product of two edge vectors. Smooth shading: per-vertex normals
(usually angle-weighted averages of incident face normals), then
linear interpolation across the face by the rasteriser.

The studio's WebGPU paths choose between them per material. Wireframe
overlays use flat normals for the inverted-hull outline trick; ramp-
shaded MToon hair uses smooth normals so the gradient stays
continuous across faces.

### Splat covariance

Each splat in a 3D-Gaussian-splatting scene is parameterised by a 3D
position and a 3×3 covariance `Σ`. The eigenvectors of `Σ` are the
principal axes of the splat ellipsoid; the eigenvalues are the
squared principal radii. Where a smooth surface underlies the splat
cloud, the smallest eigenvalue's eigenvector approximates the surface
normal, and the other two eigenvalues approximate the inverse
principal curvatures (large radius = small curvature). The local
structure of a clean splat scene is doing differential geometry in
covariance form.

### Caustic surfaces

A caustic is the singular set of a map from a source illumination to
its image, where the Jacobian degenerates from rank 2 to rank 1 (or
rank 0 at a cusp). The classification of stable singularities under
small perturbations is Arnold's catastrophe-theory result; in 3D
there are exactly five generic types (fold, cusp, swallowtail,
hyperbolic umbilic, elliptic umbilic), independent of which lens
shape produced them. The studio's caustic-disc design pipeline
solves the inverse problem: given a target image, find a height
field whose surface normals deflect light such that the resulting
caustic matches.

### WebXR geodesic teleport

When the player teleports across uneven terrain, the locomotion
solver shoots a geodesic on the local terrain mesh from the toe in
the chosen direction, integrating the geodesic equation in the local
chart. The result is that the player's feet stay on the surface
rather than ballistic-arcing through a hill or floating above a
trough.

## XI. Further reading

- **Manfredo do Carmo**, *Differential Geometry of Curves and
  Surfaces* (Prentice-Hall, 1976; Dover reprint, 2016). The
  gold-standard first text. Chapters 1–4 cover curves and surfaces;
  chapter 4 is the Theorema Egregium and Gauss-Bonnet. The book
  the studio reaches for first.
- **Andrew Pressley**, *Elementary Differential Geometry* (Springer
  Undergraduate Mathematics Series, 2nd ed., 2010). The gentler
  companion. More worked examples, more diagrams, no loss of rigour
  on the parts that matter. Recommended for the operator who hasn't
  done a calculus refresher recently.
- **Hermann Karcher and Konrad Polthier**, *Construction of Triply
  Periodic Minimal Surfaces* (Philosophical Transactions of the
  Royal Society A 354, 1996, pp. 2077–2104). The paper that put
  numerical TPMS construction on a firm footing. Karcher's earlier
  work in the 1980s and 90s — particularly the
  Weierstrass-representation approach — is what underwrites the
  modern implicit-function meshers.
- **Michael Spivak**, *A Comprehensive Introduction to Differential
  Geometry*, five volumes (Publish or Perish, 3rd ed., 1999). The
  deep dive. Volume 1: foundations and Theorema Egregium proved
  five different ways. Volume 2: connections and the Riemann tensor.
  Volumes 3–5: modern machinery, Lie groups, characteristic classes.
  Not the place to start; the place to end up.
- **John Lee**, *Riemannian Manifolds: An Introduction to Curvature*
  (Springer GTM 176, 2nd ed., 2018). The modern coordinate-free
  presentation. Useful when the indexed-tensor formalism in older
  texts starts to weigh more than it should.
- **Wikipedia: Differential geometry of surfaces**. The canonical
  quick-lookup page; usable for identities and formulae when the
  textbook is across the room.

## XII. Cross-references inside the codex

- `codex/linear-algebra-essentials` — the shape operator and metric
  tensor are linear-algebra objects on the tangent plane;
  eigenvectors of the shape operator give the principal directions.
- `codex/gyroid-surfaces` — the studio's canonical TPMS, the most
  visited example of `H = 0` in practice.
- `codex/reaction-diffusion-and-tpms` — long-form companion that
  pairs Turing patterns with minimal surfaces; the variational
  setup in this doc is the half it leans on.
- `codex/waveguide-optics-deep-dive` — geodesic ray paths through
  curved index fields, Snell's law as a geodesic condition,
  caustic singularities as fold catastrophes.
- `codex/gaussian-splat-mathematics` — covariance as a local metric
  proxy, the eigendecomposition story this doc previews.
- `codex/marching-cubes` — the meshing step that comes after the
  TPMS implicit is evaluated on a grid.
- `codex/signed-distance-fields` — the alternative implicit
  representation; SDFs and TPMS nodal surfaces are cousins.

## XIII. Summary, for the bench

- Curves carry `κ` and `τ`; the Frenet-Serret formulas describe how
  the frame turns. `κ = 0` is a line, `τ = 0` is a plane curve.
- Surfaces carry two fundamental forms. The first `I` is intrinsic
  (lengths, angles, area, `K`). The second `II` is extrinsic
  (principal curvatures `κ₁, κ₂`, mean curvature `H`, normal `n`).
- `H = 0` everywhere defines a **minimal surface**; soap films and
  TPMS lattices are the physical instances.
- `K = κ₁ κ₂` is the Gaussian curvature; Theorema Egregium says it
  is intrinsic, which is why you cannot wrap paper around a sphere.
- Sphere of radius `R`: `H = 1/R`, `K = 1/R²`. Plane: `H = K = 0`.
  Cylinder: `H = 1/(2R)`, `K = 0`. The cylinder is the standard
  example of "extrinsically curved, intrinsically flat".
- The gyroid implicit `sin x cos y + sin y cos z + sin z cos x = 0`
  is `H ≈ 0` everywhere on the zero set and `K < 0` everywhere — a
  saddle at every point.
- Geodesics are the surface's straight lines; great circles on a
  sphere, helices on a cylinder, ordinary lines on the plane.
- Manifolds need atlases of charts; intrinsic vs extrinsic is the
  load-bearing distinction.
- Gauss-Bonnet ties total Gaussian curvature to topology: `∫∫ K dA
  = 2π χ = 2π (2 − 2g)`. Topology sets the budget; geometry decides
  where to spend it.

That's the framework. The rest of the maths-essentials series fills
in the splat covariance ellipsoids, the optical caustics, and the
specific TPMS recipes that sit on top.
