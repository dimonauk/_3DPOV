import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>mathutils.Euler(angles, order)</code> wraps three radian angles
        and a three-letter axis-application sequence. That sequence is not
        cosmetic: it determines <em>which</em> angle configuration collapses two
        rotation degrees of freedom into one — gimbal lock. Pick the wrong order
        for a given bone and you will see axis-flip artefacts in animation, or,
        more insidiously, a GLB that plays back correctly in Blender&rsquo;s
        viewport but freezes every animated bone at rest pose in Three.js,
        because the GLTF exporter samples <em>whichever FCurve data path matches
        the declared</em> <code>rotation_mode</code> — and finds nothing there.
      </p>

      <h2>The middle-axis rule</h2>
      <p>
        Every Euler order is written as three letters, e.g.{" "}
        <code>YXZ</code>. The rotations compose right-to-left into a matrix:{" "}
        <code>R = R_Y · R_X · R_Z</code>. The <strong>middle letter</strong>{" "}
        (here <code>X</code>) is always the danger axis: when its angle reaches
        ±90°, the first and third rotation axes become coplanar and one degree of
        freedom is lost permanently for that configuration. This is the only
        place in the chain where gimbal lock can occur; the other two axes are
        safe at any angle.
      </p>
      <pre><code>{`# Middle (gimbal-prone) axis for each Euler order
_MIDDLE = {
    "XYZ": 1,   # Y — hits gimbal at arm raise (Y≈90°)
    "XZY": 2,   # Z
    "YXZ": 0,   # X — Y raise is SAFE; X rarely reaches ±90° in limbs
    "YZX": 2,   # Z
    "ZXY": 0,   # X
    "ZYX": 1,   # Y
}`}</code></pre>
      <p>
        The canonical trap in character animation:{" "}
        <strong>XYZ Euler on an upper-arm bone</strong>. The primary
        motion — raising the arm — is a Y rotation. At Y&nbsp;=&nbsp;90° (arm
        pointing straight up), adding a Z twist does nothing new; it rotates in
        the same plane as X. Switching to <strong>YXZ</strong> moves Y to the
        outer (first) position, making it safe at any angle. The middle axis
        becomes X, which rarely approaches ±90° in normal arm motion.
      </p>

      <h2>Gimbal severity — a measurable signal</h2>
      <p>
        The collapse is not binary: axes gradually lose independence as the
        middle angle approaches ±90°. <code>|sin(middle_angle)|</code> measures
        that loss — it is 0 at 0°, 0.5 at 30°, and 1 at ±90° (fully locked).
        That gives a continuous severity score you can log, warn on, or use to
        trigger an auto-fix:
      </p>
      <pre><code>{`import math, bpy

_MIDDLE = {"XYZ":1,"XZY":2,"YXZ":0,"YZX":2,"ZXY":0,"ZYX":1}

def gimbal_severity(pb: bpy.types.PoseBone) -> float:
    mode = pb.rotation_mode
    if mode in {"QUATERNION", "AXIS_ANGLE"}:
        return 0.0
    return abs(math.sin(pb.rotation_euler[_MIDDLE[mode]]))`}</code></pre>

      <h2>VRM bone assignment strategy</h2>
      <p>
        VRM skeletons contain 50+ bones. The choice of rotation mode per bone
        group should be deliberate:
      </p>
      <pre><code>{`ROTATION_MODES = {
    # Spine and head need full 360° freedom on all axes simultaneously
    "Hips":     "QUATERNION",
    "Spine":    "QUATERNION",
    "Chest":    "QUATERNION",
    "Neck":     "QUATERNION",
    "Head":     "QUATERNION",

    # Upper arm: primary motion is Y (raise/lower); YXZ puts Y at outer position
    "UpperArm": "YXZ",

    # Forearm: hinge joint, nearly single-axis (X); XYZ is fine, Y/Z stay near 0
    "LowerArm": "XYZ",

    # Hand/wrist: main curl is Y; YXZ is the safer choice
    "Hand":     "YXZ",
}`}</code></pre>
      <p>
        Setting <code>pb.rotation_mode</code> in Pose mode changes the active
        channel immediately, but existing keyframes on the old channel remain and
        are no longer read.{" "}
        <strong>Switching mode mid-animation without converting keyframes
        produces a frozen bone</strong> — the action exists but the exporter
        samples the wrong data path.
      </p>

      <h2>Constructing and converting Euler values</h2>
      <pre><code>{`import mathutils, math

# Construction — angles in radians, order is 3-char string
eul = mathutils.Euler((math.radians(45), math.radians(30), 0), "YXZ")

# → Quaternion (lossless, no order dependency)
q = eul.to_quaternion()

# → 3×3 Matrix
m = eul.to_matrix()

# Quaternion back to a DIFFERENT Euler order
eul_xyz = q.to_euler("XYZ")   # equivalent rotation, different decomposition
eul_yxz = q.to_euler("YXZ")

# Round-trip loss is floating-point only (< 1e-7 rad in practice)
delta = sum(abs(eul[i] - eul_yxz[i]) for i in range(3))
print(f"Round-trip loss: {delta:.2e} rad")   # → ~3e-8`}</code></pre>
      <p>
        The round-trip through quaternion is safe: quaternion representation is
        order-independent, so <code>Euler.to_quaternion().to_euler(same_order)</code>{" "}
        recovers the original angles to floating-point precision. The only
        exception is at the gimbal singularity itself — there the decomposition
        is undefined and the round-trip may return any of infinitely many
        equivalent Euler triples.
      </p>

      <h2>Animating the comparison: XYZ gimbal vs YXZ</h2>
      <pre><code>{`bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="POSE")
pb = arm_obj.pose.bones["UpperArm"]

# ── Phase 1: XYZ — demonstrates gimbal ──────────────────────────────────
pb.rotation_mode = "XYZ"

pb.rotation_euler = mathutils.Euler((0, 0, 0), "XYZ")
pb.keyframe_insert("rotation_euler", frame=1)

pb.rotation_euler = mathutils.Euler((0, math.radians(90), 0), "XYZ")
pb.keyframe_insert("rotation_euler", frame=22)
print(f"XYZ severity at Y=90°: {gimbal_severity(pb):.3f}")  # → 1.000

# Adding Z twist here physically does the same as rotating X — collapsed
pb.rotation_euler = mathutils.Euler((0, math.radians(90), math.radians(45)), "XYZ")
pb.keyframe_insert("rotation_euler", frame=45)

# ── Phase 2: YXZ — safe path ─────────────────────────────────────────────
pb.rotation_mode = "YXZ"   # switch; old XYZ fcurves persist but are ignored now

pb.rotation_euler = mathutils.Euler((0, 0, 0), "YXZ")
pb.keyframe_insert("rotation_euler", frame=46)

pb.rotation_euler = mathutils.Euler((0, math.radians(90), 0), "YXZ")
pb.keyframe_insert("rotation_euler", frame=67)
print(f"YXZ severity at Y=90°: {gimbal_severity(pb):.3f}")  # → 0.000 (Y is outer)

pb.rotation_euler = mathutils.Euler(
    (math.radians(15), math.radians(90), math.radians(45)), "YXZ"
)
pb.keyframe_insert("rotation_euler", frame=90)
print(f"YXZ severity with all three axes: {gimbal_severity(pb):.3f}")  # → ~0.259`}</code></pre>

      <h2>Bulk audit across a full VRM skeleton</h2>
      <pre><code>{`def audit_rig(arm_obj):
    rows = [
        (pb.name, pb.rotation_mode, gimbal_severity(pb))
        for pb in arm_obj.pose.bones
    ]
    rows.sort(key=lambda r: r[2], reverse=True)
    print(f"{'Bone':<18} {'Mode':<12} {'Gimbal severity'}")
    print("─" * 46)
    for name, mode, sev in rows:
        warn = " ⚠" if sev > 0.95 else ""
        print(f"  {name:<16} {mode:<12} {sev:.3f}{warn}")`}</code></pre>
      <p>
        Sorting by severity descending means any bones approaching gimbal lock
        surface immediately. Run this at export time and treat any severity{" "}
        <code>&gt; 0.9</code> as a blocking issue for VRM or GLB delivery.
      </p>

      <h2>Export trap: channel mismatch</h2>
      <p>
        The GLTF exporter (KhronosGroup/glTF-Blender-IO, Apache-2.0, bundled in
        Blender 5.1) reads <code>PoseBone.rotation_mode</code> at export time to
        decide which FCurve data path to sample. If the mode is{" "}
        <code>&apos;QUATERNION&apos;</code> but no <code>rotation_quaternion</code>{" "}
        channels exist (because all keyframes were inserted on{" "}
        <code>rotation_euler</code>), the exported GLB contains an empty
        animation track. The bone is frozen at rest in Three.js — no error, no
        warning.
      </p>
      <p>
        Guard against this by always calling{" "}
        <code>pb.keyframe_insert(&quot;rotation_quaternion&quot;)</code> when{" "}
        <code>pb.rotation_mode == &quot;QUATERNION&quot;</code>, and{" "}
        <code>pb.keyframe_insert(&quot;rotation_euler&quot;)</code> when it is
        an Euler order string. Never mix channel types on one bone within a
        single action.
      </p>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Bone animates in Blender but is static in Three.js</strong>:{" "}
        check <code>pb.rotation_mode</code> vs the FCurve data path in the Dope
        Sheet. Mismatched channels are the cause in nearly every case.
      </p>
      <p>
        <strong>Switching rotation mode mid-animation produces a jump</strong>:{" "}
        convert the existing keyframes first. Use the built-in operator{" "}
        <code>bpy.ops.pose.rotation_mode_set(type=&apos;YXZ&apos;)</code> with
        bones selected — it converts existing fcurve channels in place. This is
        only available in an interactive Pose mode context; in headless scripts
        you must rebuild channels manually using{" "}
        <code>Euler.to_quaternion().to_euler(new_order)</code> per frame.
      </p>
      <p>
        <strong>NaN values in FCurve at the gimbal singularity</strong>: the
        decomposition <code>Quaternion.to_euler(order)</code> is numerically
        unstable at exactly ±90° on the middle axis. Avoid keyframing at the
        exact singularity — use 89.9° or switch to quaternion for that bone.
      </p>

      <h2>Further reading in this studio</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-quaternion-slerp-squad-vrm-retarget"
            className={lk}
          >
            mathutils.Quaternion — SLERP, Squad & Log-Space Blending for VRM
            Animation Retarget
          </Link>{" "}
          — the companion piece on the interpolation side of quaternion rotation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm"
            className={lk}
          >
            PoseBone Matrix Chain — World-Space Transform Decomposition & IK
            Bake for VRM
          </Link>{" "}
          — using <code>Matrix.decompose()</code> to extract clean rotation from
          world transforms when you need order-independent bakes.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-keying-set-vrm-auto-key-capture"
            className={lk}
          >
            bpy.types.KeyingSet — Custom VRM Auto-Key Capture Pipeline
          </Link>{" "}
          — ensuring the correct channel (quaternion vs euler) is auto-keyed on
          a per-bone basis.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-fcurve-driver-shape-key-bone-rotation-vrm"
            className={lk}
          >
            FCurve Drivers — Shape Key & Bone Rotation for VRM
          </Link>{" "}
          — driver expressions that read <code>rotation_euler[1]</code> (the Y
          component of an Euler bone) to drive blend shape weights.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/current/mathutils.html#mathutils.Euler"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            mathutils.Euler API reference
          </a>{" "}
          (CC BY 4.0). Related projects:{" "}
          <a href="https://projects.blender.org/blender/blender" className={lk} target="_blank" rel="noopener noreferrer">
            projects.blender.org
          </a>
          ,{" "}
          <a href="https://docs.blender.org/api/current/" className={lk} target="_blank" rel="noopener noreferrer">
            full Python API docs
          </a>
          .
        </li>
        <li>
          Wikipedia contributors —{" "}
          <a
            href="https://en.wikipedia.org/wiki/Euler_angles"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Euler angles
          </a>{" "}
          (CC BY-SA 4.0). Related articles:{" "}
          <a href="https://en.wikipedia.org/wiki/Gimbal_lock" className={lk} target="_blank" rel="noopener noreferrer">
            Gimbal lock
          </a>
          ,{" "}
          <a href="https://en.wikipedia.org/wiki/Tait%E2%80%93Bryan_angles" className={lk} target="_blank" rel="noopener noreferrer">
            Tait&ndash;Bryan angles
          </a>
          ,{" "}
          <a href="https://en.wikipedia.org/wiki/Quaternion" className={lk} target="_blank" rel="noopener noreferrer">
            Quaternion
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-mathutils-euler-rotation-order-gimbal-safe-vrm-webxr",
    title:
      "Python mathutils.Euler — Rotation Order Audit, Gimbal Detection & VRM Rig Mode Assignment for GLB Export (Blender 5.1)",
    blurb:
      "mathutils.Euler(angles, order) determines where gimbal lock can occur. Learn the middle-axis rule, measure gimbal severity per-bone with a sin() test, assign optimal rotation modes across a VRM skeleton (QUATERNION for spine, YXZ for arms), and avoid the silent GLB export trap where a rotation_mode mismatch produces frozen bones in Three.js.",
    Body,
    createdAt: new Date("2026-07-16"),
    tags: [
      "blender",
      "python",
      "scripting",
      "mathutils",
      "euler",
      "quaternion",
      "rotation",
      "vrm",
      "rigging",
      "animation",
      "glb",
      "webxr",
    ],
    difficulty: "intermediate",
  }
);
