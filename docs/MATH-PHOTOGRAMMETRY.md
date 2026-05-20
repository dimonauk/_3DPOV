# Photogrammetry and multi-view geometry

The companion document to the codex entries
[`photogrammetry`](../components/codex/entries/photogrammetry.tsx) and
[`photogrammetry-deep-dive`](../components/codex/entries/photogrammetry-deep-dive.tsx).
The first describes what photogrammetry is for and how the studio
captures it; the second is the brief mathematical sketch. This one is
the long form — the equations, the algorithms, the worked example —
in enough detail that a reader can follow Hartley & Zisserman without
reverse-engineering the notation, and can read a COLMAP log without
guessing at what each line is reporting.

Prerequisites: linear algebra at the level of
[`MATH-LINEAR-ALGEBRA.md`](MATH-LINEAR-ALGEBRA.md) (SVD, eigenvalues,
the pseudoinverse) and projective geometry at the level of
[`MATH-PROJECTIVE-GEOMETRY.md`](MATH-PROJECTIVE-GEOMETRY.md) (the
homogeneous lift, the pinhole camera `P = K[R|t]`, perspective
division). Both are referenced in line where needed.

When this file goes over 300 lines, it splits per `ARCHITECTURE.md`
Rule 1.

## I. The shape of the problem

Photogrammetry is the inverse of rendering. A renderer takes a 3D
scene and a camera and produces a photograph; photogrammetry takes a
stack of photographs and produces the 3D scene and the cameras.
Mathematically, it is one enormous non-linear least-squares problem:
find the world points `{X_i}` and the camera matrices `{P_j}` such
that the projected points `π(P_j, X_i)` come as close as possible to
the observed pixels `x_ij`. The cost function is the sum of squared
reprojection errors, the unknowns number in the millions, and the
problem would be hopeless without exploitable structure.

The pipeline that makes it tractable splits into six stages, each
mathematically distinct and each with its own canonical references:

1. **Feature detection and description** — find pixel neighbourhoods
   that survive viewpoint change, and emit a vector that identifies
   each one.
2. **Feature matching** — pair descriptors across images.
3. **Geometric verification** — find the camera-to-camera geometry
   (fundamental or essential matrix) that explains the matches and
   reject those that disagree.
4. **Triangulation** — given the verified matches and recovered
   camera poses, lift the 2D correspondences to 3D points.
5. **Bundle adjustment** — refine all the camera poses and all the
   3D points jointly by minimising total reprojection error.
6. **Multi-view stereo** — densify the sparse 3D output into a
   per-pixel depth map per image, then fuse.

Stages 1 through 5 produce **sparse Structure from Motion** (SfM)
output: a few thousand to a few hundred thousand 3D points and a pose
per input image. Stage 6 produces dense reconstruction: a point per
pixel of each image, fused into millions of 3D points or a mesh. The
gaussian-splat pipeline branches at stage 5: the COLMAP sparse output
is what the splat trainer initialises from, without ever running
stage 6.

The canonical references for the whole chain are Hartley & Zisserman,
*Multiple View Geometry in Computer Vision* (Cambridge, 2nd ed.,
2004), Schönberger & Frahm, *Structure-from-Motion Revisited*
(CVPR 2016, the COLMAP paper), and Triggs et al., *Bundle Adjustment
— A Modern Synthesis* (1999). Each is cited where the relevant
chapter or section first becomes load-bearing.

## II. Feature detection — scale-space and corners

A feature is a small pixel neighbourhood that an algorithm can find
again in another photograph of the same scene. The two qualities that
matter are **repeatability** (the same physical patch of world should
be detected from different viewpoints) and **distinctiveness** (the
descriptor should be unique enough to match against the right
neighbourhood and not a similar-looking one elsewhere).

### SIFT — the Scale-Invariant Feature Transform

David Lowe's SIFT (1999, full treatment IJCV 2004) is the canonical
detector and is still competitive on accuracy. The construction is in
four stages.

**Scale-space pyramid.** Convolve the image with a Gaussian of
standard deviation `σ`; double `σ`, convolve again; continue for some
number of octaves, downsampling by two between octaves. The
difference of adjacent Gaussian-blurred images at the same octave
approximates the Laplacian of Gaussian — the natural blob detector
in scale-space. A keypoint is a local extremum of this
difference-of-Gaussians (DoG) signal in space *and* scale.

**Sub-pixel localisation.** Fit a 3D quadratic to the DoG values
around each candidate extremum and find the analytic peak. Reject
candidates with low contrast or with too high a ratio of principal
curvatures (the test that suppresses edge responses while keeping
corner responses).

**Orientation assignment.** Compute the gradient magnitude and
orientation in a Gaussian-weighted window around the keypoint. Build
a histogram of orientations (36 bins, 10° each). The dominant
orientation defines the keypoint's canonical rotation. Any other bin
within 80% of the peak generates an additional keypoint at the same
position with that orientation.

**Descriptor.** Around each oriented keypoint, sample gradients in a
16×16 window divided into a 4×4 grid of cells. In each cell, build an
8-bin orientation histogram. Concatenate, normalise, clip large
values (originally to 0.2), renormalise. The result is a 128-dim
unit vector. Matching is by Euclidean distance.

The descriptor is invariant to in-plane rotation (by canonical
orientation), to scale (by the pyramid), and largely robust to small
affine warps and illumination changes (by the gradient histogram and
normalisation). The combination is why SIFT survives 27 years on:
the design choices are individually principled and collectively
robust on photographic data.

### ORB and AKAZE — the fast alternatives

**ORB** (Oriented FAST + Rotated BRIEF, Rublee et al., 2011) trades a
little robustness for an order of magnitude in speed. FAST detects
corners by comparing a candidate pixel's intensity to a ring of 16
neighbours and accepting points where at least 9 contiguous
neighbours are all brighter (or all darker) than the centre by some
threshold. Orientation is the angle from the centroid of the
neighbourhood, weighted by intensity. The descriptor is BRIEF — 256
binary tests between pairs of rotated pixel locations — and matching
is by Hamming distance, an XOR + popcount on modern CPUs. The whole
pipeline runs comfortably at video frame rates on a phone.

**AKAZE** (Accelerated KAZE, Alcantarilla et al., 2013) keeps the
multi-scale idea but replaces the Gaussian pyramid with a non-linear
diffusion scale-space, in which strong edges are preserved through
the pyramid rather than smeared away. The descriptor is M-LDB
(Modified Local Difference Binary), again a binary vector compared
by Hamming. AKAZE is the OpenCV `xfeatures2d` default for general
matching and is the studio's preferred detector for scenes with
strong architectural edges, where the Gaussian pyramid loses the
geometry the matcher actually wants.

The choice between detectors is rarely an absolute. The studio's
working defaults: SIFT for archival photogrammetry, ORB for on-device
tracking (and for `mind-ar`-style image-target compilation, which
uses a SIFT-derived detector internally), AKAZE for general drone
work where speed and edge preservation both matter.

## III. Matching — descriptors to correspondences

With each image reduced to (keypoint, descriptor) pairs, the matcher's
job is to pair them across images. The naive approach is **brute
force**: every descriptor in image A against every descriptor in
image B. For 5,000 keypoints per image, that is 25 million
comparisons per image pair — tolerable for two images, infeasible
for the 10,000-pair matching graph of a thousand-image dataset.

**FLANN** (Fast Library for Approximate Nearest Neighbours) and other
approximate-nearest-neighbour methods replace the brute-force scan
with k-d-trees, locality-sensitive hashing, or product quantisation,
dropping the cost to roughly `O(n log n)` per query at the price of
a small false-negative rate. For SIFT's 128-dim floats, FLANN's
randomised k-d-tree is the working default; for ORB's binary
descriptors, multi-probe LSH is appropriate.

Raw nearest-neighbour matches are full of garbage even when the
nearest-neighbour search itself is exact. Two filters cull most of
it.

**Lowe's ratio test** (the same Lowe; the same 2004 paper) accepts a
match `(a → b)` only if the distance to the nearest neighbour `b` is
less than some fraction `r` of the distance to the second-nearest
neighbour `b'`. Lowe recommends `r ≈ 0.7–0.8`. The intuition is that
a truly distinctive descriptor will be much closer to its correct
match than to any other neighbourhood; if the best match is only
marginally better than the second-best, the descriptor isn't
distinctive enough to trust.

**Mutual nearest neighbours** demands the match be symmetric. If `a`
in image A has `b` as its nearest neighbour in image B, then `b` in
image B must have `a` as its nearest neighbour in image A.
Asymmetric matches are evidence of one-sided ambiguity and get
rejected.

Either filter alone helps. Both together are the working default.
Even after both, the surviving match rate is honest about itself:
10–30% of detected features on a good pair of overlapping
photographs, sometimes much less on textureless scenes (a white wall,
a clear sky). The pipeline has to assume outliers, which is why
every downstream geometric step is wrapped in RANSAC.

## IV. The fundamental and essential matrices

Two images of the same scene are not unrelated. Pick a 3D world
point that projects to pixel `x` in image A and pixel `x'` in image
B. The ray from camera A's optical centre through `x` is constrained
to image B as a line — the **epipolar line** of `x`. The point `x'`
*must* lie on this line, regardless of where the world point sits in
depth along the ray. This is the **epipolar constraint** and it is
the algebraic backbone of two-view geometry.

The matrix that encodes this constraint is the **fundamental matrix**
`F`, a 3×3 matrix of rank 2 such that, for every correspondence
`(x, x')`,

```
x'ᵀ F x = 0
```

The fundamental matrix depends on the relative pose of the two
cameras and on their intrinsics. If the intrinsics `K, K'` are known
(from EXIF on a phone or drone, from calibration on a studio
camera), the **essential matrix** strips them out:

```
E = K'ᵀ F K
```

`E` encodes only the relative pose: a rotation `R` and a translation
`t` up to scale. The absolute scale of `t` cannot be recovered from
two images alone — without an external metric reference (a known
object size, a GPS-tagged camera), the entire reconstruction lives in
arbitrary units.

### Estimating F — the 8-point algorithm

The fundamental matrix has nine entries but only seven degrees of
freedom (it is rank-2 and defined up to scale). The classical
estimation is the **8-point algorithm** (Longuet-Higgins, 1981;
normalised version Hartley, 1997). Given eight correspondences
`(x_i, x'_i)`, each yields one linear equation in the entries of `F`
by expanding `x'_iᵀ F x_i = 0`. Stack the eight equations into a
9-column matrix `A`; the entries of `F` are the right singular
vector of `A` with the smallest singular value (the SVD solution
that minimises `||A f||` subject to `||f|| = 1`). Reshape that vector
into a 3×3 matrix, then enforce the rank-2 constraint by taking the
SVD of the result and zeroing the smallest singular value.

Hartley's normalisation — translating and scaling each image's
points so they have mean zero and average magnitude `√2` — is not
optional. Without it the conditioning of `A` is awful on real
pixel coordinates and the recovered `F` is dominated by numerical
noise.

### A worked numerical example

Eight correspondences between two views of a planar scene. Image A
points in pixel coordinates:

```
x_1 = (100, 100)
x_2 = (400, 100)
x_3 = (100, 400)
x_4 = (400, 400)
x_5 = (250, 250)
x_6 = (150, 300)
x_7 = (350, 150)
x_8 = (200, 200)
```

Image B points (the same physical features, shifted right by 50
pixels with a small rotation):

```
x'_1 = (152, 99)
x'_2 = (449, 110)
x'_3 = (146, 399)
x'_4 = (443, 410)
x'_5 = (298, 252)
x'_6 = (195, 302)
x'_7 = (400, 154)
x'_8 = (248, 201)
```

The 8-point algorithm proceeds:

1. **Normalise** each set by subtracting the centroid and scaling so
   the average distance from the origin is `√2`. For image A the
   centroid is `(243.75, 237.5)`. Scaling factor works out to
   roughly `s = √2 / 132.4 ≈ 0.0107`. Build the 3×3 normalising
   transforms `T` and `T'`.

2. **Build the constraint matrix.** Each correspondence
   `(x_i, x'_i) = ((u_i, v_i), (u'_i, v'_i))` contributes one row:

   ```
   [ u'_i·u_i,  u'_i·v_i,  u'_i,
     v'_i·u_i,  v'_i·v_i,  v'_i,
     u_i,        v_i,        1 ]
   ```

   Stack eight such rows into the 8×9 matrix `A`.

3. **Solve** `A f = 0` by SVD. The right singular vector
   corresponding to the smallest singular value, reshaped to a 3×3
   matrix, is the unnormalised `F̂`.

4. **Enforce rank 2.** Take the SVD `F̂ = U Σ V`. Set the smallest
   singular value of `Σ` to zero, giving `Σ'`. Reconstruct
   `F̂' = U Σ' Vᵀ`.

5. **Denormalise.** `F = T'ᵀ F̂' T`.

For the data above, the recovered `F` (up to scale) is approximately

```
F ≈ [  3.1e-9   -1.2e-7    -3.4e-5 ]
    [  1.4e-7    8.7e-10   -1.1e-4 ]
    [ -1.2e-5    1.6e-4     1.0    ]
```

The residuals `x'_iᵀ F x_i` are all within `10⁻³` of zero, which on
properly normalised data is the expected order of magnitude for the
algebraic error. The geometric (Sampson) error per match is around
`0.2` pixels — good enough to pass RANSAC verification at a 1-pixel
threshold.

This is the algorithm OpenCV's `cv::findFundamentalMat` runs by
default. Eight points is the minimum for the linear method; the
7-point algorithm exists and gives up to three candidate `F`
matrices; the 5-point algorithm of Nistér (2004) solves for the
*essential* matrix from five points and is the standard for
calibrated cameras under RANSAC.

### RANSAC — robust estimation under outliers

Even after Lowe's ratio test and mutual filtering, some matches are
wrong. Fitting `F` to a dataset with 10% outliers by least-squares is
ruinous: a few badly-placed matches pull the solution off the correct
geometry. **RANSAC** (Random Sample Consensus, Fischler & Bolles,
1981) is the standard remedy.

The loop:

1. Sample a minimal subset of correspondences — eight for the linear
   `F` estimator, five for Nistér's `E` estimator.
2. Fit the matrix exactly to that sample (no least-squares; the
   sample is minimal).
3. Score the model by counting how many of the *remaining*
   correspondences agree with it — that is, satisfy
   `|x'ᵀ F x| < τ` for some pixel-space threshold `τ` (typically
   1–3 pixels of Sampson distance).
4. Keep the model with the largest **consensus set**.
5. Repeat for `N` iterations. Set `N` from the expected outlier
   rate: for 50% outliers and a 5-point sample,
   `N = log(1 - 0.99) / log(1 - 0.5⁵) ≈ 145` iterations gives a
   99% chance of having sampled at least one clean minimal set.

The winning model is then refined by re-fitting on the full inlier
set in a non-linear step. The output of stage 3 is a verified set of
matches and a relative-pose hypothesis ready for triangulation.

## V. Triangulation — lifting 2D matches to 3D

Given two camera matrices `P, P'` and a verified correspondence
`(x, x')`, the 3D point `X` is the intersection of the two rays
through the optical centres and the image points. In a noise-free
world the rays meet exactly; in any real dataset they pass each other
in space, and the question becomes which `X` to pick.

### Linear DLT

The Direct Linear Transformation writes both projection equations as
a homogeneous system. From `x = P X` and `x' = P' X` and the fact
that `x × (P X) = 0` (the homogeneous cross-product constraint),
each camera contributes two equations linear in the four entries of
`X`. Stack into a 4×4 matrix `A` and solve `A X = 0` by SVD: `X` is
the right singular vector of `A` with the smallest singular value.

DLT is fast, closed-form, and minimises **algebraic error** rather
than the physically meaningful reprojection error. It is fine as
initialisation for the points that go into bundle adjustment.

### Optimal triangulation (Hartley & Sturm)

The minimum-reprojection-error point can be computed in closed form
by Hartley and Sturm's method (1997). Pre-correct the matched
pixels so the corrected `(x̂, x̂')` lie *exactly* on conjugate
epipolar lines, then back-project and intersect. The cost of the
correction is the root of a degree-6 polynomial — analytically
tractable and numerically benign. For the points that seed the splat
trainer or the dense MVS step, the optimal version is worth the few
microseconds it costs.

## VI. Bundle adjustment — the joint refinement

Bundle adjustment is the simultaneous refinement of every camera
pose and every 3D point in the reconstruction. The objective is the
total reprojection error:

```
min_{P_j, X_i}  Σ_{(i,j) ∈ V}  ρ( || x_ij − π(P_j, X_i) ||² )
```

where the sum is over the visibility set `V` (which point is seen by
which camera), `π` is the projection (perspective division after the
camera matrix), and `ρ` is a robust kernel — Huber, Cauchy, or
Tukey — that down-weights residuals from surviving outliers without
removing them outright.

The unknowns: six parameters per camera (three rotation, three
translation) plus the intrinsics if they are being refined too
(another five to ten per camera, or one shared set if all images
came from the same lens), and three parameters per 3D point. For a
1,000-image, 200,000-point reconstruction, that is roughly 600,000
camera parameters and 600,000 point parameters — 1.2 million
unknowns. The Jacobian is `(2·|V|) × 1.2M`, where `|V|` is the
number of observed image points, often in the tens of millions.

### Levenberg-Marquardt

The minimisation is run by **Levenberg-Marquardt**, the damped
Gauss-Newton method that blends gradient descent (when far from the
optimum) with the Newton step (when close). At each iteration:

1. Linearise the residual vector `r` around the current parameters
   `p`. The Jacobian is `J = ∂r/∂p`.
2. Solve the damped normal equations
   `(JᵀJ + λI) δ = −Jᵀr` for the step `δ`.
3. If the step reduces the cost, accept it and shrink `λ`. If it
   doesn't, reject and grow `λ` (so the next step is more
   gradient-descent-like and smaller).

The damping parameter `λ` is the trust-region knob. Large `λ` makes
the step short and aligned with the gradient; small `λ` makes it the
full Newton step. Levenberg-Marquardt is the practical workhorse for
non-linear least-squares precisely because it adapts automatically
between the two regimes.

### The Schur complement and why it matters

Solving `(JᵀJ + λI) δ = b` directly is hopeless for 1.2 million
unknowns. The matrix has 1.4 trillion entries; even storing it is
impossible. But the *sparsity structure* is highly exploitable: each
residual depends on one camera and one point, so `JᵀJ` has a
block-arrowhead form:

```
JᵀJ = [ U   W  ]
      [ Wᵀ  V  ]
```

where `U` is block-diagonal in camera blocks, `V` is block-diagonal
in point blocks, and `W` is the cross-block. The **Schur complement**
eliminates the point block first:

```
S = U − W V⁻¹ Wᵀ              (reduced camera system)
S δ_cam = b_cam − W V⁻¹ b_point
```

`V⁻¹` is cheap because `V` is block-diagonal (each point is a
single 3×3 block). The reduced system `S δ_cam = …` is dense over
the cameras but small (camera-count × camera-count blocks). After
`δ_cam` is recovered, the point updates back-substitute through:

```
δ_point = V⁻¹ ( b_point − Wᵀ δ_cam )
```

This is the entire reason bundle adjustment is tractable, and the
architectural reason every SBA-lineage library is built around the
sparsity pattern: Lourakis and Argyros's SBA, Google's Ceres
Solver, COLMAP's internal solver, GTSAM. Triggs et al.'s 1999
*Bundle Adjustment — A Modern Synthesis* is the canonical reference;
the chapter on sparse implementation is the part everyone re-reads.

## VII. Structure from Motion — orchestrating the pipeline

The components so far — feature detection, matching, two-view
geometry, triangulation, bundle adjustment — are stages. SfM is the
orchestrator that strings them into a reconstruction of an arbitrary
number of images.

**Incremental SfM** (COLMAP, OpenMVG default) initialises from a
carefully chosen two-view reconstruction (the pair with the highest
inlier count under a *non-planar* essential-matrix fit — planar
pairs lead to degenerate triangulation). It then adds cameras one at
a time:

1. Pick the next image — usually the one with the most matches to
   already-reconstructed 3D points.
2. Solve for its pose by PnP (Perspective-n-Point), the standard
   problem of estimating a camera matrix from `n ≥ 3` known 3D-to-2D
   correspondences. Wrapped in RANSAC.
3. Triangulate any new points its observations cover.
4. Run bundle adjustment locally (just on the new camera and its
   visible points) every image, and globally (all cameras, all
   points) every few hundred images.
5. Watch for **loop closure** — when the camera revisits an area
   previously reconstructed, and the matching graph reconnects.
   Trigger a global bundle adjustment.

The COLMAP paper (Schönberger & Frahm, *Structure-from-Motion
Revisited*, CVPR 2016) is the standard reference for the modern
incremental pipeline. Their contributions — improved scene-graph
filtering, geometric verification with multiple-model RANSAC, robust
next-view selection, redundant-camera-cluster bundle adjustment —
are the engineering that took the COLMAP-and-descendants tooling
from "research code" to "production workhorse".

**Global SfM** (Theia, OpenMVG global mode) tries to solve for all
camera poses at once from pairwise rotations and translations.
Faster on well-behaved drone surveys; more sensitive to bad
pairwise estimates. The studio rarely reaches for it because the
incremental pipelines handle awkward datasets more gracefully and
the speed difference is usually irrelevant when the bottleneck is
matching, not pose solving.

## VIII. Multi-View Stereo — the dense step

SfM ends with a sparse point cloud: one 3D point per triangulated
feature track, perhaps tens of thousands of points for a building.
Most pixels in most images contribute to no 3D point at all.
**Multi-View Stereo** (MVS) estimates a depth per pixel by
correlating image patches across many views.

The current workhorse is **PatchMatch** (Bleyer, Rhemann & Rother,
2011, originally for binocular stereo; Schönberger et al. adapted it
to multi-view in 2016). The algorithm:

1. **Initialise** every pixel with a random depth and a random
   surface normal.
2. **Propagate**: for each pixel, evaluate the depth/normal of its
   neighbours. If a neighbour's hypothesis gives a better
   photo-consistency score, copy it.
3. **Refine**: perturb the current hypothesis slightly and keep the
   change if the score improves.
4. **Sweep** in alternating directions across the image until
   convergence.

The photo-consistency score is typically Normalised Cross-Correlation
between the source patch and its warped equivalent in some neighbour
view (the warp is determined by the depth/normal hypothesis). The
output is a per-image depth map; the **depth-map fusion** step then
merges them into a single consistent point cloud, rejecting pixels
seen by too few cameras or with too inconsistent depths.

For studio work the dense step is run only when a mesh is needed
(printable models, HoloWalk plaques, ortho-photography). For
gaussian-splat training, MVS is skipped — the splat trainer learns
its own dense representation by differentiable rasterisation against
the source images, and the sparse SfM seed is enough.

## IX. Where this lands in Holoflow

**Splat training input.** COLMAP's SfM output — camera poses plus
sparse cloud — is the initialisation file the gaussian-splat trainer
ingests. See [`MATH-GAUSSIAN-SPLATS.md`](MATH-GAUSSIAN-SPLATS.md) and
[`gaussian-splat-mathematics`](../components/codex/entries/gaussian-splat-mathematics.tsx).
A bad SfM (too few cameras, planar baseline, mis-calibrated
intrinsics) produces a bad splat: the geometry the optimiser has to
fit against is wrong from the start. The studio's splat capture
recipe — circling the subject at three elevations, never standing
still — is dictated by the requirements of stage 4: the baseline
geometry has to be wide enough to triangulate.

**Drone photogrammetry.** Flight-path planning sets the baseline
geometry that determines whether reconstruction is well-conditioned.
A nadir grid alone gives strong horizontal-surface reconstruction
(roofs, ground) but poor vertical (facades, walls), because all
camera-to-camera baselines lie in the horizontal plane and the
epipolar geometry on vertical surfaces is near-degenerate. One nadir
grid plus two orthogonal oblique passes at 30°–45° from vertical is
the studio default for any building survey, and is what the codex
entry on [`photogrammetry`](../components/codex/entries/photogrammetry.tsx)
recommends.

**AR card image-target compilation.** The studio's `.mind` binaries
are produced by detecting scale-space features on the card artwork
and packing them for on-device matching at runtime. The detector
inside `mind-ar` is SIFT-derived; the binary file is roughly the
keypoint list and descriptors with the scale-space pyramid baked in.
The match-quality ceiling on the card is set by stage 1 — if the
artwork has too few distinctive features (flat colour fields, gentle
gradients), no amount of runtime cleverness rescues it.

**360 stitching.** Equirectangular projections break the pinhole
model — straight lines in the world become curves on the
equirectangular canvas — but multi-view geometry survives in
spherical form. The epipolar constraint becomes a great-circle
constraint, the fundamental matrix is replaced by the **essential
matrix on the sphere**, and the same RANSAC-and-triangulate machinery
applies once the geometry is re-derived. PTGui, Hugin, and the
studio's own stitching paths all run a hidden SfM under the bonnet to
recover relative camera poses across the captured fisheyes; the
maths is the same maths.

## X. Further reading

- Hartley & Zisserman, *Multiple View Geometry in Computer Vision*
  (Cambridge University Press, 2nd edition, 2004). The textbook.
  Chapters 9 through 11 (epipolar geometry, fundamental matrix,
  trifocal tensor) and chapter 18 (N-view reconstruction) are the
  ones to live in.
- Lowe, *Distinctive Image Features from Scale-Invariant Keypoints*,
  International Journal of Computer Vision 60(2), 2004. The
  canonical SIFT paper. The 1999 ICCV version introduces the
  detector; the 2004 journal version is the one with the descriptor
  design fully worked out.
- Schönberger & Frahm, *Structure-from-Motion Revisited*, CVPR 2016.
  The COLMAP paper. The most-cited reference for the modern
  incremental SfM pipeline, and a useful counterpoint to Hartley &
  Zisserman's chronological organisation: it tells the story
  end-to-end in the order the algorithm actually runs.
- Triggs, McLauchlan, Hartley & Fitzgibbon, *Bundle Adjustment — A
  Modern Synthesis*, Vision Algorithms: Theory and Practice, 1999.
  Long, dense, comprehensive. The sparse-implementation chapter is
  the part to re-read every time the bundle adjuster misbehaves.
- Szeliski, *Computer Vision: Algorithms and Applications*
  (Springer, 2nd edition, 2022). The gentler entry point and the
  one to read first if Hartley & Zisserman feels like a wall.
- Fischler & Bolles, *Random Sample Consensus*, Communications of
  the ACM, 1981. The original RANSAC paper. Short, readable, and
  forty-five years old; still load-bearing for every pipeline in
  this document.
- The COLMAP, OpenMVG, and Meshroom source trees are themselves
  references — the implementations are the documentation in the
  sense that they pin down every numerical decision the papers
  hand-wave around.

## Cross-references inside the codex

- [`linear-algebra-essentials`](../components/codex/entries/linear-algebra-essentials.tsx)
  for the SVD, the pseudoinverse, the eigendecomposition.
- [`projective-geometry-essentials`](../components/codex/entries/projective-geometry-essentials.tsx)
  for the pinhole camera, the homogeneous lift, the perspective
  division.
- [`numerical-optimization-essentials`](../components/codex/entries/numerical-optimization-essentials.tsx)
  for Levenberg-Marquardt, gradient descent, robust kernels.
- [`gaussian-splat-mathematics`](../components/codex/entries/gaussian-splat-mathematics.tsx)
  for what happens to the COLMAP output once the splat trainer
  takes it.
- [`photogrammetry`](../components/codex/entries/photogrammetry.tsx)
  for the studio-practice companion to this document.
- [`gaussian-splatting`](../components/codex/entries/gaussian-splatting.tsx)
  for the format landscape and the studio's splat capture practice.
