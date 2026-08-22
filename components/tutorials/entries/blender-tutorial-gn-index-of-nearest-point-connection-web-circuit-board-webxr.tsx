import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function IndexOfNearestBody() {
  return (
    <>
      <p>
        When you scatter points on a surface and want to draw edges between each
        point and its nearest neighbour, the obvious tool is{" "}
        <Link href="/tutorials/blender-tutorial-gn-shortest-edge-path-circuit-trace" className={lk}>
          Shortest Edge Paths
        </Link>{" "}
        — but that node traces Dijkstra paths through <em>existing topology</em>.
        It cannot reach across empty space. <code>Index of Nearest</code> does
        the opposite: it searches the current element domain by proximity,
        returning the index of the nearest other element with no topology
        dependency. The result — each scatter point knowing its nearest peer's
        index — drives the unit-line instancing trick that produces a clean
        1-NN connection web, and maps directly to the{" "}
        <Link href="/tutorials/blender-tutorial-python-mathutils-geometry-kdtree-bvhtree-spatial" className={lk}>
          KDTree
        </Link>{" "}
        that Python&apos;s <code>mathutils</code> exposes for the same spatial
        query in scripted pipelines.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Index of Nearest vs Sample Nearest
      </h2>
      <p className="mt-2">
        Blender 5.1 has two proximity nodes that look similar but serve
        different purposes:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Index of Nearest</strong> — searches{" "}
          <em>within the same geometry</em> on a single domain. Every scatter
          point asks which peer in the same cloud is nearest. Query set and
          search set are identical.
        </li>
        <li>
          <strong>Sample Nearest</strong> — samples an{" "}
          <em>external geometry</em> fed in through an Object Info socket. Use
          it when queries and candidates are different objects, as in the{" "}
          <Link href="/tutorials/blender-tutorial-gn-sample-nearest-surface-mesh-conform" className={lk}>
            mesh-conform deformer
          </Link>{" "}
          or when building a Voronoi region map against a separate set of seeds.
        </li>
      </ul>
      <p className="mt-2">
        For a circuit-board web where every point finds its nearest{" "}
        <em>peer</em>, <code>Index of Nearest</code> is correct.
        <code>Min Distance</code> set to a small positive value (0.0002 m here)
        excludes the point itself, whose distance to self is always zero.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Field evaluation context</h2>
      <p className="mt-2">
        <code>Index of Nearest</code> is a field node — it produces a value per
        element and has no Geometry socket. Its evaluation domain is set by the
        first downstream geometry node that uses the field. Here that is{" "}
        <strong>Instance on Points</strong>, whose Rotation and Scale inputs
        evaluate in the Point domain of the scatter points. So both{" "}
        <code>Index of Nearest</code> and the <strong>Position</strong> field
        node see the scatter-point domain automatically. No geometry connection
        is needed on either node.
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`inn = tree.nodes.new('GeometryNodeIndexOfNearest')
inn.inputs['Min Distance'].default_value = 0.0002   # skip self (dist=0)
# inn.outputs['Index']    → int: index of nearest peer
# inn.outputs['Distance'] → float: distance to that peer`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Evaluate at Index — reading the neighbour&apos;s position
      </h2>
      <p className="mt-2">
        Feed the index into <strong>Evaluate at Index</strong> to read any
        attribute at that element. For edge geometry, read the nearest point's
        position:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`evp = tree.nodes.new('GeometryNodeEvaluateAtIndex')
evp.data_type = 'FLOAT_VECTOR'
evp.domain    = 'POINT'
tree.links.new(inn.outputs['Index'], evp.inputs['Index'])
tree.links.new(pos.outputs[0],       evp.inputs['Value'])  # Position field
# evp.outputs['Value'] → position of the nearest point`}
      </pre>
      <p className="mt-2">
        The same pattern works for colour, a named float, or any other
        per-point attribute — making Evaluate at Index the universal
        &ldquo;gather from neighbour&rdquo; operator. Use the{" "}
        <Link href="/tutorials/blender-tutorial-gn-viewer-node-debug-inspect-attributes" className={lk}>
          Viewer node
        </Link>{" "}
        to inspect the index and value fields before wiring them further.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Unit-line instancing — converting index pairs to edge geometry
      </h2>
      <p className="mt-2">
        Geometry Nodes has no primitive for &ldquo;add an edge between vertex A
        and vertex B.&rdquo; The workaround: stamp a Mesh Line from{" "}
        <code>(0,0,0)</code> to <code>(1,0,0)</code> at every scatter point via
        Instance on Points, with per-instance rotation and scale that land the
        tip exactly on the nearest neighbour:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 p-3 text-xs text-green-300">
        {`# delta = nn_pos - current_pos
sub = nodes.new('ShaderNodeVectorMath'); sub.operation = 'SUBTRACT'
tree.links.new(evp.outputs['Value'], sub.inputs[0])
tree.links.new(pos.outputs[0],        sub.inputs[1])

lenv = nodes.new('ShaderNodeVectorMath'); lenv.operation = 'LENGTH'
norv = nodes.new('ShaderNodeVectorMath'); norv.operation = 'NORMALIZE'
tree.links.new(sub.outputs[0], lenv.inputs[0])
tree.links.new(sub.outputs[0], norv.inputs[0])

# Align +X to direction; scale unit line to exact edge length
aln = nodes.new('FunctionNodeAlignEulerToVector')
aln.axis = 'X'; aln.pivot_axis = 'Z'
tree.links.new(norv.outputs[0], aln.inputs['Vector'])

sxyz = nodes.new('ShaderNodeCombineXYZ')
sxyz.inputs['Y'].default_value = 1.0; sxyz.inputs['Z'].default_value = 1.0
tree.links.new(lenv.outputs['Value'], sxyz.inputs['X'])  # X = dist

il = nodes.new('GeometryNodeInstanceOnPoints')
tree.links.new(dist.outputs['Points'], il.inputs['Points'])
tree.links.new(mesh_line.outputs[0],   il.inputs['Instance'])
tree.links.new(aln.outputs[0],         il.inputs['Rotation'])
tree.links.new(sxyz.outputs[0],        il.inputs['Scale'])`}
      </pre>
      <p className="mt-2">
        Proof: Instance on Points applies{" "}
        <code>world_pos = P_i + R @ (scale * local_pos)</code>. With
        scale = (dist, 1, 1) and R aligning +X to direction, the tail stays
        at P_i and the head arrives at P_i + dist × direction = P_j. Realize
        Instances materialises the set; Mesh to Curve → Curve to Mesh sweeps an
        octagonal tube profile (radius 0.005 m, 6 sides), mirroring the same
        extrusion pipeline used in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-distribute-points-on-curves-ivy-leaf-scatter" className={lk}>
          ivy-scatter
        </Link>{" "}
        vine stems.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Extending to K=3 with a Repeat Zone
      </h2>
      <p className="mt-2">
        For a denser web, run <code>Index of Nearest</code> three times inside
        a Repeat Zone (Blender 4.1+), carrying{" "}
        <code>Min Distance</code> as a repeat item. Each iteration sets
        min_dist to the previous iteration&apos;s returned distance — scaled
        by <code>1.001</code>, not a fixed offset. A fixed offset breaks on
        dense clouds where consecutive nearest neighbours may be less than the
        offset apart; the proportional epsilon scales with local density and
        remains robust across all point counts.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Failure modes</h2>
      <p className="mt-2">
        <strong>Nearest = self.</strong> With <code>Min Distance = 0.0</code>
        the node returns the query element itself (dist = 0). The delta
        becomes <code>(0,0,0)</code> and scale collapses — instances are
        degenerate and Realize Instances drops them silently. Always use a
        small positive threshold.
      </p>
      <p className="mt-2">
        <strong>Fallback to index 0.</strong> If min_dist exceeds the true
        nearest distance, the node returns index 0 as a fallback. On sparse
        boundary points this produces unexpectedly long edges. The Viewer node
        on the Index output reveals the pattern immediately.
      </p>
      <p className="mt-2">
        <strong>Wrong evaluation domain.</strong> If Index of Nearest feeds a
        node that evaluates in the face or edge domain, it searches face
        centres or edge midpoints instead of points. Ensure the downstream
        geometry node is Instance on Points or another point-domain consumer.
      </p>

      <h2 className="mt-6 text-lg font-semibold">WebXR export</h2>
      <p className="mt-2">
        Apply the GN modifier before GLB export (
        <code>export_apply=True</code>). On a 2 × 2 m panel at
        160 points/m² the realised tube mesh runs ~80 k vertices; Draco level 6
        typically halves the buffer. Pair the emission material with{" "}
        <code>KHR_materials_emissive_strength</code> via the{" "}
        <Link href="/tutorials/blender-tutorial-python-gltf-user-extension-export-extras-hook" className={lk}>
          glTF user extension hook
        </Link>{" "}
        to preserve HDR emission strength in Three.js.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-index-of-nearest-point-connection-web-circuit-board-webxr",
  title:
    "GN Index of Nearest — 1-NN Connection Web: Circuit Board Panel for WebXR (Blender 5.1)",
  lead: "Use the Index of Nearest field node to find each scatter point's nearest peer, then stamp directed unit-line instances — stretched and rotated per-point — to produce a K=1 minimum-spanning-forest trace network, swept into emission tubes and exported as a single WebXR GLB.",
  date: "2026-07-03",
  tags: ["blender", "geometry-nodes", "spatial", "webxr", "circuit-board", "knn"],
  body: <IndexOfNearestBody />,
  blendFile:
    "public/library/blends/geometry-nodes/gn-index-of-nearest-point-connection-web-circuit-board-webxr/blueprint.py",
  externalLinks: [
    {
      label: "Blender Manual — Index of Nearest node",
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sample/index_of_nearest.html",
    },
    {
      label: "Blender API — GeometryNodeIndexOfNearest",
      href: "https://docs.blender.org/api/current/bpy.types.GeometryNodeIndexOfNearest.html",
    },
  ],
});
