import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ArmatureSplineIkTentacleBody() {
  return (
    <>
      <p>
        Spline IK solves a problem that ordinary Inverse Kinematics cannot:
        distributing a chain of bones along an arbitrary curved path.
        Regular IK — Blender&apos;s CCD solver, used in the{" "}
        <Link href="/tutorials/blender-tutorial-armature-ik-robot-arm" className={lk}>
          robot arm tutorial
        </Link>{" "}
        — finds joint angles that move a tip bone to a single goal point.
        It produces elegant two- or three-joint solutions, but making it
        follow a smooth S-curve requires many intermediate targets and becomes
        unmanageable for tentacles, hair strands, tails, or spinal columns.
        Spline IK sidesteps this entirely: you supply a Bezier curve as the
        target, and Blender samples the curve at equal arc-length intervals to
        find the position and tangent for each bone. Move a Bezier handle and
        every bone in the chain adjusts simultaneously — no additional targets,
        no pole empties, no solver fighting.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Where the constraint lives
      </h2>
      <p>
        The <code>SPLINE_IK</code> constraint is placed on the{" "}
        <strong>tip bone</strong> — the last (farthest from root) bone in the
        chain — and the <code>chain_count</code> property specifies how many
        bones upward from there participate. Placing it on the root would
        constrain only that one bone.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# In Pose mode — active object = Armature
tip_pbone = arm_obj.pose.bones["Bone.009"]   # tip of a 10-bone chain

con = tip_pbone.constraints.new('SPLINE_IK')
con.target           = curve_obj   # a Bezier Curve object
con.chain_count      = 10          # all 10 bones participate
con.use_curve_radius = False       # ignore curve point radius property
con.xz_scale_mode    = 'VOLUME_PRESERVE'
con.y_scale_mode     = 'FIT_CURVE'`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        xz_scale_mode — the squash-and-stretch axis
      </h2>
      <p>
        As the tentacle stretches or compresses along the curve,{" "}
        <code>xz_scale_mode</code> governs what happens to the
        cross-section. The four options encode distinct physics metaphors:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm mt-2">
        <li>
          <code>NONE</code> — cross-section stays at bone&apos;s original scale.
          Correct for rigid mechanical cables or stylised cartoon limbs that
          must not change width regardless of pose.
        </li>
        <li>
          <code>VOLUME_PRESERVE</code> — cross-section narrows as the chain
          stretches and widens as it compresses, conserving the rubber-hose
          volume. Best for organic tentacles, tails, and cartoon limbs.
        </li>
        <li>
          <code>INVERSE_PRESERVE</code> — the inverse of{" "}
          <code>VOLUME_PRESERVE</code>: cross-section grows when the chain
          stretches. Unusual physically but useful for stylised accordion or
          spring-like objects.
        </li>
        <li>
          <code>BONE_ORIGINAL</code> — inherits the bone&apos;s own X/Z scale
          from object-level transforms. Useful when you want artist-defined
          thickness that Spline IK should not override.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        y_scale_mode — fitting the chain to the curve
      </h2>
      <p>
        <code>FIT_CURVE</code> stretches or compresses each bone in Y so the
        total chain length matches the Bezier arc length exactly. This is
        almost always correct for tentacles and hair, where the curve length
        defines the visual extent. Switch to <code>BONE_ORIGINAL</code> for
        spine rigs where anatomical segment lengths must stay fixed regardless
        of the curve&apos;s arc length — the chain will simply not reach the tip
        if the curve is too long.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Animating by moving Bezier handles
      </h2>
      <p>
        The rig animation happens entirely on the{" "}
        <strong>curve, not the armature</strong>. Select the curve, Tab into
        Edit mode, grab a control point or a handle with G, and the chain
        follows immediately. To keyframe the handle position from Python:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`# Keyframe a Bezier control point's position on the curve data block
sp  = curve_obj.data.splines[0]
pts = sp.bezier_points

bpy.context.scene.frame_set(30)
pts[1].co = Vector((0.55, 0.60, 0.15))   # mid-point prey-reach pose
pts[1].keyframe_insert(data_path="co")
pts[1].keyframe_insert(data_path="handle_right")
pts[1].keyframe_insert(data_path="handle_left")`}</pre>
      <p className="text-sm text-neutral-400 mt-2">
        Note: keyframes live on{" "}
        <code>bpy.data.curves[&quot;name&quot;].splines[0].bezier_points[i]</code>,
        not on the curve object&apos;s transforms. The{" "}
        <code>animate_curve()</code> function in <code>blueprint.py</code>{" "}
        sets three poses — rest, prey-reach, coil — at frames 1, 30, 60.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Step-by-step</h2>

      <h3 className="font-medium mt-4 mb-1">1. Build the Bezier control curve</h3>
      <p>
        Add a Bezier curve (<em>Shift+A → Curve → Bezier</em>) with three
        control points along +Y. The three points form a rest S-shape: root at
        origin, mid displaced laterally, tip at the chain&apos;s far end. Set{" "}
        <strong>Twist Mode → Minimum</strong> on the curve data block to
        suppress torsion artefacts along the chain. Tick{" "}
        <em>Hide in Render</em> — the curve is a rig helper, not a mesh.
      </p>

      <h3 className="font-medium mt-4 mb-1">2. Build the armature chain</h3>
      <p>
        In Edit mode, create ten bones head-to-tail along +Y. Use{" "}
        <code>b.use_connect = True</code> on each child to weld the head to
        the parent&apos;s tail. Bone +Y must align with the chain direction —
        this is Blender&apos;s default for newly created bones, so no roll
        correction is needed. The weight-paint conventions are the same as in
        the{" "}
        <Link href="/tutorials/blender-tutorial-armature-weight-paint" className={lk}>
          weight-painting tutorial
        </Link>
        : each ring of skin vertices receives a weight of 1.0 to the bone
        whose Y range contains it, with the deformer interpolating smoothly
        across adjacent groups.
      </p>

      <h3 className="font-medium mt-4 mb-1">3. Add the Spline IK constraint</h3>
      <p>
        Switch to Pose mode, select the tip bone, open Bone Constraints, click{" "}
        <em>Add Bone Constraint → Spline IK</em>. Set <em>Target</em> to the
        curve object. Set <em>Chain Length</em> to 10. The chain immediately
        conforms to the curve&apos;s rest shape. Adjust{" "}
        <em>XZ Scale Mode → Volume Preserve</em> and{" "}
        <em>Y Scale Mode → Fit Curve</em>.
      </p>

      <h3 className="font-medium mt-4 mb-1">4. Build and weight the skin mesh</h3>
      <p>
        Create a tapered tube — <code>SKIN_RINGS × SKIN_SEGS</code> vertices —
        using bmesh, tapered from <code>BASE_RADIUS</code> at root to{" "}
        <code>TIP_RADIUS</code> at tip. Assign manual vertex groups: each ring
        of <code>SKIN_SEGS</code> vertices gets weight 1.0 to the bone whose
        Y mid-point is closest. Add an Armature modifier pointing to the
        armature. Three rings per bone is sufficient for smooth bending. The
        subsurface-scattered teal material is the same node graph used in the{" "}
        <Link href="/tutorials/blender-tutorial-shader-subsurface-scattering-stylised-skin" className={lk}>
          stylised skin shader tutorial
        </Link>
        , dialled back to underwater-creature colours.
      </p>

      <h3 className="font-medium mt-4 mb-1">5. Animate three poses</h3>
      <p>
        Frame 1: rest S-curve. Frame 30: mid-point pushed further lateral and
        slightly toward camera — the prey-reach lunge. Frame 60: tip bent back
        toward root — the coiled retraction. Each pose requires three
        keyframes: <code>pts[i].co</code>, <code>pts[i].handle_right</code>,
        and <code>pts[i].handle_left</code>.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GLB export: the bake problem
      </h2>
      <p>
        glTF 2.0 has no Spline IK equivalent. The glTF-Blender-IO exporter
        will write the armature in its bind pose (straight chain) unless you
        first bake the constraint to keyframes. For a{" "}
        <strong>static deformed-pose export</strong>, the blueprint uses the
        depsgraph snapshot approach — evaluate the mesh at frame 30, extract
        it, export without any rig data. For{" "}
        <strong>animated export</strong>, bake first:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto">{`bpy.ops.nla.bake(
    frame_start=1, frame_end=60,
    only_selected=False,
    visual_keying=True,      # bakes the SOLVED transforms, not the constraint params
    clear_constraints=True,  # removes Spline IK after bake — constraint is now redundant
    use_current_action=True,
    bake_types={'POSE'},
)`}</pre>
      <p>
        After baking, the armature has explicit location/rotation/scale
        keyframes per bone that glTF-Blender-IO can export as animation
        channels. This is the same pipeline used for the NLA clips in the{" "}
        <Link href="/tutorials/blender-tutorial-nla-action-clips-vrm" className={lk}>
          NLA action clips tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Chain not following curve</strong> — confirm the constraint{" "}
          <em>Target</em> field points to the Curve object, not the Armature
          or the skin mesh.
        </li>
        <li>
          <strong>Only one bone moving</strong> —{" "}
          <code>chain_count</code> defaults to 1. Set it to <code>BONE_COUNT</code>.
        </li>
        <li>
          <strong>Mesh tears at joints</strong> — increase{" "}
          <code>SKIN_RINGS</code>. Fewer than two rings per bone causes
          visible pinching.
        </li>
        <li>
          <strong>GLB is T-pose</strong> — expected without baking. Use the
          depsgraph snapshot for a static pose or bake to keyframes for
          animation.
        </li>
        <li>
          <strong>Torsion twisting along the chain</strong> — set the curve&apos;s
          Twist Mode to <em>Minimum</em> (Curve Properties → Active Spline →
          Twist Method).
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          Blender Foundation,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/animation/constraints/tracking/spline_ik.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Spline IK Constraint — Blender Manual
          </a>{" "}
          — CC-BY-SA 4.0
        </li>
        <li>
          Nicolas Janakiev,{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting
          </a>{" "}
          — MIT
        </li>
        <li>
          Khronos Group,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0 — glTF animation export and NLA bake pipeline
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:    "blender-tutorial-armature-spline-ik-tentacle",
  title:   "Armature Spline IK — Flexible Tentacle / Tendril Rig",
  summary:
    "Fit a ten-bone chain to a Bezier curve using the Spline IK constraint. " +
    "Covers chain_count, xz_scale_mode (Volume Preserve), y_scale_mode " +
    "(Fit Curve), Bezier-handle animation, and the bake-to-keyframes pipeline " +
    "required for glTF export.",
  date:    "2026-06-11",
  tags:    ["blender", "rigging", "animation", "spline-ik", "armature", "gltf"],
  body:    ArmatureSplineIkTentacleBody,
});
