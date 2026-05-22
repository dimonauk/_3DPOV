import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnExtrudeMeshPanelLinesBody() {
  return (
    <>
      <p>
        The <code>Extrude Mesh</code> Geometry Node has one property that
        separates decorative panelling from generic box extrusion:{" "}
        <strong>Individual</strong>. Without it, all selected faces extrude as
        a single fused slab &mdash; shared edges merge and the result is one
        solid block. With it, each face extrudes independently along its own
        normal, leaving a visible gap at every former shared edge. That gap is
        the panel line, and it requires no Boolean operation, no knife cut, no
        manual edge loop.
      </p>

      <p>
        The second insight is that the <code>Extrude Mesh</code> node outputs
        three geometry streams, not one. <strong>Mesh</strong> is the full
        result. <strong>Top</strong> is a boolean mask covering only the newly
        created top faces (the recessed panel bottoms). <strong>Side</strong>
        covers the new sidewall faces. Wiring <code>Top</code> directly into a{" "}
        <code>Scale Elements</code> node&rsquo;s Selection input chamfers
        precisely those faces &mdash; shrinking each panel bottom toward its
        centre &mdash; without any secondary attribute or separate Index
        calculation. The extrusion output becomes its own selection handle.
      </p>

      <p>
        Face tagging is handled outside the GN tree: Python marks every
        checkerboard face (<code>(row&nbsp;+&nbsp;col)&nbsp;%&nbsp;2&nbsp;==&nbsp;0</code>)
        as a named <code>BOOLEAN</code> <code>FACE</code> attribute on the
        mesh before the modifier is attached. A single Named Attribute node
        inside the tree reads it back. This keeps the node graph to six nodes
        rather than the chain of Index→Divide→Floor→Modulo→Compare that would
        be needed to reconstruct a 2-D pattern purely in GN. The{" "}
        <Link href="/tutorials/blender-tutorial-vertex-colour-attributes" className={lk}>
          vertex colour attributes tutorial
        </Link>{" "}
        covers the same <code>mesh.attributes.new()</code> API for per-face
        data storage. For the hard-surface modelling workflow that this
        technique feeds into, see the{" "}
        <Link href="/tutorials/blender-tutorial-low-poly-faceted-hard-surface" className={lk}>
          low-poly faceted hard-surface tutorial
        </Link>
        . The{" "}
        <Link href="/tutorials/blender-tutorial-gn-curve-to-mesh" className={lk}>
          GN Curve to Mesh tutorial
        </Link>{" "}
        covers the same <code>export_apply=True</code> requirement and the
        same <code>tree.interface.new_socket()</code> Blender 5.1 API for
        declaring GN inputs. Full pipeline context &mdash; loading the
        resulting GLB into the WebXR scene &mdash; is in the{" "}
        <Link href="/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain" className={lk}>
          geometry nodes low-poly terrain tutorial
        </Link>
        , which uses the same bpy.data GN tree construction pattern.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-extrude-mesh-panel-lines",
  title:
    "GN Extrude Mesh: procedural recessed panel lines with Individual extrusion in Blender 5.1",
  date: "2026-05-22",
  kind: "tutorial",
  excerpt:
    "How to drive GeometryNodeExtrudeMesh with Individual=True to create independent per-face recesses, then reuse the Top output socket as a Scale Elements selection to chamfer every panel rim — six nodes, zero Boolean operations.",
  Body: GnExtrudeMeshPanelLinesBody,
  related: [
    {
      href: "/tutorials/blender-tutorial-low-poly-faceted-hard-surface",
      label: "Tutorial — Low-poly faceted hard surface",
      note: "Hard-surface panel modelling with Smooth by Angle; panel lines layer on top.",
    },
    {
      href: "/tutorials/blender-tutorial-gn-curve-to-mesh",
      label: "Tutorial — GN Curve to Mesh",
      note: "Same export_apply=True requirement; cable runs compose with panel wall assets.",
    },
    {
      href: "/tutorials/blender-tutorial-vertex-colour-attributes",
      label: "Tutorial — Vertex Colour Attributes",
      note: "The same mesh.attributes.new() API for per-face data; colour the panel recesses differently.",
    },
    {
      href: "/tutorials/blender-tutorial-geometry-nodes-low-poly-terrain",
      label: "Tutorial — GN low-poly terrain",
      note: "Same tree.interface.new_socket() Blender 5.1 pattern; scatter panel tiles across terrain.",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/extrude_mesh.html",
      label:
        "Blender Manual — Extrude Mesh node (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "Full socket reference including the Individual boolean, Top/Side output masks, and the Offset vector vs Offset Scale distinction. Note: the Offset input direction defaults to face normal when left unconnected; only the scale is needed for a purely normal-direction recess.",
    },
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/scale_elements.html",
      label:
        "Blender Manual — Scale Elements node (CC-BY-SA 4.0 — Blender Foundation contributors)",
      note: "UNIFORM vs SINGLE_AXIS scale modes; Center input (defaults to each face centre, which is exactly right for chamfering panels). Related projects: blender-addons Scale Elements operator, blender-extensions-platform.",
    },
    {
      href: "https://github.com/KhronosGroup/glTF-Blender-IO",
      label: "glTF-Blender-IO (Apache-2.0 — Khronos Group contributors)",
      note: "The exporter source for why export_apply=True is required. The io_scene_gltf2/blender/exp/gltf2_blender_gather_nodes.py module shows depsgraph.object_get_evaluated() being called to read the GN-evaluated mesh rather than the base datablock. Related sibling repos: KhronosGroup/glTF-Sample-Models (Apache-2.0), KhronosGroup/glTF-Sample-Viewer (BSD-2-Clause).",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    time: "one to two hours",
    difficulty: "intermediate",
    cost: "free — Blender is open-source",
    prerequisites: [
      "Completed the GN Curve to Mesh tutorial or comfortable building node trees via bpy.data.",
      "Blender 5.1 installed and able to run blueprint.py headlessly.",
      "Familiar with bmesh vertex/face creation and the mesh.attributes API.",
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
        title: "Build the base grid with bmesh and tag panel faces",
        body: "Use bmesh to build a 4×4 quad grid rather than bpy.ops.mesh.primitive_grid_add(), which silently fails in --background mode:\n\n  bm = bmesh.new()\n  verts = {}\n  for r in range(ROWS + 1):\n      for c in range(COLS + 1):\n          verts[(r, c)] = bm.verts.new(Vector((c * SIZE, r * SIZE, 0)))\n\n  for r in range(ROWS):\n      for c in range(COLS):\n          bm.faces.new([verts[(r,c)], verts[(r,c+1)], verts[(r+1,c+1)], verts[(r+1,c)]])\n\nAfter bm.to_mesh(mesh) and bm.free(), create the attribute:\n\n  attr = mesh.attributes.new(name='panel_face', type='BOOLEAN', domain='FACE')\n  for i in range(len(mesh.polygons)):\n      attr.data[i].value = (i // COLS + i % COLS) % 2 == 0\n\nThe BOOLEAN + FACE combination stores one bool per polygon. mesh.update() must be called before attributes.new() so polygon count is accurate. The attribute persists in the .blend and travels with the object through any GN modifier evaluation.",
      },
      {
        title: "Declare GN tree interface sockets",
        body: "Create the node group and add I/O sockets using the 4.0+ API:\n\n  tree = bpy.data.node_groups.new(type='GeometryNodeTree', name='PanelLinesGN')\n  tree.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')\n  tree.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')\n\n  s = tree.interface.new_socket('Panel Depth', in_out='INPUT', socket_type='NodeSocketFloat')\n  s.default_value = -0.04\n  s.min_value = -0.20\n\n  s2 = tree.interface.new_socket('Panel Inset', in_out='INPUT', socket_type='NodeSocketFloat')\n  s2.default_value = 0.82\n\ntree.interface.new_socket() is the only valid way to add sockets in Blender 4.0+. tree.inputs.new() was removed; any tutorial using it errors with AttributeError on the first run. Socket insertion order determines the Input_N key used by the modifier: Geometry=Input_0, Panel Depth=Input_1, Panel Inset=Input_2.",
      },
      {
        title: "Add Named Attribute and Extrude Mesh nodes",
        body: "Create the Named Attribute node to read the pre-tagged face selection:\n\n  n_attr = nodes.new('GeometryNodeInputNamedAttribute')\n  n_attr.data_type = 'BOOLEAN'\n  n_attr.inputs[0].default_value = 'panel_face'   # Name socket (index 0)\n\nCreate the Extrude Mesh node and set Individual:\n\n  n_extrude = nodes.new('GeometryNodeExtrudeMesh')\n  n_extrude.mode = 'FACES'\n  n_extrude.inputs[4].default_value = True   # Individual\n\nThe Individual socket is index 4 in FACES mode (Mesh=0, Selection=1, Offset=2, OffsetScale=3, Individual=4). Set mode before reading inputs because the socket layout depends on mode. The Offset Vector input (index 2) is left unconnected — the node defaults to face-normal direction, which is +Z for the flat wall faces. Connecting Panel Depth to Offset Scale (index 3) makes the extrusion depth live.",
      },
      {
        title: "Wire the Top output to Scale Elements",
        body: "After Extrude Mesh, add Scale Elements and wire the Top output directly:\n\n  n_scale = nodes.new('GeometryNodeScaleElements')\n  n_scale.domain = 'FACE'\n  n_scale.scale_mode = 'UNIFORM'\n\n  links.new(n_extrude.outputs['Top'],   n_scale.inputs['Selection'])\n  links.new(n_in.outputs['Panel Inset'], n_scale.inputs['Scale'])\n\nThe Top socket carries a boolean face mask of exactly the newly created extruded end faces. No second Named Attribute node or stored attribute is needed. Scale Elements with UNIFORM mode and no Center input connected defaults to each face's own centre — correct for chamfering panels individually. Scale=1.0 is a no-op; scale=0.75 shrinks each panel face to 75% of its size.\n\nThe Center socket accepts a vector for a custom pivot. Connecting a Position node to Center would chamfer relative to the world origin instead of each face's local centre — this is a common mistake that produces asymmetric chamfers.",
      },
      {
        title: "Apply flat shading and export",
        body: "Add a Set Shade Smooth node after Scale Elements:\n\n  n_smooth = nodes.new('GeometryNodeSetShadeSmooth')\n  n_smooth.domain = 'FACE'\n  n_smooth.inputs['Shade Smooth'].default_value = False\n\nSetting domain='FACE' and Shade Smooth=False applies flat faceted normals to every face — base wall, sidewalls, and chamfered tops — regardless of the source mesh's shade state. This is the studio convention for cel-shading.\n\nExport with:\n\n  bpy.ops.export_scene.gltf(\n      filepath=str(GLB_OUT),\n      export_format='GLB',\n      use_selection=True,\n      export_apply=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_normals=True,\n  )\n\nexport_apply=True evaluates the GN modifier through the depsgraph and bakes the resulting mesh into temporary data for the exporter. Without it the exporter reads the unmodified flat 4×4 grid.",
      },
    ],
    finalResult:
      "A Draco-compressed GLB containing a 1×1 m wall panel with eight recessed chamfered tiles in a checkerboard pattern, flat-shaded for cel-shading. The source .blend retains the live GN modifier with Panel Depth and Panel Inset exposed as named sliders. Swapping the pattern attribute (any BOOLEAN FACE attribute will work) or replacing the base grid with any flat mesh updates the panel distribution without rebuilding the node tree.",
    variations: [
      "Raised rivets instead of recessed panels: set Panel Depth to a positive value (e.g. +0.02). The Individual extrusion raises the selected faces outward, forming button or rivet clusters. Combine with a second Extrude Mesh node at -0.005 around the rivet face (using the Side output as selection) to add a recessed shadow ring around each rivet base.",
      "Random face selection: replace the pre-tagged checkerboard attribute with a Random Value node (BOOLEAN type, seed driven by a Group Input) inside the GN tree. Wire the output directly to ExtrudeMesh.Selection. The panel pattern changes every time the Seed slider moves, making the tile unique. Store the seed value in the modifier's Input_3 for reproducibility.",
      "Extruded text panels: stamp a text object into the base grid using a Boolean modifier before attaching the GN modifier. The text geometry creates irregular face shapes; Extrude Mesh Individual=True still works because it operates per-face regardless of polygon shape or size.",
    ],
    troubleshooting: [
      {
        symptom: "All faces extrude as a single slab rather than independently",
        cause: "Individual is False (the default). Connected adjacent selected faces fuse at their shared borders and extrude as one unit.",
        fix: "Set n_extrude.inputs[4].default_value = True in Python, or tick the Individual checkbox in the node header in the GN Editor. Confirm visually: independent extrusion shows gaps between each panel; fused extrusion shows no gaps.",
      },
      {
        symptom: "GLB contains a flat unextruded grid — no panel geometry",
        cause: "export_apply=False (the default). The exporter read the base flat mesh, not the GN-evaluated result.",
        fix: "Add export_apply=True to the bpy.ops.export_scene.gltf() call. Inspect the GLB in glTF Viewer — the face count should be ~192 (16 base + side + top faces per extrusion).",
      },
      {
        symptom: "AttributeError: 'NodeTreeInterface' has no attribute 'new'",
        cause: "Script is using tree.inputs.new() — the pre-4.0 API that was removed.",
        fix: "Replace with tree.interface.new_socket(name, in_out='INPUT', socket_type='NodeSocketFloat'). The blueprint.py in this entry uses the correct 5.1 API throughout.",
      },
      {
        symptom: "Scale Elements chamfers all faces, not just the recessed panels",
        cause: "ScaleElements.inputs['Selection'] is not connected, so it defaults to selecting all faces.",
        fix: "Wire n_extrude.outputs['Top'] to n_scale.inputs['Selection']. The Top mask covers exactly the newly created panel end faces — no other faces are selected.",
      },
    ],
  },
  base,
);
