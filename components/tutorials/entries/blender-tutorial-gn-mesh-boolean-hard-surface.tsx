import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnMeshBooleanBody() {
  return (
    <>
      <p>
        Blender&rsquo;s Boolean Modifier cuts one object&rsquo;s volume out of
        another, but it requires a separate cutter object for each cut. Doing
        fifty holes means fifty cutter objects, fifty modifier entries, and a
        scene outliner that rapidly becomes unmanageable. The Geometry Nodes
        Mesh Boolean node takes two{" "}
        <em>Geometry</em> inputs &mdash; both can be generated entirely inside
        the same node group &mdash; so the cutter geometry is procedural: a
        Poisson-distributed scatter of cylinders driven by sliders for density,
        radius, and depth. One modifier, one object, zero extra scene clutter.
      </p>

      <p>
        The Mesh Boolean node exposes two solvers. <strong>FAST</strong> uses a
        flood-fill approach and is roughly four times quicker on dense geometry,
        but it fails silently on non-manifold inputs, self-intersecting cutters,
        and overlapping cutter volumes &mdash; it returns either an empty mesh or
        an inverted solid with no warning. <strong>EXACT</strong> uses
        multi-precision integer arithmetic and handles all of those edge cases
        correctly. For a scatter-based cutter (cylinders can overlap at high
        density) EXACT is always the right choice: the extra computation time is
        negligible for panels under a hundred thousand source faces, and the
        trade-off of accepting an invisible failure mode is never worth four
        milliseconds of render time.
      </p>

      <p>
        There is one step between Instance on Points and Mesh Boolean that
        surprises every first-time user:{" "}
        <strong>Realize Instances</strong> is mandatory. The Instance on Points
        node outputs an <em>Instances</em> geometry type &mdash; lightweight
        transform references, not real mesh data. The Mesh Boolean node requires
        a <em>Mesh</em> type. Connecting Instances directly to the Boolean cutter
        input produces a silent no-op: the panel stays intact with no error in
        the interface. Inserting Realize Instances between them converts the
        transform references to actual copied mesh data, which the Boolean solver
        can then consume. The{" "}
        <Link href="/tutorials/blender-tutorial-gn-instance-on-points" className={lk}>
          Instance on Points tutorial
        </Link>{" "}
        covers Realize Instances in the context of scatter-for-export; here it
        plays a different role &mdash; feeding a boolean solver rather than
        collapsing for GLB.
      </p>

      <p>
        The export step follows the same rule as every other GN tutorial:{" "}
        <code>export_apply=True</code> in the{" "}
        <code>bpy.ops.export_scene.gltf()</code> call. Without it the exporter
        receives the raw quad-grid panel mesh with no holes. With it the
        dependency graph evaluates the GN modifier, bakes the boolean result to
        temporary mesh data, and serialises that to the GLB. The{" "}
        <Link href="/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines" className={lk}>
          GN Extrude Mesh panel lines tutorial
        </Link>{" "}
        uses the same flag for the same reason &mdash; the two techniques
        complement each other: extruded panel lines give shallow surface relief,
        boolean cuts give through-holes and deep recesses. Combining both in one
        GN tree gives the kind of readable hard-surface read that makes low-poly
        space-station panels look credible without any UV-mapped texture detail.
        See the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          texture baking tutorial
        </Link>{" "}
        for how to collapse the high-detail boolean result into a normal map for
        a lower-poly LOD.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-mesh-boolean-hard-surface",
  title:
    "GN Mesh Boolean: procedural holes and cutouts for hard-surface assets in Blender 5.1",
  date: "2026-05-23",
  kind: "tutorial",
  excerpt:
    "Cut a Poisson-distributed grid of cylindrical holes through a panel mesh using a single Geometry Nodes modifier — exposing Hole Density, Radius, Depth, and Seed as live sliders. Covers the FAST vs EXACT solver trade-off, why Realize Instances is mandatory between scatter and boolean, and the export_apply=True requirement for GLB.",
  Body: GnMeshBooleanBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-extrude-mesh-panel-lines",
      label: "Tutorial — GN Extrude Mesh panel lines",
      note: "The complement technique: shallow recessed panel lines via Extrude Mesh rather than through-hole Boolean. Combine both in one GN tree for a full hard-surface read.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-instance-on-points",
      label: "Tutorial — GN Instance on Points",
      note: "The Distribute Points + Instance on Points pattern that also feeds the cutter scatter here. Covers Realize Instances in the export context.",
    },
    {
      href: "/tutorials/blender-tutorial-texture-baking-normal-ao",
      label: "Tutorial — Texture Baking: Normal Map + AO",
      note: "How to bake the high-detail boolean geometry down to a normal map for a lightweight low-poly LOD ready for real-time rendering.",
    },
    {
      href: "/tutorials/blender-tutorial-low-poly-faceted-hard-surface",
      label: "Tutorial — Low-poly faceted hard surface",
      note: "The manual modelling companion: hand-placed edge loops and flat-shaded normals for the same asset class without GN.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/mesh_boolean.html",
      label: "Blender Manual — Mesh Boolean node (CC-BY-SA 4.0 · Blender Foundation)",
      note: "Official documentation for the Mesh Boolean node: operation enum, solver options, Self Intersection and Hole Tolerant flags, and performance notes. The solver comparison section explains exactly why EXACT costs more time but produces reliable results.",
    },
    {
      href: "https://github.com/blender/blender/blob/main/source/blender/geometry/intern/mesh_boolean.cc",
      label: "blender/blender — mesh_boolean.cc (Apache-2.0 · Blender Foundation, Howard Trickey lead)",
      note: "The C++ source of the EXACT boolean solver. Howard Trickey's multi-precision arithmetic implementation directly explains the failure modes documented above: the flood-fill path in the FAST solver short-circuits on non-manifold edge cases that the EXACT path handles with compensated arithmetic. Reading the two solver branches side-by-side is the clearest explanation of why they diverge.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "KhronosGroup/glTF-Blender-IO (Apache-2.0 · Khronos Group)",
      note: "The Blender glTF exporter source. The export_apply logic in blender_gltf2_addon/blender/exp/gltf2_blender_gather_meshes.py shows exactly when the dependency graph is asked to evaluate GN modifiers — confirming that export_apply=True is the correct flag and not a workaround.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Completed the GN Instance on Points tutorial, or comfortable with building node trees via bpy.data.",
      "Blender 5.1 installed and able to run blueprint.py headlessly.",
      "Understand what a closed (manifold, watertight) mesh is — the cutter cylinder must be fully closed for the boolean solver to define a volume.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Uses BLENDER_EEVEE_NEXT for the record.py render step.",
      },
    ],
    steps: [
      {
        title: "Create the base panel with bmesh.ops.create_grid (not bpy.ops)",
        body: "bpy.ops.mesh.primitive_grid_add() requires an active 3D viewport context. In --background mode it does nothing. Use bmesh instead:\n\n  mdata = bpy.data.meshes.new('panel_base')\n  obj   = bpy.data.objects.new('panel_boolean', mdata)\n  bpy.context.scene.collection.objects.link(obj)\n\n  import bmesh\n  bm = bmesh.new()\n  bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1.0)\n  bm.to_mesh(mdata)\n  bm.free()\n\nbmesh.ops.create_grid with x_segments=1, y_segments=1 produces a single quad. This is the cleanest input to a boolean: no interior edges, no seam vertices, no subdivided topology to complicate the solver's inside/outside classification. If the panel needs visible surface detail add a Subdivision Surface modifier AFTER the Boolean modifier so the topology is only dense where the boolean result already exists.",
      },
      {
        title: "Declare GN I/O sockets with tree.interface.new_socket()",
        body: "Create the node group and declare sockets before adding any nodes:\n\n  tree = bpy.data.node_groups.new(type='GeometryNodeTree', name='GNBooleanHoles')\n  tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n  tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n  s = tree.interface.new_socket('Hole Density', in_out='INPUT', socket_type='NodeSocketFloat')\n  s.default_value = 4.0\n  s.min_value = 0.1\n\ntree.interface.new_socket() is the Blender 4.0+ API. tree.inputs.new() was removed before 5.x. Socket insertion order determines the mod['Input_N'] index: Geometry INPUT = Input_0 (auto-wired), Hole Density = Input_2 (after the Geometry OUTPUT at Input_1), Hole Radius = Input_3, Hole Depth = Input_4, Seed = Input_5.",
      },
      {
        title: "Build the cutter geometry: Cylinder with NGON caps",
        body: "Add the cutter cylinder node:\n\n  n_cyl = nodes.new('GeometryNodeMeshCylinder')\n  n_cyl.fill_type = 'NGON'   # closed solid: one polygon per end cap\n  n_cyl.inputs['Vertices'].default_value = 12\n\nThe fill_type matters critically. NONE leaves open end caps — the cylinder is not a closed solid and the boolean solver cannot determine its interior, so DIFFERENCE produces no cut. TRIFAN creates triangulated caps from a centre vertex (more faces, same result). NGON creates a single flat polygon per cap — fewest faces, fully closed, correct boolean behaviour.\n\nThe Radius and Depth inputs are wired from Group Input sockets (not set as default_value on the node itself) so they become live modifier sliders.",
      },
      {
        title: "Scatter cutters with Distribute Points on Faces (POISSON)",
        body: "Add the distribution and instance nodes:\n\n  n_dist = nodes.new('GeometryNodeDistributePointsOnFaces')\n  n_dist.distribute_method = 'POISSON'\n\n  n_inst = nodes.new('GeometryNodeInstanceOnPoints')\n\n  n_real = nodes.new('GeometryNodeRealizeInstances')\n\nPoisson disk distribution enforces a minimum spacing between points derived from the Density Max value. For circular holes the natural minimum spacing floor is 2 × radius — points closer than this would produce overlapping cylinders, which the FAST solver cannot handle. The EXACT solver handles the overlap correctly, but keeping Density low enough to avoid severe overlap also keeps face count manageable after realization.\n\nRealize Instances is the mandatory step between Instance on Points and Mesh Boolean. Instance on Points outputs an Instances geometry type — lightweight transform references. Mesh Boolean requires a Mesh type. Connect Instances directly and the boolean is a silent no-op: the panel stays intact, no error shown, no log warning. After Realize Instances the instances become actual copied mesh data. The face count after realization = hole_count × (2 × ring_verts + 2 × cap_faces). At density 4 on a 2m panel (~16 holes), ring_verts=12: 16 × 26 = 416 faces for the cutter mesh before the boolean subtraction.",
      },
      {
        title: "Configure the Mesh Boolean node: EXACT solver, Hole Tolerant",
        body: "Add and configure the boolean node:\n\n  n_bool = nodes.new('GeometryNodeMeshBoolean')\n  n_bool.operation = 'DIFFERENCE'\n  n_bool.solver    = 'EXACT'\n  n_bool.inputs['Self Intersection'].default_value = False\n  n_bool.inputs['Hole Tolerant'].default_value     = True\n\nWire it:\n  links.new(n_in.outputs['Geometry'],     n_bool.inputs[0])  # base mesh\n  links.new(n_real.outputs['Geometry'],   n_bool.inputs[1])  # cutters\n\nThe first input socket (index 0) is the Mesh being cut. The second (index 1) is the cutter. Additional cutter inputs can be added by wiring to inputs[2], inputs[3], etc. — Blender adds multi-input slots automatically.\n\nHole Tolerant enables the solver's interior classification pass that handles inputs with topological holes (boundary edges). The flat quad panel has no holes, but enabling this costs negligible time and prevents silent failure if the user swaps in a mesh with cuts already in it.",
      },
      {
        title: "Add Set Shade Smooth (FACE domain) after the boolean",
        body: "Add the smooth node:\n\n  n_smooth = nodes.new('GeometryNodeSetShadeSmooth')\n  n_smooth.domain = 'FACE'\n  n_smooth.inputs['Shade Smooth'].default_value = True\n\nThe boolean operation removes faces from the base mesh and replaces them with the interior faces of the cutter. The replacement faces inherit the shade-smooth state of the boolean result rather than the base object. Without an explicit Set Shade Smooth node, hole walls often render flat-shaded regardless of the object's shade-smooth state. Setting domain='FACE' applies smooth shading uniformly to every polygon produced by the boolean, including the curved cylinder walls and the remaining flat panel faces.",
      },
      {
        title: "Attach modifier and set input values",
        body: "Attach the node group:\n\n  mod = obj.modifiers.new(name='HoloflowGNBoolean', type='NODES')\n  mod.node_group = tree\n\nSet live values:\n  mod['Input_2'] = 4.0    # Hole Density\n  mod['Input_3'] = 0.07   # Hole Radius\n  mod['Input_4'] = 0.25   # Hole Depth\n  mod['Input_5'] = 7      # Seed\n\nThe mod['Input_N'] dictionary holds the live values used during depsgraph evaluation. These are distinct from the socket default_value set on the interface — both exist in memory, but the modifier dictionary value takes precedence. Always set mod['Input_N'] explicitly after attaching the modifier; do not rely on socket defaults alone.",
      },
      {
        title: "Export GLB with export_apply=True",
        body: "Select the panel object and export:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n      export_materials='EXPORT',\n      export_image_format='WEBP',\n  )\n\nexport_apply=True triggers bpy.types.Depsgraph.object_get_evaluated() which evaluates the full modifier stack including the GN boolean. The evaluated mesh — with holes punched through it — is what the exporter serialises. Without this flag the exporter writes the raw quad grid: no holes, wrong output.\n\nVerify in Don McCurdy's glTF Viewer (gltf.report): the panel should show curved hole walls with correct outward normals. In the scene graph inspector confirm the mesh has no open boundary edges and no inverted face normals (face normals view → all blue, none red).",
      },
    ],
    finalResult:
      "A GLB containing a 2m square panel with a Poisson-distributed grid of cylindrical through-holes, Draco-compressed, with smooth-shaded curved walls. The source .blend retains the live GN modifier with Hole Density, Radius, Depth, and Seed exposed as panel sliders. Changing the Seed reshuffles the hole positions; changing Density adds or removes holes; changing Radius scales every hole simultaneously — all without touching the mesh directly.",
    variations: [
      "Hexagonal holes: replace GeometryNodeMeshCylinder with GeometryNodeMeshCylinder with Vertices=6 and fill_type='NGON'. Six-sided holes pack more densely than circles and read as industrial ventilation grilles. Set n_cyl.inputs['Vertices'].default_value = 6.",
      "Slot cutouts: replace the cylinder with a mesh cuboid (GeometryNodeMeshCube). Add a Random Rotation socket to the Instance on Points node and drive it from a Random Value node clamped to 0–π so slots point in random orientations. Boolean DIFFERENCE cuts rectangular slots at varying angles.",
      "Layered depth: duplicate the modifier entry (copy the node group to a new name, adjust depth to 0.05) and stack a second GN modifier on the same object. The second modifier cuts shallower decorative pockets over the deep through-holes. Multiple GN modifiers on one object evaluate sequentially and share the same export_apply=True call.",
    ],
    troubleshooting: [
      {
        symptom: "Boolean has no effect — panel shows no holes despite modifier being active",
        cause: "Instance on Points output was wired directly to the Mesh Boolean input. Instances type is rejected silently.",
        fix: "Insert a Realize Instances node between Instance on Points and the Mesh Boolean cutter input (inputs[1]). The boolean solver requires Mesh type, not Instances.",
      },
      {
        symptom: "Holes appear at low density but the mesh breaks or inverts at high density",
        cause: "Solver is set to FAST. Overlapping cutter cylinders at high density trigger the flood-fill failure path.",
        fix: "Set n_bool.solver = 'EXACT'. EXACT uses multi-precision arithmetic and handles overlapping cutters correctly. FAST is only suitable when all cutters are well-separated (no overlap).",
      },
      {
        symptom: "GLB exports with no holes — the panel mesh is intact",
        cause: "export_apply was not set to True.",
        fix: "Add export_apply=True to the bpy.ops.export_scene.gltf() call. Without it the exporter reads the base mesh data before GN evaluation.",
      },
      {
        symptom: "Hole walls render flat-shaded even though the panel faces are smooth",
        cause: "The boolean-generated faces inherit a flat-shaded state from the cutter interior faces.",
        fix: "Add a Set Shade Smooth node (domain='FACE', Shade Smooth=True) after the Mesh Boolean node in the GN tree. This overwrites the shade state of all output faces uniformly.",
      },
    ],
  },
  base,
);
