import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnDualMeshHexagonalHullArmourBody() {
  return (
    <>
      <p>
        The <strong>Dual Mesh</strong> geometry node swaps the face and vertex
        topology of any mesh: every face of the original becomes a vertex in
        the dual, and every vertex becomes a face. Applied to a subdivision-2
        icosphere (80 triangular faces, 42 vertices), the dual has exactly 42
        faces — 30 hexagons and 12 pentagons. That is the Buckminster Fuller
        C60 / football-stitch pattern, produced from one node with no manual
        UV layout, no hexagonal grid maths, and no scatter system.
      </p>
      <p className="mt-3">
        This tutorial builds a closed sci-fi hull armour ball: Dual Mesh drives
        the tiling; <code>Corners of Face → Total</code> detects the 12
        pentagonal accent faces at runtime; <code>Scale Elements</code> opens
        the inter-panel gap; <code>Extrude Mesh</code> raises each panel along
        its own normal; and a <code>Smooth by Angle</code> pass puts a crisp
        crease between adjacent panels while leaving each flat panel face
        smooth. The pentagon faces carry an emissive cyan material — useful as
        sensor domes or energy nodes in a WebXR scene. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scale-elements-noise-driven-face-scale-diamond-plate"
          className={lk}
        >
          Scale Elements Diamond Plate
        </Link>{" "}
        tutorial, which grows a regular-quad tiling instead of topological
        dual geometry.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Why the icosphere produces a football
      </h2>
      <p>
        Euler&apos;s formula for a closed surface: V − E + F = 2. The
        subdivision-2 icosphere satisfies 42 − 120 + 80 = 2. Its dual swaps
        faces and vertices: V&prime; = 80, E&prime; = 120, F&prime; = 42. The
        42 dual faces are one face per original vertex. Original ico vertices
        come in two valences: the 12 corners of the base icosahedron have
        degree 5 (five triangle edges meet there) → 12 pentagon dual faces.
        The 30 edge-midpoints added by the first subdivision step have degree 6
        → 30 hexagon dual faces. Face valence sum: 12 × 5 + 30 × 6 = 240 = 2
        × 120 = 2E ✓. Increasing the subdivision level adds only degree-6
        midpoints → more hexagons, pentagons stay at 12. That is why every
        geodesic dome has exactly 12 pentagons regardless of frequency.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        GeometryNodeDualMesh — node properties
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`# bl_idname: 'GeometryNodeDualMesh'
# Inputs:
#   Mesh            — source geometry
#   Keep Boundaries — Bool; when True, open boundary edge loops are
#                     preserved as-is in the dual.  On a closed
#                     icosphere this is a no-op, but leave it True
#                     so the tree degrades gracefully if the source
#                     is ever replaced with a clipped mesh.
# Output:
#   Dual Mesh       — geometry with swapped face/vertex topology

dual = nodes.new('GeometryNodeDualMesh')
dual.inputs['Keep Boundaries'].default_value = True
links.new(grp_in.outputs['Geometry'], dual.inputs['Mesh'])`}
      </pre>
      <p>
        The node has no user-facing properties beyond Keep Boundaries — the
        dual is fully determined by the source topology. The output mesh is
        always a polygon soup (mixed pentagon/hexagon faces, no quads). Faces
        wind consistently outward, so normals are correct for EEVEE and GLB
        export without any flip pass.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Detecting pentagons with Corners of Face
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`# GeometryNodeCornersOfFace returns, per face, the indices of its
# corners and their count.  'Total' is the corner count = vertex count
# for that face (5 for pentagon, 6 for hexagon).

idx_face   = nodes.new('GeometryNodeInputIndex')   # evaluated on FACE domain
corners_of = nodes.new('GeometryNodeCornersOfFace')
compare    = nodes.new('FunctionNodeCompare')
compare.data_type = 'INT'
compare.operation = 'EQUAL'
compare.inputs['B'].default_value = 5   # 5-corner face → pentagon

set_mat = nodes.new('GeometryNodeSetMaterialIndex')
set_mat.inputs['Material Index'].default_value = 1  # pentagon → mat slot 1

links.new(idx_face.outputs['Index'],    corners_of.inputs['Face Index'])
links.new(corners_of.outputs['Total'],  compare.inputs['A'])
links.new(compare.outputs['Result'],    set_mat.inputs['Selection'])
links.new(dual.outputs['Dual Mesh'],    set_mat.inputs['Geometry'])`}
      </pre>
      <p>
        The <strong>domain context</strong> flows backwards from{" "}
        <code>Set Material Index</code> (which operates on the FACE domain)
        through the comparison chain to <code>Index</code>, so{" "}
        <code>Index</code> automatically returns the current face index without
        any explicit domain cast. This pattern — feeding <code>Index</code>{" "}
        into a topology query node to get per-element topology data — is one of
        the most useful idioms in advanced Geometry Nodes work. For per-vertex
        edge count use <code>GeometryNodeEdgesOfVertex → Total</code> in the
        same pattern. See{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer-hard-surface"
          className={lk}
        >
          GN Bevel Mesh + Edge-Angle Limit
        </Link>{" "}
        for another example of per-edge topology gating.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Node tree order matters: set material before extruding
      </h2>
      <p>
        <code>Set Material Index</code> must run on the dual faces{" "}
        <em>before</em> <code>Extrude Mesh</code>. When Extrude runs, each new
        top cap face and each new side-wall quad inherit the material index of
        the parent face. Pentagon top caps and their five side walls all get
        mat slot 1 (emissive cyan); hexagon caps and their six side walls get
        mat slot 0 (metallic). If you wire Set Material Index after Extrude,
        the extruded top caps are new faces whose corner count matches the
        original (5 or 6) but the side walls are always quads (4 corners) —
        so the <code>Compare(=5)</code> would misclassify all side walls as
        non-pentagon, breaking the material assignment.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Scale Elements — inter-panel gap
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`scale_el = nodes.new('GeometryNodeScaleElements')
scale_el.domain     = 'FACE'
scale_el.scale_mode = 'UNIFORM'
# Each face shrinks toward its own centre (not the mesh centre).
# 0.88 → 12 % gap; 1.0 → touching; 0.0 → collapsed to face centroid.
# The gap exposes the underlying icosphere surface as a recessed grid.
scale_el.inputs['Scale'].default_value = 0.88`}
      </pre>
      <p>
        The gap is a design variable worth exposing as an animatable Group
        Input socket. Animate from 0.0 → 0.88 over 60 frames to show panels
        &ldquo;peeling apart&rdquo; from a solid sphere — a good tutorial
        reveal animation. For a different look, set gap to 0.95 and use
        the gap as negative space for a grille effect. See the companion{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-extrude-mesh-city-block-attribute-height"
          className={lk}
        >
          GN Extrude Mesh — City Block
        </Link>{" "}
        tutorial for how Scale Elements pairs with Extrude on a planar grid
        rather than a curved dual mesh.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Extrude Mesh — raising each panel
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`extrude = nodes.new('GeometryNodeExtrudeMesh')
extrude.mode = 'FACES'
extrude.inputs['Individual'].default_value   = True
# Individual=True: each face extrudes along its OWN normal (radially
# outward on a sphere).  Individual=False would extrude the entire
# selection as a slab along the average normal — wrong for a curved surface.

# Offset Scale drives extrusion depth along face normal.
# Positive = outward (panel protrudes).  Use 0.04–0.08 for WebXR scale.
extrude.inputs['Offset Scale'].default_value = 0.06`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Smooth by Angle — per-edge sharpness
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`smooth_ang = nodes.new('GeometryNodeSmoothByAngle')
smooth_ang.inputs['Angle'].default_value = math.radians(30.0)
# Adjacent hexagonal faces on the dual-ico meet at a dihedral of ≈ 138 °
# → supplement (the "opening" measured by Smooth by Angle) ≈ 42 ° > 30 °
# → sharp edge between panels.
# Within a flat hexagonal face, adjacent triangle fans have dihedral ≈ 0 °
# → stays smooth → no polygon silhouette within the face.
# This replaces the removed Auto Smooth from Blender < 4.1.`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Export for WebXR
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-4 overflow-x-auto">
{`bpy.ops.export_scene.gltf(
    filepath      = bpy.path.abspath(OUTPUT_GLB),
    export_format = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_normals      = True,
    export_materials    = 'EXPORT',
    export_apply        = False,  # blueprint.py applies the modifier first
)`}
      </pre>
      <p>
        The emissive cyan material exports cleanly via the Principled BSDF
        emission channel in Blender 5.1 (mapped to{" "}
        <code>KHR_materials_emissive_strength</code> in the GLB). Confirm
        the pentagon glow is visible in the{" "}
        <Link href="https://sandbox.babylonjs.com" className={lk}>
          Babylon.js Sandbox
        </Link>{" "}
        or the Three.js editor before finalising the strength value — EEVEE
        bloom makes emission appear stronger than it renders in a WebXR
        viewer. For full PBR parameter mapping from Blender to GLB, see{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr"
          className={lk}
        >
          Principled BSDF v2 → glTF 2.0 PBR for WebXR
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Troubleshooting
      </h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          <strong>Dual Mesh output is empty / zero faces.</strong> The source
          mesh must be a valid manifold with at least one face. An empty mesh
          object, a curve, or a surface object will produce no output. Ensure
          the icosphere operator completed without error.
        </li>
        <li>
          <strong>Keep Boundaries=True causes artefacts on the edge.</strong>{" "}
          Only relevant when the source mesh has an open boundary loop (e.g. a
          hemisphere). For a full icosphere this socket is irrelevant; disable
          it and recheck if your source was clipped.
        </li>
        <li>
          <strong>All faces get material slot 1 (cyan).</strong> The{" "}
          <code>Compare</code> node&apos;s B value is probably 0 instead of 5.
          Or <code>Set Material Index</code> is placed after{" "}
          <code>Extrude Mesh</code> where side-wall quads (4 corners) also
          slip through the ≠ 5 check. Re-order nodes.
        </li>
        <li>
          <strong>Panels have no gap / all collapsed to centroid.</strong> Scale
          factor = 0: set it back to 0.88. If the <code>Scale</code> socket is
          not driven by the value node, the default is 0.
        </li>
        <li>
          <strong>Extrude pushes panels inward instead of outward.</strong>{" "}
          Negative Offset Scale inverts the extrusion direction along the face
          normal. Use a positive value (0.06) for outward. If normals are
          inverted on the source (blue inside-out in Overlay), recalculate
          normals in Edit Mode (Alt+N → Recalculate Outside) before adding the
          GN modifier.
        </li>
        <li>
          <strong>Inter-panel edges not sharp in the render.</strong> Smooth by
          Angle is absent from the tree, or its Angle threshold is above 90 °
          (which would also smooth the 138 ° dihedral between panels). Keep
          threshold at 30 °.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Outside sources
      </h2>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>
          Blender Foundation,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/dual_mesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Dual Mesh — Geometry Nodes Reference
          </a>
          , CC BY-SA 4.0. Related:{" "}
          <a
            href="https://github.com/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender/blender
          </a>
          ,{" "}
          <a
            href="https://extensions.blender.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            extensions.blender.org
          </a>
          .
        </li>
        <li>
          Nicholas Sharp et al.,{" "}
          <a
            href="https://github.com/nmwsharp/polyscope"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            polyscope
          </a>{" "}
          (MIT) — geometry visualisation library with dual mesh computation
          examples in{" "}
          <code>examples/intrinsic_triangulations</code>. Related:{" "}
          <a
            href="https://github.com/nmwsharp/potpourri3d"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            potpourri3d
          </a>
          ,{" "}
          <a
            href="https://github.com/nmwsharp/robust-laplacians-py"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            robust-laplacians-py
          </a>{" "}
          (both MIT).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace. Load blueprint.py and run it. A sphere covered in raised hex/pent panels appears. The GN modifier GN_DualMesh_HullArmour is applied; hull_armour.blend and hull_armour.glb are written.",
      },
      {
        title: "Inspect the Dual Mesh node",
        body: "Undo the apply (Ctrl+Z). Open a Geometry Node Editor area. You will see: Group Input → Dual Mesh → Set Material Index → Scale Elements → Extrude Mesh → Smooth by Angle → Store Named Attribute → Group Output. Click the Dual Mesh node and open the N panel — the only user property is Keep Boundaries.",
      },
      {
        title: "Count faces in the viewport",
        body: "With the GN modifier active (not applied), switch to Edit Mode. In the Viewport Overlays dropdown enable Statistics. You should see F: 42 in the face count for the evaluated mesh. Tab back to Object Mode.",
      },
      {
        title: "Identify pentagons vs hexagons",
        body: "In the GN editor, disconnect Scale Elements temporarily. Select one face in the viewport (Edit Mode, Face Select). Mesh → Vertices → Select All by Trait → Faces by Sides → 5. Exactly 12 faces highlight — the pentagons. Re-enable Scale Elements when done.",
      },
      {
        title: "Adjust Panel Gap",
        body: "Select the Scale Elements node. Change Scale from 0.88 to 0.50 — panels almost collapse. Change to 0.98 — near-invisible gap. Return to 0.88. Note that 1.0 makes panels touch at face edges, producing T-junctions; keep below 1.0.",
      },
      {
        title: "Adjust Extrude depth",
        body: "Select the Extrude Mesh node. Change Offset Scale from 0.06 to 0.15 — very pronounced raised panels. Change to 0.01 — almost flat. Return to 0.06. Note that Individual must stay True or the sphere extrudes as a solid slab.",
      },
      {
        title: "Verify pentagon glow",
        body: "Switch viewport shading to Material Preview (Z → Material Preview). The 12 pentagon panels should glow cyan. If they are metallic blue instead, the Compare B value is wrong or Set Material Index is after Extrude Mesh — fix the node order.",
      },
      {
        title: "Check GLB in Babylon.js Sandbox",
        body: "Drag hull_armour.glb into https://sandbox.babylonjs.com. Confirm the 12 pentagon emissive patches are visible. Adjust PENT_EMIT_STRENGTH in blueprint.py if the glow is invisible (too low) or blows out in the viewer (too high). A value of 1.8 works well at IBL level 1.0.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Open record.py in the Scripting workspace and run it. Renders 120 frames at 24 fps: frames 1–60 animate the panel gap from 0 to 0.88 (panels separate); frames 61–120 rotate the hull armour 360 ° for a turntable reveal. Output: public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/viewport.mp4.",
      },
      {
        title: "Record screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Five passes: add Dual Mesh node, add Scale Elements, add Extrude Mesh, wire pentagon detection + materials, final orbit reveal. Target runtime: ≈ 3 minutes raw, edit to 90 s for the tutorial clip. Save to public/library/videos/geometry-nodes/gn-dual-mesh-hexagonal-hull-armour/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-dual-mesh-hexagonal-hull-armour",
    title:
      "GN Dual Mesh — Pentagon-Hexagon Hull Armour: Topology-Dual Tiling on an Icosphere for WebXR (Blender 5.1)",
    date: "2026-06-28",
    kind: "tutorial",
    excerpt:
      "The Dual Mesh geometry node swaps face↔vertex topology: a subdivision-2 icosphere (80 tris, 42 vertices) produces exactly 12 pentagons + 30 hexagons in one node — the Buckminster Fuller football pattern. Pentagon faces are detected at runtime with Corners of Face → Total = 5, driving a separate emissive cyan material. Scale Elements opens the inter-panel gap; Extrude Mesh raises each panel individually along its own normal; Smooth by Angle sharpens the inter-panel creases. Exports as Draco GLB for WebXR.",
    Body: GnDualMeshHexagonalHullArmourBody,
  },
);
