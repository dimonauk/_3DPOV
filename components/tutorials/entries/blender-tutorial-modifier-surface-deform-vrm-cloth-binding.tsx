import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function SurfaceDeformBody() {
  return (
    <>
      <p>
        The Surface Deform modifier solves a deceptively hard problem: how do
        you make a garment mesh follow a character body through arbitrary
        deformation — armature poses, shape keys, even a cloth sim — without
        the garment sliding across the body surface? The answer is a one-time{" "}
        <em>bind</em>. At bind time, Blender projects every vertex of the bound
        mesh (the tunic) onto the surface of the target mesh (the body), records
        which triangle it landed in and its exact barycentric coordinates within
        that triangle, then stores that relationship permanently. From that
        moment on, whenever the body moves, the garment vertex rides the same
        triangle — it has no choice but to follow the body topology, seams and
        all. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-lattice-shrinkwrap-prop-cage"
          className={lk}
        >
          Lattice + Shrinkwrap prop cage tutorial
        </Link>
        , where Shrinkwrap re-projects to the nearest surface every frame and
        consequently slides whenever the character poses — a fundamental
        difference in architecture.
      </p>

      <p>
        Bind fidelity is bounded by target mesh resolution. Surface Deform
        searches the triangle nearest each garment vertex; if the body has only
        192 quads (a 12×16 cylinder), those triangles are large and a sharp
        shoulder crease maps poorly. Applying a Subdivision Surface (level 2)
        to the body before binding raises the count to 3 072 quads — the maximum
        bind gap around the circumference shrinks from ≈ 11 cm to ≈ 3 cm, and
        creases track cleanly. This is the same resolution argument that applies
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
          className={lk}
        >
          weight paint VRM deformation envelope tutorial
        </Link>
        : denser body topology always gives the deformation system more to work
        with. The subdivision only needs to exist at bind time — you can apply
        it and discard the extra polygons from the render body afterwards if
        real-time budget demands it, because the bind data was already recorded.
      </p>

      <p>
        One hard ordering rule: <strong>bind in rest pose</strong>. The modifier
        records barycentric coordinates relative to the body vertices in their
        current world positions. If the body has an armature pose active at bind
        time, the recorded coordinates describe the posed surface, not the rest
        surface. When the character then returns to rest, the garment drifts from
        the body. In practice: add the Surface Deform modifier to the garment,
        set the target, <em>then</em> add the Armature modifier to the body and
        pose it. Never the other way round. This sequencing constraint also
        matters for VRM rigs that use corrective shape keys — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-rigging-stretchy-ik-volume-preserve-vrm"
          className={lk}
        >
          stretchy IK tutorial
        </Link>{" "}
        for the rest-pose discipline required when setting up driven deformations
        before any IK targets are placed.
      </p>

      <p>
        The <code>falloff</code> exponent controls how sharply the influence
        weight drops off with distance from the nearest triangle. At 4.0
        (default), vertices slightly outside the target boundary still receive a
        smooth blend from nearby triangles — ideal for soft fabric where the hem
        floats a few millimetres clear. At higher values (8–12) the falloff
        becomes near-binary, which suits rigid accessories (a belt clasp, an
        earring) where you want the object to track a precise point on the
        surface without any blurring across adjacent triangles. The{" "}
        <code>strength</code> scalar is a blend between the garment&apos;s
        original position (0.0) and the fully deformed position (1.0), giving
        you an easy way to partially detach an accessory — useful for break-off
        animation.
      </p>

      <p>
        For WebXR and GLB export, Surface Deform must be resolved to actual
        vertex positions before the file is written. The simplest path is{" "}
        <code>export_apply=True</code> in the glTF operator, which applies all
        modifiers on exported copies without touching the live .blend stack.
        This gives a static mesh snapshot at the current frame — fine for
        props and scenery. For a fully animated VRM export where the garment
        moves with the skeleton in Three.js: apply Surface Deform (baking the
        rest-pose fit), then add an Armature modifier to the garment referencing
        the same skeleton, and use the Data Transfer modifier to copy the
        body&apos;s vertex group weights onto the garment. The result is a
        garment driven entirely by the armature, as clean as the body mesh
        itself. The alternative — a physics-driven garment via the cloth
        simulator — is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-flag-banner"
          className={lk}
        >
          cloth simulation flag banner tutorial
        </Link>
        ; Surface Deform and cloth sim can be combined (cloth sim on a
        low-poly proxy, Surface Deform binding the high-res garment to the
        proxy), which is the professional character-cloth pipeline for VRM.
      </p>

      <p>
        <strong>Outside sources:</strong>{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/surface_deform.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Surface Deform Modifier
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) — covers the bind operator, falloff
        exponent, strength blend, and the Mesh Deform modifier sibling which
        uses a volumetric cage rather than a surface projection; related page is
        the Mesh Deform entry at{" "}
        <code>
          docs.blender.org/manual/…/modeling/modifiers/deform/mesh_deform.html
        </code>
        .{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.SurfaceDeformModifier.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Python API — SurfaceDeformModifier
        </a>{" "}
        (CC-BY-SA 4.0, Blender Documentation Team) — lists all Python-accessible
        properties including <code>is_bound</code>, <code>falloff</code>,{" "}
        <code>strength</code>, and <code>target</code>; related projects are
        projects.blender.org (source) and developer.blender.org (design docs for
        the modifier rewrite in 4.x).
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-surface-deform-vrm-cloth-binding",
  title:
    "Modifier — Surface Deform: Bind Accessories & Cloth to a VRM Character Mesh (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Surface Deform records the barycentric position of each garment vertex on the body surface at bind time, then rides that triangle through any deformation — armature poses, shape keys, cloth sims — without sliding. Covers bind resolution via Subdivision Surface, the falloff exponent for soft fabric vs rigid accessories, rest-pose ordering discipline, and the export_apply vs Data Transfer weight-transfer paths for rigged GLB export.",
  Body: SurfaceDeformBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed.",
      "Familiarity with adding modifiers in the Properties panel.",
      "Basic Pose Mode experience — see the FK/IK switch tutorial for a primer on armature posing.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Surface Deform modifier available since Blender 2.82. bpy.context.temp_override() for headless bind requires Blender 3.2+. The mod.is_bound property is readable since 3.0.",
      },
    ],
    steps: [
      {
        title: "Understand why Surface Deform doesn't slide",
        body:
          "# Surface Deform vs Shrinkwrap — the key architectural difference:\n#\n# Shrinkwrap (re-projection every frame):\n#   Frame 1: garment vert at (0.1, 0, 0.4) → projects to body surface\n#   Frame 2: body deforms → garment vert projects again to NEAREST surface point\n#   Problem: nearest point can jump to a different part of the body → SLIDING\n#\n# Surface Deform (bind once, follow forever):\n#   Bind:   garment vert at (0.1, 0, 0.4) → projects to triangle T42 at (u=0.3, v=0.5)\n#   Stored: {triangle_index: 42, u: 0.3, v: 0.5}\n#   Frame 2: body deforms → T42's three vertices move → garment vert = interp(T42, 0.3, 0.5)\n#   Result: garment vert is ALWAYS 30%/50% inside T42, regardless of how T42 moves\n#   No sliding. The topological relationship is fixed.\n#\n# Trade-off: if the body undergoes deformations so extreme that T42's area\n# inverts (the triangle flips), the garment vertex will also flip — Surface\n# Deform cannot prevent extreme topology inversions.  Keep garment vertices\n# safely away from high-compression zones (inner elbows, crotch crease).",
      },
      {
        title: "Build the body torso (bind target)",
        body:
          "import bpy, bmesh, math, pathlib\nfrom mathutils import Vector\n\nBODY_RADIUS = 0.22\nBODY_HEIGHT = 0.55\nBODY_SEGS   = 12\nBODY_SUBD   = 2\n\nbpy.ops.object.select_all(action='SELECT')\nbpy.ops.object.delete(use_global=False)\n\nbpy.ops.mesh.primitive_cylinder_add(\n    vertices=BODY_SEGS, depth=BODY_HEIGHT, radius=BODY_RADIUS,\n    end_fill_type='NGON',\n    location=(0, 0, BODY_HEIGHT / 2),\n)\nbody = bpy.context.active_object\nbody.name = 'body_torso'\n\n# Light waist pinch with bmesh — gives the surface interesting topology\n# for the bind to track around curves.\nbm = bmesh.new()\nbm.from_mesh(body.data)\nwaist_z = BODY_HEIGHT * 0.45\nfor v in bm.verts:\n    t = 1.0 - abs(v.co.z - waist_z) / (BODY_HEIGHT * 0.30)\n    if 0.0 < t < 1.0:\n        v.co.x *= 1.0 - 0.12 * t\n        v.co.y *= 1.0 - 0.12 * t\nbm.to_mesh(body.data)\nbm.free()\n\n# Apply Subdivision Surface at level 2 — raises quad count from 192 to ~3072.\n# More triangles = smaller maximum bind gap = smoother garment deformation.\n# The subdivision only needs to exist at BIND TIME.  After binding the garment\n# you can decimate the body for real-time use without affecting the stored\n# barycentric coordinates.\nsubd = body.modifiers.new('Subd', 'SUBSURF')\nsubd.levels = BODY_SUBD\nbpy.ops.object.modifier_apply(modifier='Subd')\nprint(f'Body: {len(body.data.vertices)} verts, {len(body.data.polygons)} polys')",
      },
      {
        title: "Build the open-ended tunic garment",
        body:
          "GARMENT_INSET  = 0.008   # metres outward from body surface\nGARMENT_HEIGHT = 0.50\n\n# end_fill_type='NOTHING' — open tube, no top/bottom cap polygons.\n# The hem and collar are open edge loops, which is correct garment topology.\nbpy.ops.mesh.primitive_cylinder_add(\n    vertices=BODY_SEGS * 2,               # double radial count for cleaner bind\n    depth=GARMENT_HEIGHT,\n    radius=BODY_RADIUS + GARMENT_INSET,\n    end_fill_type='NOTHING',\n    location=(0, 0, GARMENT_HEIGHT / 2 + 0.025),\n)\ngarment = bpy.context.active_object\ngarment.name = 'tunic'\n\n# Push verts outward along their normals with bmesh — prevents z-fighting\n# at rest pose where garment and body are very close.\nbm = bmesh.new()\nbm.from_mesh(garment.data)\nbm.normal_update()   # recompute after any geometry changes\nfor v in bm.verts:\n    v.co += v.normal * 0.003\nbm.to_mesh(garment.data)\nbm.free()\ngarment.data.update()\n\n# At this point garment is a slightly inflated tube around the body.\n# Both objects are in 'rest' state (no armature, no pose) — correct bind context.",
      },
      {
        title: "Add Surface Deform, set target, bind",
        body:
          "# Add the modifier to the GARMENT (not the body).\n# The target points to the BODY — that's the surface the garment binds to.\nmod = garment.modifiers.new('SurfaceDeform', 'SURFACE_DEFORM')\nmod.target   = body\nmod.strength = 1.0    # 0 = garment stays put, 1 = fully follows body\nmod.falloff  = 4.0    # exponent for influence falloff across tri boundary\n#                       4.0 = default, smooth fabric\n#                       8–12 = harder cutoff, rigid accessories\n\n# The bind operator reads bpy.context.active_object.\n# temp_override redirects operator context without touching scene context.\n# Available in Blender 3.2+.  Required for headless / --background execution.\nbpy.context.view_layer.objects.active = garment\ngarment.select_set(True)\nwith bpy.context.temp_override(active_object=garment, object=garment):\n    result = bpy.ops.object.surfacedeform_bind(modifier=mod.name)\n\nif 'FINISHED' not in result:\n    raise RuntimeError(\n        'Bind failed.  Common causes:\\n'\n        '  - body mesh not manifold (has open edges / non-planar faces)\\n'\n        '  - body has zero polygons\\n'\n        '  - mod.target was not set before bind call'\n    )\n\nprint(f'is_bound = {mod.is_bound}')   # True on success\n# The bind data is now stored inside the modifier.\n# Move the body mesh in Pose Mode and the tunic will follow.",
      },
      {
        title: "Add armature, parent body with Automatic Weights",
        body:
          "ARM_HEIGHT = BODY_HEIGHT * 0.5\n\narm_data = bpy.data.armatures.new('VRM_Spine')\narm_data.display_type = 'STICK'\narm_obj  = bpy.data.objects.new('VRM_Spine', arm_data)\nbpy.context.collection.objects.link(arm_obj)\nbpy.context.view_layer.objects.active = arm_obj\n\nbpy.ops.object.mode_set(mode='EDIT')\nsp = arm_data.edit_bones.new('spine')\nsp.head = Vector((0, 0, 0))\nsp.tail = Vector((0, 0, ARM_HEIGHT))\nbpy.ops.object.mode_set(mode='OBJECT')\n\n# Parent BODY to armature with Automatic Weights.\n# CRITICAL: the garment already has Surface Deform bound.\n# Adding Armature to the BODY (not the garment) means:\n#   body deforms via armature\n#   garment deforms via Surface Deform tracking the body\n# This is the correct modifier chain — the garment needs NO armature modifier.\nbpy.ops.object.select_all(action='DESELECT')\nbody.select_set(True)\narm_obj.select_set(True)\nbpy.context.view_layer.objects.active = arm_obj\nbpy.ops.object.parent_set(type='ARMATURE_AUTO')\nprint('Body parented.  Garment now follows body automatically via Surface Deform.')",
      },
      {
        title: "Animate spine lean — observe garment following",
        body:
          "SPINE_ROT_DEG = 28.0\nANIM_FRAMES   = 60\n\nbpy.context.scene.frame_start = 1\nbpy.context.scene.frame_end   = ANIM_FRAMES\nbpy.context.view_layer.objects.active = arm_obj\nbpy.ops.object.mode_set(mode='POSE')\n\npb = arm_obj.pose.bones['spine']\npb.rotation_mode = 'XYZ'\npeak = math.radians(SPINE_ROT_DEG)\n\nfor frame, rx in ((1, 0.0), (ANIM_FRAMES // 2, peak), (ANIM_FRAMES, 0.0)):\n    bpy.context.scene.frame_set(frame)\n    pb.rotation_euler = (rx, 0, 0)\n    pb.keyframe_insert('rotation_euler', frame=frame)\n\nbpy.ops.object.mode_set(mode='OBJECT')\n\n# The garment (tunic) needs ZERO keyframes here.\n# Surface Deform evaluates on every frame by reading the body's current state.\n# Press Space to play — the tunic follows the spine lean without any extra keys.\n# VERIFY:\n#   At frame 30 (peak lean), scrub back to frame 1 and UNBIND the modifier —\n#   the garment pops back to its original unbound tube shape.\n#   Re-bind to restore tracking.",
      },
      {
        title: "Export rest-pose GLB snapshot",
        body:
          "import pathlib\nOUT_DIR = pathlib.Path(bpy.data.filepath).parent if bpy.data.filepath else pathlib.Path('/tmp')\n\n# Jump to rest pose for a clean export baseline.\nbpy.context.scene.frame_set(1)\nbpy.ops.object.select_all(action='DESELECT')\nbody.select_set(True)\ngarment.select_set(True)\nbpy.context.view_layer.objects.active = body\n\n# export_apply=True applies Surface Deform on the EXPORTED copy of the garment.\n# The live modifier stack in the .blend is untouched.\n# The exported garment is a baked static mesh shaped to the current frame.\nbpy.ops.export_scene.gltf(\n    filepath=str(OUT_DIR / 'vrm_cloth_binding.glb'),\n    use_selection=True,\n    export_format='GLB',\n    export_apply=True,\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_yup=True,\n)\nprint('Exported → vrm_cloth_binding.glb')\n\n# For a RIGGED garment (garment moves with skeleton in Three.js):\n#   1. Duplicate the garment.\n#   2. Apply Surface Deform on the duplicate (bakes rest-pose vertex positions).\n#   3. Add Armature modifier to the duplicate, referencing the same armature.\n#   4. Add Data Transfer modifier to the duplicate:\n#          source=body, data_type='VGROUP_WEIGHTS', use_vert_data=True\n#      This copies the body's vertex group weights onto the garment.\n#   5. Apply Data Transfer, then export with export_skins=True.\n#   Result: garment driven by skeleton, no Surface Deform in the GLB.",
      },
    ],
  },
  base,
);
