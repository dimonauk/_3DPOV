# WebXR mathematics — intrinsics, IMU fusion, IPD geometry

The long-form companion to the codex entry at
`/codex/webxr-mathematics`. The codex page is the short walk; this
one is the full path through what a headset is doing while the
scene draws.

The studio binds the maths here to three concrete places in the
codebase: the head-pose driver under `lib/tracking/`, the
scene-composition stage at `components/xr-scene/`, and the
head-pose capability surface at `lib/capabilities/input/headpose.ts`.
The per-device parameters that pin the floor on each headset —
panel resolution, refresh rate, framebuffer scale, foveation
policy — come from `docs/WEBXR-DEVICE-TARGETS.md`, which is the
binding reference the renderer reads at session start.

## 1. The shape of a head-mounted display, mathematically

A modern HMD is three problems stacked on one another:

1. **A stereo pair of pinhole cameras**, each with its own
   intrinsics — focal length, principal point, distortion model.
2. **A six-degree-of-freedom pose estimator**, fusing a gyroscope,
   an accelerometer, sometimes a magnetometer, and a tracking
   camera rig running visual-inertial odometry.
3. **A presentation pipeline** that reprojects last frame's
   render to cover this frame's pose, because draw-to-scan-out
   takes finite time and the head moved.

The WebXR Device API is the seam between these subsystems and a
browser scene — a stream of `XRFrame` objects carrying
`viewerPose`, `view.projectionMatrix`, `view.transform`.
Underneath each of those is one of the three problems above,
already solved by the runtime.

## 2. Per-eye camera intrinsics

Each lens-and-panel pairing inside the headset behaves, near
enough, like a pinhole camera. Its intrinsics matrix is

```text
K = [[f_x,  s,  c_x],
     [ 0, f_y, c_y],
     [ 0,   0,   1]]
```

with focal lengths `f_x, f_y` in pixel units, principal point
`(c_x, c_y)` where the optical axis pierces the panel, and a skew
`s` that's zero for any sensor that isn't parallelogram-shaped —
which is to say, always zero in practice. See
`/codex/projective-geometry-essentials` for the full derivation of
why this matrix is what it is.

A worked example using the Quest 3 panel: per-eye resolution
2064 × 2208 pixels, horizontal field of view about 110°. The
focal length in pixels is

```text
f_x = (panel_width / 2) / tan(FOV_x / 2)
    = 1032 / tan(55°)
    ≈ 1032 / 1.428
    ≈ 723 pixels
```

That's the lens-to-panel relationship the headset's factory
calibration recovers and surfaces to WebXR as the projection
matrix on each `XRView`. The application doesn't see `K` directly —
it sees a 4 × 4 projection matrix that takes view-space points
straight to clip-space pixels in one multiply, with the
intrinsics already baked in and the near and far planes folded
into the depth row.

Real headset lenses are radially distorted. The factory
calibration absorbs the distortion as a polynomial in radial
distance from the principal point and the runtime applies it
as part of projection — which is one reason eye-tracked
foveation tends to ship with edge-distortion correction in the
compositor.

## 3. Head pose: 6-DoF in homogeneous form

The headset reports its pose as a position `(x, y, z)` in metres
and an orientation as a unit quaternion `q = (w, x, y, z)`
normalised so `w² + x² + y² + z² = 1`. WebXR exposes this
through `XRFrame.getViewerPose(referenceSpace)`, which returns
an `XRViewerPose` whose `transform.position` is a DOMPoint and
whose `transform.orientation` is the quaternion as another
DOMPoint.

The pose composes with each eye's `view.transform` (the
inter-pupillary offset and any per-eye toe-in) to give the two
view matrices the renderer needs, one per eye, both in the same
world frame:

```text
view_matrix_eye = inverse(viewer_transform · eye_transform)
```

The application never has to know the user's actual IPD — only
that it must respect each `view.transform` when rendering.

Why quaternions and not Euler angles? Three reasons. They have
no gimbal lock — Euler angles lose a degree of freedom at
±90° pitch and break drone IMU integration the moment the craft
pitches over. They compose cleanly under multiplication, which
mirrors rotation composition. And spherical linear interpolation
between two quaternions gives the right-feeling intermediate
orientation, whereas lerping Euler angles swings through
intermediate poses no artist ever wanted. See
`/codex/quaternions-and-rotations` for the full story.

## 4. IMU fusion: where the pose actually comes from

Inside the HMD, two sensor families run at kilohertz rates:

- **The gyroscope** reports angular velocity `ω` in radians per
  second. Integrating it across a tick `Δt` gives an
  orientation update, but any bias in the gyro's zero-rate
  output drifts. A typical MEMS gyro accumulates a degree or
  two of error per minute if trusted alone.
- **The accelerometer** reports the sum of gravity and linear
  acceleration. At rest the gravity vector points down in the
  world frame and gives an absolute reference for pitch and
  roll, but the signal is noisy, and the moment the head
  actually accelerates the gravity reading is confused.

The headset combines them so the gyro carries the fast, smooth
orientation changes and the accelerometer corrects the slow
drift around the gravity axis. Two canonical recipes.

### 4.1 The complementary filter

The cheapest fusion. Maintain an orientation estimate `q`. Each
tick:

```text
q_gyro  = integrate(q_prev, ω, Δt)
q_accel = orientation_from_gravity(a_measured)
q_new   = α · q_gyro + (1 − α) · q_accel
```

with `α ≈ 0.98`. The gyro carries most of the trust, the
accelerometer nudges the estimate slowly back to vertical. It's
fast enough for a hobbyist drone but loose enough that consumer
HMDs reach for something tighter.

### 4.2 The Madgwick filter

Sebastian Madgwick's 2010 paper sits between the complementary
filter and the full EKF: an analytic gradient-descent step
that's cheaper than an EKF and more correct than a naive
complementary filter, and is what most consumer headset firmware
quietly leans on.

The derivation is small enough to hold in one's head.
Parameterise orientation as a quaternion. Compute the error
between the accelerometer reading and the gravity vector rotated
into the body frame by the current `q`. Take the gradient of
that error with respect to `q`. Step `q` along the negative
gradient at a rate `β` that trades convergence speed against
noise. Fold the gyro integration in on top:

```text
q_new = q_prev + (q̇_gyro − β · ∇error_accel) · Δt
```

`β` is the only tuneable; for a typical HMD it sits around
0.05–0.1.

### 4.3 The extended Kalman filter (EKF)

The full machinery. The state is the orientation (and sometimes
position, gyro bias, accelerometer bias). The covariance of that
state is maintained alongside the mean. The filter linearises
the dynamics around the current estimate and computes a Kalman
gain that says, in vector form, how much to trust each new
measurement against the current state's uncertainty. The EKF
costs a matrix inversion per tick but produces tighter behaviour
and explicit uncertainty estimates — which is what the
compositor needs if it wants to extrapolate the pose forward to
the scan-out deadline. See `/codex/signal-processing-essentials`
for the broader recursive-filter story.

## 5. Yaw drift and the visual fix

The gravity vector pins pitch and roll. It tells one nothing
about heading: yaw around the gravity axis drifts freely. A
magnetometer fixes it absolutely from the Earth's field — but
wobbles indoors and dies near speakers and motors. A camera
fixes it relative to the scene by tracking how a feature's
bearing changes between frames. Modern HMDs use the camera
path, or both in a tightly-coupled filter (the Quest line uses
no magnetometer at all).

This is **visual-inertial odometry** (VIO). The inside-out
tracking cameras feed a feature tracker that locks the world
frame; the IMU handles everything between camera frames; the
EKF fuses the two streams. Quest 3 carries four passthrough
cameras; Vision Pro carries six; Steam Frame carries four.
More cameras means more chances of seeing enough texture to
lock onto in dim or feature-poor environments.

The maths of feature tracking is projective geometry — see
`/codex/projective-geometry-essentials` for the fundamental
matrix and the epipolar constraint that makes two-view feature
matching tractable. The shape of the fused estimator is what
the literature calls SLAM (Simultaneous Localisation and
Mapping). The head and the world co-evolve in the filter,
because one cannot estimate the head's motion without knowing
where the features are, and one cannot place the features
without knowing the head's motion. The literature trail runs
from Davison's MonoSLAM (2003) through ORB-SLAM and VINS-Mono
to the present-day tightly-coupled visual-inertial systems
shipping in every standalone headset on the market.

## 6. Stereoscopy and the inter-pupillary distance

Adult IPDs run from about 54 mm at the small end to 74 mm at
the large; the modal figure is somewhere near 63 mm. Each eye
sees a view from its own optical centre, shifted sideways from
the head pose by `±IPD/2`. That shift is what makes the
rendered scene have depth: a point at infinity projects
identically in both eyes; a point one metre away projects to
different pixels in the two panels; the brain reads that
disparity as depth.

### 6.1 The worked IPD example

Take a world point one metre directly in front of the user at
eye height. In head-local coordinates (right-handed, −z
forward), the point is `X = (0, 0, −1)`. With IPD = 63 mm, the
two eyes sit at

```text
eye_L = (+0.0315, 0, 0)
eye_R = (−0.0315, 0, 0)
```

The point's position in each eye's frame is

```text
X − eye_L = (−0.0315, 0, −1)   in left-eye frame, after shifting origin
X − eye_R = (+0.0315, 0, −1)   in right-eye frame
```

Pinhole projection with `f = 1 m` (focal length expressed in
the same units as the scene, the way one writes it on the
blackboard before converting to panel pixels):

```text
u = f · x / |z|
v = f · y / |z|
```

For the left eye: `u_L = 1 · (−0.0315) / 1 = −0.0315 m`. For
the right eye: `u_R = 1 · (+0.0315) / 1 = +0.0315 m`. The
**disparity** is

```text
d = u_L − u_R = −0.063 m
```

which is the IPD with the sign convention chosen. At one focal
length distance the disparity equals the baseline, which is the
intuition pump worth carrying around: doubling the depth halves
the disparity, depth at infinity gives zero disparity, depth
at half a focal length doubles it.

Converted to panel pixels at Quest-3 focal length (`f_x ≈ 723`
pixels), a one-metre object lands `0.0315 × 723 ≈ 22.8` pixels
to one side of the principal point in each eye, and the
disparity across the panels is about 45 pixels.

### 6.2 Vergence-accommodation conflict

Two oculomotor systems normally co-vary in the real world: the
eyes **converge** on a near object — rotate inwards — and
simultaneously **accommodate** to it — the crystalline lens
thickens to focus light from that distance onto the retina.

In an HMD the convergence cue is correct: the disparity tells
the eyes to converge on the virtual depth. The accommodation
cue is wrong: the physical light is coming from the panel a
few centimetres in front of the eye, and the lens has to
accommodate to *that* distance. The two cues disagree, the
visual system burns extra effort trying to reconcile them, and
the user gets the headache and nausea that the literature
politely calls "visual fatigue". David Hoffman, Ahna Girshick,
Kurt Akeley and Martin Banks's 2008 *Journal of Vision* paper
quantified it; Sue Cobb's 1999 review of VR-induced symptoms
named the broader cluster of effects in which it sits. Either
citation does, depending on which way one wants the literature
to lean.

Light-field displays and varifocal HMDs are the long-term fix —
they place the accommodation distance under software control so
the cues can co-vary. For everything shipping today, the studio
designs around the conflict: keep reading-distance content at
comfortable virtual depths (no closer than about 0.5 m), avoid
rapid depth changes that force the eyes to re-converge against
a fixed accommodation, and don't park UI right under the user's
nose.

## 7. Foveated rendering, in numbers

The retina is wildly non-uniform. The fovea covers about ±1°
of arc at the centre of gaze and resolves around 60 cycles per
degree of grating. At 10° eccentricity acuity has dropped to
perhaps a quarter of that. At 30° it's less than a tenth.

The fall-off is roughly linear with eccentricity if one measures
in **cortical magnification units** — how much primary visual
cortex an arcmin of retina is given — and it's the load-bearing
result behind every foveated renderer. A practical falloff in
pixels-per-degree is

```text
PPD(e) = PPD_0 / (1 + k · e)
```

with `k ≈ 0.3` for headset compositors. At 0° eccentricity the
renderer runs at full PPD; at 10° at a quarter; at 30° at a
tenth.

Variable-rate shading exploits this by running one fragment
shader per N × N tile in the periphery and one per pixel in
the centre. Two implementations show up in shipping hardware.
The Apple Vision Pro compositor runs at 5 PPD in the periphery
and 40 PPD in the centre, with the foveation region moving as
the eyes do — that's **eye-tracked foveation**. The Quest 3
has no consumer eye tracking, so it picks a fixed centre region
instead — that's **fixed foveation**. Fixed foveation misses
when the user looks sideways through the lens but still
recovers a substantial fragment-cost discount on average.

The Holoflow renderer requests foveation through the WebXR
`XRSession.fixedFoveation` setter where supported; the per-
device foveation policy table lives in `WEBXR-DEVICE-TARGETS.md`.
See `/codex/foveated-rendering` for the shipping-hardware story
and the studio's authoring notes.

## 8. Reprojection — timewarp and spacewarp

The render takes finite time. If the application asks for
90 Hz, the budget per frame is 11.1 ms. If it misses, the
compositor still has to put pixels on the panel at the scan-out
deadline, and an old frame against a new pose looks awful — the
world swims as the user turns the head.

The fix is to render once into a slightly wider buffer and, at
the last moment before scan-out, sample from that buffer using
the **current** head pose rather than the pose the frame was
rendered against. The mathematical operation is a 2D image
warp parameterised by the orientation delta between
"pose-at-render-start" and "pose-at-scan-out"; for small deltas
the warp is a homography. That's **asynchronous timewarp** (ATW).

**Asynchronous spacewarp** (ASW) extends ATW with a motion-
vector pass that extrapolates translation and animated geometry
as well as rotation, letting a 45 Hz render look like a 90 Hz
one — at the cost of characteristic artefacts (disocclusion
ghosts at moving silhouettes, wrong edges on transparency) that
the studio designs around rather than fights.

The application doesn't wire any of this. The runtime owns the
warp. The application is responsible for submitting a depth
buffer where one is expected, respecting the recommended
framebuffer scale, and not reading back the framebuffer after
submission.

## 9. Where this lives in Holoflow

| Concern | File |
| --- | --- |
| Head-pose driver, WebXR adapter to the tracking registry | `lib/tracking/` |
| Head-pose capability surface | `lib/capabilities/input/headpose.ts` |
| Scene composition, two-view render, per-device foveation request | `components/xr-scene/` |
| Per-device parameters (panel, refresh, IPD policy) | `docs/WEBXR-DEVICE-TARGETS.md` |
| WebXR session lifecycle, feature detection | `components/three/xr/XRCanvas.tsx` (per `docs/WEBXR_STACK.md`) |
| Broader tracking-source registry the WebXR adapter joins | `docs/TRACKING.md` |

The studio's pattern: runtime owns the maths, application owns
the policy. Runtime fuses the IMU; application decides what to
do with the pose. Runtime foveates the framebuffer; application
decides which TSL post-pack to chain on top.

## 10. Cross-references

`/codex/linear-algebra-essentials`,
`/codex/projective-geometry-essentials`,
`/codex/quaternions-and-rotations`,
`/codex/signal-processing-essentials`, `/codex/webxr`,
`/codex/foveated-rendering`, and the forthcoming *drone control
mathematics* — IMU fusion reappears at the autopilot with the
same complementary-vs-Kalman tension but tighter latency.

## 11. References

- WebXR Device API specification, W3C Immersive Web WG —
  <https://www.w3.org/TR/webxr/>.
- Apple visionOS developer documentation —
  <https://developer.apple.com/documentation/visionos>.
- Hartley & Zisserman, *Multiple View Geometry in Computer
  Vision* (Cambridge UP, 2nd ed., 2004) — chapters 6–7 on
  camera models and calibration.
- Sebastian O. H. Madgwick, *An efficient orientation filter
  for inertial and inertial/magnetic sensor arrays* (Bristol,
  April 2010).
- David M. Hoffman, Ahna R. Girshick, Kurt Akeley, Martin S.
  Banks, *Vergence-accommodation conflicts hinder visual
  performance and cause visual fatigue*. Journal of Vision,
  2008.
- Sue V. G. Cobb et al., *Virtual reality-induced symptoms and
  effects (VRISE)*. Presence: Teleoperators and Virtual
  Environments, 1999.
- A. J. Davison, *Real-Time Simultaneous Localisation and
  Mapping with a Single Camera* (ICCV 2003) — the root paper
  of the visual-SLAM lineage HMDs descend from.
- Daniel & Whitteridge (1961), *The representation of the
  visual field on the cerebral cortex in monkeys* — the
  cortical-magnification result behind the foveation falloff.

---

Revisit on a new WebXR spec revision, a new HMD with a
fundamentally different display stack (light-field, varifocal)
that breaks the vergence-accommodation argument, or a new pose
source in the tracking registry whose fusion semantics differ
from the runtime's.
