import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Three distinct matrix properties on a pose bone are easy to conflate,
        and mixing them up produces poses that drift, flip, or silently export
        wrong transforms to GLB. <code>pose_bone.matrix_basis</code> is the
        local delta from the rest pose, expressed in the parent bone&rsquo;s
        current pose space — this is the{" "}
        <em>input</em> you write to drive the pose, and it lives upstream of
        all constraints.{" "}
        <code>pose_bone.matrix_channel</code> is the post-constraint evaluated
        result in armature space — the value Blender has computed after
        applying every bone constraint, driver, and IK solver.{" "}
        <code>pose_bone.matrix</code> is effectively an alias for{" "}
        <code>matrix_channel</code> in read contexts, but in{" "}
        <em>write</em> contexts (Blender 4.x/5.x) it triggers a back-solve:
        Blender computes the required <code>matrix_basis</code> from the
        parent chain so the evaluated armature-space matrix matches what you
        assigned. The rest-pose reference — how far each bone deviates from its
        bind pose — lives in <code>bone.matrix_local</code>, which is static
        and only changes in Edit Mode. The relationship this tutorial&rsquo;s{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain"
          className={lk}
        >
          EditBone chain tutorial
        </Link>{" "}
        establishes the rest pose for: every{" "}
        <code>bone.matrix_local</code> you read during a pose retarget
        encodes the armature-space transform laid down in that Edit Mode
        session.
      </p>

      <p>
        The single most common bug when scripting multi-bone poses is reading a
        child bone&rsquo;s matrix immediately after writing the parent, without
        calling <code>bpy.context.view_layer.update()</code> between them.
        Blender&rsquo;s dependency graph evaluates bone transforms lazily: the
        child&rsquo;s <code>matrix_channel</code> still holds the value from
        the previous evaluation pass until the graph is explicitly flushed.
        Every frame of the figure-8 IK loop in this blueprint writes UpperArm,
        calls <code>view_layer.update()</code>, then writes Forearm. Skip the
        update and the Forearm rotates as though the UpperArm hadn&rsquo;t
        moved — the visible symptom is a forearm that swings in a fixed arc
        rather than staying connected to the elbow. The same discipline applies
        to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-pose-bone-constraint-management-export-bake"
          className={lk}
        >
          constraint management pipeline
        </Link>
        : after adding or removing a bone constraint you must flush the graph
        before reading any constrained bone&rsquo;s matrix, otherwise the
        influence of the new constraint isn&rsquo;t reflected.
      </p>

      <p>
        The IK solver here is purely mathematical: no Blender IK constraint is
        added. Given two bone lengths <em>l₁</em> and <em>l₂</em> and a
        target position at distance <em>d</em>, the law of cosines gives the
        interior angle at the elbow:{" "}
        <code>cos(C) = (l₁² + l₂² − d²) / (2·l₁·l₂)</code>. The forearm
        local rotation is then <code>bend = π − C</code> (zero when extended,
        π when fully folded). The law of sines gives the angle B by which the
        upper arm deviates from the straight shoulder-to-target direction:{" "}
        <code>sin(B) = l₂·sin(C) / d</code>. Adding B to the{" "}
        <code>atan2(diff.z, diff.x)</code> direct angle gives the upper arm&rsquo;s
        world orientation (elbow-up convention). This analytical path avoids the
        operator-context dependency that makes{" "}
        <code>bpy.ops.pose.ik_add()</code> unreliable in headless scripts. The
        alternative Blender-constraint approach — applying an IK constraint and
        baking it to keyframes — is demonstrated in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          NLA IK bake tutorial
        </Link>
        , where <code>bpy.ops.nla.bake()</code> reads constraint outputs frame
        by frame and inserts them as explicit keyframes.
      </p>

      <p>
        World-space matrix decomposition uses{" "}
        <code>Matrix4x4.decompose()</code>, which returns a{" "}
        <code>(Vector, Quaternion, Vector)</code> triple. Calling the three
        separate methods — <code>to_translation()</code>,{" "}
        <code>to_quaternion()</code>, <code>to_scale()</code> — on a matrix
        with non-uniform scale produces inconsistent results: each method
        independently extracts its component while ignoring the others, so the
        rotation extracted after a non-uniform scale is not the rotation you
        would get from a proper polar decomposition.{" "}
        <code>decompose()</code> performs the decomposition coherently in a
        single pass. For VRM export the bone scale must be 1 (VRM 1.0 forbids
        non-uniform bone scale on the humanoid skeleton), but the habit of
        using <code>decompose()</code> instead of separate extractors is still
        worth building: it is safe under all conditions, whereas the separate
        calls silently give wrong quaternions on scaled bones — a failure mode
        that surfaces only when the mesh is deformed by the rig. The driver
        pipeline from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-driver-shape-key-bone-rotation-vrm"
          className={lk}
        >
          FCurve driver shape-key tutorial
        </Link>{" "}
        shows a companion pattern: reading <code>pose_bone.rotation_quaternion</code>{" "}
        as a driver variable to map bone rotation to a shape key, which is the
        shape side of the same bone–mesh coupling this tutorial addresses on
        the transform side.
      </p>

      <p>
        For GLB export, the critical step is detaching the active action
        slot and keeping the keyframes inside an NLA strip. Blender&rsquo;s
        GLTF exporter reads animations from NLA strips when{" "}
        <code>export_animations=True</code>; if the action is left in the
        active slot only (not in an NLA strip), some exporter versions skip
        it or export it as an unnamed clip. The NLA strip&rsquo;s name becomes
        the <code>animation.name</code> in the GLTF file — Three.js and
        Babylon.js both surface this name in their animation mixer, so naming
        it descriptively (here <code>&ldquo;IK_Baked&rdquo;</code>) keeps the
        WebXR runtime code readable. The broader NLA clip authoring workflow —
        multiple strips, blending weights, strip hold-last-frame — is covered
        in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-track-strip-action-library-vrm-pose-blend"
          className={lk}
        >
          NLA Action Library VRM Pose Blend tutorial
        </Link>
        . The Blender Foundation&rsquo;s{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.PoseBone.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bpy.types.PoseBone API reference
        </a>{" "}
        (CC-BY-4.0) documents every matrix property used here. The{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          VRM specification (MIT, vrm-c)
        </a>{" "}
        defines the humanoid bone naming convention that determines which bones
        in a VRM rig must be present and which matrix orientations they must
        adopt at rest — understanding that contract is what makes the matrix
        maths here transferable to a production VRM character rather than a toy
        arm.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm",
  title:
    "Python PoseBone Matrix Chain — World-Space Transform Decomposition & IK Bake for VRM",
  lede: "Master pose_bone.matrix vs matrix_basis vs bone.matrix_local, solve a figure-8 two-bone IK analytically with the law of cosines, bake to keyframes, and export a clean GLB for WebXR.",
  date: "2026-07-06",
  author: "Holoflow Studio",
  tags: [
    "blender",
    "python",
    "bpy",
    "posebone",
    "matrix",
    "ik",
    "animation",
    "vrm",
    "webxr",
    "scripting",
    "mathutils",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-posebone-matrix-world-space-ik-bake-vrm",
    time: "forty minutes",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable in the Scripting workspace; understands bpy.ops vs bpy.data",
      "Basic armature anatomy: EditBone, PoseBone, rest pose vs posed transform",
      "Has read the NLA Bake IK/FK tutorial or understands the action-to-NLA-strip flow",
    ],
    steps: [
      {
        title:
          "Understand the three pose-bone matrix properties and when each applies",
        body: "pose_bone.matrix_basis\n  — Local delta from rest, in PARENT-BONE pose space.\n  — This is your input: set it (or set rotation_quaternion / location / scale\n    and Blender computes matrix_basis from them) to drive the pose.\n  — Upstream of ALL constraints; they cannot read it back.\n\npose_bone.matrix_channel\n  — Post-constraint armature-space matrix.  Read-only.\n  — The evaluated result after all bone constraints, IK, and drivers.\n\npose_bone.matrix\n  — Alias for matrix_channel in READ contexts.\n  — WRITABLE in Blender 4.x/5.x: Blender back-solves matrix_basis from\n    the parent chain to make the evaluated matrix match what you assigned.\n  — Use this for world-targeted operations (e.g. retargeting from another rig).\n\nbone.matrix_local\n  — Rest-pose matrix in ARMATURE space (static; changes only in Edit Mode).\n  — Essential for understanding how matrix_basis is interpreted:\n    final_arma_space = parent_matrix_channel @ bone.matrix_local @ matrix_basis\n\nWorld-space bone head:\n  world_pos = arm_obj.matrix_world @ pose_bone.head\n    # pose_bone.head is armature-local; matrix_world transforms to world space.\n\nWorld-space full bone transform (head + orientation):\n  world_mat = arm_obj.matrix_world @ pose_bone.matrix\n\nTROUBLESHOOTING:\n  'matrix_basis assignment has no effect':\n    You may be in a mode that doesn't support pose (not POSE mode or Object mode).\n    Or the bone has a constraint with full_override; the constraint wins.\n  'pose_bone.matrix gives wrong values after parent write':\n    You forgot to call bpy.context.view_layer.update() after the parent bone write.",
      },
      {
        title:
          "Build a 3-bone FK arm in Edit Mode — Shoulder stub → UpperArm → Forearm",
        body: "import bpy, mathutils\n\nbpy.ops.object.armature_add(location=(0, 0, 0))\narm_obj = bpy.context.active_object\n\nbpy.ops.object.mode_set(mode='EDIT')\neb = arm_obj.data.edit_bones\n\n# Shoulder: short stub so UpperArm has a connected parent.\nshoulder      = eb[0]           # armature_add provides one default bone\nshoulder.name = 'Shoulder'\nshoulder.head  = mathutils.Vector((0, 0, 0))\nshoulder.tail  = mathutils.Vector((0.12, 0, 0))\n\nupper             = eb.new('UpperArm')\nupper.head        = mathutils.Vector((0.12, 0, 0))\nupper.tail        = mathutils.Vector((0.62, 0, 0))   # 0.50 m bone\nupper.parent      = shoulder\nupper.use_connect = True   # head snaps to parent tail — no position gap in chain\n\nfore             = eb.new('Forearm')\nfore.head        = upper.tail.copy()\nfore.tail        = fore.head + mathutils.Vector((0.45, 0, 0))\nfore.parent      = upper\nfore.use_connect = True\n\nbpy.ops.object.mode_set(mode='POSE')\n# QUATERNION mode avoids gimbal lock and maps directly to GLTF sampler type.\nfor pb in arm_obj.pose.bones:\n    pb.rotation_mode = 'QUATERNION'\n\n# WHY use_connect = True:\n#   Connected bones share a vertex between parent tail and child head;\n#   there is no translational degree of freedom at the joint, which matches\n#   how VRM humanoid bones work (no IK translation, only rotation at joints).\n#   Non-connected bones can translate; appropriate only for root/floating bones.",
      },
      {
        title:
          "Solve two-bone IK analytically — law of cosines, law of sines, atan2",
        body: "import math\n\ndef solve_two_bone_ik(origin, target, l1, l2):\n    \"\"\"\n    origin — UpperArm head (world Vector)\n    target — desired Forearm tip (world Vector)\n    l1     — upper arm length; l2 — forearm length\n    Returns (shoulder_global_angle, bend_angle) in radians.\n    \"\"\"\n    diff = target - origin\n    d    = diff.length\n    d    = max(0.001, min(d, l1 + l2 - 0.001))  # clamp to reachable range\n\n    # Law of cosines: angle C at elbow.\n    # C = π when arm is straight (d = l1+l2); C = 0 when folded.\n    cos_C = (l1*l1 + l2*l2 - d*d) / (2 * l1 * l2)\n    cos_C  = max(-1.0, min(1.0, cos_C))\n    angle_C = math.acos(cos_C)\n\n    # bend = local rotation for Forearm: 0 when straight, π when folded.\n    bend = math.pi - angle_C\n\n    # Law of sines: angle B at shoulder, between upper arm and shoulder→target.\n    # sin(B) / l2 = sin(C) / d\n    sin_B   = l2 * math.sin(angle_C) / d\n    sin_B   = max(-1.0, min(1.0, sin_B))\n    angle_B = math.asin(sin_B)   # positive → elbow tilts toward +Z\n\n    # Global angle of upper arm = direct angle to target + elbow-up bias.\n    shoulder_global = math.atan2(diff.z, diff.x) + angle_B\n    return shoulder_global, bend\n\n# WHY analytical and not bpy.ops.pose.ik_add():\n#   Operators are UI-context dependent; in headless scripts or background\n#   renders they often fail with 'context override required'.\n#   An analytical solver has no context dependency and can evaluate 1000\n#   frames without touching the operator stack.\n#\n# FAILURE MODES:\n#   'arm undershoots target': check sign conventions; ensure diff.z is\n#     in the IK plane and not zeroed out by a wrong origin subtraction.\n#   'elbow flips at near-extended pose': cos_C approaches ±1, causing\n#     acos to become numerically unstable.  The clamp on d prevents this\n#     for all targets within 99.9% of full extension.",
      },
      {
        title:
          "Write pose_bone.rotation_quaternion and call view_layer.update() after each bone",
        body: "def apply_pose(arm_obj, shoulder_global, bend):\n    # UpperArm: rotate around -Y to tilt tip toward +Z.\n    arm_obj.pose.bones['UpperArm'].rotation_quaternion = (\n        mathutils.Euler((0, -shoulder_global, 0), 'XYZ').to_quaternion()\n    )\n    # CRITICAL: flush the dependency graph before writing Forearm.\n    # Without this, Forearm's matrix_channel still reflects the old UpperArm pose.\n    bpy.context.view_layer.update()\n\n    # Forearm: bend relative to UpperArm local frame.\n    arm_obj.pose.bones['Forearm'].rotation_quaternion = (\n        mathutils.Euler((0, -bend, 0), 'XYZ').to_quaternion()\n    )\n    bpy.context.view_layer.update()\n\n# WHY rotation_quaternion over matrix_basis directly:\n#   Writing matrix_basis requires you to account for bone.matrix_local (the rest\n#   transform), making the code fragile to rest-pose changes.  Writing\n#   rotation_quaternion lets Blender handle the rest-pose factoring internally.\n#   Equivalent operations:\n#     pb.rotation_quaternion = q      (high-level: clean)\n#     pb.matrix_basis = q.to_matrix().to_4x4()  (low-level: correct for axis-aligned rest)\n#     pb.matrix = target_arma_mat     (world-retarget: Blender back-solves basis)\n#   All three REQUIRE view_layer.update() afterwards for child bones to see the change.\n#\n# TROUBLESHOOTING:\n#   Forearm orbits fixed point instead of following elbow:\n#     Missing view_layer.update() between UpperArm and Forearm writes.\n#   Shoulder rotates to wrong angle:\n#     Check that diff.z uses Z for 'height' and diff.x for 'horizontal';\n#     Blender is Z-up, so atan2(diff.z, diff.x) is in the XZ plane.",
      },
      {
        title:
          "Frame loop — IK solve, keyframe_insert, push action to NLA strip",
        body: "FRAME_START, FRAME_END = 1, 48\nscene = bpy.context.scene\nscene.frame_start = FRAME_START\nscene.frame_end   = FRAME_END\n\narm_obj.animation_data_create()\naction = bpy.data.actions.new('ArmIKBaked')\narm_obj.animation_data.action = action\n\nbpy.context.view_layer.update()\nua_head = arm_obj.pose.bones['UpperArm'].head   # armature-local Vector\norigin_world = arm_obj.matrix_world @ ua_head    # world Vector\n\nfor frame in range(FRAME_START, FRAME_END + 1):\n    scene.frame_set(frame)\n    t  = (frame - FRAME_START) / max(1, FRAME_END - FRAME_START)\n    # Figure-8 Lissajous: X = cos(2π·t), Z = sin(4π·t)\n    tx = origin_world.x + 0.55 * math.cos(2 * math.pi * t)\n    tz = 0.60           + 0.35 * math.sin(4 * math.pi * t)\n    target = mathutils.Vector((tx, origin_world.y, tz))\n\n    sg, bend = solve_two_bone_ik(origin_world, target, 0.50, 0.45)\n    apply_pose(arm_obj, sg, bend)\n\n    arm_obj.pose.bones['UpperArm'].keyframe_insert(\n        data_path='rotation_quaternion', frame=frame)\n    arm_obj.pose.bones['Forearm'].keyframe_insert(\n        data_path='rotation_quaternion', frame=frame)\n\n# Push to NLA so GLB exporter names the animation clip.\ntracks = arm_obj.animation_data.nla_tracks\ntrack  = tracks.new()\ntrack.name = 'IK_Baked'\nstrip  = track.strips.new('ArmIKBaked', FRAME_START, action)\nstrip.action_frame_start = FRAME_START\nstrip.action_frame_end   = FRAME_END\narm_obj.animation_data.action = None   # detach active slot; NLA drives now\n\n# WHY detach the active action:\n#   GLB export reads NLA strips.  If an action is ALSO in the active slot,\n#   some exporter versions duplicate it or produce two clips.  Detaching\n#   makes the NLA the sole source of animation data.",
      },
      {
        title:
          "Decompose world-space bone matrix — decompose() vs separate to_* calls",
        body: "def world_mat_decomposed(arm_obj, bone_name):\n    pb        = arm_obj.pose.bones[bone_name]\n    arm_mat   = pb.matrix                        # armature-local 4×4\n    world_mat = arm_obj.matrix_world @ arm_mat   # world-space 4×4\n    return world_mat.decompose()                 # (Vector, Quaternion, Vector)\n\nbpy.context.scene.frame_set(24)\nbpy.context.view_layer.update()\nfor bn in ('Shoulder', 'UpperArm', 'Forearm'):\n    loc, rot, scl = world_mat_decomposed(arm_obj, bn)\n    print(f'{bn}: loc=({loc.x:.3f},{loc.y:.3f},{loc.z:.3f})')\n\n# WHY decompose() over mat.to_translation() + mat.to_quaternion() + mat.to_scale():\n#   For a matrix with non-uniform scale (scl.x ≠ scl.y ≠ scl.z), the three\n#   separate extractors produce an inconsistent triple: to_quaternion() sees\n#   residual shear from the scale, giving a rotation that doesn't compose back\n#   to the original matrix.  decompose() uses a single polar decomposition so\n#   loc, rot, scl are mutually consistent.\n#\n# VRM NOTE:\n#   VRM 1.0 humanoid bones must have uniform scale at the rig root.  If\n#   arm_obj.scale is not (1,1,1), call bpy.ops.object.transform_apply(scale=True)\n#   before export so arm_obj.matrix_world == its rotation matrix only.\n#   Failing to apply scale causes exported bone lengths to be wrong in Three.js.\n#\n# Retarget pattern (copy world pose from one rig to another):\n#   src_world = src_arm.matrix_world @ src_arm.pose.bones['Hips'].matrix\n#   tgt_arm.pose.bones['Hips'].matrix = tgt_arm.matrix_world.inverted() @ src_world\n#   bpy.context.view_layer.update()",
      },
      {
        title: "Export GLB — baked keyframes, NLA strip, Draco compression",
        body: "bpy.ops.export_scene.gltf(\n    filepath                             = bpy.path.abspath('//pose_arm_baked.glb'),\n    export_format                        = 'GLB',\n    use_selection                        = False,\n    export_animations                    = True,\n    export_bake_animation                = False,  # keyframes already explicit\n    export_draco_mesh_compression_enable = True,\n    export_draco_mesh_compression_level  = 6,\n)\n\n# export_bake_animation = True would re-bake every frame even for pre-baked data;\n# set False to avoid double-bake overhead and potential floating-point drift.\n#\n# Three.js WebXR consumption:\n#   const mixer = new THREE.AnimationMixer(gltf.scene);\n#   const clip  = gltf.animations.find(a => a.name === 'IK_Baked');\n#   mixer.clipAction(clip).play();\n#   // NLA strip name → animation.name in GLTF JSON.\n#\n# TROUBLESHOOTING:\n#   'No animations in exported GLB':\n#     Check that arm_obj.animation_data.nla_tracks has at least one strip\n#     with action_frame_start < action_frame_end.\n#   'Animation plays for 0 frames in Three.js':\n#     Verify strip.action_frame_start and strip.action_frame_end are set;\n#     the exporter uses these to determine the clip duration.\n#   'Bone positions wrong in viewer but correct in Blender':\n#     Apply object transforms (rotation, scale) before export.\n#     bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)",
      },
    ],
  },
  base
);
