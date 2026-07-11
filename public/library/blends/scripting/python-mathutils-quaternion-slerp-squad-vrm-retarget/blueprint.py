# ============================================================
# blueprint.py
# mathutils.Quaternion — SLERP, Squad & Log-Space Blending
#                        for VRM Animation Retargeting
# Blender 5.1 | Holoflow Studio | CC0
# ============================================================
# TECHNIQUE:
#   Quaternions represent orientations as unit vectors on the
#   4-D hypersphere S³.  Every rotation has a double cover:
#   q and −q are the same physical pose.  Naive LERP of quat
#   components therefore drifts off S³ and can flip sign mid-
#   animation.  SLERP (Shoemake 1985) walks the geodesic arc
#   at constant angular velocity.  Squad extends SLERP to a
#   piecewise cubic that is C1 at each waypoint.  Log-space
#   averaging lets you blend N weighted poses correctly for
#   VRM blendshape controllers — the only approach that gives
#   the geometric mean rather than a biased component sum.
# ============================================================

import bpy, math, json, os
from mathutils import Quaternion, Vector

# ── CONSTANTS ─────────────────────────────────────────────────
BONE_NAMES   = ["Spine", "Chest", "Neck", "Head"]
SLERP_STEPS  = 12   # frames for the SLERP sweep
SQUAD_STEPS  = 8    # frames per segment in the Squad sweep
FPS          = 24

# Change OUTPUT_DIR to your project blend folder:
OUTPUT_DIR   = bpy.app.tempdir  # overridden by save path below


# ── MATHS PRIMITIVES ──────────────────────────────────────────

def quat_log(q: Quaternion) -> Vector:
    """Unit quaternion → 3-vector in tangent space at identity.

    WHY: Arithmetic average of quaternion WXYZ components is wrong
    because the components live on a curved manifold (S³), not
    flat R⁴.  The log map locally flattens S³ around the identity
    so that weighted sums produce the correct geometric mean.
    Edge case: near-identity quaternion (|θ| < ε) — limit gives
    log(q) ≈ (x, y, z) because sin(θ)/θ → 1.
    """
    w = max(-1.0, min(1.0, q.w))   # clamp for float rounding
    half = math.acos(w)
    if half < 1e-7:
        return Vector((q.x, q.y, q.z))
    s = half / math.sin(half)
    return Vector((q.x * s, q.y * s, q.z * s))


def quat_exp(v: Vector) -> Quaternion:
    """3-vector in tangent space → unit quaternion (inverse of log)."""
    angle = v.length
    if angle < 1e-7:
        return Quaternion()   # identity
    s = math.sin(angle) / angle
    return Quaternion((math.cos(angle), v.x * s, v.y * s, v.z * s))


def quat_avg_weighted(quats_weights: list) -> Quaternion:
    """Geometric mean of (quaternion, weight) pairs via log-space.

    WHY: VRM blendshape controllers accumulate face pose weights
    that must sum correctly.  The standard approach — add WXYZ
    components with weights, then normalise — gives wrong results
    near ±180° rotations.  Log-space averaging is O(N) and exact
    for the first-order approximation.
    """
    log_sum = Vector((0.0, 0.0, 0.0))
    total   = sum(w for _, w in quats_weights)
    for q, w in quats_weights:
        log_sum += quat_log(q) * (w / total)
    return quat_exp(log_sum)


def squad_tangent(q_prev: Quaternion,
                  q_curr: Quaternion,
                  q_next: Quaternion) -> Quaternion:
    """Inner control point for Squad interpolation through q_curr.

    Squad formula: s_i = q_i * exp(−(log(q_i⁻¹·q_{i−1})
                                    + log(q_i⁻¹·q_{i+1})) / 4)
    This ensures the curve velocity at q_curr equals the average
    of arrival and departure directions — C1 continuity.
    """
    qi_inv = q_curr.inverted()
    term1  = quat_log(qi_inv @ q_prev)
    term2  = quat_log(qi_inv @ q_next)
    inner  = (term1 + term2) * (-0.25)
    return q_curr @ quat_exp(inner)


def squad(q1: Quaternion, s1: Quaternion,
          s2: Quaternion, q2: Quaternion, t: float) -> Quaternion:
    """Spherical quadrangle interpolation — C1 rotation curve.

    De Casteljau construction on S³:
        a = slerp(q1, q2, t)      ← endpoint arc
        b = slerp(s1, s2, t)      ← tangent arc
        result = slerp(a, b, 2t(1−t))   ← quadratic blend
    The 2t(1−t) weight is zero at t=0 and t=1 so Squad agrees
    with its endpoint SLERPs, but bulges toward s at mid-arc.
    """
    a = q1.slerp(q2, t)
    b = s1.slerp(s2, t)
    return a.slerp(b, 2.0 * t * (1.0 - t))


# ── SCENE ─────────────────────────────────────────────────────

def build_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.name         = "quat_retarget"
    sc.render.fps   = FPS
    total_frames    = (SLERP_STEPS + 2) + 2 + (2 * SQUAD_STEPS) + 4
    sc.frame_start  = 1
    sc.frame_end    = total_frames
    return sc


# ── ARMATURE ──────────────────────────────────────────────────

def build_armature():
    """Four-bone spine chain simulating a VRM Spine→Head hierarchy."""
    arm_data = bpy.data.armatures.new("VRM_Spine")
    arm_obj  = bpy.data.objects.new("VRM_Spine", arm_data)
    bpy.context.scene.collection.objects.link(arm_obj)
    bpy.context.view_layer.objects.active = arm_obj

    bpy.ops.object.mode_set(mode="EDIT")
    eb        = arm_data.edit_bones
    prev_bone = None
    tip       = Vector((0.0, 0.0, 0.0))
    for name in BONE_NAMES:
        b            = eb.new(name)
        b.head       = tip.copy()
        b.tail       = tip + Vector((0.0, 0.0, 0.25))
        b.roll       = 0.0
        if prev_bone:
            b.parent       = prev_bone
            b.use_connect  = True
        prev_bone = b
        tip       = b.tail.copy()

    bpy.ops.object.mode_set(mode="POSE")
    return arm_obj


# ── POSES ─────────────────────────────────────────────────────

def make_poses():
    rest = {n: Quaternion()                                for n in BONE_NAMES}
    mid  = {
        "Spine": Quaternion((1, 0, 0), math.radians(22)),
        "Chest": Quaternion((0, 1, 0), math.radians(12)),
        "Neck" : Quaternion((0, 0, 1), math.radians( 8)),
        "Head" : Quaternion((1, 0, 0), math.radians(-6)),
    }
    full = {
        "Spine": Quaternion((1, 0, 0), math.radians(45)),
        "Chest": Quaternion((0, 1, 0), math.radians(30)),
        "Neck" : Quaternion((0, 0, 1), math.radians(20)),
        "Head" : Quaternion((1, 0, 0), math.radians(-15)),
    }
    return rest, mid, full


# ── KEYFRAME HELPERS ──────────────────────────────────────────

def set_key(arm_obj, quats: dict, frame: int):
    bpy.context.scene.frame_set(frame)
    for name, q in quats.items():
        pb = arm_obj.pose.bones[name]
        pb.rotation_mode       = "QUATERNION"
        pb.rotation_quaternion = q
        pb.keyframe_insert("rotation_quaternion", frame=frame)


# ── DEMO A: SLERP SWEEP (frames 1 … SLERP_STEPS+2) ───────────

def demo_slerp(arm_obj, pose_a, pose_b):
    """Constant-angular-velocity arc from rest to full bend."""
    n = SLERP_STEPS + 2
    for step in range(n):
        t     = step / (n - 1)
        frame = 1 + step
        quats = {name: pose_a[name].slerp(pose_b[name], t)
                 for name in BONE_NAMES}
        set_key(arm_obj, quats, frame)


# ── DEMO B: SQUAD SWEEP (offset by gap) ───────────────────────

def demo_squad(arm_obj, poses):
    """C1 curve through rest → mid → full, no velocity kink."""
    offset = SLERP_STEPS + 4
    n      = len(poses)

    # compute Squad inner tangents for interior poses
    tangents = [None] * n
    for i in range(n):
        if i == 0 or i == n - 1:
            tangents[i] = poses[i]   # endpoint: tangent = pose itself
        else:
            tangents[i] = {
                name: squad_tangent(poses[i-1][name],
                                    poses[i  ][name],
                                    poses[i+1][name])
                for name in BONE_NAMES
            }

    frame = offset
    for seg in range(n - 1):
        for step in range(SQUAD_STEPS):
            t     = step / SQUAD_STEPS
            quats = {
                name: squad(poses[seg][name],     tangents[seg][name],
                            tangents[seg+1][name], poses[seg+1][name], t)
                for name in BONE_NAMES
            }
            set_key(arm_obj, quats, frame)
            frame += 1


# ── DEMO C: LOG-SPACE WEIGHTED BLEND ──────────────────────────

def demo_logspace_blend(arm_obj, rest, mid, full, frame):
    """Three-way weighted blend: 50% rest + 30% mid + 20% full."""
    blended = {}
    for name in BONE_NAMES:
        blended[name] = quat_avg_weighted([
            (rest[name], 0.5),
            (mid [name], 0.3),
            (full[name], 0.2),
        ])
    set_key(arm_obj, blended, frame)


# ── EXPORT ────────────────────────────────────────────────────

def export_all(arm_obj, sc):
    base = os.path.join(bpy.app.tempdir, "quat_retarget")
    os.makedirs(base, exist_ok=True)

    # GLB — baked pose channels
    bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    arm_obj.select_set(True)
    bpy.context.view_layer.objects.active = arm_obj
    bpy.ops.export_scene.gltf(
        filepath                       = os.path.join(base, "quat_retarget_arm.glb"),
        use_selection                  = True,
        export_format                  = "GLB",
        export_animations              = True,
        export_optimize_animation_size = True,
    )

    # Manifest JSON — per-frame quaternion values
    frames_data: dict = {}
    for f in range(sc.frame_start, sc.frame_end + 1):
        sc.frame_set(f)
        fd = {}
        for name in BONE_NAMES:
            q = arm_obj.pose.bones[name].rotation_quaternion
            fd[name] = [round(q.w, 6), round(q.x, 6),
                        round(q.y, 6), round(q.z, 6)]
        frames_data[str(f)] = fd

    manifest = {"bones": BONE_NAMES, "fps": FPS, "frames": frames_data}
    with open(os.path.join(base, "quat_retarget_manifest.json"), "w") as fh:
        json.dump(manifest, fh, indent=2)

    blend_path = os.path.join(base, "quat_retarget.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path)
    print(f"[holoflow] saved → {base}")


# ── MAIN ──────────────────────────────────────────────────────

def main():
    sc              = build_scene()
    arm_obj         = build_armature()
    rest, mid, full = make_poses()

    demo_slerp(arm_obj, rest, full)
    demo_squad(arm_obj, [rest, mid, full])

    blend_frame = sc.frame_end - 1
    demo_logspace_blend(arm_obj, rest, mid, full, blend_frame)

    export_all(arm_obj, sc)
    print("[holoflow] quaternion blueprint complete.")

main()
