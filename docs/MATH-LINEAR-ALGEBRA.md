# Linear algebra — the foundational layer

Every other maths doc in the codex builds on this one. Splats,
projective camera geometry, HRTF audio, drone IMU pose, and the
gradient-and-Hessian language of optimisation each take vectors,
matrices, and a small handful of decompositions for granted. This
file collects that small handful in one place, with the geometric
readings the studio leans on and worked numerical examples where
they help.

The companion codex entry lives at
`components/codex/entries/linear-algebra-essentials.tsx` and
covers the same material in catalogue mode. This file is the
longer treatment: derivations, more examples, the bits that wouldn't
fit on a single page.

When this file goes over 300 lines it splits, per the
`ARCHITECTURE.md` Rule 1 convention used by `MORPHING_MATHEMATICS.md`.

## I. Vectors and matrices

A **vector** is an ordered list of numbers. In the studio's contexts
it usually names one of:

- a point in 3D space (a splat centre, a camera origin, a drone GPS
  fix in local-tangent coordinates),
- a direction (a surface normal, the gravity vector, a ray from the
  camera through a pixel),
- a colour (RGB triple, RGBA quad, the nine spherical-harmonic
  coefficients of a per-splat colour),
- a row of sensor readings (an IMU sample, a microphone-array frame).

A **matrix** is a rectangular array of numbers. The single most useful
reading is that an `m×n` matrix `M` is a **linear transformation** from
n-dimensional space to m-dimensional space: feed in an n-vector, get
out an m-vector via `Mx`. The columns of `M` are the images of the
standard basis vectors under that transformation — which is why the
columns of a 3D rotation matrix are themselves the rotated x, y, z
axes.

> **Figure the studio could draw later.** Two side-by-side diagrams:
> on the left, the standard basis (e₁, e₂) on a unit grid; on the
> right, the same vectors after being multiplied by a 2×2 matrix,
> landing as the new columns of M. The whole grid sheared with them.

## II. Matrix multiplication is composition

`AB` is the linear transformation "apply B, then apply A". The order
matters: matrix multiplication is non-commutative. Rotating, then
translating, gives a different result from translating, then
rotating.

The studio's WebGPU and Three.js render paths stack model-view-
projection matrices in exactly this order:

```text
clip_position = P · V · M · model_position
```

`M` is the world transform (object → world), `V` is the camera
transform (world → camera-space), `P` is the projection (camera
→ clip coordinates). The matrices multiply right-to-left; the
vector is consumed left-to-right. Getting the order wrong is the
single most common silent bug in a new render path; the scene
renders, just not where it should.

## III. Eigenvalues and eigenvectors

Given a square matrix `A`, an **eigenvector** `v` is a vector that
doesn't change direction under `A` — only scale. The scale factor
is the **eigenvalue** `λ`:

```text
A v = λ v
```

The physical reading is **principal axes**: the directions in which
`A` acts as a pure stretch. For:

- a **rotation matrix in 3D**, the eigenvector with eigenvalue 1 is
  the rotation axis (Euler's rotation theorem);
- a **covariance matrix**, the eigenvectors are the directions of
  greatest variance and the eigenvalues are the variances along
  them;
- the **Hessian of a loss function** at a local minimum, the
  eigenvectors are the local curvature axes and the eigenvalues are
  the curvatures (positive in all directions at a true minimum).

### A worked 3×3 example

```text
A = [[4, 1, 0],
     [1, 4, 0],
     [0, 0, 2]]
```

The characteristic polynomial is `det(A − λI) = 0`. Expanding along
the third row (which is mostly zeros) gives:

```text
(2 − λ) · det([[4 − λ, 1], [1, 4 − λ]]) = 0
(2 − λ) · ((4 − λ)² − 1) = 0
(2 − λ) · (λ² − 8λ + 15) = 0
(2 − λ) · (λ − 3) · (λ − 5) = 0
```

So the eigenvalues are `λ ∈ {2, 3, 5}`.

For `λ = 5`, solve `(A − 5I) v = 0`:

```text
[[−1,  1,  0],
 [ 1, −1,  0],
 [ 0,  0, −3]] · v = 0
```

The first two rows give `v₁ = v₂`; the third gives `v₃ = 0`. So
`v = (1, 1, 0)` (up to scale).

For `λ = 3`: same approach, `v = (1, −1, 0)`. For `λ = 2`:
`v = (0, 0, 1)`.

The three eigenvectors are mutually orthogonal (because `A` is
symmetric — the spectral theorem guarantees this). Normalising them
and packing as columns of `Q`:

```text
Q = [[1/√2,  1/√2, 0],
     [1/√2, −1/√2, 0],
     [0,     0,    1]]

Λ = diag(5, 3, 2)

A = Q · Λ · Q⁻¹     (with Q⁻¹ = Qᵀ here, because Q is orthogonal)
```

This is the **eigendecomposition** of `A`. Computationally it costs
roughly `O(n³)` to compute and is numerically well-behaved for
symmetric matrices; non-symmetric and near-defective matrices get
unpleasant.

> **Figure.** Three perpendicular arrows in 3D labelled with their
> eigenvalues — a long one along (1, 1, 0) labelled ×5, a medium
> one along (1, −1, 0) labelled ×3, a short one along (0, 0, 1)
> labelled ×2. A unit sphere drawn over them, deforming into the
> ellipsoid that `A` produces.

## IV. Singular value decomposition (SVD)

Eigendecomposition only works on square matrices, and not all of
them are diagonalisable. SVD is the generalisation that works on
**any** matrix:

```text
M = U Σ Vᵀ
```

where `U` is `m×m` orthogonal, `V` is `n×n` orthogonal, and `Σ` is
`m×n` diagonal with non-negative entries (the **singular values**)
sorted largest first.

**Geometric reading.** Any linear map is a rotation (`Vᵀ`), then a
non-uniform scale along axes (`Σ`), then another rotation (`U`).
That's it. Every matrix the studio meets factors this way.

### SVD ↔ eigendecomposition

For a symmetric positive-semi-definite matrix the two decompositions
agree: `U = V = Q` and the singular values are the eigenvalues. For
a general matrix `M`, the SVD relates to the eigendecompositions of
`MᵀM` and `MMᵀ`:

- the columns of `V` are the eigenvectors of `MᵀM`,
- the columns of `U` are the eigenvectors of `MMᵀ`,
- the singular values are the square roots of the (shared) non-zero
  eigenvalues of either product.

### Three roles SVD plays in studio work

**1. Principal Component Analysis (PCA).** Centre a data matrix `X`
(subtract the column means); compute its SVD. The columns of `V` are
the principal directions, the singular values divided by `√(n−1)`
are the per-axis standard deviations, and the rows of `U Σ` are the
projections of each data point onto the principal axes. The first
`k` columns are the best `k`-dimensional projection of the data in
least-squares sense — this is the **Eckart-Young theorem**.

**2. Dimensionality reduction and compression.** Truncate `Σ` to its
top `k` singular values — set the rest to zero — and the resulting
rank-`k` matrix is the closest rank-`k` approximation of `M` in
both Frobenius and spectral norms. This is how:

- splat compression discards the bottom-of-the-stack splats that
  contribute least variance,
- audio feature extraction reduces a 1024-point spectrum to a few
  dozen MFCCs,
- some forms of LLM-weight quantisation work (low-rank adapters,
  the LoRA family).

**3. Moore-Penrose pseudoinverse.** When `M` isn't square or isn't
invertible, the system `Mx = b` may have no exact solution, or many.
The pseudoinverse picks the best one:

```text
M⁺ = V Σ⁺ Uᵀ
```

where `Σ⁺` is `Σᵀ` with each non-zero singular value `σᵢ` replaced
by `1/σᵢ`. Then `x = M⁺ b` gives:

- the least-squares solution if `M` is over-determined (more
  equations than unknowns),
- the minimum-norm solution if `M` is under-determined (fewer
  equations than unknowns).

This is what's actually happening when:

- structure-from-motion refines camera poses,
- a plane is fitted to a point-cloud neighbourhood,
- a closed-form linear regression returns its coefficients.

The pseudoinverse never directly appears in the user's code — the
solver does — but understanding what it computes is what makes the
solver's failure modes (rank-deficient matrices, near-zero singular
values blowing up to `1/σᵢ`) legible.

> **Figure.** A 2×2 matrix's action shown as three frames: a unit
> circle, the circle rotated by `Vᵀ`, the rotated circle scaled into
> an axis-aligned ellipse by `Σ`, and the ellipse rotated by `U`.
> Captioned: "any linear map is rotate, scale, rotate."

## V. Covariance matrices

A covariance matrix summarises how a set of vectors varies and
co-varies. For `n` samples `x₁, …, xₙ` of d-dimensional vectors with
mean `μ`:

```text
Σ = (1 / (n − 1)) · Σᵢ (xᵢ − μ)(xᵢ − μ)ᵀ
```

`Σ` is `d×d`, always symmetric, always positive-semi-definite. Its
eigenvalues are real and non-negative; its eigenvectors are
orthogonal. The eigendecomposition `Σ = Q Λ Qᵀ` gives the principal
axes of the data cloud and the variances along them.

### Where covariance appears in the studio

**Gaussian splats.** Each splat in a 3DGS scene carries a 3×3
covariance matrix that describes its anisotropic ellipsoidal extent.
The eigendecomposition of that covariance gives the ellipsoid's
principal axes and radii — exactly what the rasteriser needs to draw
it correctly. The training pipeline parameterises the covariance as
`Σ = R S Sᵀ Rᵀ` with `R` a quaternion-derived rotation and `S` a
per-axis scale, which guarantees positive-semi-definiteness during
optimisation.

**HRTF audio.** Personalisation pipelines for head-related transfer
functions model the variability across thousands of measured ears
as a covariance over filter coefficients. The principal components
are the handful of dimensions a personalisation slider has to move
along — usually 8 to 16 PCs capture most of the inter-subject
variance.

**Point-cloud fitting.** Fitting a plane to a neighbourhood of
points: compute the local covariance of those points, take its
eigendecomposition, and the eigenvector with the smallest eigenvalue
is the surface normal. This is how normal estimation in
photogrammetry pipelines and ICP alignment for LiDAR scans works
under the bonnet.

**Multivariate Gaussians in general.** Anywhere a distribution is
written `N(μ, Σ)`, the covariance is doing the same job — describing
the ellipsoid of one-sigma uncertainty around the mean. Kalman
filters propagate these ellipsoids; particle filters sample from
them; Bayesian regression conditions on them.

## VI. Rotation matrices vs quaternions

A 3D rotation can be written as a `3×3` orthogonal matrix with
determinant `+1`. The set of such matrices is `SO(3)`, the **special
orthogonal group**. Composing rotations is matrix multiplication;
inverting is transposition.

Three **Euler angles** (yaw, pitch, roll) parameterise the same
rotation more compactly, but suffer **gimbal lock**: at certain
orientations two of the three rotation axes align and a degree of
freedom is lost. Numerically, the issue is that the parameterisation
is singular — the Jacobian of the rotation with respect to the
angles has rank 2 instead of 3 at those configurations.

Practical consequence: drone IMU code that integrates rate-gyro
measurements directly as Euler angles fails the moment the craft
pitches close to 90°. The cure is to integrate in a non-singular
representation.

**Quaternions** — four numbers, one scalar plus a 3-vector —
parameterise rotations without the singularity. They double-cover
`SO(3)` (each rotation corresponds to two quaternions, `q` and
`−q`), but the doubling is harmless. The unit-quaternion sphere `S³`
is smooth, free of singularities, and supports a natural spherical
interpolation (slerp) between orientations that lerping Euler angles
cannot.

The full treatment lives in the quaternions codex entry — the
multiplication rules, the Hamilton vs JPL conventions that catch out
drone-firmware authors, and the rotation-by-conjugation formula
`p' = q · p · q⁻¹`. This file's job is just to set up the problem
that the quaternions doc solves.

> **Figure.** Side-by-side diagrams of a gimbal in a normal
> configuration and a gimbal-locked configuration, with the lost
> degree of freedom highlighted.

## VII. Where this appears in the studio's verticals

**Splats and 3DGS.** Per-splat 3×3 covariance, eigendecomposed at
render time for ellipsoid axes; SVD on the full splat parameter
matrix for compression and level-of-detail; quaternion-derived
rotations parameterise the covariance during training.

**Drone IMU and structure-from-motion.** Rate-gyro integration in
quaternion form; accelerometer bias estimation as a Kalman filter
that propagates a covariance matrix; bundle adjustment as a vast
non-linear least-squares problem solved iteratively, each iteration
a pseudoinverse-via-SVD on the linearised system.

**Projective camera geometry.** The pinhole camera matrix is `3×4`;
decomposing it into intrinsics, rotation, and translation uses QR
factorisation (a cousin of SVD with different orthogonality
constraints). The fundamental matrix and essential matrix between
two views are rank-2 by construction, and SVD is the canonical tool
for enforcing that rank during estimation.

**Optimisation.** Gradient descent and its variants treat the
gradient as a vector and (for second-order methods like Newton's,
Gauss-Newton, Levenberg-Marquardt) the Hessian as a symmetric matrix
whose eigenvalues describe the local curvature of the loss
landscape. The condition number of the Hessian — the ratio of its
largest to smallest eigenvalue — governs how quickly first-order
methods converge.

**HRTF and ambisonic audio.** Spatial audio decoders express the
sound field as a vector in the spherical-harmonic basis; rotating
the listener's head is a rotation matrix in `SO(3)` lifted to a
larger orthogonal rotation on the SH coefficients. The covariance
of the SH coefficients across measurement sets drives both
personalisation and noise reduction.

**WebGPU and the shader stack.** Every per-frame computation a
modern renderer does is, at its core, multiplying small matrices by
vectors a few million times. The hardware is tuned for `mat4` and
`vec4`; the math is the same as on paper, just dispatched to a few
thousand parallel lanes.

## VIII. What this doc deliberately doesn't cover

- **Tensor algebra and Einstein summation.** Useful for general
  relativity, neural-network internals, and physics work. Out of
  scope here — picked up where needed in the topic-specific docs.
- **Numerical conditioning and floating-point pitfalls.** Trefethen
  and Bau is the right reference; this file gives the maths, not the
  floats.
- **Group theory under the rotations.** `SO(3)`, `SU(2)`, Lie
  algebras, the exponential map. Touched on in the quaternions doc;
  more depth in any standard reference.
- **Sparse matrix techniques.** Compressed sparse row format,
  iterative solvers, multigrid. Relevant once bundle adjustment gets
  large enough that the dense pseudoinverse is no longer affordable.

## IX. Further reading

- Gilbert Strang, *Introduction to Linear Algebra* (Wellesley-Cambridge,
  6th edition, 2023). The textbook the studio reaches for first.
  Chapters 6 and 7 cover eigenvalues, eigenvectors, and SVD with the
  geometric framing this file leans on.
- 3Blue1Brown, *Essence of Linear Algebra* video series (16 episodes,
  YouTube / 3blue1brown.com). The visual intuition for "matrix as
  transformation" comes from here for most working engineers under
  forty.
- Wikipedia: Eigenvalues and eigenvectors. The canonical reference
  page; usable as a quick lookup for properties and identities.
- Wikipedia: Singular value decomposition. Geometric interpretation,
  applications, and the Eckart-Young low-rank-approximation theorem.
- Trefethen and Bau, *Numerical Linear Algebra* (SIAM, 1997). When
  the decompositions stop being theoretical and start being floats
  on a GPU, this is the book that explains why the algorithm behaves
  the way it does.
- Hartley and Zisserman, *Multiple View Geometry in Computer Vision*
  (Cambridge, 2nd edition, 2004). The reference for projective
  geometry, fundamental and essential matrices, and bundle
  adjustment. Linear algebra all the way down.

## X. Cross-references inside the codex

- `codex/gaussian-splatting` — where per-splat covariance lives.
- `codex/hrtf-head-related-transfer-function` — covariance in audio
  personalisation.
- `codex/photogrammetry` — bundle adjustment, fundamental and
  essential matrices.
- `codex/webgpu` — where the model-view-projection stack actually
  runs.
- The quaternions codex entry (when it lands) — the cure for gimbal
  lock previewed in section VI.
- `docs/MORPHING_MATHEMATICS.md` — the easing-equation canon, which
  uses the lerp primitive this doc gestures at without dwelling on.
