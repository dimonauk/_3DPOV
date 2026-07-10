import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.1 quietly deleted two mesh properties that artists relied on
        for per-edge shading control: <code>mesh.use_auto_smooth</code> and{" "}
        <code>mesh.auto_smooth_angle</code>. Their replacement &mdash; the
        &ldquo;Smooth by Angle&rdquo; Geometry Nodes modifier, applied via{" "}
        <code>bpy.ops.object.shade_smooth_by_angle()</code> &mdash; computes
        normals at render time and is convenient for interactive work, but it
        cannot produce truly arbitrary per-loop values. The only 5.1 path to
        hand-authored normals is{" "}
        <code>bpy.types.Mesh.normals_split_custom_set()</code>: a flat list of{" "}
        <code>(x, y, z)</code> tuples, one per loop, stamped directly onto the
        mesh data-block and preserved through GLB export as the{" "}
        <code>NORMAL</code> vertex attribute.
      </p>

      <p>
        The studio&apos;s faceted aesthetic &mdash; used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr"
          className={lk}
        >
          faceted gem tutorial
        </Link>{" "}
        &mdash; typically relies on flat-shaded triangles: every loop on a face
        shares the face normal and the silhouette reads as hard crystal. Custom
        split normals add a third option between &ldquo;fully flat&rdquo; and
        &ldquo;fully smooth&rdquo;: faces within a shallow angular range share
        a blended average normal, while faces outside that range stay hard.
        This is how a gemstone can read as faceted overall but have a smooth
        highlight sweep across the table cut. The same technique drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
          className={lk}
        >
          cel-shade bake pipeline
        </Link>
        : a directional highlight that follows a smooth normal island reads as
        a single cartoon specular band rather than per-triangle noise.
      </p>

      <p>
        Island detection here uses a Union-Find structure on face-normal dot
        products. Two faces belong to the same island when their normals are
        within ~35° of each other; the algorithm propagates transitively, so a
        5-face cap on an icosahedron merges into one island even if no two
        non-adjacent faces in the cap meet the threshold directly. Once islands
        are known, an area-weighted average normal is computed for each and
        assigned to every loop in the island. The resulting{" "}
        <code>.glb</code> carries baked{" "}
        <code>NORMAL</code> attributes and loads in Three.js / WebXR with no
        further processing, unlike meshes that depend on a runtime
        &ldquo;Smooth by Angle&rdquo; pass that WebXR runtimes cannot replicate.
        For the broader pre-export pipeline around modifier application, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-modifier-stack-pre-export-apply"
          className={lk}
        >
          modifier stack apply tutorial
        </Link>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "advanced",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    supplies: {
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Understand split normals vs face normals in Blender 5.1",
        body: `# In Blender 5.1 there are three distinct normal concepts on a mesh:
#
#   1. Face normal        — one vector per polygon, perpendicular to the face.
#                           Always computed from vertex positions.
#
#   2. Vertex normal      — per-vertex average of adjacent face normals.
#                           Used for smooth shading when no custom data exists.
#
#   3. Split (loop) normal — one vector per mesh LOOP (per polygon corner).
#                            Allows the same vertex to have different normals
#                            depending on which face is being shaded.
#                            Hard edges are achieved by placing two loops at
#                            the same vertex position with diverging normals.
#
# mesh.normals_split_custom_set(normals) writes split normals.
# The argument length must equal the total loop count across all polygons.

import bpy

# Validate loop count on an existing mesh:
mesh = bpy.context.active_object.data  # assumes a mesh object is active
total_loops = sum(p.loop_total for p in mesh.polygons)
print(f"Polygons: {len(mesh.polygons)}, Loops: {len(mesh.loops)}")
# Both should print the same value.  loops.__len__() == total_loops.

# WHY not mesh.vertices length?
#   Each vertex can be shared by many polygons.  normals_split_custom_set
#   operates at the loop level so that vertex 7 in polygon A can have a
#   different normal than vertex 7 in polygon B — that is the hard edge.
#   A per-vertex list cannot express this; the loop list can.

# BLENDER 4.1 REMOVAL WARNING:
#   mesh.use_auto_smooth = True    → AttributeError in 5.1
#   mesh.auto_smooth_angle = 0.5   → AttributeError in 5.1
# The "Smooth by Angle" modifier replaces both, but that modifier recomputes
# normals at render time and OVERRIDES normals_split_custom_set().
# Never add that modifier to a mesh you intend to use with custom normals.`,
      },
      {
        title: "Build an icosphere via BMesh ops (no operator context needed)",
        body: `import bpy
import bmesh

OBJ_NAME   = "normal_gem"
ICO_SUBDIVS = 2     # 320 triangular faces
ICO_RADIUS  = 1.0

# Direct BMesh construction avoids the operator context requirement.
# bpy.ops.mesh.primitive_ico_sphere_add() needs an active 3-D View context;
# from a Script Editor run or background process that context is absent.

mesh = bpy.data.meshes.new(OBJ_NAME)
obj  = bpy.data.objects.new(OBJ_NAME, mesh)
bpy.context.scene.collection.objects.link(obj)

bm = bmesh.new()
bmesh.ops.create_icosphere(
    bm,
    subdivisions=ICO_SUBDIVS,
    radius=ICO_RADIUS,
)
bm.to_mesh(mesh)
bm.free()

# Refresh geometry so face normals are current.
# In 4.1+ calc_normals() is gone; mesh.update() triggers the recalc.
mesh.update(calc_edges=True)

print(f"Created: {len(mesh.polygons)} faces, {len(mesh.loops)} loops")
# Expected output for ICO_SUBDIVS=2: 320 faces, 960 loops`,
      },
      {
        title: "Detect smooth-shading islands with Union-Find",
        body: `import math

SMOOTH_DOT = 0.82   # cos(35°) — faces within 35° merge into same island

def detect_islands(mesh):
    """
    Union-Find on face-normal dot products.

    Two faces merge into the same island when their normals satisfy
    dot(n_a, n_b) > SMOOTH_DOT.  Transitivity is handled automatically:
    if A≈B and B≈C, all three merge even when dot(A, C) ≤ threshold.

    WHY this threshold?
      A regular icosahedron's adjacent face pairs have an interior dihedral
      angle of ~138°, so their normals are ~42° apart.  SMOOTH_DOT=0.82
      (cos 35°) keeps adjacent icosahedron faces in SEPARATE islands —
      giving the hard faceted look.  At subdivisions=2 the new micro-faces
      within each original facet are much closer in normal direction (< 15°),
      so they DO merge into one island per original facet.
      Result: 20 smooth islands (one per icosahedron face), hard boundaries
      between them.
    """
    n       = len(mesh.polygons)
    normals = [mesh.polygons[i].normal.copy() for i in range(n)]
    parent  = list(range(n))

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]   # path compression
            x = parent[x]
        return x

    def union(a, b):
        parent[find(a)] = find(b)

    for i in range(n):
        for j in range(i + 1, n):
            if normals[i].dot(normals[j]) > SMOOTH_DOT:
                union(i, j)

    face_to_island = {i: find(i) for i in range(n)}
    island_count   = len(set(face_to_island.values()))
    print(f"Islands found: {island_count}")
    return face_to_island

# Usage:
face_to_island = detect_islands(mesh)

# TROUBLESHOOTING — all faces in one island:
#   SMOOTH_DOT is too low (faces everywhere merge).
#   Raise it toward 0.95 (≈18°) for tighter grouping.
#
# TROUBLESHOOTING — all faces in separate islands:
#   SMOOTH_DOT is too high.  Lower it toward 0.7 (≈45°) for looser grouping.
#
# PERFORMANCE NOTE:
#   This O(F²) algorithm is fine for meshes up to ~2000 faces.
#   For larger meshes, build an adjacency list from mesh.edge_keys and
#   use BFS / flood-fill rather than all-pairs comparison.`,
      },
      {
        title: "Compute area-weighted average normals per island",
        body: `from mathutils import Vector

def island_averaged_normals(mesh, face_to_island):
    """
    For each island, sum (face_normal × face_area) across members then
    normalise.  Area-weighting prevents tiny boundary slivers from pulling
    the island normal off-axis.
    """
    accum  = {}
    weight = {}

    for poly in mesh.polygons:
        root = face_to_island[poly.index]
        accum.setdefault(root, Vector((0, 0, 0)))
        weight.setdefault(root, 0.0)
        accum[root]  += poly.normal * poly.area
        weight[root] += poly.area

    result = {}
    for root, vec in accum.items():
        w = weight[root]
        n = (vec / w) if w > 1e-12 else Vector((0, 0, 1))
        n.normalize()
        result[root] = n

    return result   # dict[island_root → normalised Vector]

island_normals = island_averaged_normals(mesh, face_to_island)
print(f"Island normals computed: {len(island_normals)}")

# WHY not just use the face normal of the first member face?
#   On a subdivided surface the first face in an island might be a micro-
#   triangle at the edge of the original icosahedron facet.  Its individual
#   normal can deviate several degrees from the island centre.  The weighted
#   average converges to the true geometric centre of the facet.

def build_per_loop_normals(mesh, face_to_island, island_normals):
    """
    Build the flat list normals_split_custom_set() expects:
    one (x,y,z) tuple per loop, in polygon order.

    Loop ordering: for polygon P, loops span
    [P.loop_start, P.loop_start + P.loop_total).
    normals_split_custom_set iterates polygons in index order and advances
    through the flat list by poly.loop_total each step.  The build here
    mirrors that exact traversal.
    """
    out = []
    for poly in mesh.polygons:
        n = island_normals[face_to_island[poly.index]]
        for _ in poly.loop_indices:
            out.append((n.x, n.y, n.z))
    return out

loop_normals = build_per_loop_normals(mesh, face_to_island, island_normals)
print(f"Per-loop normals built: {len(loop_normals)} (should equal {len(mesh.loops)})")`,
      },
      {
        title: "Apply custom split normals and verify the result",
        body: `def apply_custom_normals(mesh, normals_list):
    """
    Two-step application:
      1. Enable smooth shading on every polygon (use_smooth=True).
         A flat-shaded polygon renders with its face normal regardless
         of what normals_split_custom_set stored — the custom normals
         are silently ignored.  Always set use_smooth first.

      2. Call normals_split_custom_set(normals_list).
         The list length must equal len(mesh.loops); a mismatch raises
         RuntimeError immediately, which is the correct fail-fast behaviour.
    """
    for poly in mesh.polygons:
        poly.use_smooth = True

    mesh.normals_split_custom_set(normals_list)

    # Verification round-trip: read back what was stored.
    # calc_normals_split() evaluates the split normal attribute into
    # mesh.loops[i].normal — a read-only temporary that disappears after
    # free_normals_split().
    mesh.calc_normals_split()
    first_loop_normal = mesh.loops[0].normal.copy()
    mesh.free_normals_split()

    from mathutils import Vector
    expected = Vector(normals_list[0])
    delta    = (first_loop_normal - expected).length
    if delta > 0.001:
        print(f"WARNING: loop 0 stored {first_loop_normal!r}, expected {expected!r}")
    else:
        print(f"OK: loop 0 normal matches ({first_loop_normal.x:.3f}, "
              f"{first_loop_normal.y:.3f}, {first_loop_normal.z:.3f})")

apply_custom_normals(mesh, loop_normals)

# GOTCHA — transforms invalidate split normals:
#   bpy.ops.object.transform_apply() recomputes vertex positions and
#   clears split normals.  Always apply_custom_normals AFTER applying
#   transforms, not before.  If using the GLTF exporter with export_apply=True,
#   the exporter applies modifiers internally and calls calc_normals_split()
#   on the evaluated mesh, which correctly reads the custom data.

# GOTCHA — Smooth by Angle modifier:
#   If bpy.ops.object.shade_smooth_by_angle() was called on this object,
#   a 'Smooth by Angle' Geometry Nodes modifier exists.  That modifier
#   recomputes normals at viewport/render time and takes priority over the
#   stored split normals.  Remove it:
#   for mod in list(obj.modifiers):
#       obj.modifiers.remove(mod)
#   … then reapply custom normals.`,
      },
      {
        title: "Export as GLB with custom normals baked",
        body: `import bpy, os

def add_metallic_material(obj):
    mat = bpy.data.materials.new("NormalGem_Metal")
    mat.use_nodes = True
    mat.node_tree.nodes.clear()
    out  = mat.node_tree.nodes.new("ShaderNodeOutputMaterial")
    bsdf = mat.node_tree.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = (0.72, 0.55, 0.18, 1.0)
    bsdf.inputs["Metallic"].default_value   = 1.0
    bsdf.inputs["Roughness"].default_value  = 0.15
    mat.node_tree.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    out.location  = (300, 0)
    bsdf.location = (0, 0)
    obj.data.materials.append(mat)

def export_glb(obj, rel_path):
    """
    Export single object as GLB.

    export_normals=True (default) tells the GLTF exporter to emit a NORMAL
    attribute.  The exporter calls mesh.calc_normals_split() on the
    evaluated mesh and reads loop normals, which includes our custom data.

    export_apply=False: we do NOT want modifiers applied.  This object has
    no modifiers, but being explicit prevents a future 'Smooth by Angle'
    modifier from silently overwriting the normals during export.

    Draco level 6 + WebP: Holoflow studio standard for WebXR assets.
    """
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    abs_path = bpy.path.abspath(rel_path)
    bpy.ops.export_scene.gltf(
        filepath=abs_path,
        use_selection=True,
        export_format='GLB',
        export_normals=True,
        export_apply=False,
        export_yup=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
    )
    print(f"Exported: {abs_path}")
    return abs_path

add_metallic_material(obj)
glb_path = export_glb(obj, "//custom_normals_gem.glb")

# VERIFY in Three.js (console):
#   const loader = new GLTFLoader()
#   loader.load('/path/to/custom_normals_gem.glb', (gltf) => {
#     const geo = gltf.scene.children[0].geometry
#     console.log(geo.attributes.normal)   // should be BufferAttribute
#   })
#
# If geo.attributes.normal is undefined, check:
#   • export_normals=True was set
#   • mesh.polygons all have use_smooth=True
#   • No Smooth by Angle modifier was on the object at export time`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-mesh-custom-split-normals-smooth-island-faceted-webxr",
    title:
      "Python bpy.types.Mesh — Custom Split Normals: Per-Loop Normal Authoring, Smooth Shading Islands & Faceted GLB for WebXR",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Use bpy.types.Mesh.normals_split_custom_set() in Blender 5.1 to hand-author per-loop split normals: group icosphere faces into smooth-shading islands via Union-Find, compute area-weighted average normals per island, and export as a GLB with baked NORMAL attributes for Three.js WebXR — no runtime Smooth by Angle dependency.",
    Body,
  }
);
