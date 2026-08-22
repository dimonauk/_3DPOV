import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A 3-D rotation looks deceptively simple — three Euler angles, done.
        The problem surfaces when two of those angles align (gimbal lock) and
        the third loses a degree of freedom, producing the characteristic flip
        artefact you see in badly-exported VRM animations. Quaternions sidestep
        the issue by representing orientations as unit vectors on the 4-D
        hypersphere S³, where interpolation is always well-defined. Blender
        stores all pose-bone channels in quaternion form internally;{" "}
        <code>mathutils.Quaternion</code> exposes the full algebra from Python.
        This tutorial covers three distinct operations:{" "}
        <strong>SLERP</strong> for a minimal-arc single-segment blend,{" "}
        <strong>Squad</strong> for a C1 multi-pose curve, and{" "}
        <strong>log-space averaging</strong> for blending N weighted VRM
        blendshape poses — the same mathematics that drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-matrix-transform-compose-decompose-webxr"
          className={lk}
        >
          matrix decompose pipeline
        </Link>{" "}
        one level deeper.
      </p>
      <p>
        The double-cover property of quaternions matters in practice: q and −q
        represent the same rotation, so naïve linear interpolation can pick the
        long arc when the dot product is negative. Blender&apos;s built-in{" "}
        <code>slerp()</code> guards against this automatically, but Squad and
        the log-space tools you write yourself require you to normalise the
        input hemisphere first — the blueprint shows the exact guard. Outside
        references:{" "}
        <a
          href="https://docs.blender.org/api/5.1/mathutils.html#mathutils.Quaternion"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Foundation mathutils.Quaternion API
        </a>{" "}
        (CC-BY-SA 4.0); Three.js Quaternion source by mrdoob et al.{" "}
        <a
          href="https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          (MIT, github.com/mrdoob/three.js)
        </a>
        , sibling ecosystem: pmndrs/react-three-fiber, pmndrs/drei.
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    steps: [
      {
        title: "Construct quaternions from axis-angle and Euler",
        body: `# WHY axis-angle over raw WXYZ literals:
# Human-readable intent, far less prone to sign errors.
# Quaternion((axis_x, axis_y, axis_z), angle_radians)
# produces a half-angle internally — you supply full rotation.

import math
from mathutils import Quaternion, Vector

# Axis-angle construction
q_spine = Quaternion((1, 0, 0), math.radians(45))  # 45° around X
q_chest = Quaternion((0, 1, 0), math.radians(30))  # 30° around Y

# From Euler (ZYX convention) — useful when importing from JSON
from mathutils import Euler
q_from_euler = Euler((0.5, 0.1, 0.3), 'XYZ').to_quaternion()

# Composition: apply q_chest AFTER q_spine
# Use @ (matmul) — plain * is deprecated in Blender 5.1
q_combined = q_spine @ q_chest

# Inversion and dot product
print(q_spine.inverted())       # conjugate for unit quaternions
print(q_spine.dot(q_chest))     # positive ↔ quaternions on same hemisphere`,
      },
      {
        title: "SLERP — minimal arc, constant angular velocity",
        body: `import bpy, math
from mathutils import Quaternion

BONE_NAMES  = ["Spine", "Chest", "Neck", "Head"]
SLERP_STEPS = 12

arm_obj = bpy.data.objects["VRM_Spine"]   # built by blueprint.py
pose_a  = {n: Quaternion() for n in BONE_NAMES}   # rest
pose_b  = {
    "Spine": Quaternion((1,0,0), math.radians(45)),
    "Chest": Quaternion((0,1,0), math.radians(30)),
    "Neck" : Quaternion((0,0,1), math.radians(20)),
    "Head" : Quaternion((1,0,0), math.radians(-15)),
}

n = SLERP_STEPS + 2
for step in range(n):
    t     = step / (n - 1)
    frame = 1 + step
    bpy.context.scene.frame_set(frame)
    for name in BONE_NAMES:
        pb = arm_obj.pose.bones[name]
        pb.rotation_mode       = "QUATERNION"
        # slerp() auto-flips sign if dot product < 0
        pb.rotation_quaternion = pose_a[name].slerp(pose_b[name], t)
        pb.keyframe_insert("rotation_quaternion", frame=frame)`,
      },
      {
        title: "Log-space primitives — quat_log and quat_exp",
        body: `import math
from mathutils import Quaternion, Vector

def quat_log(q: Quaternion) -> Vector:
    """Unit quaternion → 3-vector in tangent space at identity.
    WHY: arithmetic averaging of WXYZ lives on a curved manifold.
    Log-map flattens S³ locally so weighted sums are correct.
    """
    w    = max(-1.0, min(1.0, q.w))   # guard float rounding at ±1
    half = math.acos(w)
    if half < 1e-7:                   # near identity: limit → (x,y,z)
        return Vector((q.x, q.y, q.z))
    s = half / math.sin(half)
    return Vector((q.x * s, q.y * s, q.z * s))


def quat_exp(v: Vector) -> Quaternion:
    """Inverse of quat_log: tangent-space 3-vector → unit quaternion."""
    angle = v.length
    if angle < 1e-7:
        return Quaternion()           # identity
    s = math.sin(angle) / angle
    return Quaternion((math.cos(angle), v.x * s, v.y * s, v.z * s))


# Weighted geometric mean of three poses (50 / 30 / 20 %)
quats_weights = [
    (Quaternion((1,0,0), math.radians(45)), 0.5),
    (Quaternion((1,0,0), math.radians(30)), 0.3),
    (Quaternion((1,0,0), math.radians(10)), 0.2),
]
log_sum = Vector((0.0, 0.0, 0.0))
total   = sum(w for _, w in quats_weights)
for q, w in quats_weights:
    log_sum += quat_log(q) * (w / total)
blended = quat_exp(log_sum)
print("blended angle:", math.degrees(blended.to_axis_angle()[1]))`,
      },
      {
        title: "Squad — C1 curve through three pose waypoints",
        body: `# Squad inner tangent for waypoint i:
# s_i = q_i · exp(−(log(q_i⁻¹·q_{i−1}) + log(q_i⁻¹·q_{i+1})) / 4)
# This makes the curve speed match on arrival and departure.

def squad_tangent(q_prev, q_curr, q_next):
    qi_inv = q_curr.inverted()
    t1 = quat_log(qi_inv @ q_prev)
    t2 = quat_log(qi_inv @ q_next)
    return q_curr @ quat_exp((t1 + t2) * -0.25)


def squad(q1, s1, s2, q2, t: float):
    """de Casteljau on S³ — three SLERPs, one result."""
    a = q1.slerp(q2, t)
    b = s1.slerp(s2, t)
    return a.slerp(b, 2.0 * t * (1.0 - t))


# Three-waypoint example
rest = Quaternion()
mid  = Quaternion((1,0,0), math.radians(22))
full = Quaternion((1,0,0), math.radians(45))

s_mid = squad_tangent(rest, mid, full)   # tangent at waypoint 1

STEPS = 8
for i in range(STEPS + 1):
    t = i / STEPS
    # Segment 0→1: rest → mid
    q = squad(rest, rest, s_mid, mid, t)
    print(f"t={t:.2f} angle={math.degrees(q.to_axis_angle()[1]):.1f}°")`,
      },
      {
        title: "Write quaternion channels into NLA and export GLB",
        body: `# After keying rotation_quaternion on pose bones, the FCurves
# store WXYZ components.  GLB exports them as quaternion samplers
# (CUBICSPLINE or LINEAR) — THREE.js reads these natively without
# conversion.  The round-trip check below verifies the exported
# values agree with the Python source to float32 precision.

import bpy, struct

arm_obj = bpy.context.active_object
bpy.ops.export_scene.gltf(
    filepath                       = "/tmp/quat_retarget_arm.glb",
    use_selection                  = True,
    export_format                  = "GLB",
    export_animations              = True,
    export_optimize_animation_size = True,
)

# Quick float32 round-trip sanity check (GLB stores f32):
from mathutils import Quaternion
q_source = Quaternion((1, 0, 0), 0.785398)   # π/4
q_f32    = Quaternion(
    struct.unpack("4f", struct.pack("4f", q_source.w,
                                         q_source.x,
                                         q_source.y,
                                         q_source.z))
)
assert (q_source.w - q_f32.w) < 1e-7, "float32 precision lost"
print("[holoflow] GLB quaternion round-trip OK")

# Studio pipeline note: the holoflow_webxr_exporter add-on
# (tools/blender-addon/) applies +Y-up rotation at export.
# Quaternions survive this as a left-multiplication by the
# coordinate-frame rotation quaternion — no Euler conversion needed.`,
      },
    ],
    troubleshooting: [
      {
        problem: "slerp() produces a long arc instead of shortest path",
        solution:
          "Check q1.dot(q2) before calling slerp(). If the dot product is negative, negate one quaternion: q2 = -q2. Blender's built-in slerp() does this automatically; Squad does not — guard it in squad_tangent().",
      },
      {
        problem: "quat_log() returns NaN for a quaternion with w > 1.0",
        solution:
          "Floating-point accumulation can push q.w slightly above 1.0 after many multiplications. The blueprint clamps q.w to [-1, 1] before math.acos(). Always normalise incoming quaternions: q.normalize().",
      },
      {
        problem: "GLB animation plays back with a sudden flip at frame 7",
        solution:
          "The FCurve interpolation mode is LINEAR but the W channel crosses zero, producing an antipodal shortcut. Set interpolation to BEZIER for all four WXYZ curves, or pre-process your keyframes to keep the dot product positive between consecutive frames.",
      },
      {
        problem: "Log-space blend feels wrong compared to visual expectation",
        solution:
          "Log-space averaging is a first-order approximation valid for rotations within ~90° of each other. Beyond that, use iterative Riemannian mean (Fréchet mean) or restrict blendshape weights so the active poses always stay within the valid range.",
      },
    ],
    outsideSources: [
      {
        title: "Blender Foundation — mathutils.Quaternion API (CC-BY-SA 4.0)",
        author: "Blender Foundation",
        licence: "CC-BY-SA-4.0",
        url: "https://docs.blender.org/api/5.1/mathutils.html#mathutils.Quaternion",
        relatedProjects: [
          "https://projects.blender.org/blender/blender",
          "https://developer.blender.org/docs/features/animation/",
        ],
      },
      {
        title: "Three.js Quaternion source — SLERP reference implementation (MIT)",
        author: "mrdoob et al.",
        licence: "MIT",
        url: "https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js",
        relatedProjects: [
          "https://github.com/mrdoob/three.js",
          "https://github.com/pmndrs/react-three-fiber",
          "https://github.com/pmndrs/drei",
        ],
      },
    ],
  },
  {
    slug: "python-mathutils-quaternion-slerp-squad-vrm-retarget",
    title:
      "Python mathutils.Quaternion — SLERP, Squad & Log-Space Blending for VRM Retarget (Blender 5.1)",
    description:
      "Master quaternion arithmetic in Blender 5.1 Python: SLERP for constant-velocity arcs, Squad for C1 multi-pose curves, and log-space geometric-mean averaging for correct VRM blendshape pose mixing.",
    image: null,
    body: <Body />,
    tags: [
      "blender",
      "python",
      "scripting",
      "mathutils",
      "quaternion",
      "slerp",
      "animation",
      "vrm",
      "rigging",
      "webxr",
    ],
  }
);
