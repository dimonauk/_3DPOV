import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Most facial rigs begin as a thicket of RNA drivers — one driver per
        shape key, per bone, per material property. The rig works, but
        debugging means chasing fifty dependency arrows through the Graph
        Editor. The Action Constraint collapses that thicket into a single
        relationship: one control bone&apos;s rotation range maps to a frame
        range inside a stored Action, and that Action can contain any number
        of animated channels. Rotate the dial from 0° to 45° and Blender
        scrubs through frames 0–30 of the Action, evaluating every bone
        rotation in that clip in a single depsgraph pass.
      </p>

      <p>
        The key choice is <strong>where the constraint sits</strong>. The
        constraint goes on the <em>root</em> bone of the armature, not on the
        individual deform bones. This keeps deform bones clean and leaves them
        free to be driven by other constraints or NLA clips in parallel. The{" "}
        <code>mix_mode=&apos;ADD&apos;</code> setting is essential for
        production rigs: a second expression (surprised, sad) uses its own
        Action Constraint on the same root bone, and both evaluate additively —
        neither clobbers the other. Compare this with the single-driver pattern
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
          className={lk}
        >
          Corrective Shape Keys tutorial
        </Link>
        , where each driver targets exactly one output; the Action Constraint
        is the right primitive when one input controls many.
      </p>

      <p>
        <strong>Shape keys are the one edge case.</strong> The Action
        Constraint is evaluated during the armature&apos;s pose phase of the
        depsgraph. Shape-key values live on the mesh object&apos;s data block,
        which the armature evaluator cannot write to during that same pass.
        Attempting to include shape-key fcurves in the Action has no effect.
        The correct split: bone animation goes in the Action Constraint; shape
        keys go on RNA drivers that read the same control bone. The driver
        expression is a one-liner —{" "}
        <code>min(max(rot / 0.785398, 0.0), 1.0)</code> — that maps the
        0–45° rotation range to a 0–1 blendshape weight. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial"
          className={lk}
        >
          Python Shape Key Driver tutorial
        </Link>{" "}
        covers wiring drivers from Python; the same pattern applies here, just
        the expression differs.
      </p>

      <p>
        The expression Action itself is a standard <code>bpy.data.actions</code>{" "}
        block with bone fcurves. Only two keyframes per channel are needed:
        frame 0 (neutral) and frame 30 (peak). Blender linearly interpolates
        between them as the constraint scrubs. There is no need for baked
        curves, noise modifiers, or any other fcurve complexity — the
        simplicity of the Action is what makes the constraint reliable. The NLA
        patterns from the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA Action Clips for VRM tutorial
        </Link>{" "}
        are complementary: the NLA handles timeline-level sequencing of whole
        animations, while the Action Constraint handles pose-level realtime
        blending of sub-expressions.
      </p>

      <p>
        For VRM export the rig must export cleanly as a GLB. Three things to
        verify before export: (1) the control bone&apos;s{" "}
        <code>use_deform=False</code> flag — VRM importers expect only DEF
        bones in the skinning table; (2) shape-key drivers are <em>baked</em>{" "}
        or the expression is in posed state at export time — drivers do not
        survive in GLB, only the evaluated values do; (3){" "}
        <code>export_apply=True</code> to fold transforms. The{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm"
          className={lk}
        >
          Stretchy IK for VRM tutorial
        </Link>{" "}
        covers the full export checklist. Outside references:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/animation/constraints/transform/action.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Action Constraint — Blender Manual
        </a>{" "}
        (Blender Foundation, CC-BY-SA 4.0) and the{" "}
        <a
          href="https://github.com/saturday06/VRM-Addon-for-Blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          VRM Add-on for Blender by saturday06
        </a>{" "}
        (MIT) — the sibling VRM specification lives at{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          vrm-c/vrm-specification
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-rigging-action-constraint-expression-dial-vrm",
  title:
    "Rigging: Action Constraint — Expression Dial VRM Face Rig (Blender 5.1)",
  date: "2026-06-28",
  kind: "tutorial",
  excerpt:
    "Map one control bone's rotation range to frames of a stored Action, simultaneously driving bone poses and shape-key blendshapes for a compact VRM facial expression rig.",
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/rigging/rigging-action-constraint-expression-dial-vrm/",
    time: "one focused hour",
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
      "Comfortable in Pose Mode and the Properties > Bone Constraints panel",
      "Understands shape keys and basic RNA drivers",
      "Has read the NLA Action Clips or FK/IK Switch tutorials",
    ],
    steps: [
      {
        title: "Build the expression Action",
        body: `Create a bpy.data.actions block and add bone rotation fcurves manually:

  action = bpy.data.actions.new("happy_expression")
  fc = action.fcurves.new(
      data_path='pose.bones["DEF_brow_L"].rotation_euler',
      index=0,   # X-axis
  )
  fc.keyframe_points.add(2)
  fc.keyframe_points[0].co = (0, 0.0)
  fc.keyframe_points[0].interpolation = "LINEAR"
  fc.keyframe_points[1].co = (30, math.radians(-15))
  fc.keyframe_points[1].interpolation = "LINEAR"

Frame 0 = neutral rest pose, frame 30 = peak expression. Two linear keyframes per channel are all that is needed — the Action Constraint interpolates between them as it scrubs the frame value. Do NOT assign this action to arm.animation_data.action; it is a detached action that only the constraint evaluates.`,
      },
      {
        title: "Apply the Action Constraint",
        body: `Attach the constraint to the root bone in Pose Mode:

  bpy.context.view_layer.objects.active = arm
  bpy.ops.object.mode_set(mode="POSE")
  con = arm.pose.bones["root"].constraints.new("ACTION")
  con.action            = action
  con.frame_start       = 0
  con.frame_end         = 30
  con.target            = arm
  con.subtarget         = "CTRL_expression"
  con.transform_channel = "ROTATION_Y"
  con.min               = 0.0
  con.max               = math.radians(45)
  con.mix_mode          = "ADD"

mix_mode="ADD" is critical for multi-expression rigs. A second "sad" expression can use its own Action Constraint on the same root bone, and both layer without conflict. mix_mode="REPLACE" would make the second constraint override the first completely.`,
      },
      {
        title: "Wire shape keys via RNA drivers",
        body: `Shape-key values cannot be included in the armature-side Action. Instead, add a driver directly to each shape key:

  sk = head.data.shape_keys.key_blocks["brow_raise"]
  drv = sk.driver_add("value").driver
  drv.type       = "SCRIPTED"
  drv.expression = "min(max(rot / 0.785398, 0.0), 1.0)"

  var = drv.variables.new()
  var.name = "rot"
  var.type = "TRANSFORMS"
  var.targets[0].id              = arm
  var.targets[0].bone_target     = "CTRL_expression"
  var.targets[0].transform_type  = "ROT_Y"
  var.targets[0].transform_space = "LOCAL_SPACE"

0.785398 radians = 45°. The clamp maps the same 0–45° range to 0–1 blendshape weight, mirroring exactly what the Action Constraint does on the bone side.`,
      },
      {
        title: "Test the expression dial",
        body: `Select CTRL_expression in Pose Mode and rotate on Y:

  R → Y → type a value, or drag in the 3D viewport.

At 0°: neutral — all shape keys at 0, DEF bones at rest.
At 22.5° (half): brow_raise ≈ 0.5, mouth_smile ≈ 0.5, DEF bones at half rotation.
At 45° (peak): both shape keys at 1.0, DEF bones at their peak rotation.

Open the Drivers panel (Graph Editor → select a shape key → switch to Drivers) to see the live evaluation. The Bone Constraints panel on the root bone shows the Action Constraint's current frame value (a float from 0 to 30) as you rotate the dial.`,
      },
      {
        title: "Export to GLB for VRM",
        body: `Before export: bake shape-key drivers to keyframes so the GLB carries actual morph data.

  # Pose the rig at neutral before export
  arm.pose.bones["CTRL_expression"].rotation_euler.y = 0.0
  bpy.context.view_layer.update()

  with bpy.context.temp_override(active_object=arm, selected_objects=[arm, head]):
      bpy.ops.export_scene.gltf(
          filepath="//expression_dial_rig.glb",
          use_selection=True,
          export_yup=True,
          export_apply=True,
          export_morph=True,
          export_morph_normal=False,
          export_draco_mesh_compression_enable=True,
          export_draco_mesh_compression_level=6,
      )

export_morph=True serialises the shape key targets as morph targets in the GLB. The VRM runtime will drive them via its own blendshape system, replacing the Blender drivers.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "Rotating the CTRL bone has no effect on DEF bones",
        cause:
          "The Action Constraint is evaluating but the Action's fcurve data_path doesn't match the bone name exactly.",
        fix: 'Verify the fcurve data_path in the Python console: print(arm.data.actions["happy_expression"].fcurves[0].data_path). Bone names are case-sensitive; a trailing space or typo silently skips evaluation.',
      },
      {
        symptom: "Shape keys don't update as the bone rotates",
        cause:
          "The RNA driver's transform_space may be WORLD_SPACE instead of LOCAL_SPACE, returning the world-space rotation which differs from the local value after parent transforms.",
        fix: 'Set var.targets[0].transform_space = "LOCAL_SPACE". Alternatively, check the Driver panel: if the variable shows a non-zero value but the shape key remains at 0, the expression may be dividing by the wrong constant.',
      },
      {
        symptom: "mix_mode='ADD' causes bones to overshoot",
        cause:
          "A second Action Constraint is also contributing bone rotation on the same channel, and both are additive.",
        fix: "Assign each expression's constraint to different bone channels or use separate target sub-bones as dials. Alternatively, clamp the output: set frame_start/frame_end to the safe neutral-to-peak range and verify the CTRL bone's rotation never exceeds CTRL_ROT_PEAK in practice.",
      },
      {
        symptom: "GLB has no morph targets after export",
        cause: "export_morph was False or the mesh had no active shape keys at export time.",
        fix: "Confirm export_morph=True and that the mesh has at least one non-Basis shape key. If shape keys were deleted and re-added, ensure Basis is always the first key block.",
      },
    ],
  },
  base,
);
