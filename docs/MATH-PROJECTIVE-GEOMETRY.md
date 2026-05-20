# Projective geometry essentials

A foundational-math note for Holoflow Studio's verticals.
Load-bearing for 360 photography, WebXR, AR card tracking, and the
drone photogrammetry side of the gaussian splat pipeline. The
companion codex entry lives at
`/components/codex/entries/projective-geometry-essentials.tsx`; this
document is the longer-form bench reference behind it.

Cross-links: `MATH-LINEAR-ALGEBRA.md` (forthcoming) for the matrix
machinery underneath everything here, and the codex entry on
[equirectangular projection](../components/codex/entries/equirectangular-projection.tsx)
for the spherical case the pinhole model gives up on.

## Why an extra dimension

The first move in projective geometry is to take a 3D point
`(x, y, z)` and write it as a 4-vector `(x, y, z, 1)`. The fourth
component is the homogeneous coordinate, conventionally `w`. There
are two reasons to bother.

The first is uniformity. In plain Cartesian coordinates, translation
is an addition and rotation is a multiplication, and the two refuse
to compose into a single operation. Translation by `t` followed by
rotation by `R` is `R(x + t)`; rotation followed by translation is
`Rx + t`; neither is a clean matrix multiply against the original
`x`. With the homogeneous lift, every rigid transformation — rotate,
translate, scale, shear, project — becomes a 4×4 matrix times a
4-vector, and composing two transforms is one matrix multiply.
That's the entire reason GPU pipelines are built on 4×4 matrices.

The second reason is that perspective projection itself becomes
linear in homogeneous coordinates. In Cartesian terms, projecting a
3D point onto a 2D image divides x and y by z — a non-linear
operation that resists composition. In homogeneous terms, projection
is a matrix multiply followed by a division at the end. The division
is called *perspective division* and is the only non-linear step in
the entire camera pipeline; it lives at the very last stage, and
everything before it is honest linear algebra.

A homogeneous coordinate scales freely:
`(x, y, z, 1) ~ (2x, 2y, 2z, 2) ~ (kx, ky, kz, k)`
for any non-zero `k`. Two 4-vectors describe the same Cartesian
point whenever they differ only by a scalar. Recovering Cartesian
form at the end means dividing the first three components by the
fourth.

And when `w = 0` — when the homogeneous coordinate has the form
`(x, y, z, 0)` — there is no Cartesian point to recover. The vector
names a *point at infinity*: a direction without a location, the
place where parallel railway tracks meet. Vanishing points in a
photograph are this idea showing up in real data. Any sensible
camera model can talk about points at infinity without breaking,
because the maths simply doesn't reach for the forbidden division.

## The pinhole camera and `P = K[R|t]`

The pinhole camera is the simplest honest model of a rectilinear
lens. A 3×4 matrix `P` takes a homogeneous 3D world point and emits
a homogeneous 2D image point. It factors into two pieces.

The **intrinsics** `K` are a 3×3 upper-triangular matrix:

```
K = [ f_x   s   c_x ]
    [  0   f_y  c_y ]
    [  0    0    1  ]
```

with `f_x, f_y` the focal lengths in pixel units, `(c_x, c_y)` the
principal point in pixel coordinates (where the optical axis meets
the sensor — usually near the centre but not exactly), and `s` a
skew term that is zero for any sensor manufactured this century.
`K` answers the question: given a ray leaving the lens in camera
coordinates, which pixel on the sensor does it hit?

The **extrinsics** `[R|t]` are a 3×4 block: a 3×3 rotation `R` and a
3×1 translation `t`. They place the camera in the world, answering:
where is the camera, and which way is it looking? Together:

```
P = K [R | t]    (3×4)
x = P · X        (homogeneous pixel = camera matrix · homogeneous world point)
```

A handful of parameters — five intrinsics, six extrinsics, eleven
total — completely describes a pinhole camera. Calibration is the
process of recovering them from images of known geometry (a
chequerboard, most commonly); Zhang's 2000 paper is the standard
method and is what OpenCV's `calibrateCamera` implements.

### A worked example

Take a world point `X = (2, 1, 5, 1)` in metres. The camera sits at
the origin with no rotation, so `R = I` and `t = 0`, which collapses
`[R|t]` to `[I | 0]` and lets us just feed `(2, 1, 5)` into `K`.
The camera has focal length `f_x = f_y = 800` pixels and principal
point `(c_x, c_y) = (320, 240)` (a 640×480 sensor with the optical
axis through the middle).

```
K · (2, 1, 5) = ( 800·2 + 0·1 + 320·5,
                  0·2 + 800·1 + 240·5,
                  0·2 + 0·1 +   1·5 )
              = ( 1600 + 1600,
                  800  + 1200,
                  5 )
              = ( 3200, 2000, 5 )
```

That's the homogeneous pixel. Perspective division by the last
component:

```
(u, v) = ( 3200 / 5, 2000 / 5 ) = ( 640, 400 )
```

Pixel `(640, 400)` sits on the right edge of the 640×480 frame,
which is the model telling us this world point is at the limit of
the field of view. Honest geometric feedback; not a bug.

Move the same point closer — `X = (2, 1, 2, 1)` — and the
projection becomes:

```
K · (2, 1, 2) = ( 1600 + 640, 800 + 480, 2 ) = ( 2240, 1280, 2 )
(u, v)        = ( 1120, 640 )
```

Way off-frame. The model has correctly told us that an object
two metres in front of the lens, two metres to the right, will not
appear on this sensor with this focal length. The mathematics is
doing the work of a viewfinder.

## When the pinhole breaks

The pinhole model is honest inside a narrow corridor of lens
behaviour: roughly, rectilinear lenses with horizontal field of
view up to around 85°. Beyond that, the geometry that the model
promises — straight lines in the world stay straight in the image —
stops being true.

Three failure modes, in order of severity:

1. **Wide-angle lenses (~85°–110° HFOV)** introduce barrel
   distortion. The calibration pipeline absorbs this as polynomial
   radial coefficients `k1, k2, k3` (sometimes through `k6`) layered
   on top of `K`. The OpenCV `cv::calibrateCamera` function fits
   these alongside the intrinsics. Once known, the distortion can
   be undone per-pixel and the rest of the projective machinery
   works as written.

2. **Fisheye lenses (~110°–180° HFOV)** break the model altogether.
   The radial polynomial extension of pinhole cannot stretch far
   enough to cover them. They need their own family — equidistant,
   equisolid, stereographic, or full-frame fisheye — with their own
   four-parameter polynomial fit. OpenCV ships `cv::fisheye` as a
   separate module precisely because the maths is structurally
   different.

3. **Panoramic / 360° capture** abandons pinhole entirely in favour
   of a spherical sampling scheme. The studio's preferred path for
   360 photography is to keep the raw fisheye pair (one for each
   lens of an Avata 360 or Osmo 360) and treat each fisheye with
   its own calibrated lens model, rather than accept the
   consumer-stitched equirect with the seam baked in. See the
   [equirectangular projection codex entry](../components/codex/entries/equirectangular-projection.tsx)
   for the geometry of that surrender.

The trade-off across these tiers is data fidelity vs. pipeline
compatibility. Every off-the-shelf SfM tool understands pinhole.
Many understand pinhole + radial distortion. Fewer understand
fisheye. Almost none understand spherical. The studio's
`splat360.pipeline.camera_model` decision lives exactly on this
trade-off.

## Homographies

A homography is a 3×3 invertible matrix `H` that maps one plane
onto another. Eight degrees of freedom (nine entries, defined up to
scale), four point correspondences, one linear solve. Homographies
underwrite:

- **Document scanners** that flatten a tilted page.
- **Whiteboard de-skewing** in conferencing apps.
- **Planar AR markers** (ArUco, AprilTag, ImageMagick targets) —
  the four corners give four correspondences, the homography
  decomposes into a pinhole pose under known intrinsics, and the
  AR object snaps into place.
- **Panorama stitching** when the photographer rotates in place
  without translating, so that the scene-as-seen reduces to a
  plane at infinity.

The catch — and it is a serious one — is **parallax**. A
homography cannot model depth-driven shifts. If the scene has
varying depth and the camera translates between shots, the closer
objects shift relative to the farther ones, and no single
homography can register the two views. The result is ghosted
seams and a stitch that fails wherever foreground and background
disagree.

Homographies are honest only when:

- The scene is planar (a wall, a road surface, a document), **or**
- The camera rotates about its optical centre with no translation.

Get either of those wrong and the stitcher lies. Mid-range
panorama tools (Hugin, PTGui) compensate for small translations
with multi-band blending and seam-finding, but the underlying
geometric model is still homography; the blending is just
hiding the lie politely.

## Epipolar geometry, briefly

When the scene is not planar and the camera does translate, one
needs **epipolar geometry**. The headline object is the
**fundamental matrix** `F` — a 3×3 rank-2 matrix that captures
everything the two-view geometry tells you about correspondences,
without needing either camera's intrinsics recovered.

For any pixel `x` in the left image, its corresponding pixel in
the right image must lie on a single straight line — the
**epipolar line** `l' = F · x`. Correspondence is therefore a
one-dimensional search along that line, not a two-dimensional
search across the whole image. The practical consequence is
roughly a thousand-fold speedup over naive matching, which is
why every modern stereo and structure-from-motion pipeline runs
on it.

If the intrinsics are known, `F` upgrades to the **essential
matrix** `E = K'^T · F · K`, which factors directly into a
relative rotation and translation between the two views. Five
correspondences are enough to recover `E` (Nistér's five-point
algorithm); eight are enough for `F` (Longuet-Higgins). The
detailed maths is in chapters 9–11 of Hartley & Zisserman.

## Structure-from-motion (SfM)

SfM is the technique that recovers both 3D structure and camera
poses from a stack of overlapping photographs. Its hard
constraint is geometric: **at least two views, with non-zero
translational baseline between them**.

A camera that only rotates — a perfect tripod pan, a VR headset
on a swivel chair — gives no triangulation information. Rays
from a world point all pass through the same optical centre, and
depth is fundamentally unobservable. The photographer has to
*walk* for SfM to work, which is why:

- Drone photogrammetry **orbits** the subject rather than
  spinning in place.
- The studio's splat pipeline rejects captures where the
  photographer pirouetted on the spot.
- Bracketed exposures from a tripod are useful for HDR but
  useless for 3D.

The standard SfM tool is COLMAP, which runs feature detection
(SIFT, by default), feature matching, geometric verification via
RANSAC against `F`, incremental pose recovery, and bundle
adjustment to minimise reprojection error. The output is a sparse
point cloud and a camera matrix per shot. The studio's gaussian
splat trainer then takes those camera matrices as fixed inputs
and optimises the splat geometry against the source images.

## Where this shows up at Holoflow

| Vertical | Projective-geometry surface |
|---|---|
| 360 stitching | Per-lens fisheye model + rotation `R` to a common world frame |
| WebXR pose | Headset reports `[R \| t]` per frame; renderer composes with eye intrinsics |
| AR card tracking | Homography from four marker corners → pinhole pose via known `K` |
| Drone photogrammetry | Full SfM: orbit baseline, COLMAP `P` recovery, splat trainer |
| Gaussian splat | Each splat is rendered with the same `P` SfM recovered |

Quaternions show up in the headset side (`R` is conventionally
shipped as a quaternion in WebXR `XRRigidTransform`s; see the
forthcoming `MATH-QUATERNIONS.md`). AR tracking has enough
specific quirks — fiducial design, ambiguity flips, jitter
filtering — to warrant its own bench reference; see the
forthcoming `AR-TRACKING.md`.

## Further reading

- **Hartley & Zisserman**, *Multiple View Geometry in Computer
  Vision* (Cambridge University Press, 2nd ed., 2004). The
  canonical reference. Dense, rewarding, contains every proof one
  might want about `F`, `E`, and calibration. Chapters 6, 8, 9,
  and 11 are the core projective-camera material.
- **Szeliski**, *Computer Vision: Algorithms and Applications*
  (Springer, 2nd ed., 2022). The gentler entry point. Chapter 2
  covers projective geometry, chapter 11 covers SfM. Free PDF on
  the author's site.
- **OpenCV camera calibration tutorial** at
  `https://docs.opencv.org/4.x/dc/dbb/tutorial_py_calibration.html` —
  the most consulted practical reference for getting from a
  chequerboard image set to a usable `K` and distortion vector.
  Covers Zhang's method without making you read Zhang's paper.
- **Zhang, Z.**, "A Flexible New Technique for Camera
  Calibration" (IEEE TPAMI, 2000). The original paper behind
  OpenCV's calibration function. Worth reading once.

## Summary, for the bench

- Lift 3D points to homogeneous 4-vectors so projection is linear.
- `P = K[R|t]` is the pinhole camera matrix — `K` is the lens, `[R|t]` is the pose.
- Perspective division at the end recovers pixel coordinates from the homogeneous pixel.
- Points at infinity (`w = 0`) are directions, not locations.
- Pinhole is honest up to ~85° HFOV; beyond that, add radial distortion, then switch to fisheye, then to spherical.
- Homographies handle planar scenes or pure-rotation cameras; they cannot handle parallax.
- The fundamental matrix `F` constrains correspondence to an epipolar line.
- SfM needs two views with translational baseline; rotation alone gives no depth.
- The whole studio capture stack — 360, AR, WebXR, drone — runs on this framework.

That's the framework. The rest of the maths-essentials series fills
in the linear algebra, the quaternions, and the specific AR tracker
gymnastics that sit on top.
