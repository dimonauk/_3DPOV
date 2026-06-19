import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function StretchyIkBody() {
  return (
    <>
      <p>
        Blender&apos;s IK solver can extend a bone chain beyond its natural
        reach by scaling each participating bone along its local Y axis — the
        along-bone direction. The feature is controlled by two independent
        knobs: <code>IKConstraint.use_stretch</code> (the master switch) and{" "}
        <code>PoseBone.ik_stretch</code> (a per-bone weight ∈ [0, 1] that
        limits how much of the required stretch each bone contributes). Without
        any further setup, the skin deforms like a rubber tube: as Y grows past
        1.0 the mesh thins, which reads as physically wrong and looks
        unpleasant in cartoon rigs. Compare the rigid approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          IK robot arm tutorial
        </Link>
        , where ik_stretch is intentionally left at 0.0 to preserve mechanical
        proportions.
      </p>

      <p>
        The correction is a pair of scripted drivers on the X and Z pose-bone
        scales of every stretchy deform bone. The expression{" "}
        <code>Y&nbsp;^&nbsp;(&#x2212;0.5)</code> is derived from conservation
        of volume: if X·Y·Z = 1 and X = Z (isotropic in cross-section) then
        X = Z = Y<sup>&#x2212;½</sup>. When Y doubles (the bone stretches to
        twice its rest length) X and Z shrink to ≈ 0.707 — so the cross-section
        area halves while the length doubles, keeping volume constant. A custom
        property <code>volume_preserve</code> ∈ [0, 1] blends the driver
        smoothly between pure thinning (0.0) and full volume compensation
        (1.0), giving animators stylistic control at the object level rather
        than in the node tree. This blend pattern is the same philosophy used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
          className={lk}
        >
          corrective shape keys + driver tutorial
        </Link>
        , where a custom property similarly gates the correction at the rig
        level.
      </p>

      <p>
        GLB export requires one non-obvious flag:{" "}
        <code>export_force_sampling=True</code> in the glTF exporter. Without
        it, Blender exports only explicitly keyed channels — but the X and Z
        scales are driven, not keyed, so they would be missing from the glTF
        animation tracks. Force sampling evaluates the full depsgraph every
        frame and writes TRS data for all animated transforms, including driven
        ones. Three.js and the WebXR runtime read bone scale from those tracks
        directly — no custom shader is needed at runtime. This export nuance
        also applies when baking the deformation envelope described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
          className={lk}
        >
          weight paint VRM deformation envelope tutorial
        </Link>
        . For the cartoon spine equivalent of this squash-stretch technique,
        see the B-Bone approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-bbone-cartoon-spine-vrm"
          className={lk}
        >
          B-Bones cartoon spine tutorial
        </Link>
        , which achieves similar elastic deformation purely through the B-Bone
        curvature system rather than scale drivers — a useful comparison for
        choosing between the two workflows.
      </p>

      <p>
        <strong>Outside sources:</strong>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.BoneIKConstraint.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Python API — BoneIKConstraint
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) — documents{" "}
        <code>ik_stretch</code>, <code>use_stretch</code>, and{" "}
        <code>chain_count</code> with their exact type signatures; related
        projects include projects.blender.org (Blender source) and
        developer.blender.org (design documents for the IK refactor in 4.x).{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Inverse Kinematics: Introduction
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) — covers the IK goal,
        pole targets, chain length, and the stretch/stiffness model; the
        related manual page on iTaSC explains the alternative full-body IK
        solver that also honours ik_stretch.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm",
  title:
    "Rigging — Stretchy IK + Volume Preservation: Elastic Limbs for VRM Characters (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Enable ik_stretch on an IK chain then add scripted drivers — X = Z = Y^(-0.5) — so bones stay plump as they extend beyond their natural reach. Covers the per-bone ik_stretch weight, conservation-of-volume derivation, custom property blend control, and the export_force_sampling flag required to bake driver values into glTF TRS animation tracks.",
  Body: StretchyIkBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed.",
      "Basic familiarity with Pose Mode and adding constraints — see the FK/IK switch tutorial for a primer on IK constraint setup.",
      "Basic Python in Blender — understanding how to open the Script editor and run a script.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "ik_stretch and scripted drivers work in all Blender 2.8+ releases. The glTF exporter flag export_force_sampling is available since Blender 3.6.",
      },
    ],
    steps: [
      {
        title: "Understand why IK stretch thins the mesh",
        body:
          "# Blender's IK solver modifies PoseBone.scale[1] (the local Y axis,\n# along the bone) when ik_stretch > 0 and the target is out of reach.\n# The deform bones that drive the skin inherit this Y scale.\n# Without correction:\n#   Y = 2  →  mesh is twice as long\n#   X = Z = 1  →  mesh has the same cross-section width\n#   visual result: a thinning tube  (volume has doubled, not been preserved)\n#\n# The fix: drive X and Z from Y with the inverse-square-root relationship.\n# Derivation:\n#   volume = X * Y * Z = constant = 1 (normalised rest-pose)\n#   assume X = Z  (isotropic cross-section)\n#   X^2 * Y = 1  →  X = Y ^ (-0.5)\n#\n# So the driver expression is simply:  max(yscale, 0.001) ** -0.5\n# The max() guards against divide-by-zero if the bone collapses to zero length.\n#\n# Optional blend:\n#   (1 - vp) + vp * yscale**-0.5\n# where vp = volume_preserve custom property ∈ [0, 1].\n# At vp=0 → scale stays at 1.0 (pure thinning).\n# At vp=1 → full volume compensation.",
      },
      {
        title: "Build the 3-bone arm armature",
        body:
          'import bpy\nfrom mathutils import Vector\n\nUPPER_LEN = 0.35; FORE_LEN = 0.30; HAND_LEN = 0.07\n\nbpy.ops.object.select_all(action="SELECT")\nbpy.ops.object.delete(use_global=False)\n\narm_data = bpy.data.armatures.new("ElasticArm")\narm_obj  = bpy.data.objects.new("ElasticArm", arm_data)\nbpy.context.collection.objects.link(arm_obj)\nbpy.context.view_layer.objects.active = arm_obj\nbpy.ops.object.mode_set(mode="EDIT")\neb = arm_data.edit_bones\n\ndef add_bone(name, head, tail, parent=None, connected=False, deform=True):\n    b = eb.new(name)\n    b.head, b.tail = Vector(head), Vector(tail)\n    b.use_deform = deform\n    if parent:\n        b.parent = eb[parent]; b.use_connect = connected\n    return b\n\nadd_bone("upper_arm.DEF", (0,0,0), (0,0,UPPER_LEN))\nadd_bone("forearm.DEF", (0,0,UPPER_LEN), (0,0,UPPER_LEN+FORE_LEN),\n         parent="upper_arm.DEF", connected=True)\nadd_bone("hand.DEF", (0,0,UPPER_LEN+FORE_LEN),\n         (0,0,UPPER_LEN+FORE_LEN+HAND_LEN),\n         parent="forearm.DEF", connected=True)\n\n# IK control — not a deform bone, no parent so it can move freely\nIK_HEAD = (0.04, 0, UPPER_LEN + FORE_LEN)\nadd_bone("hand.IK", IK_HEAD,\n         (IK_HEAD[0], IK_HEAD[1], IK_HEAD[2]+HAND_LEN), deform=False)\n\nbpy.ops.object.mode_set(mode="POSE")\nprint("Bones created:", [b.name for b in arm_data.bones])',
      },
      {
        title: "Add the IK constraint and enable per-bone stretch",
        body:
          '# The IK constraint goes on the LAST bone in the chain (forearm.DEF).\n# chain_count = 2 means the solver will consider forearm → upper_arm.\n# use_stretch = True is the MASTER switch — without it ik_stretch is ignored.\n# ik_stretch is the per-bone weight: 0=rigid, 1=stretches as much as needed.\n\npb = arm_obj.pose.bones\n\nik_con             = pb["forearm.DEF"].constraints.new("IK")\nik_con.target      = arm_obj\nik_con.subtarget   = "hand.IK"   # the IK target bone\nik_con.chain_count = 2\nik_con.use_stretch = True        # master switch — MUST be True\n\n# Per-bone weights.  0.8 means each bone contributes up to 80% of required\n# stretch.  If both bones have 0.8 and they can together reach the target,\n# the upper bone takes more and the forearm takes less — the solver splits\n# the load proportionally.\npb["upper_arm.DEF"].ik_stretch = 0.8\npb["forearm.DEF"].ik_stretch   = 0.8\n\nprint("IK constraint applied.  Move hand.IK bone above z =", UPPER_LEN+FORE_LEN,\n      "to see stretch.")',
      },
      {
        title: "Add the volume_preserve custom property",
        body:
          '# Custom properties on the armature object appear in\n# Properties → Object → Custom Properties.\n# The id_properties_ui call adds soft limits and a tooltip.\n\narm_obj["volume_preserve"] = 1.0   # start with full compensation enabled\nui = arm_obj.id_properties_ui("volume_preserve")\nui.update(\n    min=0.0, max=1.0,\n    description="Blend 0=tube-thinning → 1=volume-conserving stretch",\n)\n\n# VERIFY in the Properties panel:\n# Select the armature object, Object Properties → Custom Properties\n# → "volume_preserve" slider should appear.',
      },
      {
        title: "Wire the volume-preservation drivers",
        body:
          '# For EACH of the two stretchy deform bones, drive both the X scale\n# (axis index 0) and the Z scale (axis index 2) using the same formula.\n# Y scale (axis 1) is what the IK solver writes — we read it as a variable.\n\ndef add_volume_driver(obj, bone_name, axis):\n    """Adds a scripted driver to pose_bone.scale[axis]."""\n    fc  = obj.driver_add(f\'pose.bones["{bone_name}"].scale\', axis)\n    drv = fc.driver\n    drv.type = "SCRIPTED"\n\n    # Variable: the bone\'s own Y scale (IK solver writes this)\n    v_y = drv.variables.new()\n    v_y.name            = "yscale"\n    v_y.type            = "SINGLE_PROP"\n    v_y.targets[0].id        = obj\n    v_y.targets[0].data_path = f\'pose.bones["{bone_name}"].scale[1]\'\n\n    # Variable: the volume_preserve custom property (blend control)\n    v_vp = drv.variables.new()\n    v_vp.name            = "vp"\n    v_vp.type            = "SINGLE_PROP"\n    v_vp.targets[0].id        = obj\n    v_vp.targets[0].data_path = \'["volume_preserve"]\'\n\n    # The expression:\n    #   vp=1 → full compensation: yscale^-0.5\n    #   vp=0 → no correction: constant 1.0\n    #   max() prevents ZeroDivisionError if yscale collapses to 0\n    drv.expression = "(1-vp) + vp * max(yscale, 0.001)**-0.5"\n    return fc\n\nfor bone_name in ("upper_arm.DEF", "forearm.DEF"):\n    add_volume_driver(arm_obj, bone_name, 0)   # X\n    add_volume_driver(arm_obj, bone_name, 2)   # Z\n\n# VERIFY: in the Graph Editor switch to Drivers mode.\n# You should see 4 driver curves: upper_arm X, upper_arm Z, forearm X, forearm Z.',
      },
      {
        title: "Attach a skin mesh and test the stretch",
        body:
          '# A simple cylinder is enough to see the volume effect.\n# Parent it to the armature with Armature Deform → Automatic Weights.\n\nbpy.ops.object.mode_set(mode="OBJECT")\nbpy.ops.mesh.primitive_cylinder_add(\n    radius=0.04,\n    depth=UPPER_LEN + FORE_LEN,\n    location=(0, 0, (UPPER_LEN + FORE_LEN) / 2),\n)\ncyl = bpy.context.active_object; cyl.name = "arm_mesh"\n\nbpy.ops.object.select_all(action="DESELECT")\ncyl.select_set(True); arm_obj.select_set(True)\nbpy.context.view_layer.objects.active = arm_obj\nbpy.ops.object.parent_set(type="ARMATURE_AUTO")\n\n# Test in Pose Mode:\n# 1. Select the armature, switch to Pose Mode.\n# 2. Select hand.IK, press G Z 0.25 Enter — move target above reach.\n# 3. The cylinder elongates.  With volume_preserve=1 it should NOT thin.\n# 4. In Object Properties set volume_preserve=0.  The cylinder now thins.\n# 5. Restore to 1.0.',
      },
      {
        title: "Add keyframe animation and export as GLB",
        body:
          '# Key the IK target: rest → stretch → rest over 60 frames.\n# Then export with export_force_sampling=True — this bakes all drivers\n# (X and Z scales) into per-frame keyframes so the glTF animation tracks\n# contain the actual values, not driver references (which glTF cannot express).\n\nbpy.context.view_layer.objects.active = arm_obj\nbpy.ops.object.mode_set(mode="POSE")\nsc = bpy.context.scene\nsc.frame_start = 1; sc.frame_end = 60\npb = arm_obj.pose.bones\nREACH = UPPER_LEN + FORE_LEN\n\nfor frame, dz in ((1, 0.0), (30, REACH * 0.28), (60, 0.0)):\n    sc.frame_set(frame)\n    pb["hand.IK"].location = (0, 0, dz)\n    pb["hand.IK"].keyframe_insert("location", frame=frame)\n\n# GLB export\nbpy.ops.object.mode_set(mode="OBJECT")\nbpy.ops.object.select_all(action="DESELECT")\narm_obj.select_set(True); cyl.select_set(True)\nbpy.context.view_layer.objects.active = arm_obj\n\nbpy.ops.export_scene.gltf(\n    filepath="//stretchy_ik_vrm.glb",\n    use_selection=True,\n    export_format="GLB",\n    export_apply=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format="WEBP",\n    export_yup=True,\n    export_skins=True,\n    export_animations=True,\n    export_force_sampling=True,   # CRITICAL: bakes drivers into TRS keyframes\n    export_bake_animation=True,\n)\nprint("Exported → stretchy_ik_vrm.glb")',
      },
    ],
  },
  base,
);
