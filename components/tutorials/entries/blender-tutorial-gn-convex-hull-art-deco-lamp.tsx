import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnConvexHullBody() {
  return (
    <>
      <p>
        <strong>GeometryNodeConvexHull</strong> wraps any input geometry in the
        minimal convex polyhedron — the tightest possible mesh that contains every
        input vertex without any inward-facing concavity.  When you first noise-displace
        a sphere and then run Convex Hull on the result, the node &ldquo;bridges&rdquo;
        across the concave valleys between displacement peaks, collapsing each valley into
        a single large planar face.  The number of hull faces is not predictable in
        advance — it equals the number of{" "}
        <em>extreme points</em> in the displaced vertex cloud, which depends on noise
        scale and amplitude rather than the underlying subdivision count.  This is the
        mechanism that produces the art-deco facet pattern: fewer, larger displacement
        bumps produce fewer, larger planar faces; more, smaller bumps give the
        crushed-velvet look.  The resulting faces are{" "}
        <em>exactly</em> planar by mathematical construction, so flat shading is
        lossless — no custom split normals, no Shade Smooth artefacts to suppress.
        Compare the noise-driven displacement approach here with the manual geometry
        booleans in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-mesh-boolean-hard-surface"
          className={lk}
        >
          GN Mesh Boolean tutorial
        </Link>
        , where concavities are intentionally cut rather than bridged.
      </p>

      <p>
        The displacement uses a 4D noise texture (
        <code>noise_dimensions=&apos;4D&apos;</code>) with the W socket animated over
        48 frames.  Advancing W translates through a{" "}
        <em>different spatial pattern</em> at every value — the facet topology genuinely
        changes (edges appear and disappear) rather than merely scaling.  Animating{" "}
        <code>NOISE_SCALE</code> instead would only zoom the same field, resizing all
        facets proportionally with no topological variety.  This is the same 4D W-axis
        technique used for the animated blob planet in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          Set Position + Noise Displacement tutorial
        </Link>
        .  The detail parameter must be kept{" "}
        <em>low</em> (2.0 is the sweet spot for art-deco lantern silhouettes): raising
        it adds self-similar fractal octaves that smooth the displacement into an
        even envelope, so the convex hull converges back toward a sphere and the
        faceting collapses.  The noise output is centred — subtract 0.5 and multiply
        by 2 — so the displacement is symmetric about zero and the sphere neither
        inflates nor deflates on average.  The Amp group-input socket scales the
        final Normal×noise vector; values above 0.5 produce spiky star forms rather
        than lantern shapes.  See how emission material drives the glowing glass look
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          GN Fillet Curve — Neon Sign tutorial
        </Link>
        , and how full glass transmission is handled in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF Transmission &amp; Iridescence tutorial
        </Link>
        .
      </p>

      <p>
        The GLB export is clean and full-featured: the convex hull geometry is
        baked into actual mesh faces by{" "}
        <code>export_apply=True</code>, the W-animation is embedded as a glTF
        morph target (or animation track via the default exporter), and Draco level&nbsp;6
        compresses the low polygon-count hull efficiently.  Because hull faces are
        perfectly flat, the glTF{" "}
        <code>NORMAL</code> accessor is tightly compressed — flat normals are
        constant per face, so Draco&rsquo;s delta-coding achieves high ratios.  In
        Three.js, load the GLB with{" "}
        <code>GLTFLoader</code> and the{" "}
        <code>DRACOLoader</code> extension; the MeshStandardMaterial receives the
        amber emission colour and transmission weight from the exported
        KHR_materials_transmission extension.  For WebXR delivery where bandwidth
        matters, you can reduce to{" "}
        <code>SPHERE_SUBDIVISIONS=2</code> (42 input vertices → ~15 hull faces)
        without losing the art-deco character — the facet count is already low
        enough that further reduction reads as intentional low-poly rather than
        quality loss.  The faceted gem export pipeline is covered end-to-end in the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          Faceted Gem WebXR Export tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-convex-hull-art-deco-lamp",
  title:
    "GN Convex Hull — Procedural Faceted Art-Deco Lamp Shade (Blender 5.1)",
  date: "2026-06-08",
  kind: "tutorial",
  excerpt:
    "GeometryNodeConvexHull wraps a noise-displaced IcoSphere in the minimal enclosing convex polyhedron, collapsing concave valleys into large planar faces. The noise scale controls facet density; animating the 4D W axis morphs facet topology rather than merely scaling. Expert coverage of the centring chain, the Detail paradox, W-axis animation strategy, and GLB Draco compression of flat-normal geometry.",
  Body: GnConvexHullBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-set-position-noise-displacement",
      label: "Tutorial — GN Set Position + Noise Displacement (Animated Blob Planet)",
      note: "The same 4D noise W-axis animation technique used for procedural surface displacement.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-fillet-curve-neon-sign",
      label: "Tutorial — GN Fillet Curve — Procedural Neon Sign",
      note: "Emission material workflow for glowing glass geometry in EEVEE Next.",
    },
    {
      href: "/tutorials/blender-tutorial-shader-principled-transmission-iridescence",
      label: "Tutorial — Principled BSDF Transmission & Iridescence",
      note: "Full glass transmission and iridescence setup; extends the lamp material further.",
    },
    {
      href: "/tutorials/blender-tutorial-faceted-gem-webxr",
      label: "Tutorial — Faceted Gem WebXR Export",
      note: "End-to-end pipeline for getting flat-shaded faceted geometry into Three.js via GLB.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-points-to-volume-organic-coral",
      label: "Tutorial — GN Points to Volume — Organic Coral Blob",
      note: "The volumetric alternative for organic blob forms: compare with Convex Hull's taut surface approach.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/convex_hull.html",
      label:
        "Blender Manual — Convex Hull Node (CC-BY-SA 4.0 — Blender Documentation Team)",
      note: "Full node reference. Key facts: single Geometry input, single Geometry output; no field inputs or domain selector — all variation comes from the upstream point positions; the output mesh is always a closed, manifold, convex polyhedron with planar faces; Euler characteristic V−E+F=2 always holds on the hull. Related projects: blender/blender source (GPL-2.0, not used here). Companion nodes: Merge by Distance (reduce vertex cloud before hulling for coarser facets), Gift-Wrap algorithm is the underlying method for 3D convex hulls.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference collection of headless bpy scripting patterns. Covers node group construction, modifier socket identifier lookup via ng.interface.items_tree, and keyframe insertion on modifier sockets — all patterns used in this blueprint. Related sibling resources: blender-python-snippets by the Blender Artists community (CC0).",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO — Official glTF Exporter (Apache-2.0 — Khronos Group)",
      note: "The Blender glTF exporter source. Relevant for understanding how export_apply=True triggers GN modifier evaluation, how KHR_materials_transmission exports Principled BSDF Transmission Weight, and how flat-normal meshes are stored in the NORMAL accessor. Related: KhronosGroup/glTF (specification), KhronosGroup/glTF-Sample-Models (test assets, Apache-2.0).",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "one hour",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Familiar with the Geometry Nodes editor: can add nodes, connect sockets, read the node graph.",
      "Blender 5.1 installed; can run a .py script via the Text Editor workspace.",
      "Understands Set Position + Noise Texture displacement (see the Blob Planet tutorial).",
      "Optional: read the Faceted Gem WebXR tutorial to understand the export pipeline.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "GeometryNodeConvexHull has been stable since Blender 3.0. In 5.1 it is listed under Mesh ▸ Operations in the Add Node menu. The 4D noise texture requires noise_dimensions='4D' on ShaderNodeTexNoise — this was available from Blender 3.4 onwards.",
      },
    ],
    steps: [
      {
        title: "Understand what GeometryNodeConvexHull actually computes",
        body: "GeometryNodeConvexHull is a pure geometry transform node:\n\n  Node type string: 'GeometryNodeConvexHull'\n  Inputs:  [0] Geometry\n  Outputs: [0] Convex Hull (Geometry)\n\nIt has no domain selector, no field inputs, no parameters.  It reads the evaluated\npoint positions of whatever mesh or point cloud arrives at its input and returns the\nminimal enclosing convex polyhedron.\n\nConvex means: for any two points on the surface, the straight line between them\nstays inside the mesh.  There are no concavities, no overhangs, no re-entrant edges.\n\nWhy this creates facets:\n  Start with a sphere displaced by noise.  The noise creates local peaks (vertices\n  pushed outward) and valleys (vertices pushed inward).  The convex hull finds all\n  extreme points — those on the outermost convex boundary — and constructs planar\n  faces between them.  Vertices in concave zones (between two peaks) are interior to\n  the hull and do NOT appear in the output mesh.  The face that spans two adjacent\n  peaks IS the hull face; it is a large, flat polygon.\n\nFace count insight:\n  The hull face count depends on the NUMBER OF PEAKS, not the number of input\n  vertices.  Adding more subdivisions to the sphere in a smooth (unpeaked) region\n  adds no hull faces — those new vertices are interior to the hull and discarded.\n  To get more hull faces, increase NOISE_SCALE (more peaks per unit of sphere\n  surface) or decrease NOISE_DETAIL (each octave adds small secondary peaks that\n  can become hull faces — counterintuitively, MORE detail with HIGH roughness can\n  produce more faces, but the faces become irregular and small).\n\nThe sweet spot for art-deco lantern character:\n  NOISE_SCALE 2.0–2.5, NOISE_DETAIL 1.5–2.5 → 20–40 hull faces\n  This matches the face count of a hand-cut faceted glass lantern.",
      },
      {
        title: "Build the noise displacement chain with centred output",
        body: "The displacement chain has four nodes before SetPosition:\n\n  # 1. Input position field (required by 4D noise Vector socket)\n  ipos = nodes.new('GeometryNodeInputPosition')\n\n  # 2. 4D noise texture\n  noise = nodes.new('ShaderNodeTexNoise')\n  noise.noise_dimensions = '4D'\n  noise.inputs['Scale'].default_value     = 2.2\n  noise.inputs['Detail'].default_value    = 2.0\n  noise.inputs['Roughness'].default_value = 0.52\n  links.new(ipos.outputs['Position'], noise.inputs['Vector'])\n  links.new(gin.outputs['W Seed'],    noise.inputs['W'])\n\n  # 3. Centre the output: (Fac − 0.5) × 2 → [−1, +1]\n  msub.operation = 'SUBTRACT'; msub.inputs[1].default_value = 0.5\n  mmul.operation = 'MULTIPLY'; mmul.inputs[1].default_value = 2.0\n  links.new(noise.outputs['Fac'], msub.inputs[0])\n  links.new(msub.outputs['Value'], mmul.inputs[0])\n\n  # 4. Scale by Amp group input\n  mamp.operation = 'MULTIPLY'\n  links.new(mmul.outputs['Value'], mamp.inputs[0])\n  links.new(gin.outputs['Amp'],    mamp.inputs[1])\n\nWHY CENTRING MATTERS:\n  ShaderNodeTexNoise.Fac outputs a float in [0, 1].  An uncentred value would\n  always be positive, meaning all vertices displace OUTWARD.  The resulting shape\n  is a balloon, not a faceted gem.  Centring to [−1, +1] lets half the vertices\n  push inward and half outward, creating genuine concavities for the hull to bridge.\n\nWHY DETAIL = 2.0:\n  At Detail = 2.0, the noise has two harmonic layers.  The first produces the large\n  displacement peaks that become hull faces.  The second adds slight variation within\n  each peak, making the faces slightly irregular (less mechanical).  At Detail = 6–8,\n  the displacement surface is so self-similar and rough that the hull needs hundreds\n  of faces to approximate it — the art-deco character is lost.",
      },
      {
        title: "Scale Normal by amplitude and feed into Set Position Offset",
        body: "The displacement direction is along each vertex's surface normal:\n\n  inorm = nodes.new('GeometryNodeInputNormal')\n\n  vscl = nodes.new('ShaderNodeVectorMath')\n  vscl.operation = 'SCALE'\n  links.new(inorm.outputs['Normal'],   vscl.inputs[0])     # Vector\n  links.new(mamp.outputs['Value'],     vscl.inputs['Scale'])  # scalar\n\n  setp = nodes.new('GeometryNodeSetPosition')\n  setp.inputs[1].default_value = True                        # Selection\n  links.new(gin.outputs['Geometry'],   setp.inputs[0])       # Geometry\n  links.new(vscl.outputs['Vector'],    setp.inputs[3])       # Offset\n\nWHY OFFSET SOCKET (inputs[3]) NOT POSITION SOCKET (inputs[2]):\n  The Offset socket ADDS to the existing vertex position — the base sphere shape\n  is preserved and only displaced.  The Position socket REPLACES the coordinate\n  absolutely — wiring noise into Position would scatter all vertices to arbitrary\n  locations in world space rather than pushing them along the sphere surface.\n\nVectorMath SCALE socket naming in Blender 4.0+:\n  In SCALE mode the VectorMath node exposes a named 'Scale' socket for the scalar.\n  In Blender 3.x this was unnamed (inputs[3]).  In 5.1, inputs['Scale'] is correct.\n  The blueprint uses inputs['Scale'] for clarity; if running on older builds, use\n  vscl.inputs[3].default_value instead.",
      },
      {
        title: "Wire Convex Hull and Set Shade Smooth = False",
        body: "Convex Hull is a single-step transform:\n\n  hull = nodes.new('GeometryNodeConvexHull')\n  links.new(setp.outputs[0], hull.inputs[0])\n\nThen disable smooth shading on the output:\n\n  sssm = nodes.new('GeometryNodeSetShadeSmooth')\n  sssm.domain = 'FACE'\n  sssm.inputs[2].default_value = False   # Shade Smooth = False → flat\n  links.new(hull.outputs[0], sssm.inputs[0])\n\nWHY SET SHADE SMOOTH = FALSE IN THE GRAPH (not in object properties):\n  The hull is created fresh every time the modifier evaluates — it is not a\n  persistent mesh.  Marking shade-flat in Object Properties only affects the\n  underlying mesh data-block, not the GN output.  SetShadeSmooth inside the GN\n  tree stamps the smooth flag onto the output mesh each evaluation.\n\nWHY FLAT SHADING IS CORRECT HERE:\n  Hull faces are exactly planar.  Smooth shading would interpolate normals from\n  the hull face corners toward the adjacent face corners, creating a gradient\n  across each face and making it appear curved — defeating the entire point of the\n  convex hull construction.  Flat shading uses the face normal directly, which is\n  the true perpendicular to each planar polygon.\n\nObservation after this step:\n  In Material Preview, the viewport will show sharp edge lines between every hull\n  face.  The number of faces visible is the hull face count — count them to\n  verify the NOISE_SCALE/NOISE_DETAIL parameter effect.",
      },
      {
        title: "Animate W Seed via modifier socket keyframing",
        body: "Find the W Seed socket identifier and insert keyframes:\n\n  mod = obj.modifiers.new('ConvexHullLamp', 'NODES')\n  mod.node_group = ng\n\n  # Discover identifier from the group interface\n  w_id = amp_id = None\n  for item in ng.interface.items_tree:\n      if item.in_out == 'INPUT' and item.name == 'W Seed':\n          w_id = item.identifier       # e.g. 'Socket_2'\n      elif item.in_out == 'INPUT' and item.name == 'Amp':\n          amp_id = item.identifier\n\n  mod[amp_id] = 0.32\n\n  scene.frame_set(1)\n  mod[w_id] = 0.0\n  mod.keyframe_insert(data_path=f'[\"{w_id}\"]', frame=1)\n  scene.frame_set(48)\n  mod[w_id] = 1.8\n  mod.keyframe_insert(data_path=f'[\"{w_id}\"]', frame=48)\n\n  # LINEAR interpolation: constant-rate morphing, no ease-in/out\n  for fc in obj.animation_data.action.fcurves:\n      for kp in fc.keyframe_points:\n          kp.interpolation = 'LINEAR'\n\nWHY W = 1.8 RATHER THAN 1.0:\n  The 4D noise field has large-scale coherence: W values spaced < 1.0 apart show\n  similar facet patterns.  W=1.8 covers ~1.8 full field cycles, ensuring the final\n  frame looks clearly different from the first.  Values above 3.0 can produce\n  visually similar facets again (field becomes periodic at large scale).\n\nWHY NOT A DRIVER:\n  A driver expression (frame*0.0375) produces the same linear ramp but requires\n  a scene variable reference.  Keyframes are more portable: the .blend file shows\n  the animation in the timeline without inspecting driver expressions.",
      },
      {
        title: "Export GLB and verify flat normals in Three.js",
        body: "Export at frame 24 (mid-morph):\n\n  scene.frame_set(24)\n  bpy.ops.export_scene.gltf(\n      filepath='//convex_hull_lamp.glb',\n      export_format='GLB',\n      export_apply=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_yup=True,\n      export_animations=True,\n  )\n\nFlat normals in the GLB:\n  Flat-shaded meshes in glTF have a distinct property: the NORMAL accessor stores\n  one normal per face corner, NOT per vertex.  A cube with 8 vertices but 24 face\n  corners (6 faces × 4 corners) stores 24 normal values.  Draco compresses this\n  efficiently because normals within each face are identical (constant-run encoding).\n  The hull with ~30 faces has roughly 90–120 normal values — tiny.\n\nThree.js consumption:\n  import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'\n  import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'\n  // Transmission requires WebGLRenderer with physicallyCorrectLights or\n  // the newer ACESFilmic tone mapping + MeshPhysicalMaterial.transmission\n  loader.load('/library/blends/geometry-nodes/gn-convex-hull-art-deco-lamp/convex_hull_lamp.glb',\n    gltf => scene.add(gltf.scene)\n  )\n\nKHR_materials_transmission export:\n  Principled BSDF Transmission Weight = 0.85 exports via the\n  KHR_materials_transmission extension.  Confirm in the GLB with a JSON inspector:\n  mesh → primitives[0] → material → extensions → KHR_materials_transmission\n    → transmissionFactor: 0.85\n  Three.js r152+ MeshPhysicalMaterial reads this automatically.",
      },
    ],
    finalResult:
      "A faceted art-deco lamp shade with ~20–40 mathematically planar hull faces, warm amber emission glow, and glass transmission. The .blend file shows 48-frame animated W-axis morph + rotation. GLB exports cleanly at ~15 KB with Draco 6; KHR_materials_transmission carries the glass properties. Flat normals verified in Three.js MeshPhysicalMaterial.",
    variations: [
      "Crystal cluster: SPHERE_SUBDIVISIONS=2 (42 verts) + NOISE_AMP_DEFAULT=0.55 + NOISE_SCALE=1.4 → ~12 large shard faces. Duplicate the lamp object 4 times, scale each copy randomly from 0.3 to 1.0, rotate on Z by random amounts. Result: a cluster of distinct crystals, each a valid convex hull with no shared geometry. LAMP_COLOUR=(0.85, 0.95, 1.0, 1.0) cool blue-white for ice crystal read.",
      "Morphing jewel pendant: NOISE_AMP=0.22 (subtle displacement) + NOISE_SCALE=3.5 → ~55 small facets. Animate W from 0→3.0 over 120 frames for a slow, contemplative morph. Add a Subdivision Surface modifier BEFORE the GN modifier (not inside the GN tree) to smooth the input sphere further — this makes peaks smaller relative to sphere radius, reducing displacement amplitude needed. Combine with KHR_materials_iridescence for a colour-shifting jewel.",
      "Low-poly WebXR collision proxy: SPHERE_SUBDIVISIONS=1 (12 verts on ICO-1) + NOISE_AMP=0.08 → 8–10 hull faces. This produces a reliable convex hull that functions as a collision geometry in physics engines (Rapier.js, Bullet). No animation needed. Export with export_apply=True + use_mesh_modifiers=True, then load into @react-three/rapier as a convexHull collider. The hull face count is low enough for real-time physics at 60 fps.",
    ],
    troubleshooting: [
      {
        symptom: "Convex Hull output looks like a smooth sphere — no visible facets",
        cause: "NOISE_DETAIL is too high (6+), or NOISE_AMP is too small (< 0.1). High detail produces self-similar fractal displacement that averages out to a smooth envelope. The hull faithfully wraps it but needs many small faces to approximate the dense peaks.",
        fix: "Set NOISE_DETAIL = 2.0 and NOISE_AMP = 0.28–0.38 first. Then adjust NOISE_SCALE: lower values (1.5–2.5) produce the clearest art-deco lantern facets. If the output still looks smooth, confirm the Set Position Offset chain is wired correctly: check that the displacement vector reaches setp.inputs[3] (Offset) not setp.inputs[2] (Position).",
      },
      {
        symptom: "mod[w_id] raises KeyError — modifier socket not found",
        cause: "The socket identifier (e.g. 'Socket_2') has changed because node group sockets were deleted and re-added, which reassigns identifier numbers.",
        fix: "Re-run the identifier lookup after any interface change: for item in ng.interface.items_tree: print(item.name, item.identifier, item.in_out). Use the printed identifier in the mod[id] assignment. Avoid deleting and re-adding sockets; always check that w_id and amp_id are not None before using them.",
      },
      {
        symptom: "GLB in Three.js shows smooth shading — facets invisible",
        cause: "The Set Shade Smooth node is missing from the GN tree, or its Shade Smooth input (inputs[2]) is left at True (the default).",
        fix: "Add GeometryNodeSetShadeSmooth after the Convex Hull node. Set domain='FACE' and inputs[2].default_value=False explicitly — the node defaults to True. Re-export with export_apply=True. Verify in a glTF validator that mesh.primitives[0].extras or the material does not carry a smoothNormals override that could re-enable smooth shading.",
      },
    ],
  },
  base,
);

export { entry };
