import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s <code>bmesh.ops</code> library contains two topology{" "}
        <em>reduction</em> operators that are often overlooked in favour of the
        flashier construction ops: <code>limited_dissolve</code> and{" "}
        <code>dissolve_edges</code>. Starting dense and dissolving down to
        faceted polygons is the cleanest route to irregular gem-like surfaces —
        far less bookkeeping than building face by face from scratch. Add{" "}
        <code>poke()</code> at the end to split the biggest merged faces into
        centroid-fan star triangles, and a subdivided icosphere becomes a
        studio-ready ornament in under 200 lines. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr"
          className={lk}
        >
          bmesh gem construction tutorial
        </Link>{" "}
        which builds topology element by element — the two approaches are the
        full spectrum of Python mesh authoring in Blender 5.1.
      </p>
      <p>
        All three operators share one property: they accept and return{" "}
        <em>explicit geometry sets</em>, require no active object, no Edit Mode,
        and no undo-stack context. That makes them equally usable from a Text
        Editor script, a headless batch run, or an{" "}
        <code>Operator.execute()</code> callback — the same script works
        everywhere. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
          className={lk}
        >
          extrude / bevel / bridge tutorial
        </Link>{" "}
        covers the construction side of <code>bmesh.ops</code>; this tutorial
        covers the reduction + decoration side.
      </p>

      <h2>limited_dissolve — angle-threshold batch dissolution</h2>
      <p>
        <code>bmesh.ops.limited_dissolve(bm, angle_limit, use_dissolve_boundaries, delimit)</code>{" "}
        collapses every edge whose dihedral angle between its two adjacent faces
        is below <code>angle_limit</code> (in radians). Near-coplanar edges
        disappear; sharp silhouette edges survive. The result is a dramatic
        polygon count reduction that preserves the overall shape&rsquo;s
        silhouette while converting smooth micro-triangle patches into large,
        flat-shaded N-gons — precisely the faceted aesthetic Holoflow Studio
        uses for WebXR instancing.
      </p>
      <p>
        The <code>delimit</code> parameter controls barriers:{" "}
        <code>set()</code> (empty) dissolves across all boundaries.{" "}
        <code>{'{"MATERIAL"}'}</code> preserves edges at material transitions;{" "}
        <code>{'{"SHARP"}'}</code> preserves hard-edge marks;{" "}
        <code>{'{"SEAM"}'}</code> preserves UV seam edges. Combine as needed:{" "}
        <code>{'{"MATERIAL", "SHARP"}'}</code> keeps both. Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr"
          className={lk}
        >
          parametric surface tutorial
        </Link>{" "}
        where faces are hand-sized from the start, here the face distribution is
        organic — driven by the icosphere&rsquo;s geodesic structure rather
        than a mathematical parameter.
      </p>

      <h2>dissolve_edges — surgical per-edge removal</h2>
      <p>
        After <code>limited_dissolve</code>, a manual pass with{" "}
        <code>bmesh.ops.dissolve_edges(bm, edges, use_verts, use_face_split)</code>{" "}
        catches any micro-angle edges that survived the global sweep. The key
        method is <code>e.calc_face_angle(fallback)</code> which returns the
        dihedral angle in radians between the two faces sharing that edge.
        Filtering for <code>len(e.link_faces) == 2</code> before calling
        prevents the fallback from masking genuine boundary edges. Setting{" "}
        <code>use_verts=True</code> cleans up collinear &ldquo;wire&rdquo;
        vertices left after edge removal — verts with exactly two remaining
        edges in a straight line that serve no topological purpose.
      </p>

      <h2>poke — centroid-fan face split</h2>
      <p>
        <code>bmesh.ops.poke(bm, faces, offset, use_relative_offset, center_mode)</code>{" "}
        inserts one vertex at the face centre and draws edges from it to every
        corner vertex, replacing one N-gon with N triangles. The{" "}
        <code>center_mode='MEAN_WEIGHTED'</code> option weights the centre
        position by each constituent triangle&rsquo;s area rather than by
        vertex count — the correct choice for irregular N-gons where a simple
        arithmetic mean would shift the centre toward dense vertex clusters on
        one side. Setting <code>offset &gt; 0</code> raises the fan centre
        outward along the face normal, producing a faceted pyramid peak visible
        as a specular ridge in PBR renders. The return value{" "}
        <code>poke_ret[&apos;faces&apos;]</code> gives all new triangles for
        immediate material-index assignment — no re-iteration needed. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-faceted-gem-webxr"
          className={lk}
        >
          faceted gem tutorial
        </Link>{" "}
        for how these star fans appear under EEVEE Next glass shading. Outside
        references:{" "}
        <a
          href="https://docs.blender.org/api/5.1/bmesh.ops.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bmesh.ops — Blender 5.1 Python API (Blender Foundation, CC BY-SA 4.0)
        </a>
        , siblings{" "}
        <a
          href="https://docs.blender.org/api/5.1/bmesh.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          bmesh module
        </a>{" "}
        and{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          projects.blender.org
        </a>
        ;{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-scripting — Python mesh examples (Nicolas Janakiev, MIT)
        </a>
        , siblings{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting/tree/master/scripts"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          /scripts
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/njanakiev"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/njanakiev
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Create a dense icosphere with bmesh.ops.create_icosphere",
        body: `"""
bmesh.ops.create_icosphere(bm, subdivisions, radius) builds a subdivision-2
icosphere entirely in the BMesh buffer — 80 equilateral triangles, 42 vertices.
No bpy.ops, no active object, no undo push.

WHY start dense?  The reduction operators (limited_dissolve, dissolve_edges)
need excess topology to merge.  At subdivisions=1 (icosahedron, 20 tris) there
is almost nothing to dissolve.  subdivisions=2 provides the right amount of
micro-faces for a clean faceted result at 30° threshold.

ensure_lookup_table() after creation is mandatory before ANY integer-indexed
access (bm.faces[i]).  Blender rebuilds this C array lazily; a missing call
raises IndexError at the first random access even though the data exists.
normal_update() recalculates face normals from vertex positions — required
before any angle-comparison operation.
"""
import bpy, bmesh, math
from mathutils import Vector

SUBDIVISIONS = 2
RADIUS       = 1.0

me = bpy.data.meshes.new("ornament_faceted")
bm = bmesh.new()

bmesh.ops.create_icosphere(bm, subdivisions=SUBDIVISIONS, radius=RADIUS)
bm.faces.ensure_lookup_table()
bm.verts.ensure_lookup_table()
bm.normal_update()

print(f"icosphere: {len(bm.faces)} faces / {len(bm.verts)} verts")
# → icosphere: 80 faces / 42 verts`,
      },
      {
        title: "Reduce topology with bmesh.ops.limited_dissolve",
        body: `"""
limited_dissolve collapses every edge whose dihedral angle is below angle_limit.
Near-coplanar edges disappear; sharp silhouette edges survive.

Parameter notes:
  angle_limit        = radians(30) collapses many micro-triangles within each
                       icosahedron face, typically leaving 20–32 large N-gons.
  use_dissolve_boundaries = False  keeps perimeter edges even when they pass
                       the angle test (no effect on closed volumes like this sphere).
  delimit = set()    → no barriers.  Use {'MATERIAL','SHARP','SEAM'} to preserve
                       those edge types.

After this call, re-run ensure_lookup_table() + normal_update() because the
element count has changed and the C index arrays are stale.
"""
LD_ANGLE_DEG = 30.0

bmesh.ops.limited_dissolve(
    bm,
    angle_limit=math.radians(LD_ANGLE_DEG),
    use_dissolve_boundaries=False,
    delimit=set(),
)
bm.faces.ensure_lookup_table()
bm.normal_update()
print(f"after limited_dissolve({LD_ANGLE_DEG}°): {len(bm.faces)} faces")
# typical output: 20–28 faces depending on rounding at 5-valent verts`,
      },
      {
        title: "Manual micro-edge cleanup with bmesh.ops.dissolve_edges",
        body: `"""
limited_dissolve operates in one global pass with a fixed threshold.
Rarely, winding ambiguities near the icosphere's 5-valent vertices leave
sub-threshold edges that survived because their adjacent faces had
temporarily inconsistent normals during the dissolution sweep.

e.calc_face_angle(fallback) returns the dihedral angle in radians between
the two faces sharing this edge.  fallback = math.pi treats boundary edges
(link_faces < 2) as "flat = keep" — harmless for a closed volume.

Filter len(e.link_faces) == 2 BEFORE calling calc_face_angle to avoid
the fallback masking genuine open-boundary edges on any partially-open mesh.

use_verts=True: dissolves "wire" verts (exactly 2 collinear remaining edges)
after edge removal.
use_face_split=False: no vertex insertion at face intersections — correct
for convex geometry.  Set True only when dissolving non-manifold edges.
"""
MANUAL_ANGLE_DEG = 8.0

micro_edges = [
    e for e in bm.edges
    if len(e.link_faces) == 2
    and math.degrees(e.calc_face_angle(math.pi)) < MANUAL_ANGLE_DEG
]

if micro_edges:
    bmesh.ops.dissolve_edges(bm, edges=micro_edges,
                             use_verts=True, use_face_split=False)
    bm.faces.ensure_lookup_table()
    bm.normal_update()
    print(f"dissolved {len(micro_edges)} micro-edges below {MANUAL_ANGLE_DEG}°")`,
      },
      {
        title: "Starburst fans with bmesh.ops.poke",
        body: `"""
poke() inserts one vertex at each face's centre and draws edges to every
corner vert, replacing one N-gon with N triangles.

center_mode='MEAN_WEIGHTED': weights the fan centre position by triangle area
— more stable than 'MEAN' (unweighted) for irregular N-gons where a simple
arithmetic mean shifts toward dense vert clusters.
'BOUNDS' uses bounding-box midpoint — only reliable for rectangular faces.

offset > 0: raises the fan centre outward along the face normal, creating a
faceted pyramid peak visible in PBR as a specular highlight ridge.
Set offset=0.0 for a flat starburst.

Selecting by vertex count is a quick proxy for face area: larger merged N-gons
absorbed more original icosphere triangles and therefore have more vertices.

poke_ret['faces'] = ALL new triangles (N per poked face).  Assign material
index immediately before losing the reference.
"""
POKE_TOP_N  = 4
POKE_OFFSET = 0.06

merged_faces = sorted(bm.faces, key=lambda f: len(f.verts), reverse=True)
poke_faces   = merged_faces[:POKE_TOP_N]

poke_ret = bmesh.ops.poke(
    bm, faces=poke_faces,
    offset=POKE_OFFSET,
    use_relative_offset=False,
    center_mode='MEAN_WEIGHTED',
)
for f in poke_ret['faces']:
    f.material_index = 1   # amber highlight material

bm.faces.ensure_lookup_table()
bm.normal_update()
print(f"poke created {len(poke_ret['faces'])} star triangles")`,
      },
      {
        title: "Finalise, flat shade, triangulate, and export GLB",
        body: `"""
recalc_face_normals after poke: new faces inherit the original face's winding
but the raised fan centre creates new face orientations — recalc with outward
flood-fill keeps normals consistent on the convex sphere.

f.smooth = False on each BMFace before to_mesh(): flags flat shading without
needing bpy.ops.object.shade_flat() or a custom split-normal layer.

triangulate with BEAUTY/EAR_CLIP: glTF 2.0 requires triangles.  BEAUTY
minimises the longest diagonal per quad (Delaunay-like); EAR_CLIP handles
concave N-gons robustly.  Poked faces are already tris — triangulate is
idempotent on them but safe to include in the full face list.

bm.free() after bm.to_mesh(): the BMesh is a C allocation, not garbage-
collected by Python.  Omitting this leaks memory in batch loops.
"""
EXPORT_PATH = "/tmp/ornament_faceted.glb"
DRACO_LEVEL = 6

bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
for f in bm.faces: f.smooth = False
bmesh.ops.triangulate(bm, faces=list(bm.faces),
                      quad_method='BEAUTY', ngon_method='EAR_CLIP')
print(f"final: {len(bm.faces)} tris / {len(bm.verts)} verts")

bm.to_mesh(me)
bm.free()

# Materials
def _mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = rgba
        bsdf.inputs['Roughness'].default_value  = 0.28
        bsdf.inputs['Metallic'].default_value   = 0.60
    return m

me.materials.append(_mat("ornament_body", (0.12, 0.45, 0.68, 1.0)))
me.materials.append(_mat("ornament_star", (0.88, 0.55, 0.02, 1.0)))

obj = bpy.data.objects.new("ornament_faceted", me)
bpy.context.scene.collection.objects.link(obj)

bpy.ops.export_scene.gltf(
    filepath=EXPORT_PATH,
    export_format='GLB',
    export_yup=True,
    export_apply=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=DRACO_LEVEL,
    export_image_format='WEBP',
)
print(f"exported → {EXPORT_PATH}")`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr",
    title:
      "Python bmesh.ops — Limited Dissolve & Poke: Dense→Faceted Topology Reduction for WebXR Ornament (Blender 5.1)",
    blurb:
      "Reduce a subdivided icosphere to irregular gem-like facets using bmesh.ops.limited_dissolve and dissolve_edges, then split the largest merged faces into centroid-fan starburst triangles with bmesh.ops.poke — all context-free, batch-safe, and ready for GLB export.",
    Body,
    createdAt: new Date("2026-07-13"),
    tags: ["blender", "python", "bmesh", "scripting", "webxr", "topology", "low-poly", "faceted"],
    difficulty: "intermediate",
  }
);
