import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.convex_hull</code> computes the smallest convex
        polyhedron whose surface covers all input vertices — classic
        gift-wrapping in O(n&nbsp;log&nbsp;n) time, operating entirely in local
        space. Feed it a point cloud (a fibonacci sphere, a vertex list from a
        hi-poly mesh, or a programmatic scatter) and it returns a watertight
        triangulated hull in a single call. The studio uses this in two ways:
        generating faceted crystal gem props for WebXR, and wrapping organic
        sculpts with a tight convex collision proxy for Cannon.js / Rapier.
      </p>
      <p>
        The operator is available wherever bmesh is available — no depsgraph,
        no modifier stack, no UI context required. Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-boolean-weld-modifier-union-clean-mesh-glb-webxr"
          className={lk}
        >
          Boolean modifier
        </Link>{" "}
        it never produces N-gons and never needs a cleanup weld pass; the
        result is already manifold.
      </p>

      <h2>Return keys: geom, geom_interior, geom_unused</h2>
      <p>
        The three return-dict keys map to three disjoint subsets of your
        BMesh after the call:
      </p>
      <pre>{`result = bmesh.ops.convex_hull(
    bm,
    input=bm.verts[:],       # accepts any list of BMVert
    use_existing_faces=False, # don't reuse source topology
)
# result["geom"]          — the hull surface: verts, edges, faces
# result["geom_interior"] — everything INSIDE the hull (delete these)
# result["geom_unused"]   — co-located or disconnected input not used`}</pre>
      <p>
        <strong>
          <code>geom_interior</code> must be deleted after every call.
        </strong>{" "}
        If your input is a mesh with faces (e.g. a remeshed blob), those
        interior faces survive invisibly — causing non-manifold edges,
        duplicate normals in the GLB NORMAL accessor, and a larger file. For a
        vert-only point cloud the interior faces are empty, but interior
        vertices still appear in <code>geom_interior</code>:
      </p>
      <pre>{`bmesh.ops.delete(bm, geom=result["geom_interior"], context="VERTS")`}</pre>
      <p>
        Always pass <code>context=&quot;VERTS&quot;</code>: it removes the verts
        plus any edges and faces that depend on them. Using{" "}
        <code>&quot;FACES&quot;</code> leaves the interior verts as loose
        geometry. Compare{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr"
          className={lk}
        >
          bmesh.ops.bisect_plane
        </Link>{" "}
        which returns <code>geom_cut</code> — elements you want to KEEP, not
        delete.
      </p>

      <h2>Crystal gem via fibonacci sphere</h2>
      <p>
        The golden-angle spiral (φ&nbsp;≈&nbsp;137.508°) distributes N points
        evenly on a sphere surface without polar bunching. Squishing the Z
        axis shapes the gem habit (oblate = disc, prolate = spike). Adding a
        small per-point radial jitter (±5&nbsp;% of radius) breaks
        crystallographic regularity — without it nearby points on latitude
        rings can produce long skinny hull triangles at the expense of visual
        variety.
      </p>
      <pre>{`import math, random
from mathutils import Vector

def fibonacci_sphere(n, radius, squish_z, jitter, rng):
    golden = math.pi * (3.0 - math.sqrt(5.0))  # ≈ 2.3999…
    pts = []
    for i in range(n):
        y   = 1.0 - (i / (n - 1)) * 2.0
        r   = math.sqrt(max(0.0, 1.0 - y * y))
        phi = i * golden
        jit = 1.0 + jitter * (rng.random() * 2.0 - 1.0)
        pts.append(Vector((
            r * math.cos(phi) * radius * jit,
            y * radius * jit,
            r * math.sin(phi) * radius * squish_z * jit,
        )))
    return pts

rng = random.Random(42)          # deterministic — same result every run
pts = fibonacci_sphere(56, 0.5, 0.68, 0.05, rng)

bm = bmesh.new()
for p in pts:
    bm.verts.new(p)
bm.verts.ensure_lookup_table()

result = bmesh.ops.convex_hull(bm, input=bm.verts[:], use_existing_faces=False)
bmesh.ops.delete(bm, geom=result["geom_interior"], context="VERTS")`}</pre>
      <p>
        The resulting hull typically has 30–60 triangular faces depending on N
        and jitter magnitude. Compare with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          bmesh.ops.limited_dissolve + poke
        </Link>{" "}
        which reduces an existing dense mesh to facets — convex_hull instead
        synthesises the facets directly from a point cloud without requiring
        any source topology.
      </p>

      <h2>Degeneracy: coplanar input</h2>
      <p>
        If ALL input vertices are coplanar the hull degenerates to a flat
        disk — two opposing faces (front + back) with no volume. Blender does
        not raise an exception; the degenerate result silently appears.
        Fibonacci sphere sampling guarantees 3D spread for n&nbsp;≥&nbsp;4,
        but watch for this when adapting to unknown or user-supplied point
        sets. Minimum viable non-degenerate hull: four non-coplanar points
        (a tetrahedron).
      </p>

      <h2>Collision proxy from a hi-poly mesh</h2>
      <p>
        To wrap an organic mesh in a convex collision proxy, mirror its
        vertex positions into a scratch BMesh and run convex_hull on them.
        Both the source mesh and the proxy must share the same local origin
        (both at world origin here) — the operator works in local space.
      </p>
      <pre>{`src_mesh = organic_obj.data
bm2 = bmesh.new()
for v in src_mesh.vertices:
    bm2.verts.new(Vector(v.co))   # copy positions, no edges/faces
bm2.verts.ensure_lookup_table()

res2 = bmesh.ops.convex_hull(bm2, input=bm2.verts[:], use_existing_faces=False)
bmesh.ops.delete(bm2, geom=res2["geom_interior"], context="VERTS")

# Tag the proxy object so the Three.js loader routes it to a physics engine
proxy_obj["hf:collision_proxy"] = True   # written into GLB extras`}</pre>
      <p>
        The custom property <code>hf:collision_proxy</code> is preserved by
        the glTF exporter (<code>export_extras=True</code>) as part of the
        node <code>extras</code> object. The Three.js side reads it and passes
        the hull geometry to a{" "}
        <code>ConvexPolyhedronShape</code> (Cannon.js) or{" "}
        <code>ConvexHullCollider</code> (Rapier) instead of adding it to the
        render scene. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-kdtree-nearest-attribute-transfer-webxr"
          className={lk}
        >
          KDTree nearest-neighbour
        </Link>{" "}
        pattern for spatial queries after the proxy is built — the KDTree lets
        you test which source vertices are nearest to any given query point on
        the hull surface.
      </p>

      <h2>Flat shade + sharp edges for WebXR</h2>
      <p>
        Hull faces are already planar triangles; flat-shading them and marking
        every hull edge as sharp produces the hard-faceted look used across
        studio props:
      </p>
      <pre>{`sharp_layer = bm.edges.layers.bool.new("sharp_edge")
for f in bm.faces:
    f.smooth = False
for e in bm.edges:
    e[sharp_layer] = True                    # every hull edge is a crease
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])`}</pre>
      <p>
        The <code>sharp_edge</code> boolean attribute (introduced in Blender
        4.1 as the migration target of the removed Auto-Smooth modifier) is
        written into the GLB&apos;s NORMAL accessor as split normals — each
        face gets its own flat normal without sharing vertex normal data across
        edges. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-remesh-modifier-voxel-sharp-topology-clean-glb-webxr"
          className={lk}
        >
          RemeshModifier SHARP mode
        </Link>{" "}
        tutorial for the dual-contouring alternative that starts from a dense
        SDF rather than a point cloud.
      </p>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath=glb_path,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format="WEBP",
    export_extras=True,   # writes hf:collision_proxy into node extras
)`}</pre>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.ops — Blender Python API 5.1
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation. Related:{" "}
          <a
            href="https://developer.blender.org"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            developer.blender.org
          </a>{" "}
          /{" "}
          <a
            href="https://projects.blender.org"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/meshes/editing/edge/convex_hull.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Convex Hull — Blender Manual
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Documentation Team. Related: Edge Tools,
          Mesh Editing reference.
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF spec
          </a>{" "}
          /{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Sample-Models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr",
  title:
    "Python bmesh.ops.convex_hull — Fibonacci Point-Cloud Crystal Gem & Convex Collision Proxy for WebXR (Blender 5.1)",
  description:
    "Build a faceted crystal gem from a fibonacci sphere point cloud and generate a tight convex collision proxy from an organic hi-poly source using bmesh.ops.convex_hull — covering the geom_interior deletion rule, degeneracy guards, flat-shade + sharp_edge pipeline, and collision-proxy routing via GLB extras for Cannon.js / Rapier.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "convex-hull",
    "point-cloud",
    "fibonacci-sphere",
    "crystal-gem",
    "collision-proxy",
    "physics",
    "hard-surface",
    "faceted",
    "webxr",
    "glb",
  ],
  libraryPath:
    "blends/geometry/python-bmesh-ops-convex-hull-pointcloud-crystal-gem-webxr",
  Body,
  keyInsights: [
    "result['geom_interior'] MUST be deleted after every convex_hull call — interior faces cause non-manifold edges, duplicate normals in the GLB NORMAL accessor, and inflated vertex count",
    "use_existing_faces=False prevents the operator from reusing source edge/face topology — always set it when feeding a full mesh rather than a bare point cloud",
    "fibonacci sphere (golden-angle spiral φ ≈ 137.508°) distributes N points without polar bunching; squish Z for oblate (disc gem) or prolate (spike gem) habit",
    "add ±5% radial jitter to break crystallographic symmetry — without it nearby polar-ring verts produce long-sliver hull triangles with near-zero area",
    "coplanar input produces a degenerate flat disk (two opposing faces) rather than raising an exception — guard with a minimum of 4 non-coplanar points",
    "tag the proxy object with obj['hf:collision_proxy'] = True and export_extras=True so the Three.js loader routes it to a physics engine rather than the render scene",
    "sharp_edge boolean edge attribute + f.smooth=False on every hull face produces hard-crease flat normals in the GLB NORMAL accessor without a separate Auto-Smooth modifier",
  ],
});
