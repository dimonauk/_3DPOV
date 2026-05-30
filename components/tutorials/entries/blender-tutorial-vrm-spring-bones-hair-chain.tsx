import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function VrmSpringBonesHairChainBody() {
  return (
    <>
      <p>
        In Blender 3.x, bones were assigned to one of thirty-two anonymous
        bit-flag layers. In Blender 4.0 those layers were replaced by{" "}
        <strong>Bone Collections</strong> — named groups with a Python API that
        creates and assigns in two clean lines. This matters for VRM characters
        because the{" "}
        <a
          href="https://github.com/saturday06/VRM-Addon-for-Blender"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          VRM Addon for Blender
        </a>{" "}
        identifies which bones belong to the spring-bone simulation chain by
        collection name, not by layer index. If you migrate a scene from 3.x
        without updating the armature structure, the addon sees no spring bones
        and exports a character with static hair.
      </p>

      <p>
        This tutorial builds a five-bone armature (Root → Spine → Head →
        Hair_1…Hair_4), places the humanoid chain in a{" "}
        <code>Humanoid</code> collection and the hair chain in a{" "}
        <code>SpringBone_Hair</code> collection, then attaches spring physics
        parameters as custom properties on each hair bone. The resulting{" "}
        <code>.blend</code> exports correctly as a skinned GLB and is
        immediately ready for the VRM addon&rsquo;s spring-bone panel when you
        install it. This builds directly on the bone hierarchy from the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature and weight paint tutorial
        </Link>{" "}
        and extends the VRM workflow established in the{" "}
        <Link
          href="/tutorials/blender-tutorial-nla-action-clips-vrm"
          className={lk}
        >
          NLA action clips tutorial
        </Link>
        .
      </p>

      <p>
        The core physics model comes from the{" "}
        <a
          href="https://github.com/vrm-c/vrm-spec/blob/master/specification/VRMC_springBone-1.0/README.md"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          VRMC_springBone 1.0 specification
        </a>{" "}
        (MIT, VRM Consortium): a chain of joints where each joint has a
        stiffness, drag force, and collision radius. The runtime — such as{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          @pixiv/three-vrm
        </a>{" "}
        (MIT, pixiv Inc.) — runs Verlet integration on the chain each frame,
        producing dynamic sway at sub-millisecond cost. The critical insight is
        that Blender&rsquo;s Cloth and SoftBody simulators cannot do this job:
        they bake their physics to vertex positions that are Blender-internal
        and cannot travel in a GLB. Spring bones define <em>parameters</em>,
        not baked data, and the runtime does the simulation. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape keys tutorial
        </Link>{" "}
        for the companion technique of baking facial expressions — a case where
        baked morph targets <em>are</em> the right choice, because expressions
        are discrete poses, not continuous physics.
      </p>

      <p>
        The blueprint uses <code>use_connect = False</code> on every spring
        bone. This is non-obvious. Connected bones fix their head position to the
        parent&rsquo;s tail, which eliminates translational freedom — the spring
        solver needs rotational freedom at the attachment point, not a rigid
        weld. The{" "}
        <Link href="/tutorials/blender-addon-vrm-format" className={lk}>
          VRM Format addon reference
        </Link>{" "}
        covers the full VRM export pipeline, including which properties the
        addon reads and which it generates from scratch.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-vrm-spring-bones-hair-chain",
  title: "VRM Spring Bones — Bone Collections + Hair-Chain Physics (Blender 5.1)",
  date: "2026-05-24",
  kind: "tutorial",
  excerpt:
    "Bone Collections replaced bone layers in Blender 4.0. Build a VRM-ready spring-bone hair chain using the new API, set stiffness and drag as custom properties, and export a skinned GLB the @pixiv/three-vrm runtime can simulate at near-zero cost.",
  Body: VrmSpringBonesHairChainBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable with the Blender armature workflow covered in the Armature & Weight Paint tutorial.",
      "Understand what NLA strips and shape key morph targets are (tutorials on this site).",
      "Blender 5.1 installed; able to run blueprint.py headlessly with --background.",
      "Optional: VRM Addon for Blender (saturday06/VRM-Addon-for-Blender, MIT) for full .vrm export.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Bone Collections API requires Blender 4.0 or later. The 32-bit bone layer system is removed in 4.1.",
      },
    ],
    steps: [
      {
        title: "Understand the Bone Collections API before writing a single bone",
        body:
          "In Blender 3.x the bone layer API was:\n  bone.layers = [False] * 32\n  bone.layers[2] = True   # assign to layer 2\n\nThis has been removed entirely. In Blender 4.0+ the API is:\n  arm = bpy.data.armatures['char_arm']\n  coll = arm.collections.new('SpringBone_Hair')   # creates BoneCollection\n  coll.assign(arm.bones['Hair_1'])                # links bone to collection\n\ncoll.assign() accepts Bone (OBJECT mode), EditBone (EDIT mode), or PoseBone (POSE mode). The bone can belong to any number of collections simultaneously. arm.collections is an array-like BoneCollectionArray; index by name or integer.\n\nTwo additional properties worth knowing:\n  coll.is_visible       # bool; equivalent to the old layer visibility toggle\n  coll.color_set        # string; 'THEME01'…'THEME20' or 'DEFAULT'; sets viewport colour\n\n'THEME08' is a light-blue that visually differentiates spring bones from humanoid bones in the Armature tab — this matters when sharing blend files where the VRM addon reads the collection names. If the collection name is wrong or missing, the addon simply ignores those bones and exports no spring-bone JSON.",
      },
      {
        title: "Place spring bones with use_connect = False",
        body:
          "In EDIT mode, after building the humanoid chain (Root → Spine → Head), create the hair chain off the Head bone:\n\n  HAIR_START = Vector((0.0, -HEAD_R * 0.85, HEAD_Z + HEAD_R + 0.01))\n  JOINT_LEN  = 0.08\n  JOINT_ARC_Y = 0.025  # gentle backward arc — resting pose\n\n  prev_b = head_b\n  for i in range(1, HAIR_JOINTS + 1):\n      b = eb.new(f'Hair_{i}')\n      drift = Vector((0.0, -JOINT_ARC_Y * (i - 1), 0.0))\n      b.head        = HAIR_START + drift + Vector((0, 0, -(i - 1) * JOINT_LEN))\n      b.tail        = b.head + Vector((0.0, -JOINT_ARC_Y, -JOINT_LEN))\n      b.parent      = prev_b\n      b.use_connect = False   # ← critical\n      prev_b = b\n\nThe use_connect = False is the design constraint that makes spring physics possible. A connected bone is forced to place its head at the parent's tail; the bone cannot pivot around its attachment point, only rotate rigidly. The VRMC_springBone Verlet solver needs to pivot the joint head while keeping the parent tail fixed — which is exactly what a disconnected parented bone allows. Without this flag, the spring solver produces no visible motion: the joint effectively has zero degrees of freedom.\n\nThe backward arc (JOINT_ARC_Y per joint) sets the resting pose. When the character is stationary, @pixiv/three-vrm drives the chain back toward this resting position as the spring stiffness pulls. A flat vertical chain at rest makes any sway look unnatural because there is no directional 'bias' for the physics to resolve against.",
      },
      {
        title: "Assign bone collections after exiting EDIT mode",
        body:
          "Exit to OBJECT mode before assigning collections. coll.assign() can accept EditBone while in EDIT mode, but the arm.collections.new() call must happen in OBJECT mode (EDIT mode armature data is in a transient edit-bones state; the collections array is read-only during editing).\n\n  bpy.ops.object.mode_set(mode='OBJECT')\n\n  coll_human  = arm_data.collections.new('Humanoid')\n  coll_spring = arm_data.collections.new('SpringBone_Hair')\n\n  for name in ('Root', 'Spine', 'Head'):\n      coll_human.assign(arm_data.bones[name])\n\n  hair_names = [f'Hair_{i}' for i in range(1, HAIR_JOINTS + 1)]\n  for name in hair_names:\n      coll_spring.assign(arm_data.bones[name])\n\n  coll_spring.color_set = 'THEME08'\n\nIf you omit the coll_human.assign() calls the humanoid bones end up in the default unnamed collection that Blender creates automatically. They still work mechanically, but the VRM addon will not find them for the humanoid bone mapping panel — you will need to re-assign manually after opening the blend.",
      },
      {
        title: "Set custom spring properties with stiffness tapering toward the tip",
        body:
          "Spring stiffness should decrease toward the tip of the chain. The root joint (Hair_1) is heavier and more connected to the body mass, so it moves less freely. The tip joint (Hair_4) is light and should swing the most.\n\n  SPRING_STIFFNESS = 4.0\n  FALLOFF          = 0.15   # reduce stiffness by 15% per joint\n\n  for i, name in enumerate(hair_names):\n      bone = arm_data.bones[name]\n      bone['vrm_spring_stiffness']  = round(SPRING_STIFFNESS * (1.0 - i * FALLOFF), 2)\n      bone['vrm_spring_drag_force'] = 0.4\n      bone['vrm_spring_hit_radius'] = 0.04\n\nThese raw custom properties are documentation properties — the VRM addon reads its own extension properties, not these. But they are visible in Properties → Bone → Custom Properties when any hair bone is selected, which makes the intended spring parameters legible to anyone opening the blend. When setting up the VRM addon panel, read these values to populate the joint stiffness / drag fields.\n\nDrag force of 0.4 is a good starting point: 0.0 produces endless oscillation (unrealistic), 1.0 produces critically-damped motion with no overshoot (stiff and robotic). Values between 0.3–0.5 read as natural hair. Hit radius of 0.04 m is a small sphere per joint — larger values make the hair collide with the body from further away, which looks wrong for close-fitting strands.",
      },
      {
        title: "Parent meshes with Automatic Weights, then normalise to 4 influences",
        body:
          "Automatic Weights (type='ARMATURE_AUTO') performs geodesic distance weighting for each vertex group, producing smooth falloffs without manual painting:\n\n  bpy.ops.object.select_all(action='DESELECT')\n  for mo in (head_obj, body_obj, hair_obj):\n      mo.select_set(True)\n  arm_obj.select_set(True)\n  bpy.context.view_layer.objects.active = arm_obj\n  bpy.ops.object.parent_set(type='ARMATURE_AUTO')\n\nAfter parenting, enforce the glTF 4-influence-per-vertex limit:\n\n  for mo in (head_obj, body_obj, hair_obj):\n      bpy.context.view_layer.objects.active = mo\n      mo.select_set(True)\n      bpy.ops.object.vertex_group_limit_total(group_select_mode='ALL', limit=4)\n      bpy.ops.object.vertex_group_normalize_all(group_select_mode='ALL', lock_active=False)\n      mo.select_set(False)\n\nThe glTF 2.0 spec allows a maximum of four bone influences per vertex. Blender's Automatic Weights often assigns more, particularly near joints. vertex_group_limit_total drops influences beyond the top four by weight. vertex_group_normalize_all re-scales the remaining weights to sum to 1.0. Without normalisation, a vertex with weights [0.8, 0.15, 0.03, 0.02] after truncation has a total of 0.20 — the mesh will partially collapse toward the origin at runtime.\n\nThe hair_bead object is the key test case: it sits in the influence zone of Hair_1 through Hair_4 simultaneously. After normalisation, each vertex should sum to 1.0 across its assigned hair bones.",
      },
      {
        title: "Export as standard GLB; use VRM Addon for VRMC_springBone",
        body:
          "Export with export_skins=True and Draco disabled:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_skins=True,\n      export_morph=False,\n      export_normals=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n  )\n\nexport_apply=True evaluates modifiers. export_skins=True writes JOINTS_0 and WEIGHTS_0 vertex attributes. export_morph=False is correct here — no shape keys in this scene.\n\nDraco is disabled because the interaction between KHR_draco_mesh_compression and JOINTS_0/WEIGHTS_0 attributes is not defined in the spec. Three.js's GLTFLoader rejects Draco-compressed skinned meshes with an error.\n\nThis export produces a valid skinned GLB but does NOT include the VRMC_springBone extension. To embed spring-bone physics metadata:\n1. Install VRM Addon for Blender (saturday06/VRM-Addon-for-Blender, MIT).\n2. Open vrm_spring_bones.blend in Blender.\n3. Properties → Object Data → VRM Spring Bone: create a spring group, add the Hair_* bones as a chain.\n4. Set stiffness and drag to match the custom properties on each bone.\n5. File → Export → VRM (.vrm) — this writes a .vrm file (which is a GLB with VRM extensions).\n\nThe resulting .vrm file includes the JSON extension block that @pixiv/three-vrm parses at runtime to drive the physics. Load it with:\n  const vrm = await VRMLoaderPlugin(loader);\n  loader.load('character.vrm', (gltf) => {\n    const vrm = gltf.userData.vrm;\n    VRMUtils.rotateVRM0(vrm);\n    scene.add(vrm.scene);\n  });",
      },
    ],
    finalResult:
      "A .blend with a five-bone armature in two named bone collections (Humanoid, SpringBone_Hair), four spring bones with tapering custom stiffness/drag/hit-radius properties, and three skinned meshes (head, body, hair bead) weight-painted and normalised to glTF spec. A skinned GLB exports cleanly into any glTF loader; adding the VRM Addon enables a .vrm export with full VRMC_springBone physics metadata for @pixiv/three-vrm.",
    variations: [
      "Multiple chains: call add_spring_chain() from the holoflow_macros module twice — once for 'Hair_L' (left ponytail) and once for 'Hair_R'. Each chain gets its own bone collection so the VRM addon can configure them independently. Adjust JOINT_ARC_Y to curve each chain outward (±X offset) rather than directly backward.",
      "Skirt physics: replace the hair bead with a flat ring mesh parented to a four-joint skirt chain (front, left, right, back, each 3 joints). Reduce stiffness to 1.5 and drag to 0.6 — skirts are heavier fabric, less springy. Collision radius should be larger (0.08 m) to prevent the skirt from clipping the thigh geometry.",
      "Ear/antenna: set JOINT_LEN = 0.04 and HAIR_JOINTS = 6 for a shorter, stiffer antenna with more joints. Increase stiffness to 8.0 so the antenna doesn't flop. Add JOINT_ARC_Y = 0 (straight up) so the resting pose is vertical — the spring solver will dampen any disturbance back to vertical quickly.",
    ],
    troubleshooting: [
      {
        symptom: "arm.collections.new() raises AttributeError",
        cause: "Running on Blender 3.x where BoneCollection does not exist, or the armature object is not active.",
        fix: "Confirm Blender version is 4.0+. Set bpy.context.view_layer.objects.active = arm_obj before calling arm_data.collections.new(). Also ensure you are in OBJECT mode, not EDIT mode.",
      },
      {
        symptom: "GLB loads but mesh collapses or shows no skinning",
        cause: "export_skins=False (the default), or vertex weights were not normalised after limit_total.",
        fix: "Add export_skins=True to the gltf export call. Re-run vertex_group_normalize_all on each mesh object after vertex_group_limit_total. Verify in Don McCurdy's glTF Viewer: Skin section should show JOINTS_0 and WEIGHTS_0 attributes.",
      },
      {
        symptom: "VRM addon shows no bones under Spring Bone panel",
        cause: "The bone collection name does not match what the VRM addon expects, or the addon version reads collection assignments differently.",
        fix: "Check the addon documentation for the expected collection naming scheme (typically 'SpringBone_*' or user-defined). Assign bones manually via the panel UI as a fallback. The custom properties on the bones document the intended parameter values for manual entry.",
      },
      {
        symptom: "Hair does not sway in @pixiv/three-vrm at runtime",
        cause: "The GLB was exported as standard glTF without VRMC_springBone metadata. Standard skinned GLBs do not include spring physics.",
        fix: "Re-export using the VRM Addon as a .vrm file, not a standard .glb. The VRMC_springBone JSON extension is only written by VRM-specific exporters. Three.js GLTFLoader with VRMLoaderPlugin reads this extension; without it, three-vrm has no spring parameters to simulate.",
      },
    ],
  },
  base,
);
