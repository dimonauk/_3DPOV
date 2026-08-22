import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PythonArmatureEditBonesBody() {
  return (
    <>
      <p>
        Three distinct Python types represent a bone depending on when and where
        you access it:{" "}
        <code>bpy.types.EditBone</code> (geometry, only live in EDIT mode),{" "}
        <code>bpy.types.Bone</code> (the frozen data bone, read-only after EDIT
        mode exits), and{" "}
        <code>bpy.types.PoseBone</code> (per-frame transform, accessible in POSE
        or OBJECT mode). The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-pose-bone-constraint-management-export-bake"
          className={lk}
        >
          Pose Bone constraints tutorial
        </Link>{" "}
        covers PoseBone in depth. This tutorial covers the part that runs first:
        constructing the skeleton itself. <code>head</code>, <code>tail</code>,
        and <code>roll</code> are EditBone-only properties — once{" "}
        <code>bpy.ops.object.mode_set(mode="OBJECT")</code> fires, the geometry
        is frozen and the EditBone collection is emptied. Any script that tries
        to set <code>arm_data.bones["spine"].head</code> on a data Bone raises{" "}
        <code>AttributeError: bpy_struct: attribute "head" from
        "Bone" is read-only</code>. The edit-mode requirement is non-negotiable.
      </p>

      <p>
        The parent–child hierarchy is set with two orthogonal fields.{" "}
        <code>bone.parent</code> places a bone in the hierarchy tree:{" "}
        transforming the parent transforms the child.{" "}
        <code>bone.use_connect</code> is an additional constraint that locks the
        child&rsquo;s <code>head</code> to the parent&rsquo;s <code>tail</code>,
        producing a connected chain with no gap. A VRM spine is a perfectly
        connected chain so every joint sets <code>use_connect = True</code>;
        shoulder bones branch from the same parent but at an offset X position,
        so their <code>use_connect</code> is <code>False</code>. Setting{" "}
        <code>use_connect = True</code> on a bone whose head does not coincide
        with the parent tail silently snaps the head — Blender enforces the
        constraint by moving the head, not raising an error. Design the bone
        positions so the chain already connects before toggling{" "}
        <code>use_connect</code>.
      </p>

      <p>
        Bone Collections (introduced in Blender 4.0, replacing the 32-layer
        integer bitmask) are assigned after returning to OBJECT mode, using the
        frozen <code>bpy.types.Bone</code> references in{" "}
        <code>arm_data.bones[name]</code>. Each collection is created with{" "}
        <code>arm_data.collections.new("Spine")</code> and bones are added with{" "}
        <code>col.assign(data_bone)</code>. Bones can belong to multiple
        collections simultaneously — a shoulder bone might appear in both{" "}
        &ldquo;Shoulders&rdquo; and an &ldquo;Upper Body&rdquo; group. Compare
        this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-bone-collections-custom-shapes"
          className={lk}
        >
          Bone Collections &amp; Custom Shapes UI tutorial
        </Link>{" "}
        for the manual workflow this script automates.
      </p>

      <p>
        Custom bone shapes are mesh objects assigned to{" "}
        <code>pose_bone.custom_shape</code> in POSE mode. The mesh is rendered
        as a wire overlay at the bone&rsquo;s transform — Blender ignores
        materials, face counts, and UV data; only the edge topology matters.{" "}
        Setting <code>obj.hide_viewport = True</code> on the widget object keeps
        it out of the scene while remaining available as a shape reference. The
        VRM convention uses a flat hexagon ring for spine bones and an elongated
        capsule for limbs. After calling{" "}
        <code>bpy.ops.object.mode_set(mode="OBJECT")</code> the blend is export-ready:
        the GLB exporter writes bones as the skeleton node and the cylinder as a
        skinned mesh primitive with per-vertex joint indices and weights derived
        from the Automatic Weights heat-diffusion solve. Three.js and Babylon.js
        can both consume this directly with{" "}
        <code>THREE.SkeletonHelper</code> and{" "}
        <code>GLTFLoader</code>. In a WebXR scene the skeleton provides the
        binding point for VRM spring-bone physics — compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM spring-bone chain tutorial
        </Link>{" "}
        that builds on top of an armature like this one.
      </p>

      <p>
        The VRM 1.0 humanoid specification maps these nine bone names to
        recognised semantic slots in a VRM runtime: physics, look-at, face
        expression blend shapes, and first-person camera offset all locate
        themselves by bone name, not by index. Scripts that build VRM armatures
        programmatically should commit these camelCase names to muscle memory —
        <code>hips</code>, <code>spine</code>, <code>chest</code>,{" "}
        <code>upperChest</code>, <code>neck</code>, <code>head</code>,{" "}
        <code>leftShoulder</code>, <code>rightShoulder</code> — because a typo
        silently disables entire VRM features without raising a validation error.
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nla-bake-ik-fk-action-push"
          className={lk}
        >
          NLA bake tutorial
        </Link>{" "}
        shows the downstream step: baking FK animations from this rig into an
        NLA strip for GLB export.
      </p>

      <p>
        <strong>Outside sources.</strong>{" "}
        Blender Foundation —{" "}
        <em>bpy.types.Armature (EditBone, PoseBone, Bone)</em>{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.Armature.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/api/5.1/bpy.types.Armature.html
        </a>{" "}
        CC-BY-SA 4.0 — the authoritative API reference for all three bone
        types, including the full EditBone socket list and the PoseBone
        matrix decomposition semantics; sibling page{" "}
        <a
          href="https://docs.blender.org/api/5.1/bpy.types.EditBone.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          bpy.types.EditBone
        </a>{" "}
        lists every property settable in EDIT mode, including{" "}
        <code>align_roll()</code> for computing roll from an up-vector target.
        Virtual Cast, Inc. —{" "}
        <em>VRM 1.0 Humanoid Bone Specification</em>{" "}
        <a
          href="https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/humanoid.md"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          github.com/vrm-c/vrm-specification
        </a>{" "}
        MIT — defines all 54 VRM humanoid bone slots (required, optional,
        suggested), their expected rest-pose orientation, and which runtimes
        consume which slots; sibling repo{" "}
        <a
          href="https://github.com/vrm-c/UniVRM"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          UniVRM
        </a>{" "}
        contains the Unity importer that reads the same name table this script
        produces.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-armature-edit-bones-vrm-spine-chain",
  title:
    "Python bpy.types.Armature — EditBone Chain: Procedural VRM Spine Skeleton for WebXR (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "The EditBone API (arm.edit_bones.new) is the only Python path to setting bone head/tail/roll — it is inaccessible outside EDIT mode and becomes read-only the instant mode_set(OBJECT) fires. Covers the three-type bone system, use_connect vs parent, Bone Collections, custom shape widgets, Automatic Weights parenting, and GLB export with skinning for WebXR VRM rigs.",
  tags: [
    "blender",
    "python",
    "scripting",
    "rigging",
    "armature",
    "vrm",
    "glb",
    "webxr",
    "skinning",
    "animation",
  ],
  Body: PythonArmatureEditBonesBody,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/scripting/python-armature-edit-bones-vrm-spine-chain",
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
      "Knows Blender's three Object modes (OBJECT, EDIT, POSE) and how to switch between them",
      "Familiar with basic rigging concepts: bones, parent–child hierarchy, vertex groups",
    ],
    steps: [
      {
        title: "Create armature data and object",
        body: "Armature data (bpy.types.Armature) exists independently of an Object. Create both, link the object to the scene collection, then make it active before calling mode_set:\n\n  arm_data = bpy.data.armatures.new('vrm_spine')\n  arm_data.display_type = 'STICK'   # STICK is clearest for tutorial screencasting\n  arm_obj = bpy.data.objects.new('vrm_spine', arm_data)\n  bpy.context.collection.objects.link(arm_obj)\n\n  bpy.context.view_layer.objects.active = arm_obj\n  arm_obj.select_set(True)\n  bpy.ops.object.mode_set(mode='EDIT')\n\nThe active_object assignment is mandatory — mode_set opens EDIT mode on whatever is currently active, not on the armature you just created.",
      },
      {
        title: "Build the spine chain in EDIT mode",
        body: "arm_data.edit_bones is a live ArmatureEditBones collection, writable only while in EDIT mode. Create each EditBone, set geometry, store references:\n\n  eb = arm_data.edit_bones\n\n  CHAIN = [\n    ('hips',       (0, 0, 0.978), (0, 0, 1.100)),\n    ('spine',      (0, 0, 1.100), (0, 0, 1.300)),\n    ('chest',      (0, 0, 1.300), (0, 0, 1.470)),\n    ('upperChest', (0, 0, 1.470), (0, 0, 1.600)),\n    ('neck',       (0, 0, 1.600), (0, 0, 1.680)),\n    ('head',       (0, 0, 1.680), (0, 0, 1.840)),\n  ]\n  created = {}\n  for name, head, tail in CHAIN:\n      bone      = eb.new(name)\n      bone.head = Vector(head)\n      bone.tail = Vector(tail)\n      bone.roll = 0.0\n      created[name] = bone\n\nroll=0 means the bone's local Y-axis (the 'up' direction in the bone's own space) points toward +global-Z. This is correct for a vertical spine. Diagonal bones (limbs) need roll computed from an explicit up-vector using bone.align_roll(up_vector).",
      },
      {
        title: "Set parent hierarchy and use_connect",
        body: "parent and use_connect are independent flags. parent places the bone in the hierarchy tree (transforms cascade). use_connect locks the child's head to the parent's tail (no gap in the chain):\n\n  PARENTS = {\n      'spine': 'hips', 'chest': 'spine',\n      'upperChest': 'chest', 'neck': 'upperChest', 'head': 'neck',\n  }\n  for child, parent_name in PARENTS.items():\n      created[child].parent      = created[parent_name]  # EditBone ref, not string\n      created[child].use_connect = True\n\n  # Shoulders branch from upperChest but sit at X ± 0.1 — NOT connected\n  for name, head, tail in SHOULDER_DEFS:\n      bone             = eb.new(name)\n      bone.head        = Vector(head)\n      bone.tail        = Vector(tail)\n      bone.roll        = 0.0\n      bone.parent      = created['upperChest']\n      bone.use_connect = False   # head position is independent of parent tail\n      created[name]    = bone\n\nDanger: assigning use_connect=True when head ≠ parent tail silently snaps the head to match. Always design bone positions to already connect before toggling use_connect.",
      },
      {
        title: "Exit EDIT mode — EditBone API closes",
        body: "Return to OBJECT mode. From this point arm_data.edit_bones is empty and invalid. Bone geometry is frozen into arm_data.bones (read-only Bone type):\n\n  bpy.ops.object.mode_set(mode='OBJECT')\n\n  # arm_data.bones[name] — bpy.types.Bone: geometry is read-only\n  # arm_obj.pose.bones[name] — bpy.types.PoseBone: pose transforms are read-write\n\nThe two post-edit types serve different roles. Bone is for reading geometry, checking parent chain, and assigning to BoneCollections. PoseBone is for setting constraints, custom shapes, pose transforms, and keyframes.\n\nCommon mistake: setting arm_data.bones['spine'].head = ... after mode exit. This raises AttributeError: attribute 'head' from 'Bone' is read-only. If you need to fix a bone's geometry, re-enter EDIT mode.",
      },
      {
        title: "Assign Bone Collections",
        body: "Bone Collections (Blender 4.0+) replace the old 32-layer integer bitmask. Create collections on the armature data, then assign data Bone references:\n\n  col_spine    = arm_data.collections.new('Spine')\n  col_shoulder = arm_data.collections.new('Shoulders')\n\n  for name, *_ in BONE_CHAIN:\n      col_spine.assign(arm_data.bones[name])\n  for name, *_ in SHOULDER_DEFS:\n      col_shoulder.assign(arm_data.bones[name])\n\nA bone can belong to multiple collections simultaneously. .assign() takes a Bone reference, not a string. Misspelling the bone name in arm_data.bones['typo'] raises KeyError — validate names before the loop if building from external data.",
      },
      {
        title: "Set custom bone shapes in POSE mode",
        body: "Custom shapes need a mesh Object as the display widget. Any mesh works; only its wire edges render. Create a flat hexagon:\n\n  def hexagon_widget(name, r=0.06):\n      m = bpy.data.meshes.new(name)\n      bm_inner = bmesh.new()\n      n = 6\n      verts = [bm_inner.verts.new(\n          (r * math.cos(2 * math.pi * i / n),\n           r * math.sin(2 * math.pi * i / n), 0)) for i in range(n)]\n      bm_inner.edges.new(verts + [verts[0]])  # closed loop\n      bm_inner.to_mesh(m); bm_inner.free()\n      obj = bpy.data.objects.new(name, m)\n      bpy.context.collection.objects.link(obj)\n      obj.hide_viewport = True   # hidden from scene, usable as widget\n      return obj\n\n  widget = hexagon_widget('WGT_Spine')\n\n  bpy.ops.object.mode_set(mode='POSE')\n  for bone_name in arm_data.bones:\n      pb = arm_obj.pose.bones[bone_name]\n      pb.custom_shape = widget\n      pb.use_custom_shape_bone_size = True  # scales with bone length\n  bpy.ops.object.mode_set(mode='OBJECT')",
      },
      {
        title: "Parent mesh with Automatic Weights and export GLB",
        body: "Automatic Weights (Ctrl+P → With Automatic Weights) runs heat-diffusion to fill vertex groups named after each bone. The operator requires the armature as the ACTIVE object and the mesh also selected:\n\n  bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.16, depth=0.84,\n                                       location=(0, 0, 1.30))\n  mesh_obj = bpy.context.active_object\n  mesh_obj.name = 'body_proxy'\n\n  bpy.ops.object.mode_set(mode='EDIT')\n  bpy.ops.mesh.subdivide(number_cuts=2)  # more verts = better weight gradient\n  bpy.ops.object.mode_set(mode='OBJECT')\n\n  mesh_obj.select_set(True)\n  arm_obj.select_set(True)\n  bpy.context.view_layer.objects.active = arm_obj\n  bpy.ops.object.parent_set(type='ARMATURE_AUTO')\n\n  for obj in bpy.context.scene.objects:\n      obj.select_set(obj.type in {'MESH', 'ARMATURE'})\n  bpy.ops.export_scene.gltf(\n      filepath=bpy.path.abspath('//vrm_spine_skeleton.glb'),\n      use_selection=True, export_skins=True, export_apply=True,\n      export_animations=False,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n  )\n\nexport_skins=True writes the inverse bind matrices and joint node indices as GLTF skin primitives. Three.js GLTFLoader reconstructs the skeleton automatically from this data.",
      },
    ],
    finalResult:
      "A .blend containing a nine-bone VRM 1.0 spine + shoulder armature (hips → head + leftShoulder + rightShoulder) with hexagon-ring custom bone shapes and two Bone Collections (Spine, Shoulders). A subdivided cylinder body proxy is parented with Automatic Weights. vrm_spine_skeleton.glb contains the skinned mesh with embedded skeleton — importable directly into Three.js, Babylon.js, or a WebXR scene. The VRM add-on (vrm-c, MIT) will recognise the bone names without any additional mapping.",
    variations: [
      "Full humanoid: extend BONE_CHAIN and SHOULDER_DEFS with upper_arm, lower_arm, hand and leg chains. Use the same loop pattern. The VRM 1.0 spec defines 18 required bones and 36 optional; build them in anatomical order so each parent exists before its children are created.",
      "Roll from up-vector: for limb bones that need a specific 'elbow points outward' orientation, replace bone.roll = 0.0 with bone.align_roll(Vector((0, 0, 1))) or a computed up-vector. align_roll sets roll so the bone's local +Y axis matches the provided vector as closely as possible given the bone's direction.",
      "BVH import bridge: read a BVH file with Python (it is a plain-text ASCII format), create an armature from the HIERARCHY section using the same eb.new() loop, then keyframe each MOTION frame into the armature's pose using pose.bones[name].rotation_quaternion + keyframe_insert().",
      "Programmatic weights: instead of ARMATURE_AUTO, manually create vertex groups via mesh_obj.vertex_groups.new(name=bone_name) then group.add(vertex_indices, weight, 'REPLACE'). This gives precise control over which vertices influence which bone — necessary for VRM blend shapes that must not be deformed by the wrong bone.",
      "Export as VRM: after building the skeleton, install the VRM add-on (vrm-c, MIT) and call bpy.ops.export_scene.vrm(filepath='...', export_invisibles=False). The exporter reads the humanoid bone names from the armature and generates the VRMC_vrm extension block automatically.",
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: attribute 'head' from 'Bone' is read-only",
        cause: "Attempting to set bone geometry after exiting EDIT mode. arm_data.bones[name] returns a read-only Bone, not an EditBone.",
        fix: "Re-enter EDIT mode: bpy.ops.object.mode_set(mode='EDIT'); then set arm_data.edit_bones[name].head/tail/roll; then return to OBJECT mode.",
      },
      {
        symptom: "arm_data.edit_bones is empty after entering EDIT mode",
        cause: "bpy.context.active_object was not the armature when mode_set was called. EDIT mode opens on whatever is currently active.",
        fix: "Set bpy.context.view_layer.objects.active = arm_obj and call arm_obj.select_set(True) before bpy.ops.object.mode_set(mode='EDIT').",
      },
      {
        symptom: "Child bone snaps to unexpected position when use_connect=True is set",
        cause: "use_connect locks the child head to the parent tail. If the child's head was positioned elsewhere, Blender silently moves it.",
        fix: "Design BONE_CHAIN positions so that each connected bone's head exactly matches its parent's tail before setting use_connect=True. Inspect with print(bone.head, parent.tail) to verify coincidence.",
      },
      {
        symptom: "Automatic Weights fails or produces all-zero weights",
        cause: "The mesh and armature are too far apart for the heat-diffusion solver, or the active object was the mesh instead of the armature during parent_set.",
        fix: "Ensure arm_obj is active (bpy.context.view_layer.objects.active = arm_obj) when calling parent_set(type='ARMATURE_AUTO'). Also check that the mesh overlaps the armature — the body proxy cylinder must enclose the bone chain or the heat solver finds no path.",
      },
      {
        symptom: "BoneCollection.assign() raises KeyError for a bone name",
        cause: "The bone name string was misspelled, or arm_data.bones was accessed before mode_set(OBJECT) completed.",
        fix: "Access arm_data.bones only after returning to OBJECT mode. Validate names with: assert name in arm_data.bones, f'{name} not found'. Print arm_data.bones.keys() to see what was actually created.",
      },
    ],
  },
  base,
);
