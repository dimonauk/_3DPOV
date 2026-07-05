import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bpy.types.MetaBall</code> is the data-block Blender assigns when
        you call <code>bpy.data.metaballs.new(name)</code>. Unlike polygon
        meshes or curves, a MetaBall object defines its surface implicitly: each
        element contributes a scalar potential field that falls off with distance,
        and the isosurface where the total potential equals{" "}
        <code>mb.threshold</code> is the rendered skin. This is the model used in
        physics simulations for liquid blobs, and in character art for organic
        shape-blocking before retopology. Five element types are available —{" "}
        <code>BALL</code> (isotropic sphere), <code>CAPSULE</code> (elongated
        along local Z), <code>ELLIPSOID</code> (anisotropically scaled with{" "}
        <code>size_x/y/z</code>), <code>CUBE</code> (box-shaped field), and{" "}
        <code>PLANE</code> (half-space cutter) — each added via{" "}
        <code>mb.elements.new(type=&apos;BALL&apos;)</code>. The{" "}
        <code>stiffness</code> attribute per element controls falloff sharpness:
        1.0 gives a Gaussian-like smooth blend at a distance (neighbouring
        elements merge even when their radii don&apos;t overlap), while 2.0
        produces a faster dropoff so elements stay distinct until nearly touching.
        Two elements with stiffness 1.0 at twice their combined radii apart will
        still form a visible bridge; at stiffness 2.0 they won&apos;t. Choosing
        the right stiffness for the intent — smooth organic merge vs crisp lobe
        separation — is the primary artistic control before threshold.
      </p>
      <p>
        The family-name merging behaviour is the critical system to understand
        before scripting multi-object rigs. Every MetaBall object in the scene
        whose name shares the same prefix before the first <code>.</code>{" "}
        character is treated as part of the same family and merged into a single
        unified isosurface at evaluation time. <code>BlobChain</code> and{" "}
        <code>BlobChain.001</code> merge; <code>OtherBlob</code> is independent.
        The family&apos;s shared threshold and resolution are read from whichever
        member is first alphabetically — changing <code>mb.threshold</code> on a
        non-primary member has no effect. The three-object rig in this blueprint
        exploits that deliberately: body BALL chain, head BALL, and tail CAPSULE
        each live in their own MetaBall data-block so their element sets can be
        authored and animated independently, yet all contribute to one watertight
        surface. This pattern matches the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-armature-edit-bones-vrm-spine-chain"
          className={lk}
        >
          VRM spine chain tutorial
        </Link>
        &apos;s practice of decomposing a skeleton into authoring units whilst
        keeping the runtime data unified. The merge happens invisibly in the
        Blender depsgraph — the same pipeline that the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph evaluated geometry tutorial
        </Link>{" "}
        covers for reading the post-modifier mesh without converting.
      </p>
      <p>
        After <code>bpy.ops.object.convert(target=&apos;MESH&apos;)</code> the
        metaball family collapses into a single Mesh object using the{" "}
        <code>render_resolution</code> setting (not the viewport{" "}
        <code>resolution</code>) to tessellate — so set{" "}
        <code>render_resolution</code> fine before converting if you want full
        fidelity. The raw converted mesh has irregular triangles whose density
        varies with curvature; it is not directly suitable for animation or
        WebXR export. Voxel Remesh re-grids the surface to uniform all-quad
        topology at the chosen <code>voxel_size</code> edge length. 0.05 m is
        the target here: coarse enough to run in a mobile WebXR browser without
        stutter, fine enough to preserve head–body junction curves and the tail
        capsule termination. Voxel Remesh works on the evaluated mesh bounding
        box; very thin features narrower than one voxel cell may disappear —
        check the tail capsule post-remesh and increase the capsule radius or
        reduce <code>voxel_size</code> if it vanishes. A subsequent Decimate
        COLLAPSE at 0.40 ratio removes a further 60% of triangulated faces while
        preserving silhouette — the same topology budget strategy as the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr"
          className={lk}
        >
          faceted gem tutorial
        </Link>{" "}
        and directly comparable to the SDF blob fusion approach in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-to-volume-sdf-blob-fusion"
          className={lk}
        >
          GN Mesh to Volume — SDF Blob Fusion
        </Link>
        , which uses Geometry Nodes&apos; Volume to Mesh node for the same
        isosurface-to-topology pipeline at the Geometry Nodes modifier level.
        The Python route here is preferable when the shape is driven by
        parametric element positions (procedural creature generation, physics
        integration) rather than interactive sculpt.
      </p>
    </>
  );
}

const base = {
  slug: "blender-tutorial-python-metaball-blob-chain-remesh-webxr",
  title:
    "Python bpy.types.MetaBall — Implicit Blob Chain: Organic Shape Blocking, Family Merging & Voxel Remesh for WebXR (Blender 5.1)",
  date: "2026-07-05",
  kind: "tutorial" as const,
  excerpt:
    "bpy.data.metaballs.new() + mb.elements.new(type) builds implicit isosurfaces without polygon authoring. Covers element types BALL/CAPSULE/ELLIPSOID, stiffness falloff control, family-name merging across multiple MetaBall objects, threshold sweet spot for organic creatures, render_resolution fidelity at convert() time, and the Voxel Remesh → Decimate → GLB pipeline for WebXR.",
  tags: [
    "blender",
    "python",
    "scripting",
    "metaball",
    "implicit-surface",
    "organic",
    "remesh",
    "webxr",
    "glb",
    "character",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-metaball-blob-chain-remesh-webxr",
    time: "thirty to forty-five minutes",
    difficulty: "intermediate" as const,
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable writing bpy Python scripts in the Scripting workspace",
      "Understands bpy.data vs bpy.ops — see the Depsgraph evaluated geometry tutorial",
      "Familiar with GLB export for WebXR — see the BMesh hard-surface prop tutorial",
    ],
    steps: [
      {
        title: "Create a MetaBall data-block and the body chain",
        body: "bpy.data.metaballs.new(name) creates the data-block; bpy.data.objects.new(name, mb) wraps it:\n\n  mb_body = bpy.data.metaballs.new('BlobChain')\n  obj_body = bpy.data.objects.new('BlobChain', mb_body)\n  bpy.context.scene.collection.objects.link(obj_body)\n\nThe object name drives family membership — everything before the first '.' is the family prefix.\n\n  mb_body.resolution        = 0.08   # viewport tessellation fineness in m\n  mb_body.render_resolution = 0.04   # used at convert() time — keep finer\n  mb_body.threshold         = 0.60   # iso value\n\nAdd BALL elements along an S-curve spine:\n\n  for i in range(6):\n      t      = i / 5.0\n      taper  = math.sin(t * math.pi)         # 0 → 1 → 0 across chain\n      radius = 0.14 + (0.30 - 0.14) * taper  # taper from end to midpoint\n      x      = 0.25 * math.sin(t * math.pi * 2.0)  # lateral S-wave\n      elem   = mb_body.elements.new(type='BALL')\n      elem.co        = Vector((x, (i - 2.5) * 0.42, 0.0))\n      elem.radius    = radius\n      elem.stiffness = 1.0\n\nelem.stiffness of 1.0: elements whose radii don't physically overlap will still produce a visible bridge at this stiffness. Increase to 1.5–2.0 if you want distinct lumps that only merge when touching.",
      },
      {
        title: "Add head and tail MetaBalls — same family, independent data",
        body: "Name subsequent objects with the same prefix + a '.' suffix:\n\n  mb_head  = bpy.data.metaballs.new('BlobChain.001')\n  obj_head = bpy.data.objects.new('BlobChain.001', mb_head)\n  bpy.context.scene.collection.objects.link(obj_head)\n  obj_head.location = Vector((0.0, 0.55, 0.55))  # above chain top\n\n  elem_h = mb_head.elements.new(type='BALL')\n  elem_h.co     = Vector((0.0, 0.0, 0.0))\n  elem_h.radius = 0.38\n\nFamily rule: ALL resolution and threshold settings are read from the alphabetically-first object in the family ('BlobChain', not 'BlobChain.001'). Setting mb_head.threshold has NO effect. Set everything on mb_body.\n\nCAPS ULE element on the tail:\n\n  mb_tail = bpy.data.metaballs.new('BlobChain.002')\n  obj_tail = bpy.data.objects.new('BlobChain.002', mb_tail)\n  bpy.context.scene.collection.objects.link(obj_tail)\n  obj_tail.location     = Vector((0.0, -1.35, 0.0))\n  obj_tail.rotation_euler = (math.radians(90), 0.0, 0.0)\n\n  elem_t = mb_tail.elements.new(type='CAPSULE')\n  elem_t.co        = Vector((0.0, 0.0, 0.0))\n  elem_t.radius    = 0.22   # capsule hemisphere radius = half-shaft length\n  elem_t.stiffness = 1.2\n\nCAPS ULE extends along the element's local Z (which is the object's Z before rotation_euler is applied). Rotating obj_tail 90° around X points the capsule along global Y — down the spine continuation.\n\nELLIPSOID elements (for limb stubs) have size_x, size_y, size_z:\n  elem_e.size_x = 0.10   # flatten into a disc or elongate into an egg\n  elem_e.size_y = 0.10\n  elem_e.size_z = 0.28",
      },
      {
        title: "Tune threshold and resolution — the iso value sweet spot",
        body: "threshold controls which potential contour defines the surface:\n\n  mb_body.threshold = 0.60   # default; suitable for smooth creature forms\n\nLower threshold (0.3–0.5): elements blend puffily at large distances — good for liquid or jelly. At very low thresholds the surface may extend beyond visible elements and produce floating geometry far from any element.\n\nHigher threshold (0.7–0.9): elements must be closer before they merge — useful for chains of distinct lobes (vertebrae, segments). Above ~0.95 elements stop merging entirely and each is a separate sphere.\n\nresolution vs render_resolution:\n  mb.resolution        = 0.08   # viewport: coarse for fast feedback\n  mb.render_resolution = 0.04   # F12 + convert(): fine for quality output\n\nAt convert() time Blender evaluates the metaball at render_resolution. If this is coarse, the resulting mesh will have the resolution artefacts of the viewport mesh — set it fine (0.03–0.05 m) before converting. The viewport resolution can be left coarse for interactive speed.\n\nbpy.context.view_layer.update() forces the depsgraph to re-evaluate all metaball families after element changes — call this before convert() to avoid stale cached geometry.",
      },
      {
        title: "Convert to mesh — family collapse into one object",
        body: "convert() merges the entire family into the active object:\n\n  for o in bpy.context.scene.objects:\n      o.select_set(False)\n  for o in [obj_body, obj_head, obj_tail]:\n      o.select_set(True)\n  bpy.context.view_layer.objects.active = obj_body\n  bpy.ops.object.convert(target='MESH')\n  obj_mesh = bpy.context.view_layer.objects.active\n\nAfter convert():\n- obj_body.type is now 'MESH'; obj_body.data is bpy.types.Mesh\n- obj_head and obj_tail are DELETED from the scene — the family merged\n- The MetaBall data-blocks (mb_body, mb_head, mb_tail) are orphaned\n- The mesh tessellated at render_resolution, NOT resolution\n\nIf you only select obj_body and convert, ALL family members still merge — selection only controls which object name the result uses. You cannot convert a single family member in isolation.\n\nFor headless/addon code without active context, use temp_override:\n  with bpy.context.temp_override(active_object=obj_body,\n                                  selected_objects=[obj_body, obj_head, obj_tail]):\n      bpy.ops.object.convert(target='MESH')",
      },
      {
        title: "Voxel Remesh → Decimate: from irregular tris to WebXR quads",
        body: "The raw converted mesh has irregular triangles — density varies with resolution and curvature:\n\n  mod_remesh = obj_mesh.modifiers.new('Remesh', type='REMESH')\n  mod_remesh.mode             = 'VOXEL'\n  mod_remesh.voxel_size       = 0.05    # m; target edge length\n  mod_remesh.adaptivity       = 0.0    # 0 = uniform; > 0 coarser in flat regions\n  mod_remesh.use_smooth_shade = True   # vertex normals interpolated post-remesh\n  bpy.ops.object.modifier_apply(modifier='Remesh')\n\nvoxel_size of 0.05 m on a 1.2 m tall creature produces ~10k–25k quads. A WebXR LOD0 mobile budget is typically ≤ 15k triangles, so Decimate follows:\n\n  mod_dec = obj_mesh.modifiers.new('Decimate', type='DECIMATE')\n  mod_dec.decimate_type = 'COLLAPSE'\n  mod_dec.ratio         = 0.40\n  bpy.ops.object.modifier_apply(modifier='Decimate')\n\nCOLLAPSE at 0.40 removes ~60% of faces while preserving topology loops — better for organic silhouettes than UNSUBDIV (which only removes loops of exact subdiv provenance) or DISSOLVE (angle-based, ignores curvature).\n\nThin features thinner than one voxel cell (voxel_size) disappear during Remesh. If the tail capsule vanishes, either reduce voxel_size (0.03) or increase the capsule radius above 0.05 m.",
      },
      {
        title: "Smart UV Project and GLB export",
        body: "Smart UV Project on the remeshed organic form:\n\n  bpy.context.view_layer.objects.active = obj_mesh\n  bpy.ops.object.mode_set(mode='EDIT')\n  bpy.ops.mesh.select_all(action='SELECT')\n  bpy.ops.uv.smart_project(angle_limit=66.0, island_margin=0.02)\n  bpy.ops.object.mode_set(mode='OBJECT')\n\nOrganic remeshed surfaces have no hard normal breaks — Smart UV Project at 66° angle limit creates islands per curvature zone rather than per polygon, which is appropriate for paintable textures. The result is imperfect (seams may cross visible areas) but usable for base colour maps; a final Unwrap or Minimise Stretch pass in Edit Mode tightens it.\n\nTag and export:\n\n  obj_mesh.name              = 'BlobCreature'\n  obj_mesh['holoflow:facet'] = False   # smooth normals — mandatory for organic\n\n  bpy.ops.export_scene.gltf(\n      filepath=bpy.path.abspath('//blob_chain.glb'),\n      use_selection=True,\n      export_format='GLB',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_apply=True,\n      export_normals=True,\n      export_materials='EXPORT',\n  )\n\nexport_apply=True is mandatory — remeshed objects often retain a non-identity scale from the original metaball object transform; without it GLB viewers may display the creature at the wrong size.",
      },
    ],
    finalResult:
      "A single GLB — BlobCreature — built from three merged MetaBall objects (body BALL chain, head BALL, tail CAPSULE). Clean all-quad topology from Voxel Remesh at 0.05 m edge length, Decimated to ~40% for WebXR poly budget, Smart UV projected, and exported as blob_chain.glb with Draco 6 compression and WebP texture support.",
    variations: [
      "Animated blob: keyframe elem.co positions on each MetaBall element frame-by-frame using elem.keyframe_insert('co', frame=N). The isosurface re-evaluates each frame — useful for procedural morphing animations. Note: convert() is a one-shot destructive step; animate BEFORE converting, or keep the MetaBall source file separate from the export file.",
      "Creature variants: change CHAIN_SEGMENTS, RADIUS_MID, and CURVE_AMP at the top of blueprint.py. Six segments → centipede-like body. Three segments → stubby grub. Two segments → dumbbell. The S-curve amplitude controls how sinuous vs straight the spine reads.",
      "ELLIPSOID limb stubs: add a fourth MetaBall object (BlobChain.003) at each arm/leg attachment point. Use type='ELLIPSOID' with size_z = 0.35 for an elongated bud. Rotate the object to point the long axis outward. The ellipsoid merges smoothly into the body surface.",
      "Liquid simulation style: lower threshold to 0.35 and stiffness to 0.8. Elements blend at much larger distances — neighbouring blobs merge even when separated by a gap equal to their radii. Combined with animated elem.co positions this gives a lava-lamp or underwater blobbing effect.",
      "Voxel size trade-off: 0.03 m gives a creature with 40k–80k quads from Remesh — too dense for mobile WebXR but suitable for a Cycles bake target. Set VOXEL_SIZE=0.03 for the source file and VOXEL_SIZE=0.05 for the export file, baking a normal map from high to low before GLB output.",
    ],
    troubleshooting: [
      {
        symptom: "Only one blob is visible — the other MetaBall objects are ignored",
        cause:
          "The object names do not share a family prefix. Blender uses the text BEFORE the first '.' as the family key. 'BlobChain' and 'BlobChain.001' share 'BlobChain'; 'BlobChain' and 'BlobChain001' (no dot) are different families.",
        fix: "Rename all objects to FAMILY + '.NNN' where FAMILY is identical and NNN is any numeric suffix. E.g. bpy.data.objects['BlobChain001'].name = 'BlobChain.001'. Confirm by selecting all and checking the viewport — the surfaces should merge.",
      },
      {
        symptom: "Changing mb_head.threshold has no effect",
        cause:
          "Threshold and resolution are read only from the alphabetically-first object in the family. All other family members' MetaBall data settings are ignored.",
        fix: "Set mb_body.threshold (the primary member) instead of mb_head.threshold. The primary is the one whose name sorts first — 'BlobChain' before 'BlobChain.001'.",
      },
      {
        symptom: "Thin tail CAPSULE disappears after Voxel Remesh",
        cause:
          "The capsule radius is smaller than voxel_size. Voxel Remesh cannot represent features narrower than one voxel cell.",
        fix: "Increase elem_t.radius above voxel_size (default 0.05 m). Alternatively reduce voxel_size to 0.03 m at the cost of higher poly count. Increase mb_body.render_resolution to 0.03 before converting so the thin capsule is properly tessellated before Remesh sees it.",
      },
      {
        symptom: "convert() raises RuntimeError: active object is not a MetaBall",
        cause:
          "bpy.context.view_layer.objects.active was not set before calling convert(). If bpy.ops.object.convert() is called with no active object it fails.",
        fix: "Always set bpy.context.view_layer.objects.active = obj_body before convert(). Also call bpy.context.view_layer.update() first to ensure the depsgraph is current.",
      },
    ],
  },
  base,
);
