# Quaternions and 3D rotations — the foundational math

A rotation in three dimensions sounds simple. Three axes, three
angles, surely three numbers will do. They will not, and this
document is the careful walk through why — and what the studio
reaches for instead.

This is the Princess teaching register. The codex entry
`/codex/quaternions-and-rotations` is the public-facing variant;
this file is the equations, the worked example, and the discipline
notes for anyone touching rotation maths inside the Holoflow
verticals. Forward cross-references to `linear-algebra-essentials`,
`drone-control-mathematics`, and `webxr-pose-estimation` are left
open on purpose — those entries land next.

## I. Four ways to describe a rotation

Three dimensions allow exactly three rotational degrees of freedom,
and the rotation group is named SO(3) — the special orthogonal
group of 3×3 matrices with determinant +1. That much is settled.
What is not settled is which set of numbers you hand to the
computer. There are four common parameterisations, and each one
gives up something different.

| Parameterisation | Numbers | Composes by | Singular? | Interpolates? |
| --- | --- | --- | --- | --- |
| Rotation matrix | 9 | matrix × matrix | no | clumsily |
| Euler angles | 3 | sequential axis rotations | yes (gimbal lock) | badly |
| Axis-angle | 4 (axis + θ) | requires conversion | no | not directly |
| Unit quaternion | 4 | quaternion × quaternion | no | yes (SLERP) |

A rotation matrix is honest about what a rotation does. It is a
3×3 orthogonal matrix with determinant +1, you apply it to a column
vector by ordinary matrix multiplication, and the maths is the
maths the linear-algebra textbook taught you. The trouble is that
storing nine numbers for a three-parameter object is wasteful, the
matrix drifts off the manifold under repeated floating-point
composition (it picks up shear, it stops being exactly orthogonal,
it starts to scale your geometry by 1.0001), and there is no
graceful way to ask for "half" of a rotation matrix.

Euler angles are the form humans type into config files. Roll,
pitch, yaw. Yaw, pitch, roll. Z-Y-X intrinsic. X-Y-Z extrinsic.
There are twelve conventions and every codebase chooses a
different one. Worse, the parameterisation contains a built-in
catastrophe.

## II. Gimbal lock — the Euler-angle catastrophe

A three-axis gimbal applies its three rotations in a fixed order.
Yaw first, then pitch about the new axis, then roll about the
twice-rotated axis. At certain orientations — pitch the camera
ninety degrees up, for instance — the yaw axis and the roll axis
have aligned. The two rotations now do the same thing. The
gimbal has lost a degree of freedom: there is a direction the
camera cannot rotate without rebuilding its frame of reference.

This is gimbal lock, and it is the canonical reason engineering
disciplines abandoned Euler angles for anything mission-critical.
The Apollo 11 inertial measurement unit famously came close to
locking on the trans-lunar coast, and Mike Collins joked over the
radio about "another gimbal lock" — he was not really joking. NASA
had spent the design phase arguing about whether to use a fourth
gimbal (the redundant-axis cure) or accept the risk and train the
crew to fly around the singular cone. They chose the latter; they
got lucky.

The pathology is not a numerical artefact. It is a topological
fact: Euler angles wrap a flat three-dimensional box onto SO(3),
and that box has seams. Any single chart on SO(3) must have
seams; this is a theorem.

Quaternions sidestep the entire problem because they do not
encode rotation as a sequence of axis applications. They encode
it as a single point on a four-dimensional unit hypersphere —
a double cover of SO(3), so q and −q describe the same physical
rotation. No preferred axis ordering, no degenerate configuration.
The price is a small algebra to learn and an occasional
renormalisation to keep the four numbers on the unit sphere.

## III. Quaternion algebra — the minimum sufficient set

A quaternion is

```text
q = w + xi + yj + zk
```

where w is the scalar part, (x, y, z) is the vector part, and
the imaginary units i, j, k satisfy Hamilton's relation:

```text
i² = j² = k² = ijk = −1
```

From that one identity the full multiplication table follows:

```text
ij =  k    jk =  i    ki =  j
ji = −k    kj = −i    ik = −j
```

Multiplication is associative but not commutative — that is the
whole point. The conjugate is

```text
q* = w − xi − yj − zk
```

and the norm is

```text
|q| = √(w² + x² + y² + z²).
```

A **unit quaternion** has `|q| = 1`. A unit quaternion of the form

```text
q = cos(θ/2) + sin(θ/2) · (n̂ₓ i + n̂ᵧ j + n̂_z k)
```

represents a rotation by angle θ around the unit axis `n̂`. The
half-angle is the bit that catches everyone the first time, and
it is also why quaternions double-cover SO(3): rotating by 360°
brings q to −q, not back to itself, and you have to go round
720° before the quaternion returns to its starting value. Physics
calls this the spinor property; computer graphics calls it a
nuisance to track, and most implementations canonicalise to the
hemisphere with w ≥ 0.

To **rotate a vector** v, embed it as a pure quaternion (scalar
part zero):

```text
p = 0 + vₓ i + vᵧ j + v_z k
```

and compute the sandwich product

```text
p' = q · p · q*.
```

The vector part of `p'` is the rotated vector. To **compose** two
rotations — rotate first by q₁, then by q₂ — multiply:

```text
q_total = q₂ · q₁
```

reading right-to-left in the same way matrix products do.

## IV. Worked example — rotate (1, 0, 0) by 90° around y

Two routes, one answer. The convention: y points up, right-handed,
positive y-rotation carries +x toward −z.

**Route one — rotation matrix.** The standard y-axis matrix with
θ = π/2 (cos θ = 0, sin θ = 1):

```text
R_y(90°) = ⎡  0   0   1 ⎤
           ⎢  0   1   0 ⎥
           ⎣ −1   0   0 ⎦

R_y · v  = ⎡  0   0   1 ⎤ ⎡ 1 ⎤   ⎡  0 ⎤
           ⎢  0   1   0 ⎥ ⎢ 0 ⎥ = ⎢  0 ⎥
           ⎣ −1   0   0 ⎦ ⎣ 0 ⎦   ⎣ −1 ⎦
```

**Route two — quaternion.** The axis is `n̂ = (0, 1, 0)`, the
angle is 90°, so the half-angle is 45° and:

```text
q  = cos 45° + sin 45° · j = √2/2 + √2/2 · j
q* = √2/2 − √2/2 · j
p  = i           (embedding v = (1, 0, 0) as a pure quaternion)
```

Compute the sandwich, using `ji = −k`, `ij = k`, `kj = −i`:

```text
q · p          = (√2/2 + √2/2 j) · i
               = √2/2 · i + √2/2 · ji
               = √2/2 · i − √2/2 · k

(q · p) · q*   = (√2/2 i − √2/2 k) · (√2/2 − √2/2 j)
               = ½ · i  −  ½ · (ij)  −  ½ · k  +  ½ · (kj)
               = ½ · i  −  ½ · k    −  ½ · k  −  ½ · i
               = −k

vector part    = (0, 0, −1)
```

The two routes converge. The matrix path used six multiplications
and three additions; the quaternion path used a similar count of
operations on four-number objects. For a single isolated rotation
the matrix is slightly cheaper. For a hundred rotations composed
in sequence, or for any rotation you need to interpolate, the
quaternion wins on every axis that matters.

## V. SLERP — constant angular velocity, free

A linear interpolation between two Euler triples produces a
rotation that visibly accelerates and decelerates, and on bad
paths visibly wobbles. A linear interpolation between two
rotation matrices does not even produce a valid rotation in the
middle — the result has determinant less than one and shears the
geometry it touches.

Ken Shoemake's 1985 SIGGRAPH paper *Animating Rotation with
Quaternion Curves* introduced the cure. **Spherical linear
interpolation** — SLERP — blends two unit quaternions along the
great-circle arc on the 4D unit hypersphere:

```text
slerp(q₀, q₁, t) = (sin((1−t)·Ω) / sin Ω) · q₀
                 + (sin(t·Ω)     / sin Ω) · q₁

where    cos Ω = q₀ · q₁   (the 4D dot product).
```

The intermediate quaternions are themselves unit quaternions —
valid rotations all the way through — and the angular velocity is
constant. Equal time, equal angle. This is the canonical answer
for camera dolly tweens, bone keyframe interpolation, and any
camera move where the eye will notice an inconstancy.

A cheaper alternative, **NLERP**, linearly interpolates the four
quaternion components and renormalises. It is not constant-
angular-velocity but is close enough for short arcs, and is the
default in most game engines for animation playback where the
per-frame cost matters more than the perfect angular cadence.

The double-cover bites here. Because q and −q are the same
rotation but distinct points on the hypersphere, a naive SLERP
between q₀ and q₁ may sweep the long way round the sphere
rather than the short way. Every serious implementation checks
the sign of `q₀ · q₁` first and flips one operand if it is
negative. This is the unglamorous detail that makes the
difference between a camera move that arrives smoothly and one
that loops 270° to reach 90° away.

## VI. The exponential map — the Lie-algebra view

The deeper structure, and the one that matters when integrating
rotation rates over time: SO(3) is a Lie group, and its tangent
space at the identity is the Lie algebra so(3), consisting of
3×3 skew-symmetric matrices. The matrix exponential

```text
R = exp([ω]ₓ)
```

maps the axis-angle vector `ω = θ · n̂` (encoded as a skew-
symmetric matrix `[ω]ₓ`) to its rotation matrix. The closed
form is Rodrigues' rotation formula:

```text
R = I + sin θ · [n̂]ₓ + (1 − cos θ) · [n̂]ₓ²
```

For quaternions the equivalent is

```text
q = exp(θ/2 · n̂) = cos(θ/2) + sin(θ/2) · n̂
```

with the half-angle dropping out of the algebra rather than being
imposed.

This view is the right tool when:

- integrating angular velocity over time (the IMU dead-reckoning
  loop on a drone running at 400 Hz);
- composing many small rotations stably, where matrix drift would
  otherwise accumulate;
- writing the gradient updates that an optimiser uses to nudge a
  rotation along the manifold rather than across its ambient
  parameter space (the gaussian-splat training loop).

The matrix-exponential view is mathematically heavier than the
quaternion algebra above and you do not need it for most working
graphics code, but knowing it exists prevents a class of
reinvention.

## VII. Where rotations live in the Holoflow verticals

This is the load-bearing payoff. The studio's pipelines all
touch rotation maths somewhere:

- **Drone gimbal control.** The DJI Mini 5 Pro's three-axis
  gimbal accepts Euler setpoints at its public API, but the
  internal IMU fusion is quaternion-based. The Madgwick filter
  and its successors operate on quaternions specifically to
  avoid the pitch-90° lock that would otherwise happen every
  time the camera looked straight down. Forward:
  `drone-control-mathematics`.

- **WebXR head tracking.** `XRPose` exposes orientation as a
  quaternion (`DOMPointReadOnly { x, y, z, w }`). The runtime
  predicts pose forward in time using the quaternion form and
  the angular-velocity vector, then ships the result to the
  renderer at vsync. Forward: `webxr-pose-estimation`.

- **Three.js camera moves.** `THREE.Quaternion.slerp()` is the
  documented method for tweening between two orientations. The
  `Object3D` stores rotation internally as a quaternion
  regardless of which setter (`.rotation`, `.quaternion`,
  `.lookAt()`) you reach for first.

- **Gaussian splat training.** Each splat in a `.ply` carries a
  rotation quaternion `(rot_0, rot_1, rot_2, rot_3)` alongside
  position, scale and spherical-harmonic colour. The
  differentiable rasteriser back-propagates through the
  quaternion; the optimiser renormalises after each step.
  Euler triples would have made the gradients unusable near
  the gimbal-lock cone — one of the quiet reasons the
  technique works at all.

- **VRM bone orientation.** Every bone in a VRM armature stores
  its local rotation as a quaternion. SLERP between keyframe
  quaternions is what makes Aura's nanny.vrm puppet wave a
  hand smoothly instead of snapping through the singular
  wrist orientations.

Five places, one algebra. Worth learning once.

## VIII. Further reading

- Hamilton, W. R. (1843). On a new species of imaginary
  quantities connected with a theory of quaternions.
  *Proceedings of the Royal Irish Academy*, 2, 424–434. The
  primary source, by the man who carved `i² = j² = k² = ijk =
  −1` into Brougham Bridge with a penknife.
- Shoemake, K. (1985). Animating rotation with quaternion
  curves. *ACM SIGGRAPH Computer Graphics*, 19(3), 245–254.
  The paper that brought quaternions to computer animation and
  defined SLERP.
- Three.js documentation, `THREE.Quaternion` — the practical
  graphics-engine reference for everything in section VII.
- 3Blue1Brown and Ben Eater (2018), *Visualizing quaternions* —
  the interactive video and accompanying explorable that makes
  the four-dimensional intuition land.
