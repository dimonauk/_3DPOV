import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Two bone constraints can orient a bone toward a target: Track To and
        Damped Track. Track To solves in Euler space and can gimbal-lock when
        the target crosses the 90° pole — in practice an eye bone suddenly flips
        180° as a camera or prop sweeps past centre. Damped Track solves as a
        quaternion minimum-rotation, always finding the shortest path between
        rest pose and target direction. That continuity is non-negotiable for a
        real-time WebXR avatar the user wears. A constraint that flips is a
        constraint that cannot ship.
      </p>

      <p>
        The second lesson is constraint <em>order</em>. Blender evaluates bone
        constraints top-to-bottom within the Bone Constraint Properties panel.
        Damped Track runs first and orients the eye toward the target. Limit
        Rotation runs second and clamps the result to a physiologically plausible
        range (±40° yaw, ±30° pitch). If you reverse the order, Limit Rotation
        fires before the eye has moved — clamping a zero rotation to ±40° is a
        no-op — and Damped Track then overwrites the clamp entirely. Order is not
        a detail; it is the rig.
      </p>

      <p>
        Right-eye mirroring uses Copy Rotation from the left eye bone with{" "}
        <code>invert_z=True</code>. Because the two eye bones are placed
        symmetrically across the YZ plane, a positive-Z yaw on the left equals a
        negative-Z yaw on the right. Copy Rotation handles this with a single
        checkbox, removing the need for a second Damped Track computation. The{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-action-constraint-expression-dial-vrm"
          className={lk}
        >
          Action Constraint Expression Dial tutorial
        </Link>{" "}
        shows the same additive-constraint philosophy applied to facial
        expressions; the eye rig here is the locomotion counterpart.
      </p>

      <p>
        The control bone (LookTarget) is a child of Head rather than a
        world-space Empty. This keeps the rig self-contained: move the head and
        the target follows — you animate relative gaze, not absolute world
        position. The VRM 1.0 LookAt specification maps to this bone via the
        humanoid bone role assignment in the{" "}
        <Link
          href="/tutorials/blender-tutorial-blender-addon-vrm-format"
          className={lk}
        >
          VRM Format add-on tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "public/library/blends/rigging/rigging-vrm-eye-look-at-damped-track/",
    time: "90 minutes",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable with Edit Mode and Pose Mode",
      "Understands parent–child bone relationships",
      "Has read the IK Robot Arm tutorial or equivalent",
    ],
    steps: [
      {
        title: "Build the armature skeleton",
        body: `Run blueprint.py in the Scripting workspace, or paste the top section into a new Text block.

The script creates a minimal VRM-compliant spine chain:

  Root > Hips > Spine > Chest > Neck > Head

Then adds three bones parented to Head (not connected):

  LeftEye   — head at (-0.032, 0, 0.73), tail points -Y (into screen)
  RightEye  — mirror of LeftEye on +X
  LookTarget — placed 0.5 m forward of head centre; this is the control bone

The eye bones use "head" coordinates matching typical VRM avatar proportions. The LookTarget bone has use_deform=False — it drives the rig but does not deform any mesh.`,
      },
      {
        title: "Add Damped Track to LeftEye",
        body: `In Pose Mode, select LeftEye. Open Properties → Bone Constraints (the chain-link icon).

Add → Tracking → Damped Track.

  Target:     vrm_eye_rig   (the armature itself — self-targeting)
  Bone:       LookTarget
  Track Axis: -Y

The -Y axis is correct because Blender bones point in +Y at rest; the eye mesh faces -Y (outward, toward camera). Damped Track will rotate LeftEye until its -Y axis points at LookTarget.

Self-targeting within one armature is fully supported in Blender 5.1 and avoids the extra Empty object that older tutorials add. The constraint evaluates after the LookTarget bone's own pose is resolved, so there is no circular dependency.`,
      },
      {
        title: "Add Limit Rotation to LeftEye (after Damped Track)",
        body: `Still on LeftEye, add → Transform → Limit Rotation.

Drag it to position BELOW DampedTrack_LookAt in the constraint stack.

  Space:   Pose Space
  X Axis:  ✓  Min: −30°  Max: 30°   (pitch: up / down)
  Y Axis:  ✗  (roll around gaze axis — never anatomically relevant)
  Z Axis:  ✓  Min: −40°  Max: 40°   (yaw: left / right)

Pose Space means the clamp is evaluated relative to the armature's pose, not world axes — so if you tilt the character's head 45°, the eye's travel range tilts with it. Local Space would keep the range in bone-rest-frame, which breaks when the head is rotated.

Use Transform Limit ✓ — this ensures the clamp applies at all influence values, not just at 1.0, which matters if you later add a slider to blend the look-at in/out.`,
      },
      {
        title: "Wire RightEye via Copy Rotation with Z inversion",
        body: `Select RightEye. Add → Transform → Copy Rotation.

  Source Armature: vrm_eye_rig
  Bone:            LeftEye
  Owner Space:     Local Space
  Target Space:    Local Space
  Invert X:        ✗
  Invert Z:        ✓   ← bilateral symmetry key
  Mix Mode:        Replace

Because the two eye bones are mirrored across the YZ plane, a +Z yaw on LeftEye corresponds to a −Z yaw on RightEye. The single invert checkbox handles this without any additional math.

Then add Limit Rotation with the same settings as LeftEye. The constraint chain on RightEye is:

  CopyRot_FromLeft → LimitRot_EyeClamp

RightEye does NOT have its own Damped Track — Copy Rotation from LeftEye is sufficient, and using a second Damped Track targeting the same bone would double-weight the result.`,
      },
      {
        title: "Test the rig interactively",
        body: `In Pose Mode, select LookTarget. Press G to grab and move it left/right/up/down.

Both eyes should track smoothly with no flipping. When the target moves past 40° to either side, the eyes hold at the limit and stop following — the Limit Rotation clamp is working.

To verify constraint order is correct, try temporarily moving Limit Rotation ABOVE Damped Track on LeftEye. The eye will ignore the clamp and track freely past ±40°. Restore the correct order before proceeding.

Open the Sidebar (N) → Item tab while LookTarget is selected to see its local coordinates update in real time as you drag.`,
      },
      {
        title: "Assign VRM humanoid bone roles",
        body: `With the VRM Add-on for Blender installed (saturday06/VRM-Addon-for-Blender, MIT licence):

  Properties → Object Data → VRM → Humanoid

Assign bone slots:
  hips     → Hips
  spine    → Spine
  chest    → Chest
  neck     → Neck
  head     → Head
  leftEye  → LeftEye
  rightEye → RightEye

The VRM 1.0 runtime's LookAt module reads the leftEye / rightEye bone slots and drives gaze by rotating those bones directly. Because our constraint chain lives on those same bones, the runtime's rotations will be clamped by our Limit Rotation automatically — no extra configuration required. See the companion tutorial on the
VRM Spring Bone system for setting up hair/clothing physics on the same rig.`,
      },
      {
        title: "Export to GLB / VRM",
        body: `Run this snippet to export a clean GLB from the scripting console:

  import bpy

  with bpy.context.temp_override(
      active_object=bpy.data.objects["vrm_eye_rig"],
      selected_objects=[bpy.data.objects["vrm_eye_rig"]],
  ):
      bpy.ops.export_scene.gltf(
          filepath="//vrm_eye_lookat_rig.glb",
          use_selection=True,
          export_yup=True,
          export_apply=True,
          export_draco_mesh_compression_enable=True,
          export_draco_mesh_compression_level=6,
      )

If you are exporting a full VRM (with mesh, textures, spring bones) use the VRM add-on's File → Export → VRM exporter instead, which serialises the constraint rig into the VRMC_vrm extension's lookAt block automatically.`,
      },
    ],
    troubleshooting: [
      {
        symptom: "LeftEye flips 180° when LookTarget crosses the centre line",
        cause:
          "Track To constraint was added instead of Damped Track. Track To solves in Euler space and is prone to gimbal-lock at the pole.",
        fix: "Delete the Track To constraint and add a Damped Track constraint in its place. Confirm the icon in the constraint header shows a bent chain, not a straight-line arrow.",
      },
      {
        symptom: "RightEye doesn't move when LookTarget is dragged",
        cause:
          "The Copy Rotation constraint is in the wrong space, or Owner/Target space mismatch means the rotation comes through as near-zero.",
        fix: "Set both Owner Space and Target Space to Local Space. In Pose Mode, rotate LeftEye manually on Z and verify the value appears on RightEye with inverted sign before adding the Damped Track source back.",
      },
      {
        symptom: "Eyes exceed ±40° and ignore the Limit Rotation clamp",
        cause:
          "Limit Rotation sits above Damped Track in the constraint stack, so Damped Track overwrites the clamped value.",
        fix: "In Bone Constraint Properties, drag Limit Rotation to be below (i.e., evaluated after) Damped Track. The up/down arrows or drag handles re-order constraints.",
      },
      {
        symptom: "Tilting the character's head causes the eyes to look at a wrong world-space direction",
        cause:
          "Limit Rotation was set to Local Space instead of Pose Space. Local Space clamps in the bone's own rest frame, ignoring head rotation.",
        fix: "Change the Space dropdown on Limit Rotation to Pose Space. The clamp will now follow the head as it rotates.",
      },
    ],
  },
  {
    slug: "blender-tutorial-rigging-vrm-eye-look-at-damped-track",
    title:
      "VRM Eye Look-At Rig — Damped Track + Limit Rotation Bone Constraints",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "Build a gimbal-safe VRM eye rig using Damped Track, Limit Rotation, and Copy Rotation constraints in Blender 5.1. Covers constraint chain order, bilateral symmetry, self-targeting armatures, and VRM LookAt API compatibility.",
    Body,
  },
);
