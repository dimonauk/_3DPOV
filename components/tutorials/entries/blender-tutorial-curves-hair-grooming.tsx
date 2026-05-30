import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CurvesHairGroomingBody() {
  return (
    <>
      <p>
        Blender&rsquo;s old particle-hair system baked strand positions into a
        per-object point cache that was opaque to the modifier stack, invisible
        to Geometry Nodes, and inaccessible via a clean Python API. Blender 4.0
        replaced it with a first-class{" "}
        <strong>Curves object</strong> — the same attribute-domain geometry
        that mesh and point-cloud objects use. Each strand is a polyline stored
        in the <code>POINT</code> domain; per-strand properties live in the{" "}
        <code>CURVE</code> domain. The sculpt-mode grooming toolkit (Add, Comb,
        Smooth, Trim) operates on the live data, and EEVEE Next renders the
        curves natively via the{" "}
        <strong>Principled Hair BSDF</strong> — no need to convert to mesh just
        to see a shaded result.
      </p>

      <p>
        This tutorial builds a low-poly head (icosphere, flat shading) and
        seeds 44 hair strands across the upper hemisphere using the direct
        Python data API — <code>curves.add_curves()</code> followed by a
        single <code>foreach_set()</code> call to write all positions in one
        batch. The gravity-bent strand formula produces a natural droop without
        any simulation. From there the walkthrough covers the sculpt-grooming
        tools, the Principled Hair BSDF melanin parametrisation, and the
        critical export limitation: the glTF 2.0 spec has no hair primitive, so
        a Geometry Nodes <em>Curve to Mesh</em> ribbon pass is required before
        GLB export. For character rigs with physics, the ribbon approach is a
        static snapshot — dynamic sway belongs in{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRMC_springBone
        </Link>
        , evaluated at runtime by{" "}
        <a
          href="https://github.com/pixiv/three-vrm"
          target="_blank"
          rel="noopener noreferrer"
          className={lk}
        >
          @pixiv/three-vrm
        </a>{" "}
        (MIT, pixiv Inc.).
      </p>

      <p>
        The blueprint produces a{" "}
        <code>.blend</code> that is ready for sculpt grooming the moment you
        open it; the surface binding (<code>curves.surface = head_scalp</code>)
        means root positions snap to the nearest face as you comb. The head
        shell exports as a Draco-6 GLB. The tutorial then walks the GN ribbon
        pipeline so you can ship a full-hair GLB. This connects naturally to
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-weight-paint"
          className={lk}
        >
          armature and weight paint workflow
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-shape-keys-morph-targets"
          className={lk}
        >
          shape key morph targets
        </Link>{" "}
        that complete a production VRM character.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-curves-hair-grooming",
  title: "Curves-Based Hair Grooming — Seed, Sculpt, and Export (Blender 5.1)",
  date: "2026-05-29",
  kind: "tutorial",
  excerpt:
    "Blender 4.0 replaced particle hair with a Curves object sharing the same attribute-domain geometry as meshes. Seed 44 strands programmatically with foreach_set, groom in sculpt mode, shade with Principled Hair BSDF, and convert to mesh ribbons for GLB/WebXR delivery.",
  Body: CurvesHairGroomingBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Comfortable with Blender object mode and the Python scripting workspace.",
      "Have worked through the Armature & Weight Paint tutorial or understand basic mesh/object relationships.",
      "Understand EEVEE Next materials at the level of the EEVEE toon cel-shader tutorial.",
    ],
    blenderVersion: "5.1",
    libraryPath: "public/library/blends/rigging/curves-hair-grooming/",
    steps: [
      {
        title: "Scene setup — flat-shaded head as surface mesh",
        body:
          "Clear the default scene and build the head:\n\n  import bpy, math, random, numpy as np\n\n  bpy.ops.object.select_all(action='SELECT')\n  bpy.ops.object.delete(use_global=False)\n\n  bpy.ops.mesh.primitive_ico_sphere_add(\n      subdivisions=2, radius=0.12, location=(0, 0, 0))\n  head = bpy.context.active_object\n  head.name = 'head_scalp'\n  bpy.ops.object.shade_flat()\n\nAn icosphere at subdivisions=2 produces 80 triangular faces distributed uniformly — critical for even hair density. A UV sphere packs far more faces near the poles; hair seeded on a UV sphere clumps at the crown.\n\nFlat shading is a deliberate studio choice: it reads as faceted/low-poly at a glance and avoids smooth-normal artefacts in the exported GLB. You can apply a Smooth Modifier later without touching the blueprint.\n\nAdd a scalp material now so it reads correctly when hair strands are sparse at the hairline:\n\n  scalp_mat = bpy.data.materials.new('scalp')\n  scalp_mat.use_nodes = True\n  bsdf = scalp_mat.node_tree.nodes['Principled BSDF']\n  bsdf.inputs['Base Color'].default_value = (0.55, 0.40, 0.35, 1.0)\n  bsdf.inputs['Roughness'].default_value  = 0.90\n  head.data.materials.append(scalp_mat)",
      },
      {
        title: "Create the Curves hair object and bind it to the surface",
        body:
          "Select the head and call curves_empty_hair_add():\n\n  bpy.ops.object.select_all(action='DESELECT')\n  head.select_set(True)\n  bpy.context.view_layer.objects.active = head\n  bpy.ops.object.curves_empty_hair_add()\n  hair_obj = bpy.context.active_object\n  hair_obj.name = 'hair_strands'\n  curves = hair_obj.data   # bpy.types.Curves\n\nThe operator creates a Curves object with curves.surface = head_scalp and curves.surface_uv_map = 'UVMap'. This binding is what allows sculpt-mode tools to snap roots back to the nearest face when you comb strands across the mesh — without it, combing would move the root freely and the hair would float off the surface.\n\nVerify in the Outliner: you should see hair_strands as a child of the scene, with a wavy-line icon (Curves object type, not the legacy Curve type which has a different icon).\n\nIn Properties → Object Data, confirm:\n- Surface: head_scalp\n- Surface UV Map: UVMap",
      },
      {
        title: "Seed 44 strands — add_curves() + foreach_set()",
        body:
          "The key insight: add_curves(counts) takes a list of per-strand point counts and allocates all strands in one C-level call. A loop calling add_curves([seg_count]) N times triggers N separate BLI array resizes — roughly 10× slower for 40+ strands.\n\n  SEG_COUNT = 7\n  N_STRANDS = 44\n  STRAND_LENGTH = 0.38\n  GRAVITY = 0.35\n  HEAD_RADIUS = 0.12\n  rng = random.Random(42)\n\n  curves.add_curves([SEG_COUNT] * N_STRANDS)\n\n  total_pts = N_STRANDS * SEG_COUNT\n  pos_flat  = np.zeros(total_pts * 3, dtype=np.float32)\n\nNow fill positions. Each strand root sits on the upper hemisphere; segments step outward along a normal-to-gravity blend:\n\n  for si in range(N_STRANDS):\n      cos_theta = rng.uniform(0.28, 1.0)   # upper 72% of hemisphere\n      sin_theta = math.sqrt(1 - cos_theta**2)\n      phi       = rng.uniform(0, 2 * math.pi)\n      nx, ny, nz = sin_theta*math.cos(phi), sin_theta*math.sin(phi), cos_theta\n      rx, ry, rz = HEAD_RADIUS*nx, HEAD_RADIUS*ny, HEAD_RADIUS*nz\n      for pi in range(SEG_COUNT):\n          t = pi / (SEG_COUNT - 1)\n          g = GRAVITY * t * t              # quadratic gravity droop\n          dx, dy, dz = nx*(1-g), ny*(1-g), nz*(1-g) - g\n          mag = math.sqrt(dx**2 + dy**2 + dz**2)\n          if mag > 1e-6: dx, dy, dz = dx/mag, dy/mag, dz/mag\n          arc = STRAND_LENGTH * t\n          bi  = (si * SEG_COUNT + pi) * 3\n          pos_flat[bi], pos_flat[bi+1], pos_flat[bi+2] = (\n              rx + dx*arc, ry + dy*arc, rz + dz*arc)\n\n  curves.attributes['position'].data.foreach_set('vector', pos_flat)\n\nforeach_set writes the whole contiguous array in one C call — for 308 points (44 × 7) this is still fast, but the pattern matters at scale (hundreds of strands) where the per-point Python call overhead dominates.",
      },
      {
        title: "Radius taper and Principled Hair BSDF material",
        body:
          "Add a radius attribute for per-point strand thickness:\n\n  rad_flat = np.array([\n      0.0042 + (0.0008 - 0.0042) * (pi / (SEG_COUNT-1))\n      for si in range(N_STRANDS) for pi in range(SEG_COUNT)\n  ], dtype=np.float32)\n  rad_attr = curves.attributes.new('radius', 'FLOAT', 'POINT')\n  rad_attr.data.foreach_set('value', rad_flat)\n\nThe radius attribute drives the rendered strand cylinder diameter in EEVEE Next — root 0.0042 BU (~4 mm) tapering to tip 0.0008 BU (~0.8 mm).\n\nNow create the hair material:\n\n  hair_mat = bpy.data.materials.new('hair')\n  hair_mat.use_nodes = True\n  nt = hair_mat.node_tree\n  nt.nodes.clear()\n\n  out  = nt.nodes.new('ShaderNodeOutputMaterial')\n  bsdf = nt.nodes.new('ShaderNodePrincipledHairBSDF')\n  out.location, bsdf.location = (300,0), (0,0)\n\n  bsdf.parametrization = 'MELANIN'\n  bsdf.inputs['Melanin'].default_value          = 0.92  # near-black\n  bsdf.inputs['Melanin Redness'].default_value  = 0.60  # warm tone\n  bsdf.inputs['Roughness'].default_value        = 0.35\n  bsdf.inputs['Radial Roughness'].default_value = 0.30\n\n  nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])\n  hair_obj.data.materials.append(hair_mat)\n\nPrincipled Hair BSDF is only available in BLENDER_EEVEE_NEXT (not Cycles in the same node). If you want cel-shaded flat hair, replace the BSDF with ShaderNodeEmission + a hard CONSTANT ColourRamp — the pattern is covered in the\nEEVEE toon cel-shader tutorial.\n\nMELANIN parametrisation range: 0.0 = platinum/white, 0.3 = blonde, 0.6 = chestnut, 0.85+ = near-black. Melanin Redness shifts the tint from ash (0) to copper-red (1) at a given melanin level.",
      },
      {
        title: "Sculpt-mode grooming tools",
        body:
          "Switch the active object to hair_strands and enter Sculpt Mode (Tab). The header toolbar shows the hair grooming brushes — these only appear when a Curves object is active.\n\nKey tools:\n\n  Comb (C)\n    Drags strand tips in the brush direction. Roots stay pinned to the\n    surface via the surface binding. Hold Shift to invert direction.\n\n  Smooth (S)\n    Reduces angular kinks between control points. Run multiple passes\n    to get a gradually curved, natural droop.\n\n  Snake Hook\n    Pulls tips with a stretching effect — good for sculpting long\n    flowing sections. Different from Comb: it moves the entire segment\n    chain from the brush centre outward.\n\n  Trim\n    Drag a line across the viewport to cut all strands that cross it\n    to the line length. Useful for setting a consistent length along\n    a parting or fringe.\n\n  Grow / Shrink\n    Scales strand length from the root. Hold Ctrl to shrink. More\n    surgical than Trim when you want variable length within the brush.\n\nWorkflow tip: Comb first to set direction, Smooth to clean up kinks, Trim for a defined length. Use density Add/Delete brushes if you need more strands in a region after the programmatic seed.\n\nUndo (Ctrl+Z) preserves sculpt history. Save frequently — the sculpt stack is lost on file close if you have not saved to .blend.",
      },
      {
        title: "GN ribbon conversion + GLB export",
        body:
          "The Blender 5.1 glTF exporter does not emit Curves as hair primitives — glTF 2.0 has no hair primitive type. Convert strands to mesh ribbons via Geometry Nodes:\n\n  1. Add a Plane object (Shift+A → Mesh → Plane).\n  2. Add a Geometry Nodes modifier, name it 'CurvesToRibbons'.\n  3. Build the node tree:\n       Object Info (Object = hair_strands, transform_space='RELATIVE')\n         └─ Geometry  →  Curve to Mesh [Curve input]\n       Quadrilateral (Width=0.004, Height=0.001)\n         └─ Curve    →  Curve to Mesh [Profile Curve input]\n       Curve to Mesh\n         └─ Mesh     →  Set Material (hair_mat)\n                     →  Group Output [Geometry]\n  4. Select head_scalp + the ribbon plane.\n  5. File → Export → glTF 2.0:\n       Format: GLB\n       Apply Modifiers: ✓\n       Draco Mesh Compression: Level 6\n       Image Format: WebP\n       Use Selection: ✓\n\nIn Python:\n\n  bpy.ops.export_scene.gltf(\n      filepath='//hair_grooming_full.glb',\n      use_selection=True,\n      export_format='GLB',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_apply=True,\n  )\n\nFor static hero renders or a low-poly character that is never animated, ribbon meshes are fine. For an interactive character with swaying hair, use VRMC_springBone (see the VRM Spring Bones tutorial) — the spring solver in @pixiv/three-vrm evaluates per-frame in JavaScript at sub-millisecond cost, which ribbon meshes cannot achieve without pre-baked vertex animation.",
      },
    ],
    finalResult:
      "A .blend with a flat-shaded icosphere head and 44 gravity-bent Curves hair strands bound to the surface, Principled Hair BSDF material, and a GN ribbon modifier for GLB export. The head-only GLB exports cleanly as Draco-6 / WebP. The ribbon-converted GLB includes mesh hair strips ready for WebXR via Three.js. The holoflow_macros module provides seed_hair_on_surface() for re-use in other character pipelines.",
    variations: [
      "Longer flowing hair: increase STRAND_LENGTH to 0.65 and SEG_COUNT to 10. Reduce cos_min to 0.10 to let strands seed further down the sides of the head. Increase GRAVITY to 0.55 so the longer strands droop further. After generating, use the Comb tool to add a parting and sweep the strands to one side.",
      "Cel-shaded flat hair: replace the Principled Hair BSDF with ShaderNodeEmission. Feed a hard CONSTANT ColourRamp (two stops: 0.0 = shadow colour, 0.6 = base colour) driven by a Geometry node's Tangent output through a Dot Product with the light direction. This gives a single-shadow toon band on each strand, matching the EEVEE toon cel-shader style used across the studio.",
      "VRM export with spring physics: after grooming, run the VRM Spring Bones tutorial to place Hair_1–Hair_N bones along a representative strand path, add VRMC_springBone parameters as custom properties, and parent the ribbon mesh to the armature. Export as a .vrm file using the VRM Addon for Blender. @pixiv/three-vrm will simulate the chain at runtime, making static ribbons unnecessary for the hair — use them only as a fallback for runtimes that do not load .vrm.",
    ],
    troubleshooting: [
      {
        symptom: "curves_empty_hair_add() raises RuntimeError: Context is incorrect",
        cause:
          "The operator requires the surface mesh to be the active object in OBJECT mode when called.",
        fix:
          "Ensure bpy.context.view_layer.objects.active = head (or your surface mesh) before calling the operator. Also confirm you are in OBJECT mode, not EDIT or SCULPT mode — call bpy.ops.object.mode_set(mode='OBJECT') if needed.",
      },
      {
        symptom: "curves.add_curves() raises AttributeError: 'Curves' object has no attribute 'add_curves'",
        cause:
          "Running on Blender 3.x or on a legacy Curve object (splines/bezier) rather than the new Curves type (hair). The two types share the name 'Curves' in some contexts.",
        fix:
          "Confirm Blender version is 4.0+. Check hair_obj.type — it must be 'CURVES' (not 'CURVE'). If the type is CURVE, you have the legacy spline object; delete it and use curves_empty_hair_add() which creates the correct type.",
      },
      {
        symptom: "foreach_set raises ValueError: array length mismatch",
        cause:
          "The flat array length does not match total_pts × 3 (for position) or total_pts (for radius). Usually caused by calling add_curves() multiple times or miscounting points.",
        fix:
          "Print len(curves.attributes['position'].data) after add_curves() and verify it equals N_STRANDS × SEG_COUNT. The flat array for 'vector' must be exactly that count × 3 floats.",
      },
      {
        symptom: "GLB opens in Don McCurdy's viewer but hair is invisible",
        cause:
          "The Curves object was included in the export selection. The glTF exporter silently skips Curves objects (no hair primitive type in glTF 2.0), so only the head mesh appears.",
        fix:
          "Export only the head mesh and the ribbon-mesh plane (the GN modifier result). Apply Modifiers must be enabled. Verify in the GLTF viewer Mesh tab — you should see two mesh primitives (head_scalp and the ribbon mesh).",
      },
    ],
  },
  base,
);
