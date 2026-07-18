import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Linear blend skinning — the armature deformation every GLB viewer uses
        — loses volume at bent joints. Bend an elbow to 90° and the inside
        crease collapses into a hard ridge; the tube cross-section pinches from a
        circle to a lens. <code>CorrectiveSmoothModifier</code> fixes this
        without a corrective shape key per pose angle. It sits{" "}
        <em>after</em> <code>ArmatureModifier</code> in the stack and works by
        computing a Laplacian-smooth delta on the rest-pose geometry, then adding
        that delta to the deformed output:
      </p>
      <pre>{`delta  =  smooth(rest)  −  rest
output =  deformed  +  delta`}</pre>
      <p>
        At the elbow crease the smooth inflates the pinched tube slightly. When
        that inflation is re-applied to the deformed mesh, the lost volume returns
        — with no shader cost and no shape key per angle. The approach
        complements, rather than replaces, the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
        >
          corrective shape key + driver technique
        </Link>{" "}
        covered elsewhere; the modifier works best for smooth organic surfaces
        while corrective shapes handle very specific extreme angles or character
        expressions.
      </p>

      <h2>Why smooth_type = LENGTH_WEIGHTED</h2>
      <p>
        The modifier offers two Laplacian variants: <code>SIMPLE</code> (uniform
        per-vertex averaging) and <code>LENGTH_WEIGHTED</code> (force weighted
        by edge length). Dense topology at joint creases — the short edges
        produced by extra loop cuts near the elbow — receives proportionally less
        smoothing force in <code>LENGTH_WEIGHTED</code> mode. This preserves
        local curvature whilst still filling in the volume collapse. On a uniform
        arm mesh the difference is subtle; on a VRM character mesh with crease
        loops the difference is significant — <code>SIMPLE</code> visibly
        flattens the dense region.
      </p>

      <h2>Why rest_source = ORCO</h2>
      <p>
        <code>ORCO</code> uses the mesh&rsquo;s original coordinate positions
        (the undeformed geometry stored in the Mesh data block) as the rest
        reference. No interactive bind step is required, making it the correct
        choice for headless scripting. Compare this to{" "}
        <code>BIND</code>, which snapshots the deformed-state coordinates at the
        moment you call <code>bpy.ops.object.correctivesmooth_bind()</code> — an
        operator that requires an active 3D Viewport context and is therefore
        cumbersome in a pipeline script.
      </p>

      <h2>Arm mesh construction</h2>
      <p>
        The arm is a tapered cylinder along the Y axis (shoulder at{" "}
        <code>y=0</code>, wrist at <code>y=ARM_LENGTH</code>).{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr"
        >
          SkinModifier builds character blockouts from wire
        </Link>
        ; this tutorial instead builds the tube directly so topology is under
        explicit control — the elbow cross-section must be the narrowest point
        for the corrective delta to be maximal there.
      </p>
      <pre>{`for i in range(ARM_SEGMENTS):
    y = ARM_LENGTH * i / (ARM_SEGMENTS - 1)

    # Two-segment radius taper: shoulder → elbow → wrist
    if y <= ARM_LENGTH * 0.5:
        frac = y / (ARM_LENGTH * 0.5)
        r = R_SHOULDER + (R_ELBOW - R_SHOULDER) * frac
    else:
        frac = (y - ARM_LENGTH * 0.5) / (ARM_LENGTH * 0.5)
        r = R_ELBOW + (R_WRIST - R_ELBOW) * frac

    ring = []
    for j in range(ARM_SIDES):
        angle = 2.0 * math.pi * j / ARM_SIDES
        v = bm.verts.new(Vector((r * math.cos(angle), y, r * math.sin(angle))))
        ring.append(v)
    rings.append(ring)`}</pre>

      <h2>Vertex groups</h2>
      <p>
        Three vertex groups drive the modifier stack.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
        >
          VRM deform envelope fundamentals
        </Link>{" "}
        covers the weight-assign API in depth; here the key addition is{" "}
        <code>cs_elbow</code> — a bell-curve group centred on the joint that
        masks <code>CorrectiveSmoothModifier</code> to the joint region only.
        Confining the correction stops the modifier fighting against intentionally
        flat cuffs or collar geometry.
      </p>
      <pre>{`# cs_elbow: weight 1.0 at elbow, falls off over ±30 % of ARM_LENGTH
dist_from_elbow = abs(y - ARM_LENGTH * 0.5)
half_width      = ARM_LENGTH * 0.30
w_cs = max(0.0, 1.0 - dist_from_elbow / half_width)
vg_cs.add(idxs, w_cs, "REPLACE")`}</pre>

      <h2>Modifier stack</h2>
      <p>
        Stack order matters.{" "}
        <code>CorrectiveSmoothModifier</code> placed before{" "}
        <code>ArmatureModifier</code> operates on undeformed geometry and sees
        no crease — the corrective delta is effectively zero everywhere. Always
        place it second.
      </p>
      <pre>{`# First: deform the mesh with skinning
arm_mod = mesh_obj.modifiers.new("Armature", "ARMATURE")
arm_mod.object = arm_obj
arm_mod.use_deform_preserve_volume = True   # quaternion blend; less volume loss to begin with

# Second: correct what remains after skinning
cs_mod = mesh_obj.modifiers.new("CorrectiveSmooth", "CORRECTIVE_SMOOTH")
cs_mod.smooth_type         = "LENGTH_WEIGHTED"
cs_mod.rest_source         = "ORCO"
cs_mod.factor              = 1.0      # 1.0 = full correction
cs_mod.iterations          = 3        # 3–5 is character-safe; ≥6 starts to balloon
cs_mod.vertex_group        = "cs_elbow"
cs_mod.invert_vertex_group = False
cs_mod.use_pin_boundary    = True     # keep endcap rings from drifting
cs_mod.use_only_smooth     = False    # False = full corrective-delta mode`}</pre>
      <p>
        <code>use_deform_preserve_volume = True</code> on the Armature modifier
        activates quaternion-based blending (B-Smooth) rather than the default
        linear blending. It already reduces volume loss noticeably, so{" "}
        <code>CorrectiveSmoothModifier</code> has less work to do — lower{" "}
        <code>iterations</code> values are sufficient.
      </p>

      <h2>Posing and export</h2>
      <pre>{`# Pose the elbow to 90° before export
bpy.context.view_layer.objects.active = arm_obj
bpy.ops.object.mode_set(mode="POSE")

pb = arm_obj.pose.bones["Forearm"]
pb.rotation_mode    = "XYZ"
pb.rotation_euler.x = math.radians(90.0)

bpy.ops.object.mode_set(mode="OBJECT")

# export_apply=True collapses ArmatureModifier + CorrectiveSmoothModifier
# into a static snapshot of the corrected 90° bent arm for WebXR preview
bpy.ops.export_scene.gltf(
    filepath     = path,
    export_apply = True,
    export_yup   = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = "WEBP",
)`}</pre>

      <h2>Armature setup</h2>
      <p>
        The two-bone armature follows the same joint-chain pattern described in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain"
        >
          Python armature edit-bones — VRM spine chain
        </Link>
        . Bones are created in EDIT mode; the Forearm bone is parented to
        UpperArm so rotations propagate correctly. For a production VRM rig
        you would rename bones to VRM spec names (<code>LeftUpperArm</code>,{" "}
        <code>LeftLowerArm</code>) and apply this same modifier stack.
      </p>

      <h2>Failure modes</h2>
      <pre>{`# 1. No visible correction — modifier placed before ArmatureModifier.
#    Fix: ensure CorrectiveSmoothModifier is listed AFTER Armature in
#    obj.modifiers (check index order via list(obj.modifiers)).

# 2. Balloon or over-inflate at elbow — iterations too high.
#    Fix: reduce iterations to 2–3. Lower factor to 0.5–0.8 for partial blend.

# 3. cs_elbow vertex group missing — modifier silently operates on ALL verts.
#    Fix: assign the group before adding the modifier. Verify with:
#    print([vg.name for vg in obj.vertex_groups])

# 4. Wrist/shoulder caps drift inward after correction.
#    Fix: set use_pin_boundary = True.

# 5. BIND rest_source fails in headless — bpy.ops.object.correctivesmooth_bind()
#    requires an active 3D Viewport context.
#    Fix: use rest_source = 'ORCO' for scripts; reserve BIND for interactive sessions.`}</pre>

      <h2>See also</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver"
          >
            Corrective shape keys + driver
          </Link>{" "}
          — the complementary approach: a shape key activated by a pose driver at
          a specific angle. More surgical control over extreme poses; more
          authoring cost. Combine with CorrectiveSmoothModifier for complex rigs.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-vertex-group-weight-assign-vrm-deform-envelope"
          >
            VRM deform envelope — vertex group weight assign
          </Link>{" "}
          — the full weight-painting API: creating groups, assigning by vertex
          index, smooth-gradient blending across joint seams.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr"
          >
            SkinModifier — wire-to-mesh character blockout
          </Link>{" "}
          — for rapid blockout; apply CorrectiveSmoothModifier after Armature on
          the Skin-generated surface when the blockout is promoted to production
          geometry.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain"
          >
            Python armature edit-bones — VRM spine chain
          </Link>{" "}
          — joint-chain construction pattern; the two-bone arm used here follows
          the same edit-bones API.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/corrective_smooth.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Corrective Smooth Modifier — Blender 5.1 Manual
          </a>{" "}
          (CC-BY-SA-4.0 · Blender Foundation). Canonical parameter reference
          including the BIND operator, smooth-type descriptions, and the
          distinction between rest_source modes; related project:{" "}
          <a
            className={lk}
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/CGArtPython/blender_plus_python"
            target="_blank"
            rel="noopener noreferrer"
          >
            CGArtPython/blender_plus_python
          </a>{" "}
          (MIT · Victor Stepanov). Headless bpy scripting patterns for armature
          setup, pose-bone rotation, and modifier stack management; related
          repository:{" "}
          <a
            className={lk}
            href="https://github.com/CGArtPython/bpy_building_blocks"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy_building_blocks
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-corrective-smooth-modifier-deform-artifact-fix-vrm-webxr",
  title:
    "Python bpy.types.CorrectiveSmoothModifier — Laplacian Joint-Volume Recovery: smooth_type LENGTH_WEIGHTED, ORCO Rest Source & VRM Elbow Crease Fix for WebXR (Blender 5.1)",
  summary:
    "CorrectiveSmoothModifier eliminates the volume-loss crease that linear blend skinning produces at bent joints; it computes delta = smooth(rest) − rest and adds that delta to the deformed output — the smooth inflates the pinched elbow tube slightly, and that inflation counteracts the collapse; smooth_type=LENGTH_WEIGHTED distributes smoothing force proportional to edge length, preserving dense crease-loop detail that SIMPLE mode flattens; rest_source=ORCO uses the original undeformed mesh coordinates as rest reference without requiring the interactive correctivesmooth_bind operator, making it headless-safe; rest_source=BIND snapshots any posed state as rest but requires an active 3D Viewport context and is therefore reserved for interactive sessions; factor=1.0 applies full correction, lower to 0.5–0.8 to blend with corrective shape keys; iterations=3 is the character-safe sweet spot — ≥6 starts to balloon the mesh; use_pin_boundary=True prevents boundary endcap rings from drifting; vertex_group='cs_elbow' with a bell-curve weight confines the correction to the joint region, preventing the modifier fighting flat collar or cuff geometry; placement is critical — CorrectiveSmoothModifier MUST come after ArmatureModifier in the stack or it sees undeformed geometry and produces zero delta; use_deform_preserve_volume=True on ArmatureModifier activates quaternion-blend (B-Smooth) which already reduces volume loss, allowing lower iteration counts on CorrectiveSmoothModifier; outside sources: Corrective Smooth Modifier Blender 5.1 Manual CC-BY-SA-4.0 Blender Foundation; CGArtPython/blender_plus_python MIT Victor Stepanov.",
  tags: [
    "blender",
    "python",
    "scripting",
    "corrective-smooth",
    "deform-modifier",
    "armature",
    "vrm",
    "joint-correction",
    "laplacian",
    "vertex-group",
    "character-rigging",
    "webxr",
    "glb",
  ],
  topic: "scripting",
  date: "2026-07-18",
  body: Body,
});
