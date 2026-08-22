import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ArmatureIkRobotArmBody() {
  return (
    <>
      <p>
        Inverse Kinematics inverts the usual forward-kinematics chain: instead
        of rotating each bone in sequence from the shoulder to the wrist, you
        place a target object at the goal position and let the IK solver compute
        all intermediate angles automatically. Blender&apos;s built-in solver is
        CCD (Cyclic Coordinate Descent) — an iterative method that converges
        fast for two-joint chains and is the correct choice for the robot-arm
        case here. CCD is configured via the{" "}
        <code>INVERSE_KINEMATICS</code> bone constraint added to the tip bone in
        Pose mode. Compare this with the spring-bone system explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones tutorial
        </Link>
        , which encodes physics metadata rather than driving pose transforms.
      </p>

      <h2>chain_count: how far up the chain the solver reaches</h2>
      <p>
        The IK constraint&apos;s <code>chain_count</code> property controls how
        many bones the solver may rotate. <code>chain_count=1</code> rotates
        only the bone carrying the constraint — a ball-and-socket wrist, not a
        full arm. <code>chain_count=2</code> reaches the constrained bone
        (lower_arm) and its parent (upper_arm), producing a classic two-joint
        elbow rig. <code>chain_count=0</code> propagates all the way to the
        chain root, which is useful for full-body IK but expensive on long
        skeletons and produces less predictable results. This tutorial uses{" "}
        <code>chain_count=2</code> — the most legible configuration for
        understanding how the solver works. The Python assignment is simply:
      </p>
      <pre>{`pbone = arm_obj.pose.bones["lower_arm"]
ik             = pbone.constraints.new('INVERSE_KINEMATICS')
ik.target      = ik_target_obj
ik.chain_count = 2`}</pre>
      <p>
        The solver evaluates in Pose mode and updates every time the target
        moves — there is no explicit &ldquo;bake&rdquo; step required for
        real-time interaction. Baking is only needed if you want to export the
        solved curves to NLA strips, which is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA action clips tutorial
        </Link>
        .
      </p>

      <h2>The pole target: collapsing the elbow&apos;s infinite solutions</h2>
      <p>
        A two-bone IK chain has a degenerate degree of freedom: the elbow can
        orbit on a full cone around the axis between the shoulder and the wrist
        target, and every point on that cone is a valid solution. Without a pole
        target, the solver picks whichever direction it happened to start from,
        which flips unpredictably as the target crosses certain positions. The
        pole target is a second empty that locks elbow direction:
      </p>
      <pre>{`ik.pole_target = ik_pole_obj
ik.pole_angle  = math.radians(-90)`}</pre>
      <p>
        The <code>pole_angle</code> adjusts the relationship between the bone&apos;s
        local X axis and the pole vector. With zero-roll bones (as built by this
        blueprint), −90° is the correct offset to make the elbow point toward the
        pole empty. Move the pole empty to −Y (behind the arm) and the elbow
        bends backward; move it to +Y and the elbow bends forward. The arm
        architecture follows the weight-painting conventions established in the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature and weight paint tutorial
        </Link>
        .
      </p>

      <h2>Vertex groups vs bone envelopes for glTF skinning</h2>
      <p>
        Blender offers two armature skinning modes: vertex groups and bone
        envelopes. Vertex groups are the only mode that writes correct
        <code>JOINTS_0</code> / <code>WEIGHTS_0</code> accessors to a glTF
        file. Bone envelopes work visually in the viewport but are not exported.
        This means <code>parent_type=&apos;ARMATURE&apos;</code> in Python (which
        activates envelopes) produces a GLB with no skinning data. The correct
        pipeline is:
      </p>
      <pre>{`mesh_obj.parent = arm_obj               # OBJECT parent (default)
mod = mesh_obj.modifiers.new("Armature", 'ARMATURE')
mod.object            = arm_obj
mod.use_vertex_groups = True`}</pre>
      <p>
        For a robot arm, hard vertex group boundaries (weight 1.0 on one side
        of the elbow, 0.0 on the other) produce crisp mechanical deformation
        rather than the organic skin blending used in character rigs. Compare
        with the blended weights in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys tutorial
        </Link>
        , where per-vertex morphs handle the facial deformation instead.
      </p>

      <h2>Outside sources</h2>
      <p>
        The IK solver configuration follows the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Blender Manual — Inverse Kinematics
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team). Related: the manual also
        covers{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/spline_ik.html"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          Spline IK
        </a>{" "}
        for curve-constrained chains such as tails and tentacles.
      </p>
      <p>
        Headless armature scripting patterns come from{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          njanakiev/blender-scripting
        </a>{" "}
        (MIT, Nicolas Janakiev), specifically{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting/blob/master/scripts/armature.py"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          scripts/armature.py
        </a>
        . The glTF skin export (JOINTS_0 / WEIGHTS_0 accessor structure) is
        specified in{" "}
        <a
          href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#skins"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          glTF 2.0 §Skins
        </a>{" "}
        and implemented by{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group); the upstream spec lives at{" "}
        <a
          href="https://github.com/KhronosGroup/glTF"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          KhronosGroup/glTF
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-armature-ik-robot-arm",
  title: "Armature Constraints + IK — Inverse Kinematics for a Stylised Robot Arm",
  date: "2026-06-05",
  kind: "tutorial",
  excerpt:
    "Build a two-bone IK rig in Blender 5.1: shoulder → elbow → wrist, driven by an IK_Target empty and stabilised by an IK_Pole empty. Learn chain_count, pole_angle, and the vertex-group skinning pipeline that exports correct JOINTS_0/WEIGHTS_0 data to glTF.",
  Body: ArmatureIkRobotArmBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    goal: "A Blender .blend with a two-bone IK rig tracking a moving target empty, plus a Draco-compressed GLB of the skinned robot arm mesh, and a solid understanding of chain_count, pole targets, and vertex-group skinning for glTF export.",
    supplies: {
      materials: [
        { name: "Blender 5.1" },
        { name: "robot_arm_ik.blend (generated by blueprint.py)" },
      ],
      tools: [
        { name: "Armature editor (Edit mode)" },
        { name: "Pose mode (bone constraints)" },
        { name: "Vertex Groups panel (Object Data Properties)" },
        { name: "bpy (for blueprint.py headless run)" },
      ],
    },
    steps: [
      {
        title: "Create the armature with two connected bones",
        body: "In Edit mode, create two bones: 'upper_arm' (head at shoulder Z=1.0, tail at elbow Z=0.6) and 'lower_arm' (head at elbow Z=0.6, tail at wrist Z=0.2). Set lower_arm.parent = upper_arm and lower_arm.use_connect = True — connected bones share their head/tail vertices so the chain deforms as a continuous structure. Set both bone rolls to 0.0; consistent roll values are essential for predictable IK pole-angle behaviour. In Python: bpy.ops.object.mode_set(mode='EDIT') then create EditBone objects via arm_data.edit_bones.new('name').",
      },
      {
        title: "Add the IK_Target and IK_Pole empties",
        body: "Create two Empty objects. IK_Target (display type SPHERE, size 0.06) marks where the wrist should reach; position it at (IK_ORBIT_R, 0, WRIST_Z) for the rest pose. IK_Pole (display type ARROWS, size 0.12) controls elbow direction; position it at (0, -0.8, ELBOW_Z) — the negative-Y offset keeps the elbow pointing backward (away from camera) in the rest pose. In Python, empties have no mesh data: bpy.data.objects.new('IK_Target', None).",
      },
      {
        title: "Apply the IK constraint in Pose mode",
        body: "Switch to Pose mode (bpy.ops.object.mode_set(mode='POSE')). Access the lower_arm PoseBone via arm_obj.pose.bones['lower_arm']. Call pbone.constraints.new('INVERSE_KINEMATICS'). Set ik.target = ik_target_obj, ik.chain_count = 2, ik.pole_target = ik_pole_obj, ik.pole_angle = math.radians(-90). The pole_angle value of -90° aligns the elbow with the pole empty for zero-roll bones; if the elbow points 90° off, adjust pole_angle in 90° increments until the pose matches expectation.",
      },
      {
        title: "Build the robot arm mesh with vertex groups",
        body: "Use bmesh to create tubes and sphere joints as a single mesh object. After calling bm.to_mesh(me), add two vertex groups via obj.vertex_groups.new(name='upper_arm') and ('lower_arm'). Iterate me.vertices: if v.co.z >= ELBOW_Z assign weight 1.0 to upper_arm, else assign to lower_arm. Hard boundaries (no blending) are correct for a mechanical robot joint. Add the Armature modifier: mod = mesh_obj.modifiers.new('Armature', 'ARMATURE'); mod.object = arm_obj; mod.use_vertex_groups = True. Set mesh_obj.parent = arm_obj (parent_type='OBJECT' by default).",
      },
      {
        title: "Keyframe the IK_Target to animate the orbit",
        body: "Set scene.frame_start=1, scene.frame_end=60, scene.render.fps=24. For each frame 1–60, compute angle = 2π × (frame-1)/59, then ik_tgt.location.x = ORBIT_R × cos(angle), ik_tgt.location.z = ELBOW_Z + ORBIT_R × 0.5 × sin(angle). Call ik_tgt.keyframe_insert('location', frame=frame). After all keyframes are inserted, set all keyframe_point.interpolation = 'BEZIER' for a smooth circular orbit. The IK solver re-evaluates at each frame during playback — no baking needed for the .blend.",
      },
      {
        title: "Export as a skinned GLB",
        body: "Call scene.frame_set(15) before export to materialise the arm in its most legible mid-pose (extended sideways). Use bpy.ops.export_scene.gltf() with export_skins=True, export_animations=True, export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP'. The export_apply=True resolves the Armature modifier at the current frame — the exported GLB contains a static mesh in the frame-15 pose, plus the IK_Target's orbit animation in the glTF animations array.",
      },
    ],
    finalResult:
      "A .blend containing a two-bone IK rig with real-time solve visible in the viewport — scrub the timeline to watch the robot arm track the orbiting IK_Target sphere. A Draco GLB under 100 KB with correct JOINTS_0/WEIGHTS_0 skinning data, ready for Three.js SkeletonHelper or a WebXR scene.",
    variations: [
      "Three-bone chain (shoulder + upper + lower): add a 'shoulder' root bone above upper_arm, change chain_count to 3 on the IK constraint. The shoulder now tilts for extreme reaches. Position IK_Pole at (0, -0.8, SHOULDER_Z) so the elbow bias remains consistent. This is the foundation for a full humanoid arm rig.",
      "Stretch IK: enable ik.use_stretch = True on the constraint and set ik.weight = 0.5. The bones now stretch proportionally to close the gap when the target is out of natural reach, rather than snapping or failing to solve. Useful for cartoon characters where exaggerated poses are expected.",
      "Multiple IK chains: add a second identical chain for the left arm (mirrored in X). In Python, duplicate all objects, flip the X translation on mesh and armature, then set up a separate IK constraint on the left lower_arm pointing to a left IK_Target. Each chain solves independently; there is no performance penalty for multiple short chains.",
    ],
    troubleshooting: [
      {
        symptom: "Elbow flips direction when IK_Target crosses a certain position",
        cause:
          "The pole target is absent or too close to the shoulder–wrist axis, providing an ambiguous bias.",
        fix: "Ensure IK_Pole is positioned well away from the arm (at least 0.6 m in Y from the arm plane). Increase the Y offset to -1.2 if flipping persists. Also verify pole_angle is set to math.radians(-90) to match zero-roll bones.",
      },
      {
        symptom: "GLB has no skinning — mesh is static, bones are not exported",
        cause:
          "parent_type='ARMATURE' was used instead of 'OBJECT', or the Armature modifier is missing.",
        fix: "Verify mesh_obj.parent_type == 'OBJECT'. Check that an Armature modifier exists on the mesh with mod.object pointing to the armature and mod.use_vertex_groups = True. In the glTF-IO export settings, confirm export_skins=True.",
      },
      {
        symptom: "Arm does not deform — mesh moves as a rigid body with the armature",
        cause:
          "Vertex groups exist but weights are all zero, or the vertex group names do not match the bone names exactly.",
        fix: "In Object Data Properties → Vertex Groups, confirm 'upper_arm' and 'lower_arm' groups are listed and contain vertices with weight > 0. Select the mesh, enter Weight Paint mode, select each bone name from the group list to visualise the weight map. Bone names are case-sensitive.",
      },
    ],
  },
  base,
);
