import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Displace modifier</strong> displaces each vertex along a
        chosen axis by a formula: <code>delta&nbsp;=&nbsp;Strength&nbsp;×&nbsp;(texture_value&nbsp;−&nbsp;mid_level)</code>.
        A texture value of&nbsp;0.5 with mid_level&nbsp;=&nbsp;0.5 produces
        zero movement; white (1.0) pushes <em>out</em>; black (0.0) pulls{" "}
        <em>in</em>.  Voronoi <code>CELL_NOISE</code> fills each cell with
        near-zero at its centre and near-one at its boundary, giving the
        ridge-and-valley structure of coral, bone, and igneous rock surfaces.
        This approach is wholly distinct from the GN route in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-set-position-noise-displacement"
          className={lk}
        >
          Set&nbsp;Position&nbsp;Noise&nbsp;Displacement tutorial
        </Link>{" "}
        and from the Cycles-only route in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles&nbsp;Shader&nbsp;Displacement tutorial
        </Link>
        .  The modifier bakes its result into real vertices on export — it is
        the only of the three approaches that produces displaced geometry in a
        WebXR-ready GLB without a render step.
      </p>
      <p>
        The modifier stack order is the single most important concept.
        Blender applies modifiers from the bottom of the list upwards; the
        Subdivision Surface must sit <em>below</em> Displace so it runs first.
        On an unsubdivided 32×16 UV sphere (~512 verts) a Strength of&nbsp;0.28
        produces sharp spikes — one triangle per Voronoi ridge.  After three
        rounds of Catmull-Clark subdivision (~8&thinsp;000 verts), the same
        Strength reads as smooth organic bumps.  Catmull-Clark also rounds the
        sphere silhouette; use Simple subdivision for terrain planes where you
        want height-map fidelity without silhouette smoothing.  Compare with
        the point-cloud-to-mesh route in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-volume-to-mesh-point-cloud-blob-reconstruction"
          className={lk}
        >
          Volume&nbsp;to&nbsp;Mesh&nbsp;Blob&nbsp;Reconstruction tutorial
        </Link>{" "}
        — that approach reaches a similar organic silhouette via Marching
        Cubes and is directly sculpt-able, but at higher topological cost.
      </p>
      <p>
        <code>texture_coords&nbsp;=&nbsp;&apos;NORMAL&apos;</code> maps the
        texture using each vertex&rsquo;s own surface normal as the sample
        direction, which for a sphere is identical to spherical UV projection
        but requires no pre-mapped UV set.  Switch to{" "}
        <code>&apos;UV&apos;</code> for flat terrain planes where the
        displacement should align with the world texture grid — the same UV2
        pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled&nbsp;BSDF&nbsp;v2&nbsp;PBR&nbsp;WebXR tutorial
        </Link>{" "}
        for lightmap-safe GLB export applies equally here: UV channel 1 for
        material textures, UV channel 2 for lightmap and Displace-mode
        procedural control.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-modifier-displace-voronoi-organic-terrain-webxr",
  title:
    "Modifier Displace — Voronoi Texture-Driven Organic Surface: Coral Prop for WebXR (Blender 5.1)",
  date: "2026-07-01",
  kind: "tutorial",
  excerpt:
    "The Displace modifier displaces vertices by Strength × (texture_value − mid_level) along the vertex normal. Blueprint covers the critical SubDiv-below-Displace modifier stack order, Voronoi CELL_NOISE procedural texture configuration via bpy.data.textures, texture_coords NORMAL vs UV vs OBJECT modes, mid_level mathematics, and GLB export with export_apply=True to bake displaced geometry into a WebXR-ready mesh.",
  Body,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-set-position-noise-displacement",
      label: "Tutorial — GN Set Position Noise Displacement",
      note: "The Geometry Nodes approach to the same organic-displacement goal — per-vertex noise offset via a field, with live GN socket control. Compare modifier-stack vs node-tree displacement workflows.",
    },
    {
      href: "/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision",
      label: "Tutorial — Cycles Shader Displacement + Adaptive Subdivision",
      note: "Rendertime-only displacement in Cycles using Adaptive Subdivision driven by camera distance. The complement to this modifier approach — high detail for rendered stills, not in the GLB.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-volume-to-mesh-point-cloud-blob-reconstruction",
      label: "Tutorial — GN Volume to Mesh: Blob Reconstruction",
      note: "Alternative organic-surface path via SDF volume and Marching Cubes. Higher topological cost but sculpt-compatible — combine with this Displace approach for multi-level detail.",
    },
    {
      href: "/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr",
      label: "Tutorial — Principled BSDF v2 + glTF PBR WebXR",
      note: "UV2 lightmap setup and glTF export conventions. Extend this coral prop with a full PBR material using the same Draco + Y-up + export_apply flags.",
    },
    {
      href: "https://github.com/njanakiev/blender-scripting",
      label: "njanakiev/blender-scripting (MIT — Nicolas Janakiev)",
      note: "Reference bpy patterns for bpy.data.textures.new(), modifier property assignment, and bpy.ops.export_scene.gltf() parameter reference. Related: blender-jupyter (MIT).",
    },
    {
      href: "https://github.com/Maxivz/interactivetoolsblender",
      label: "Maxivz/interactivetoolsblender (MIT — Maxivz)",
      note: "Interactive Blender toolset covering UV and mesh workflow automation; reference for DisplaceModifier.texture_coords 'UV' mode and uv_layer string property. Related: Maxivz/blender-scripts.",
    },
  ],
};

const entry: Entry = buildInstructable(
  {
    time: "35 minutes",
    difficulty: "novice",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Add modifiers from Properties → Modifier tab.",
      "Understand modifier stack order: bottom of list = first applied.",
      "Blender 5.1 installed.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "The Displace modifier and internal Voronoi texture type are stable in Blender 4.x–5.x. The glTF export_apply flag is available from Blender 3.3 LTS onwards.",
      },
    ],
    steps: [
      {
        title: "Understand the displacement formula and Voronoi cell noise",
        body: "delta = Strength × (texture_value − mid_level)\n\n  value=1.0, mid=0.5  →  delta = +0.5×Strength  (pushed OUT: ridges)\n  value=0.0, mid=0.5  →  delta = −0.5×Strength  (pulled IN: holes)\n  value=0.5, mid=0.5  →  delta = 0              (no movement)\n\nVoronoi CELL_NOISE output:\n  Cell centre → ≈ 0.0 (minimum) → hole pulled in\n  Cell wall   → ≈ 1.0 (maximum) → ridge pushed out\nResult: a network of raised ridges separating recessed cells — the natural\ngeometry of coral skeleton, bone trabeculae, and basalt columnar cooling.\n\nCompare with INTENSITY mode: gradient from 0 at centre to 1 at edge — smooth\nbump per cell, no sharp ridge.  CELL_NOISE = hard ridges; INTENSITY = soft bumps.\n\nFor terrain use CLOUDS type (fBm fractal noise): natural erosion-like undulation\nwithout the rigid Voronoi cell geometry.  For skin pores use Voronoi INTENSITY\nwith noise_scale ≈ 0.12 (very fine).",
      },
      {
        title: "Build the base mesh — apply non-uniform scale before Displace",
        body: 'bpy.ops.mesh.primitive_uv_sphere_add(\n    segments=32, ring_count=16, radius=1.0, location=(0, 0, 0)\n)\nobj = bpy.context.active_object\nobj.name = "coral_prop"\nobj.scale = (1.0, 1.0, 0.55)   # flatten: lump silhouette vs perfect sphere\nbpy.ops.object.transform_apply(scale=True)\n# WHY apply scale: the Displace modifier displaces along vertex normals in\n# *local* object space.  An un-applied non-uniform scale distorts those local\n# normals — vertical normals at poles become elongated, horizontal normals at\n# the equator become compressed, making NORMAL-mode displacement anisotropic.\n# Applying scale bakes the distortion into the mesh data, restoring unit normals.\n# Rule: always bpy.ops.object.transform_apply(scale=True) before any deform\n# modifier that uses NORMAL coordinates.',
      },
      {
        title: "Add Subdivision Surface at the BOTTOM of the modifier stack",
        body: 'subdiv = obj.modifiers.new("Subdiv", \'SUBSURF\')\nsubdiv.levels           = 3    # viewport: ~8× more verts than base mesh\nsubdiv.render_levels    = 4    # render: ~16× — slower but smoother for stills\nsubdiv.subdivision_type = \'CATMULL_CLARK\'\n# WHY CATMULL_CLARK: smooths the sphere silhouette by pulling vertices toward\n# limit surface.  SIMPLE adds vertices by midpoint insertion only — no limit\n# surface pull — so the sphere retains facets.  For terrain height maps where\n# you want to preserve exact sampled values, SIMPLE is correct; for organic\n# props, use CATMULL_CLARK.\n\n# Stack after this step (UI shows top-to-bottom, applies bottom-to-top):\n#   [Subdiv CC ×3]   ← only modifier so far, at BOTTOM = applied first\n# Displace will be added next and appear ABOVE Subdiv. ✓',
      },
      {
        title: "Create the Voronoi procedural texture",
        body: "# bpy.data.textures is the legacy texture stack that deform modifiers\n# (Displace, Wave, etc.) read.  It is separate from the shader node tree.\n# Both live in Blender 5.1; they do not share evaluation.\ntex = bpy.data.textures.new(\"voronoi_coral\", type='VORONOI')\ntex.color_type      = 'CELL_NOISE'   # uniform fill per cell\ntex.distance_metric = 'DISTANCE'     # Euclidean F1 = standard Voronoi distance\ntex.noise_scale     = 0.40           # cell size in world units\ntex.noise_intensity = 1.0            # output amplitude (leave at 1.0)\n\n# noise_scale tuning:\n#   0.80 → 3–5 large cells, coarse boulders\n#   0.40 → 8–12 cells, coral/bone pattern (default)\n#   0.15 → 30+ fine cells, skin pores or micro-texture\n\n# Alternative distance metrics and their aesthetics:\n#   MINKOVSKY_HALF    → rounder, softer cells\n#   MINKOVSKY_FOUR    → near-square cells (good for hard-surface panel texture)\n#   CHEBYCHEV          → diamond-shaped cells\n#   MANHATTAN          → diamond grid, no organic look",
      },
      {
        title: "Add Displace modifier ABOVE Subdivision Surface",
        body: "disp = obj.modifiers.new(\"Displace\", 'DISPLACE')\ndisp.texture        = tex\ndisp.texture_coords = 'NORMAL'   # sample along vertex normal, no UV needed\ndisp.direction      = 'NORMAL'   # displace along vertex normal\ndisp.strength       = 0.28       # in world units\ndisp.mid_level      = 0.50       # symmetric in/out\n\n# Stack after this step:\n#   [Displace]       ← applied second (reads the subdivided geometry)\n#   [Subdiv CC ×3]   ← applied first (feeds dense mesh to Displace)\n\n# texture_coords mode comparison:\n#   NORMAL  — each vertex shoots its normal as a ray into the texture.\n#             Self-contained; works on any closed mesh without UV.\n#   UV      — projects texture via UV coordinates. Requires a UV unwrap.\n#             Use when you want texture-direction control (terrain planes).\n#   OBJECT  — projection from a controller empty. Animate the empty to\n#             sweep the displacement across the surface.\n#   GLOBAL  — world-space; texture does not follow the object if moved.\n\n# Vertex group masking (isolate displacement to coral arms only):\n#   disp.vertex_group = \"coral_arms\"  — paint in Weight Paint mode first",
      },
      {
        title: "Apply flat shading and export GLB",
        body: "# Flat shading on the displaced high-poly reads as cel/faceted style;\n# Voronoi ridges become clearly-visible polygon facets — intentional.\nbpy.ops.object.shade_flat()\n\nimport os\nos.makedirs(\"output\", exist_ok=True)\nbpy.ops.export_scene.gltf(\n    filepath=\"output/organic_coral_prop.glb\",\n    export_format='GLB',\n    export_apply=True,   # ← CRITICAL: bakes SubDiv + Displace into geometry\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_yup=True,\n    export_selected=True,\n)\n# Without export_apply=True the exporter strips live modifiers and the GLB\n# contains only the base 512-vert sphere.  export_apply=True evaluates the\n# full modifier stack and serialises the result (~8 000 verts, Draco ≈ 60–70%\n# compression on subdivided geometry, final GLB typically 80–200 kB).",
      },
    ],
    finalResult:
      "A flattened UV sphere with Voronoi CELL_NOISE displacement at ~8 000 vertices, Draco-compressed, Y-up GLB. The modifier stack remains live in the .blend for continued Strength / noise_scale tuning. Flat shading gives a cel/faceted coral aesthetic compatible with the studio low-poly style.",
    variations: [
      "Animated growth: keyframe disp.strength from 0.0 to 0.28 over 60 frames. Use EXPO interpolation (kp.interpolation = 'EXPO') for organic ease-in. The GLB does not carry this animation unless baked to shape keys with bpy.ops.object.shape_key_add() at each frame — feasible for short (≤5-frame) morph sequences.",
      "OBJECT-mode directional sweep: add bpy.ops.object.empty_add(), set disp.texture_coords = 'OBJECT' and disp.texture_coords_object = empty. Animate the empty's X position to sweep the Voronoi pattern across the prop's surface — creates a coral-growth animation without modifying the texture itself.",
      "Layered Displace: add a second Displace modifier above the first using a Clouds texture with noise_scale = 1.5 for macro-scale undulation (big hills), while the Voronoi Displace below adds micro-scale ridges. Two Displace modifiers stack additively. Tune their Strength ratio: macro:micro ≈ 0.5:0.15 for natural multi-scale terrain.",
    ],
    troubleshooting: [
      {
        symptom: "GLB exports a plain smooth sphere with no displacement",
        cause: "export_apply=True was omitted, or the Displace modifier's viewport eye icon is disabled.",
        fix: "Add export_apply=True to the gltf export call. Check the modifier stack: confirm the Displace modifier has its viewport enable (eye icon) turned on. If you want to confirm before export, use Object → Apply → All Modifiers (destructive) and inspect the mesh in Edit Mode — you should see displaced vertex positions.",
      },
      {
        symptom: "Displacement looks spiky / faceted even at low Strength",
        cause: "Subdivision Surface is either missing, sits above Displace in the stack, or has levels 0–1.",
        fix: "Open Properties → Modifier tab. Verify the stack is: [Displace] at top, [Subdiv] at bottom. If Subdiv is above Displace, drag it below (grab the grip dots on the left of the modifier header and drag). Increase subdiv.levels to 3 minimum. Remember: bottom of the list = first applied.",
      },
      {
        symptom: "Texture Properties tab shows an empty texture browser after adding Displace",
        cause: "The Texture Properties tab is context-sensitive and only shows the active modifier's texture.",
        fix: "In Properties → Modifier, click the Displace modifier header bar to make it active (highlighted border appears). Then switch to Properties → Texture (the icon resembling a chequered strip, below the Camera icon). The voronoi_coral texture settings will appear there.",
      },
    ],
  },
  base,
);

export { entry };
