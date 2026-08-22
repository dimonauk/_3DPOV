import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every Blender add-on that does snapping, brush-radius detection, or
        surface-draping relies on the same two data structures:{" "}
        <code>mathutils.kdtree.KDTree</code> for nearest-vertex lookup and{" "}
        <code>mathutils.bvhtree.BVHTree</code> for face-level ray-cast and
        surface-snap queries. These are the exact primitives powering
        Blender&apos;s Shrinkwrap modifier, the viewport snapping engine, and
        every brush-radius tool in the sculpt system — they are exposed directly
        in the Python API so that add-ons can replicate the same spatial logic
        without duplicating the C implementation. Understanding the difference
        between them, and when each answer is &ldquo;correct&rdquo; for the
        problem at hand, is the distinction between an add-on that works on
        flat meshes and one that works on everything.
      </p>

      <p>
        The fundamental difference is what each structure indexes.{" "}
        <strong>KDTree</strong> stores a set of points — typically vertex
        positions — and answers &ldquo;what point in this set is closest to a
        query coordinate?&rdquo; It knows nothing about edges or faces; if two
        vertices bracket a face centre that is geometrically nearer to the
        query, KDTree will still return one of the vertices.{" "}
        <strong>BVHTree</strong> indexes the faces themselves and returns the
        exact closest point on any triangle, which may lie on a face interior,
        an edge, or a vertex. For surface-snapping workflows — placing a decal
        on a curved wall, attaching a particle to a cloth sim, projecting a
        rig control onto skin — BVHTree is always the right choice. For
        vertex-proximity workflows — which vertex should inherit this weight
        paint stroke, which mesh island is closest to a pivot — KDTree is
        faster to build and query.
      </p>

      <p>
        The blueprint builds an icosphere with per-vertex noise displacement
        (the &ldquo;anchor mesh&rdquo;), then scatters 64 random probe
        positions in a 1.3 m bounding box. Each probe is snapped to the
        nearest face point using{" "}
        <code>BVHTree.find_nearest()</code>. A second KDTree is then built
        over those snapped positions, and{" "}
        <code>kd.find_n(co, k+1)</code> draws two nearest-neighbour edges per
        probe — forming a surface constellation that can be exported as a GLB
        with vertex-colour distance encoding. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-projection"
          className={lk}
        >
          GN Raycast Terrain Decal tutorial
        </Link>{" "}
        uses the same surface-projection concept at the Geometry Nodes level;
        this tutorial exposes the underlying Python mechanics so you can
        replicate or extend it in add-on code.
      </p>

      <h2>Building from the evaluated depsgraph</h2>
      <p>
        The single most common mistake when building a BVHTree is to construct
        it from the base mesh data-block (<code>obj.data</code>) instead of the
        fully evaluated result. When a Subdivision Surface, Displace, or
        Geometry Nodes modifier is active, the base data-block contains the
        pre-modifier cage — positions that may be several centimetres away from
        the visible surface. The fix is two lines:
      </p>
      <pre>
        <code>{`depsgraph = bpy.context.evaluated_depsgraph_get()
eval_obj  = obj.evaluated_get(depsgraph)
bvh = mathutils.bvhtree.BVHTree.FromObject(eval_obj, depsgraph)`}</code>
      </pre>
      <p>
        <code>BVHTree.FromObject</code> evaluates every modifier in the stack
        before building the hierarchy. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-object-instances-gn-scatter-glb-export"
          className={lk}
        >
          Depsgraph Object Instances tutorial
        </Link>{" "}
        covers the evaluated depsgraph in detail; treat it as a prerequisite
        for any Python work that touches modifier-dependent geometry.
      </p>

      <h2>KDTree.balance() is not optional</h2>
      <p>
        <code>KDTree</code> is built in two phases: insert all points with{" "}
        <code>kd.insert(co, index)</code>, then call <code>kd.balance()</code>{" "}
        exactly once. Balance partitions the internal binary tree; without it,
        every <code>find*()</code> call returns an empty result — silently, with
        no exception. The pattern to memorise:
      </p>
      <pre>
        <code>{`kd = mathutils.kdtree.KDTree(len(verts))
for i, v in enumerate(verts):
    kd.insert(mw @ v.co, i)   # world-space coords
kd.balance()                   # mandatory, call once`}</code>
      </pre>
      <p>
        Inserting world-space coordinates at build time (multiplying by{" "}
        <code>matrix_world</code>) means query coordinates can also be in world
        space — no inverse-matrix conversion is needed at query time. This is
        the pattern used inside the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          Batch GLB Exporter
        </Link>{" "}
        to sort objects spatially before output.
      </p>

      <h2>find_nearest() vs ray_cast()</h2>
      <p>
        <code>BVHTree.find_nearest(origin)</code> — no direction required;
        returns the globally closest face point. Returns{" "}
        <code>(location, normal, face_index, distance)</code>. All four fields
        are <code>None</code> when the BVH is empty — guard defensively even
        when you know the mesh is non-empty, because this is the correct
        pattern to copy into production add-on code where the object might be
        an empty placeholder. The <code>distance</code> field is the Euclidean
        distance from the query origin to the snapped location, not the
        distance from the mesh origin.
      </p>
      <p>
        <code>BVHTree.ray_cast(origin, direction)</code> — fires a ray from{" "}
        <code>origin</code> in <code>direction</code> and returns the first hit
        face. Returns <code>(location, normal, face_index, distance)</code> on
        hit, or <code>(None, None, None, None)</code> on miss. Use
        ray_cast for decal projection (cast from a light source toward the
        surface), line-of-sight tests (cast from character eyes toward a
        target), and the classic &ldquo;is this point inside the mesh?&rdquo;
        trick via odd-even ray parity. The{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-lattice-shrinkwrap-prop-cage"
          className={lk}
        >
          Shrinkwrap tutorial
        </Link>{" "}
        explains the modifier-level equivalent of what <code>ray_cast</code>{" "}
        does at the Python level.
      </p>

      <h2>Vertex colour attribute → GLB → Three.js</h2>
      <p>
        The constellation mesh stores a <code>FLOAT_COLOR</code> attribute
        named <code>snap_dist</code> on the <code>POINT</code> domain. The
        shader reads it via a <strong>Attribute</strong> node wired to an{" "}
        <strong>Emission</strong> output — Emission is used because it does not
        require a light in the scene to be visible in the render. On export,{" "}
        <code>export_colors=True</code> in <code>bpy.ops.export_scene.gltf</code>{" "}
        writes the attribute as a <code>COLOR_0</code> accessor in the glTF
        buffer. In Three.js after <code>GLTFLoader</code>:
      </p>
      <pre>
        <code>{`// mesh.geometry.attributes['snap_dist'] is a Float32BufferAttribute
// 4 components (RGBA) per vertex, range 0–1
const col = mesh.geometry.attributes['snap_dist'];`}</code>
      </pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>find_n() always returns the query point itself at index 0.</strong>{" "}
          Request <code>k+1</code> neighbours and skip entries where{" "}
          <code>j == i</code> to get exactly <em>k</em> external neighbours.
        </li>
        <li>
          <strong>BVHTree built from a mesh with zero faces.</strong> Happens if
          the evaluated object is a curve or point cloud — check{" "}
          <code>eval_obj.type == &apos;MESH&apos;</code> before building.
        </li>
        <li>
          <strong>Snap positions buried inside the mesh.</strong> Your probes
          are inside the mesh; <code>find_nearest</code> snaps to the closest
          face from any side. Use a{" "}
          <code>ray_cast</code> from outside the bounding box if you need
          exterior-only snapping.
        </li>
        <li>
          <strong>to_mesh_clear() not called.</strong> Omitting this after
          <code>eval_obj.to_mesh()</code> leaks a temporary mesh data-block
          every time the script runs. Always pair <code>to_mesh()</code> with{" "}
          <code>to_mesh_clear()</code> in a try/finally if the script errors
          between the two calls.
        </li>
      </ul>

      <h2>Outside References</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/current/mathutils.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Blender Python API — mathutils module
          </a>{" "}
          (CC-BY-SA 4.0, Blender Foundation) — full KDTree and BVHTree
          documentation including all find*() signatures.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — practical Blender Python patterns including
          mesh querying. Related: the same author maintains{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/blob/master/scripts"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            scripts/
          </a>{" "}
          with spatial mesh examples.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-mathutils-geometry-kdtree-bvhtree-spatial",
  title:
    "Python mathutils — KDTree Nearest-Vertex & BVHTree Surface-Snap for Add-on Spatial Queries (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-mathutils-geometry-kdtree-bvhtree-spatial",
  date: "2026-06-29",
  body: Body,
  tags: ["blender", "python", "scripting", "spatial", "kdtree", "bvhtree", "webxr"],
});
