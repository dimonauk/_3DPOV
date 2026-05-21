import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnCurveToMeshBody() {
  return (
    <>
      <p>
        Blender stores curves and meshes as separate data types. A Bezier
        curve is a mathematical spine &mdash; infinitely smooth, zero
        polygon count &mdash; and the old way to give it thickness was the
        Curve Object&rsquo;s Bevel Depth property. That still works in 5.1
        but produces topology the glTF exporter handles poorly: end cap
        normals point inward, the UV layout is non-standard, and there is
        no Python handle on the generated vertices. The Geometry Nodes{" "}
        <code>Curve to Mesh</code> node solves all three problems by
        converting the spine into a proper quad-grid cylinder with correct
        outward-facing caps.
      </p>

      <p>
        The Curve-to-Mesh pattern has three moving parts. First, a{" "}
        <strong>Resample Curve</strong> node in COUNT mode forces evenly-spaced
        rings along the spine before conversion &mdash; without it, rings cluster
        near control points and spread thin between them, which is visible at the
        end of a gentle arc. Second, a <strong>Curve Circle</strong> node with
        RADIUS mode provides the cross-section profile: a circle with a given
        radius and vertex count. Third, the <strong>Curve to Mesh</strong> node
        takes both, sweeps the profile along the resampled spine, and closes the
        ends with <code>Fill Caps</code>. All three parameters &mdash; radius,
        ring vertex count, spine sample count &mdash; are exposed as typed{" "}
        <code>Group Input</code> sockets addressable from the modifier panel or
        from Python via <code>mod[&quot;Input_N&quot;]</code>.
      </p>

      <p>
        The export step has one non-obvious requirement:{" "}
        <code>export_apply=True</code> in the GLB call. The GN modifier is
        evaluated lazily by Blender&rsquo;s dependency graph and the result is
        not stored as permanent mesh data until explicitly applied. Without the
        flag, <code>bpy.ops.export_scene.gltf()</code> sees the raw Bezier curve
        object and exports a line primitive or an empty mesh. With it set, the
        exporter evaluates the GN tree through the depsgraph first, gets the
        cylindrical mesh, and writes that to the GLB. Because there are no shape
        keys on this object, <code>export_apply=True</code> is safe &mdash; the
        constraint that forbids it (see the{" "}
        <Link href="/tutorials/blender-tutorial-shape-keys-morph-targets" className={lk}>
          shape keys tutorial
        </Link>
        ) only applies when shape key vertex buffers must survive the export.
        See the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Blender-to-site asset pipeline
        </Link>{" "}
        for how the resulting GLB loads into the framework&rsquo;s scene graph.
        The{" "}
        <Link href="/tutorials/blender-tutorial-gn-instance-on-points" className={lk}>
          Instance on Points tutorial
        </Link>{" "}
        covers the parallel GN technique for scattering geometry across surfaces
        &mdash; combining the two gives cable runs threaded through instanced wall
        panels.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-curve-to-mesh",
  title: "GN Curve to Mesh: procedural cables, pipes and architectural trim in Blender 5.1",
  date: "2026-05-21",
  kind: "tutorial",
  excerpt:
    "How to convert a Bezier curve spine into a capped cylindrical mesh using Geometry Nodes — exposing Radius, Ring Verts, and Resample Count as live modifier inputs — and why export_apply=True is required to get actual mesh geometry into the GLB.",
  Body: GnCurveToMeshBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-gn-instance-on-points",
      label: "Tutorial — GN Instance on Points",
      note: "Scatter cable/pipe instances across surfaces using Distribute Points on Faces.",
    },
    {
      href: "/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain",
      label: "Tutorial — GN low-poly terrain",
      note: "Another bpy.data GN tree using the same interface.new_socket() 5.1 API.",
    },
    {
      href: "/tutorials/blender-to-site-asset-pipeline",
      label: "Tutorial — Blender to site asset pipeline",
      note: "Loading the resulting GLB and wiring it into the WebXR scene.",
    },
    {
      href: "/tutorials/blender-tutorial-low-poly-faceted-hard-surface",
      label: "Tutorial — Low-poly faceted hard surface",
      note: "Hard-surface panel modelling; cables and panels compose for interior scenes.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/operations/curve_to_mesh.html",
      label: "Blender Manual — Curve to Mesh node (CC-BY-SA — Blender Foundation contributors)",
      note: "Node reference: Fill Caps behaviour, profile curve requirements, output mesh domain. Note the Curve input must be a CURVE domain geometry, not a mesh — mixing domains silently produces no output.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO (Apache-2.0 — Khronos Group)",
      note: "The exporter source. The mesh_gltf module shows exactly when export_apply is evaluated and how it invokes depsgraph.object_get_evaluated() to read the GN result rather than the base curve data.",
    },
    {
      href: "https://github.com/mrdoob/three.js/blob/dev/src/geometries/TubeGeometry.js",
      label: "Three.js TubeGeometry (MIT — mrdoob and contributors)",
      note: "The runtime equivalent: generates the same spine+profile cylinder entirely in JS. Comparing the two shows the trade-off — Three.js TubeGeometry is dynamic (radius changes at runtime) while the baked GLB is static but renders faster on low-end hardware.",
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
      "Familiar with Bezier curve control points and handle types in Blender.",
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
        title: "Build the Bezier spine with bpy.data (not bpy.ops)",
        body: "bpy.ops.curve.primitive_bezier_curve_add() requires an active 3D viewport context and repositions the 3D cursor. In --background mode it silently does nothing. Use bpy.data instead:\n\n  cdata = bpy.data.curves.new(name='cable_spine', type='CURVE')\n  cdata.dimensions = '3D'\n  sp = cdata.splines.new('BEZIER')\n  sp.bezier_points.add(2)   # gives 3 points total\n\nSet each point's co, handle_left, handle_right, and handle_left/right_type to 'FREE'. FREE type allows asymmetric tangents — the right-hand handle at the left anchor can go steeply inward while the left-hand handle goes straight down, creating the characteristic droop of a hanging cable.\n\ncdata.resolution_u only affects viewport display subdivision. The GN Resample Curve node controls the number of rings in the final mesh independently, so this value has no bearing on output quality.",
      },
      {
        title: "Build the GN tree with interface.new_socket()",
        body: "Create the node group and declare I/O sockets before adding any nodes:\n\n  tree = bpy.data.node_groups.new(type='GeometryNodeTree', name='CurveToMeshCable')\n  tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n  tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n  s = tree.interface.new_socket('Radius', in_out='INPUT', socket_type='NodeSocketFloat')\n  s.default_value = 0.025\n  s.min_value = 0.001\n\ntree.interface.new_socket() is the Blender 4.0+ API. tree.inputs.new() was removed before 5.x; any tutorial or script that uses it will error immediately with AttributeError: 'NodeTreeInterface' object has no attribute 'new'.\n\nSocket ordering matters: the modifier panel and the mod[\"Input_N\"] dictionary key both depend on insertion order. Geometry INPUT is always Input_0 (auto-wired to the object). The first user parameter you add becomes Input_1, the next Input_2, and so on.",
      },
      {
        title: "Wire Resample Curve → Curve Circle → Curve to Mesh",
        body: "Add the four working nodes and link them:\n\n  n_resample = nodes.new('GeometryNodeResampleCurve')\n  n_resample.mode = 'COUNT'         # must be set BEFORE linking Count socket\n\n  n_profile = nodes.new('GeometryNodeCurvePrimitiveCircle')\n  n_profile.mode = 'RADIUS'\n\n  n_ctm = nodes.new('GeometryNodeCurveToMesh')\n  n_ctm.inputs[2].default_value = True  # Fill Caps (index 2)\n\n  n_smooth = nodes.new('GeometryNodeSetShadeSmooth')\n  n_smooth.domain = 'FACE'\n  n_smooth.inputs['Shade Smooth'].default_value = True\n\nFill Caps on CurveToMesh must be set via index — n_ctm.inputs[2] — because 'Fill Caps' as a socket name may not resolve in all Blender builds, but index 2 is stable in 5.x. Set it on the default_value, not as a node property.\n\nSet Shade Smooth with domain='FACE' applies smooth shading per-face after conversion. Without it the cylinder uses the object's shade-smooth state, which is OFF by default after GN mesh conversion, giving a flat-shaded pipe.",
      },
      {
        title: "Apply modifier and set input defaults",
        body: "Attach the node group to the object:\n\n  mod = obj.modifiers.new(name='HoloflowCableCtM', type='NODES')\n  mod.node_group = tree\n\nAfter attachment, modifier input defaults are available as mod[\"Input_N\"]. These are separate from the socket default_value set on the interface — both exist, but the modifier's own dictionary takes precedence during evaluation. In practice the interface defaults set what the panel shows; the modifier dictionary holds the live value.\n\nFor record.py's radius animation:\n\n  mod[\"Input_1\"] = 0.025\n  mod.keyframe_insert(data_path='[\"Input_1\"]', frame=1)\n\nThe data_path string uses Python dict-indexing syntax because the input is stored in the modifier's bpy.types.BlendDataObjects dict, not as a named attribute. Standard attribute data_path ('modifiers[\"HoloflowCableCtM\"].Input_1') does not work; the bracket form does.",
      },
      {
        title: "Export GLB with export_apply=True",
        body: "Select the cable object and call:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,          # ← required\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n  )\n\nexport_apply=True triggers the dependency graph to evaluate the GN modifier and bake the resulting cylinder into temporary mesh data that the exporter then serialises. Without it the exporter receives the underlying bpy.types.Curve datablock and writes a GLB with no mesh geometry (or a stub mesh with zero faces).\n\nVerify in Don McCurdy's glTF Viewer: the GLB should show a smooth cylinder with capped ends and a metallic grey material. In the mesh tab, confirm face count ≈ 256 (32 rings × 8 quads + 2 cap fans).",
      },
    ],
    finalResult:
      "A GLB containing a capped metallic cylinder following a 3-point Bezier S-arc, with Draco compression applied. The source .blend retains the live GN modifier with Radius, Ring Verts, and Resample Count exposed as panel sliders. Duplicating the curve object and reshaping the spline produces any cable or pipe run without rebuilding the node tree.",
    variations: [
      "Square pipe / conduit: replace GeometryNodeCurvePrimitiveCircle with GeometryNodeCurvePrimitiveQuadrilateral. Set Width and Height inputs via the Group Input. The resulting rectangular cross-section with four sharp edges produces industrial conduit or architectural box section — combine with Set Shade Smooth=False for the hard-edged look.",
      "Multiple runs: duplicate the spine object (Alt+D, not Shift+D) so both objects share the same GN modifier. Each spine can follow a different path; the modifier stays in sync with Radius changes applied to either object. For a cable management tray, place six to ten duplicate spines side by side with radius 0.008.",
      "Animated cable sag: add a Bezier Segment node inside the GN tree driven by a custom Float input named 'Sag'. Use a Math (Multiply) node to shift the middle control point's Z downward as Sag increases. Keyframe Sag from 0 to 1 over 30 frames for a cable going slack.",
    ],
    troubleshooting: [
      {
        symptom: "GLB is empty or contains zero faces despite the viewport showing a cylinder",
        cause: "export_apply=False (the default). The exporter saw the raw Bezier curve, not the GN-evaluated mesh.",
        fix: "Add export_apply=True to the bpy.ops.export_scene.gltf() call. Check glTF Viewer after re-export to confirm mesh presence.",
      },
      {
        symptom: "AttributeError: 'NodeTreeInterface' has no attribute 'new' (or 'inputs')",
        cause: "Script is using tree.inputs.new() — the Blender 3.x API removed in 4.0.",
        fix: "Replace with tree.interface.new_socket(name, in_out='INPUT', socket_type='NodeSocketFloat'). The blueprint.py in this entry uses the correct 5.1 API throughout.",
      },
      {
        symptom: "Cylinder is faceted / flat-shaded despite Set Shade Smooth node being present",
        cause: "n_smooth.domain was left at the default ('POINT') instead of 'FACE', or the node's Shade Smooth socket was not set to True.",
        fix: "Confirm n_smooth.domain = 'FACE' and n_smooth.inputs['Shade Smooth'].default_value = True. In Blender 5.1, the FACE domain applies smooth shading per polygon rather than per vertex loop.",
      },
    ],
  },
  base,
);
