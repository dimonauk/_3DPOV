import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>GeometryNodeMeshToCurve</code> converts selected edges into
        independent 2-point POLY splines. <code>GeometryNodeCurveToMesh</code>{" "}
        sweeps a circular profile along those splines to produce tube geometry.
        The result is a procedural conduit network whose layout is driven
        entirely by the source mesh topology — change the grid, the pipes update.
      </p>
      <p className="mt-2">
        <strong>Expert caveat — junction sealing.</strong> Each edge produces
        an isolated spline, so adjacent tubes share no topology at junction
        vertices. <code>Fill Caps = True</code> stamps overlapping disc faces
        at each meeting point. Fix: <code>GeometryNodeMergeByDistance</code>{" "}
        (mode=ALL) after the sweep with threshold ≈ TUBE_RADIUS × 0.1, which
        welds coincident cap centres without touching tube walls.
      </p>
      <p className="mt-2">
        <strong>Edge selection via angle.</strong>{" "}
        <code>GeometryNodeEdgeAngle</code> (EDGE domain) outputs the unsigned
        dihedral between adjacent face normals.{" "}
        <code>FunctionNodeCompare</code> (GREATER_THAN, 20°) keeps only
        structural crease edges as conduits and ignores near-flat interior
        splits.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Node graph (Blender 5.1)
      </h2>
      <pre className="bg-neutral-900 text-neutral-200 rounded p-3 text-sm mt-2 mb-3 overflow-x-auto">
{`import bpy, math

ANGLE = math.radians(20.0)
RADIUS = 0.014   # metres
MERGE  = RADIUS * 0.1

ng = bpy.data.node_groups.new("ConduitNetworkGN", "GeometryNodeTree")
ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
nodes, links = ng.nodes, ng.links

def n(t, x, y):
    nd = nodes.new(t); nd.location = (x, y); return nd
def lk(a, b): links.new(a, b)

gi  = n("NodeGroupInput",  -900, 0)
go  = n("NodeGroupOutput",  1400, 0)

angle = n("GeometryNodeEdgeAngle",      -600, 240)
cmp   = n("FunctionNodeCompare",        -360, 240)
cmp.data_type = "FLOAT"; cmp.operation = "GREATER_THAN"
cmp.inputs["B"].default_value = ANGLE

m2c = n("GeometryNodeMeshToCurve",      -100, 0)

circ = n("GeometryNodeCurvePrimitiveCircle", -100, -260)
circ.mode = "RADIUS"
circ.inputs["Resolution"].default_value = 8
circ.inputs["Radius"].default_value     = RADIUS

ctm  = n("GeometryNodeCurveToMesh",     160,  0)
ctm.inputs["Fill Caps"].default_value   = True

mbd  = n("GeometryNodeMergeByDistance", 400,  0)
mbd.mode = "ALL"; mbd.inputs["Distance"].default_value = MERGE

shade = n("GeometryNodeSetShadeSmooth", 620,  0)
shade.domain = "FACE"; shade.inputs["Shade Smooth"].default_value = True

mat  = n("GeometryNodeSetMaterial",     840,  0)
mat.inputs["Material"].default_value = bpy.data.materials["HF_Conduit_Metal"]

join = n("GeometryNodeJoinGeometry",   1100,  0)

lk(angle.outputs["Unsigned Angle"], cmp.inputs["A"])
lk(cmp.outputs["Result"],           m2c.inputs["Selection"])
lk(gi.outputs["Geometry"],          m2c.inputs["Mesh"])
lk(m2c.outputs["Curve"],            ctm.inputs["Curve"])
lk(circ.outputs["Curve"],           ctm.inputs["Profile Curve"])
lk(ctm.outputs["Mesh"],             mbd.inputs["Geometry"])
lk(mbd.outputs["Geometry"],         shade.inputs["Geometry"])
lk(shade.outputs["Geometry"],       mat.inputs["Geometry"])
lk(mat.outputs["Geometry"],         join.inputs["Geometry"])
lk(gi.outputs["Geometry"],          join.inputs["Geometry"])  # panel pass-through
lk(join.outputs["Geometry"],        go.inputs["Geometry"])`}
      </pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">Variants</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>Fillet junctions instead of merging</strong> — insert{" "}
          <code>GeometryNodeFilletCurve</code> (mode=BEZIER, radius=0.02)
          between Mesh to Curve and Curve to Mesh. Produces rounded bends;
          eliminates the cap-overlap problem entirely.
        </li>
        <li>
          <strong>Animated growth</strong> — keyframe the profile circle
          Radius socket from 0.001 at frame 1 to TUBE_RADIUS at frame 72.
          The GN tree re-evaluates per frame; tubes grow smoothly.
        </li>
        <li>
          <strong>Named attribute gate</strong> — store a per-edge boolean
          named <code>holoflow:conduit</code> via bmesh, read with{" "}
          <code>GeometryNodeInputNamedAttribute</code> as the Mesh to Curve
          selection. Separates layout decisions from the node tree.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Troubleshooting</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <strong>No tubes on a flat grid:</strong> all edges have 0° dihedral,
          below the 20° threshold. Use a grid with ridges or lower the angle
          to 0° to include all edges.
        </li>
        <li>
          <strong>Overlapping caps despite Merge by Distance:</strong>{" "}
          <code>mbd.mode</code> is <code>&apos;CONNECTED&apos;</code>. The two
          end-caps are on separate meshes — only <code>&apos;ALL&apos;</code>{" "}
          reaches across connected components.
        </li>
        <li>
          <strong>Tube walls collapsing:</strong> MERGE_DIST is too large.
          Keep it at ≤ 10% of TUBE_RADIUS.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Studio cross-references</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <Link href="/tutorials/blender-tutorial-gn-bevel-mesh-edge-angle-chamfer-hard-surface" className={lk}>
            GN Bevel Mesh + Edge-Angle Limit
          </Link>{" "}
          — same GeometryNodeEdgeAngle / FunctionNodeCompare selection pattern.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-merge-by-distance-weld-tiled-module" className={lk}>
            GN Merge by Distance — Weld-Clean Tiled Module
          </Link>{" "}
          — ALL vs CONNECTED mode distinction; threshold arithmetic.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign" className={lk}>
            GN Fillet Curve — Neon Sign Rounded Corners
          </Link>{" "}
          — alternative junction treatment: round the bend instead of capping and merging.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-shader-principled-bsdf-v2-gltf-pbr-webxr" className={lk}>
            Shader — Principled BSDF v2 → glTF 2.0 PBR
          </Link>{" "}
          — conduit and panel material channel-mapping for the GLB export.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-fill-curve-logo-extrusion-webxr-badge" className={lk}>
            GN Fill Curve + Set Spline Type — Badge Extrusion
          </Link>{" "}
          — topological inverse: Fill Curve caps open loops; Mesh to Curve opens solid meshes.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Outside sources</h2>
      <ul className="list-disc ml-5 space-y-1 text-sm">
        <li>
          <a href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/mesh/operations/mesh_to_curve.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Blender Manual — Mesh to Curve Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation) — socket definitions, selection
          behaviour on boundary edges, POLY spline output type. Related:{" "}
          <a href="https://github.com/blender/blender" className={lk} target="_blank" rel="noopener noreferrer">blender/blender</a>,{" "}
          <a href="https://github.com/blender/blender-addons" className={lk} target="_blank" rel="noopener noreferrer">blender-addons</a>.
        </li>
        <li>
          <a href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/operations/curve_to_mesh.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Blender Manual — Curve to Mesh Node
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation) — profile sweep mechanics, Fill
          Caps behaviour, output mesh density. Related:{" "}
          <a href="https://github.com/blender/blender" className={lk} target="_blank" rel="noopener noreferrer">blender/blender</a>.
        </li>
        <li>
          <a href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk} target="_blank" rel="noopener noreferrer">
            Khronos glTF 2.0 Specification
          </a>{" "}
          (Apache-2.0, Khronos Group) — multi-material primitive arrays; how a
          single GLB node carries both panel and conduit materials. Related:{" "}
          <a href="https://github.com/KhronosGroup/glTF" className={lk} target="_blank" rel="noopener noreferrer">KhronosGroup/glTF</a>,{" "}
          <a href="https://github.com/KhronosGroup/glTF-Sample-Models" className={lk} target="_blank" rel="noopener noreferrer">glTF-Sample-Models</a>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    cost: "free",
    supplies: { materials: [], tools: ["Blender 5.1"] },
    steps: [
      {
        title: "Create source grid panel",
        body: "bpy.ops.mesh.primitive_grid_add(x_subdivisions=6, y_subdivisions=4, size=2.0). Name 'panel_frame', assign HF_Panel_Frame material.",
      },
      {
        title: "Add GN modifier and tree interface",
        body: "Add Geometry Nodes modifier 'ConduitNetwork'. Create node group 'ConduitNetworkGN'. Add one Geometry input socket and one Geometry output socket via ng.interface.new_socket.",
      },
      {
        title: "Wire edge angle selection",
        body: "GeometryNodeEdgeAngle → FunctionNodeCompare (FLOAT, GREATER_THAN, B=math.radians(20)). Connect Unsigned Angle → A. Result socket is per-edge boolean.",
      },
      {
        title: "Connect Mesh to Curve",
        body: "GeometryNodeMeshToCurve: GroupInput.Geometry → Mesh, Compare.Result → Selection. Outputs one isolated 2-point POLY spline per selected edge.",
      },
      {
        title: "Sweep profile circle",
        body: "GeometryNodeCurvePrimitiveCircle (mode=RADIUS, Resolution=8, Radius=0.014). GeometryNodeCurveToMesh: MeshToCurve.Curve → Curve, Circle.Curve → Profile Curve, Fill Caps=True.",
      },
      {
        title: "Seal junctions, shade, material",
        body: "GeometryNodeMergeByDistance (mode=ALL, Distance=0.0014). SetShadeSmooth (domain=FACE). SetMaterial (HF_Conduit_Metal). Wire sequentially.",
      },
      {
        title: "Join and export GLB",
        body: "GeometryNodeJoinGeometry: conduit mesh + GroupInput.Geometry (panel pass-through). Apply modifier via temp_override. Export GLB with Draco level 6, WEBP, Y-up.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No tubes — flat grid",
        cause: "All edges have 0° dihedral, below 20° threshold.",
        fix: "Add ridges to the grid or lower ANGLE_THRESHOLD to 0° to include all edges.",
      },
      {
        symptom: "Overlapping caps despite Merge by Distance",
        cause: "mode='CONNECTED' only merges within the same connected component; junction caps are on separate meshes.",
        fix: "Set mbd.mode = 'ALL'.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr",
    title: "GN Mesh to Curve + Curve to Mesh — Angle-Gated Edge Conduit Network for WebXR Interior Panel (Blender 5.1)",
    date: "2026-06-29",
    kind: "tutorial",
    excerpt:
      "GeometryNodeMeshToCurve converts angle-selected edges of a structural grid into isolated POLY splines; GeometryNodeCurveToMesh sweeps a circular profile along each to produce a tube network. Junction caps are sealed with Merge by Distance (mode=ALL, threshold=TUBE_RADIUS×0.1). The technique is fully procedural — change the grid, the conduit run updates — and exports as a clean two-material GLB for WebXR interior prop dressing.",
    Body,
  }
);
