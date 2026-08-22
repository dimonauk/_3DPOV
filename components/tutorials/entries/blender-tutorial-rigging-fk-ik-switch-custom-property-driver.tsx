import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function FkIkSwitchBody() {
  return (
    <>
      <p>
        Forward kinematics (FK) and inverse kinematics (IK) solve the same
        problem from opposite ends. FK asks: given a set of bone rotations, where
        does the tip land? IK asks: given a target position, what rotations must
        each bone take? Animators need both — FK for arcs and follow-through, IK
        for planting a hand on a surface. The trick is switching between them
        mid-shot without rebuilding the rig.
      </p>

      <p className="mt-3">
        Blender stores the IK solver entirely in the armature&rsquo;s constraint
        stack, which means switching is just toggling one float: the IK
        constraint&rsquo;s <code>influence</code>. A{" "}
        <code>SINGLE_PROP</code> driver reads that float from a custom property
        on the armature data block, so animators control the entire system with
        a single N-panel slider — and that slider is itself keyframeable. This
        tutorial builds the rig from scratch and wires every part of the
        pipeline in Python, including the driver, so you understand exactly which
        data path connects to which output.
      </p>

      <p className="mt-3">
        The driver setup here complements the rotation-based driver expression
        built in the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
          className={lk}
        >
          corrective shape keys tutorial
        </Link>
        . That tutorial used a <code>TRANSFORMS</code> variable to read a bone
        angle; this one uses <code>SINGLE_PROP</code> targeting an armature data
        custom property — a subtly different choice that is safer when the
        driven value is already a clean 0–1 range authored by the animator
        rather than derived from a transform. The Python bpy approach to building
        constraint-driven rigs follows the same data-API-first philosophy as the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-geonodes-tree-api"
          className={lk}
        >
          programmatic Geometry Nodes tree tutorial
        </Link>
        : prefer direct data writes over operator calls wherever possible.
      </p>

      <p className="mt-3">
        The finished rig connects naturally into the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-bone-collections-custom-shapes"
          className={lk}
        >
          bone collections and custom shapes tutorial
        </Link>{" "}
        — once the FK/IK switch works, organising the control bones into named
        collections (FK layer, IK layer, deform layer) is the next production
        step. For characters destined for the VRM pipeline, see how baked action
        clips interact with IK constraints in the{" "}
        <Link href="/tutorials/blender-tutorial-nla-action-clips-vrm" className={lk}>
          NLA and VRM export tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why target arm_data, not arm_obj?
      </h2>
      <p>
        The custom property lives on the armature <em>data</em> block, not the
        object. The driver variable therefore sets{" "}
        <code>id_type=&quot;ARMATURE&quot;</code> and <code>id=arm_data</code>.
        If you target the object instead (<code>id_type=&quot;OBJECT&quot;</code>
        ), the driver still works — but it breaks the moment the armature is
        linked into another file, because the receiving file receives the data
        block only, not the object wrapper. Targeting data makes the driver
        file-link safe.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Step-tangent keyframes for the switch
      </h2>
      <p>
        When you keyframe the <code>fk_ik</code> slider at frame 1 (value 0) and
        frame 50 (value 1), Blender defaults to Bézier interpolation. This means
        the IK solver runs at 50% influence around frame 25 — a physically
        meaningless blend that distorts the pose in unexpected ways. In the Graph
        Editor, select both keyframes and press{" "}
        <code>T ▸ Constant</code> (or <code>V ▸ Vector</code>). The F-curve
        becomes a step function: FK until frame 49, IK from frame 50. That is
        the correct behaviour for a mode switch.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Inverse Kinematics
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. Chain length
          semantics, pole angle convention, influence blending caveats. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/animation/armatures/posing/bone_constraints/inverse_kinematics/spline_ik.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Spline IK page
          </a>{" "}
          and the{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.KinematicConstraint.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KinematicConstraint Python API
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/animation/drivers/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Drivers
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. SINGLE_PROP
          variable type, id_type ARMATURE target, data_path syntax for custom
          properties. Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.DriverVariable.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DriverVariable API
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.DriverTarget.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            DriverTarget API
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/EpicGamesExt/BlenderTools"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Epic Games — Blender Tools (MIT)
          </a>{" "}
          &mdash; send-to-unreal and ue-to-rigify toolset. The ue-to-rigify
          module implements FK/IK snap operators that snap the FK bones to match
          the IK pose before switching; the data-path pattern for SINGLE_PROP
          drivers in this blueprint is informed by studying its constraint
          influence system. Related:{" "}
          <a
            href="https://github.com/EpicGamesExt/BlenderTools/tree/main/src/ue2rigify"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ue2rigify source
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/rigging/rigging-fk-ik-switch-custom-property-driver",
    time: "45 minutes to one hour",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor + Python Console",
        "Pose Mode for constraint and driver inspection",
        "N-panel ▸ Item tab for the fk_ik slider",
        "Graph Editor ▸ Drivers view for driver verification",
        "Graph Editor for setting Constant interpolation on the switch",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. A three-bone arm appears: upper_arm (root), forearm, hand, with circle-widget bones for ik_target and ik_pole. The Info bar confirms the driver was created. Press N in the 3D viewport — the Item tab shows a fk_ik slider at 0.0.",
      },
      {
        title: "Test FK mode (slider = 0)",
        body: "Select the arm object. Tab into Pose Mode. Select the forearm bone. Press R X and drag — the forearm rotates freely, hand follows as a child. No IK solving. This is pure FK. Press Escape to undo.",
      },
      {
        title: "Verify the IK constraint influence",
        body: "Select the hand bone. Properties ▸ Bone Constraints shows 'IK_Limb' with influence = 0.0. A purple driver icon appears next to the influence field — right-click it and choose 'Edit Driver' to inspect the SINGLE_PROP variable targeting arm_data['fk_ik'].",
      },
      {
        title: "Switch to IK (slider = 1)",
        body: "In the Item tab, drag fk_ik to 1.0. The IK solver activates. Select the ik_target bone and press G to grab it — move it around the viewport. The forearm and hand follow the target while upper_arm stays fixed in whatever FK rotation it held. Move the ik_pole bone to steer the elbow direction.",
      },
      {
        title: "Set Constant interpolation on the switch keyframes",
        body: "Open the Graph Editor. In the Dope Sheet or the F-curve view, find the fk_ik curve. Select all its keyframes (A), press T, choose Constant. The curve becomes a staircase. This prevents the solver from blending FK and IK at fractional influence values mid-shot.",
      },
      {
        title: "Pose the FK phase and IK phase separately",
        body: "Frame 1: fk_ik=0, rotate forearm to −60° in FK. Keyframe with I ▸ Location & Rotation on the forearm bone. Frame 50: drag fk_ik to 1.0, move ik_target to a different position. Press I on ik_target ▸ Location. Scrub the timeline — the arm should hold FK pose until frame 50, then snap to IK solver.",
      },
      {
        title: "Record the viewport animation",
        body: "Scripting workspace → open record.py → Run Script. The script poses frames 1–30 in FK (forearm rotating), frame 50 snaps to IK (ik_target moving upward through frames 50–80), frame 90 snaps back to FK. Output lands at public/library/videos/rigging/rigging-fk-ik-switch-custom-property-driver/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "fk_ik slider has no visible driver icon — IK does not respond",
        cause:
          "The driver was added to a stale armature reference. This happens if blueprint.py was run, the armature deleted, and then run again — arm_data reference in the driver points to the old (now orphan) data block.",
        fix: "In the Outliner, enable 'Orphan Data' display. Delete the old armature data block. Re-run blueprint.py. The driver targets the freshly created arm_data.",
      },
      {
        symptom: "Arm flips to a mirrored solution when ik_target crosses certain positions",
        cause:
          "The IK solver has two valid solutions for most target positions (elbow forward or elbow backward). Without a pole target, it picks based on rest-pose history.",
        fix: "Move the ik_pole bone to an unambiguous position and set pole_angle to π (3.14159) if the elbow bends the wrong way. The pole target locks the solver to a single solution family.",
      },
      {
        symptom: "Switching fk_ik causes the arm to snap to a different position than the FK pose",
        cause:
          "IK and FK are independent systems. IK solves to the ik_target position; if ik_target is not at the hand's FK-computed world position, there will be a pop at the switch.",
        fix: "Before switching to IK, move ik_target to the current FK hand tip position (read it from pose.bones['hand'].tail in world space). After moving the target, switch. Many production rigs have a dedicated 'FK→IK snap' operator that does this automatically.",
      },
    ],
    finalResult:
      "A three-bone arm armature with a keyframeable fk_ik slider (0=FK, 1=IK) on the armature data block driving an IK constraint influence via a SINGLE_PROP driver, plus a 90-frame viewport recording demonstrating FK bend, mode switch, and IK target tracking.",
  },
  {
    slug: "blender-tutorial-rigging-fk-ik-switch-custom-property-driver",
    title:
      "Rigging: FK/IK Switch with Custom Property + Drivers (Blender 5.1)",
    date: "2026-06-15",
    kind: "tutorial",
    excerpt:
      "Drive an IK constraint's influence with a float custom property on the armature data block via a SINGLE_PROP driver — giving animators a single N-panel slider that switches between free FK rotation and IK solver control, keyframeable and file-link safe.",
    tags: ["blender", "rigging", "armature", "ik", "fk", "drivers", "animation"],
    Body: FkIkSwitchBody,
  }
);
