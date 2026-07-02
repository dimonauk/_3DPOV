import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Bone constraints — IK, Damped Track, Copy Location, Stretch To — are
        solved at runtime by Blender&apos;s animation system and exist nowhere in
        a GLB or VRM file. When you export a constrained armature without
        first resolving those constraints, the exported skeleton sits at its
        rest-pose transforms regardless of what you see in the viewport. Two
        production strategies solve this via the Python API, and knowing when
        to reach for each one is the difference between a clean pipeline and a
        pipeline that breaks during crunch.
      </p>

      <h2>Strategy A — NLA Bake (destructive)</h2>
      <p>
        <code>bpy.ops.nla.bake()</code> walks every frame in a range, evaluates
        the post-constraint visual transform, and writes an F-Curve key per bone
        per frame into a new Action. Pass{" "}
        <code>clear_constraints=True</code> and the constraints are removed once
        the bake completes. The resulting <code>.blend</code> contains only a
        frozen keyframe animation — ideal for final delivery files that never
        need to go back to the rig.
      </p>
      <pre>{`bpy.ops.nla.bake(
    frame_start=1,
    frame_end=60,
    only_selected=True,
    visual_keying=True,      # key the post-constraint transform
    clear_constraints=True,  # destructive — removes rig after bake
    use_current_action=False,
    bake_types={'POSE'},
)`}</pre>
      <p>
        <code>visual_keying=True</code> is not optional: without it, Blender
        keys the local <em>matrix_basis</em> (what the bone sits at before
        constraint evaluation), not the solved result. The bake appears to work
        but the exported animation is the rest pose.
      </p>

      <h2>Strategy B — Mute → Apply → Export → Restore (non-destructive)</h2>
      <p>
        For still-pose exports or when the rig must survive in the source file,
        snapshot the mute state of every constraint, set{" "}
        <code>constraint.mute = True</code>, apply the current visual transform
        into <code>matrix_basis</code>, export, then restore the snapshot. The
        rig is untouched; only the exported GLB carries the baked pose.
      </p>
      <pre>{`def all_constraints(arm_obj):
    return [c for pb in arm_obj.pose.bones for c in pb.constraints]

def mute_all(arm_obj):
    cons   = all_constraints(arm_obj)
    states = [c.mute for c in cons]
    for c in cons: c.mute = True
    return states

def restore_all(arm_obj, states):
    for c, was_muted in zip(all_constraints(arm_obj), states):
        c.mute = was_muted`}</pre>
      <p>
        Applying visual transforms requires a{" "}
        <code>bpy.ops.pose.visual_transform_apply()</code> call with a
        live VIEW_3D area in context. In a headless / background process there
        is no screen; the function early-returns gracefully rather than crashing.
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          temp_override pipeline tutorial
        </Link>{" "}
        for the broader pattern.
      </p>
      <pre>{`area   = next((a for a in bpy.context.screen.areas
               if a.type == 'VIEW_3D'), None)
if area:
    region = next(r for r in area.regions if r.type == 'WINDOW')
    with bpy.context.temp_override(area=area, region=region,
                                   active_object=arm_obj):
        bpy.ops.pose.visual_transform_apply()`}</pre>

      <h2>Adding constraints programmatically</h2>
      <p>
        Constraints live on <code>bpy.types.PoseBone.constraints</code>, a
        collection that supports <code>.new(type=&apos;...&apos;)</code> in Pose
        mode. You must be in Pose mode when adding; any attempt from Object mode
        silently does nothing because the poll check fails without error.
      </p>
      <pre>{`bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode='POSE')

pb  = arm_obj.pose.bones["Child"]
con = pb.constraints.new(type='DAMPED_TRACK')
con.name       = "DT_LookAt"
con.target     = target_empty
con.track_axis = 'TRACK_Y'

bpy.ops.object.mode_set(mode='OBJECT')`}</pre>
      <p>
        Damped Track is preferable to Track To for look-at rigs because it has
        no secondary &apos;up&apos; vector. Track To can flip 180° when the target crosses
        the bone&apos;s local plane; Damped Track solves the shortest-arc rotation
        and never flips. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-vrm-eye-look-at-damped-track"
          className={lk}
        >
          VRM Eye Look-At Damped Track tutorial
        </Link>{" "}
        for the full rigging setup.
      </p>

      <h2>Audit helper</h2>
      <p>
        Before any export-pipeline script runs in production, print a constraint
        table to the console so unexpected constraints (left from a test session,
        added by an add-on) are visible before they corrupt the export:
      </p>
      <pre>{`for pb in arm_obj.pose.bones:
    for c in pb.constraints:
        print(pb.name, c.name, c.type, f"inf={c.influence:.2f}",
              "MUTED" if c.mute else "active")`}</pre>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>
            <code>visual_transform_apply</code> has no effect in headless
          </strong>
          — expected; the operator polls for a screen. Log a warning, skip the
          apply, and let the export proceed at rest pose.
        </li>
        <li>
          <strong>
            NLA bake leaves constraint action on top of baked action
          </strong>
          — happens when <code>use_current_action=True</code> and the armature
          already has an action assigned. Set <code>use_current_action=False</code>{" "}
          to force a fresh data block.
        </li>
        <li>
          <strong>Export missing bones</strong> — GLB exporter skips bones with
          no connected mesh if <code>export_skins=False</code>. Ensure the param
          is <code>True</code> (it is by default) when exporting a bare armature.
        </li>
      </ul>

      <h2>When to use each strategy</h2>
      <table>
        <thead>
          <tr>
            <th>Need</th>
            <th>Strategy</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Final delivery GLB, animation baked</td>
            <td>A — NLA Bake</td>
          </tr>
          <tr>
            <td>Still-pose export, rig survives in .blend</td>
            <td>B — Mute/Apply/Restore</td>
          </tr>
          <tr>
            <td>Per-frame batch export (render farm)</td>
            <td>
              B inside a{" "}
              <Link
                href="/tutorials/blender-tutorial-python-app-timers-deferred-live-reload-frame-stepper"
                className={lk}
              >
                frame stepper
              </Link>
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Studio pipeline context</h2>
      <p>
        The{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Holoflow asset pipeline
        </Link>{" "}
        exports VRM avatars and prop GLBs from a shared source file. The
        constraint mute pattern runs automatically via the{" "}
        <code>holoflow_macros/constraint_export_pipeline.py</code> helper
        before every GLB write, guaranteeing that IK and look-at rigs on
        avatar eyes and fingers never corrupt the WebXR scene.
      </p>
      <p>
        For FK/IK switching at export time, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver"
          className={lk}
        >
          FK/IK switch driver tutorial
        </Link>{" "}
        — that custom property doubles as an export flag when read by the
        pipeline script.
      </p>

      <h2>External sources</h2>
      <ul>
        <li>
          Robert Guetzkow —{" "}
          <em>blender-python-examples</em> — MIT{" "}
          <a
            href="https://github.com/robertguetzkow/blender-python-examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/robertguetzkow/blender-python-examples
          </a>{" "}
          — operator, panel, property group, and constraint examples in the
          same repository; sibling resources cover bpy.props and add-on
          registration patterns directly applicable to pipeline scripting.
        </li>
        <li>
          Blender Foundation —{" "}
          <em>bpy.types.PoseBone Python API</em>{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.PoseBone.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org/api/current/bpy.types.PoseBone.html
          </a>{" "}
          — canonical reference for <code>constraints</code>,{" "}
          <code>matrix</code>, <code>matrix_basis</code>, and{" "}
          <code>matrix_channel</code> semantics; essential reading before
          writing any constraint bake or visual-apply script.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-pose-bone-constraint-management-export-bake",
  title:
    "Python bpy.types.PoseBone.constraints — Constraint Management, Mute-on-Export & NLA Bake Pipeline (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "Bone constraints are stripped silently on GLB/VRM export. Two Python strategies solve this: NLA bake (destructive, full animation range) and mute-apply-restore (non-destructive, still-pose). Covers bpy.ops.nla.bake(), bpy.ops.pose.visual_transform_apply() via temp_override, per-bone constraint snapshots, and an audit helper for pipeline scripts.",
  tags: [
    "blender",
    "python",
    "scripting",
    "rigging",
    "constraints",
    "nla",
    "export",
    "glb",
    "vrm",
    "pipeline",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-pose-bone-constraint-management-export-bake",
    time: "one to two hours",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts from the Scripting workspace",
      "Understands Pose mode, bone constraints, and the Bone Constraint Properties panel",
      "Familiar with bpy.context.temp_override() (see temp_override pipeline tutorial)",
    ],
  },
  base,
);
