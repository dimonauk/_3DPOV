import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Three defects account for the majority of WebXR GLB failures that pass
        silently through Blender&apos;s viewport: seam duplicate vertices
        (invisible in Object mode, crack-visible under environment lighting),
        inverted face winding (dark patches that backface-culling hides in
        EEVEE but an XR renderer makes invisible from every angle), and open
        boundary holes (non-manifold geometry that some glTF runtimes discard
        entirely). This tutorial covers the pure-bmesh pipeline that repairs
        all three without calling a single <code>bpy.ops</code> function —
        so it runs headless from a CLI subprocess, a pre-export hook, or the
        Blender Text Editor with identical behaviour.
      </p>

      <h2>The three operators</h2>
      <pre>{`# 1. find_doubles — locate near-coincident vertices
ret = bmesh.ops.find_doubles(bm, verts=bm.verts[:], keep_verts=[], dist=1e-4)
# Returns {'targetmap': {src_vert: target_vert}} — does NOT merge yet.

# 2. weld_verts — collapse the pairs returned by find_doubles
bmesh.ops.weld_verts(bm, targetmap=ret['targetmap'])
# After this call all pre-weld element handles may be invalid.
# Mandatory: bm.verts.ensure_lookup_table() etc. before any index access.

# 3. recalc_face_normals — flood-fill outward winding
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
# Approximates the volume centroid; flips every face whose normal points in.
# Requires a CONNECTED, MANIFOLD surface — call AFTER welding the seam.

# 4. holes_fill — cap open boundary loops
boundary_edges = [e for e in bm.edges if e.is_boundary]
bmesh.ops.holes_fill(bm, edges=boundary_edges, sides=4)
# sides=4: prefer quads; sides=0: allow any polygon size.`}</pre>

      <h2>find_doubles is a query, not a mutation</h2>
      <p>
        The most common mistake: calling <code>find_doubles</code> and
        expecting the mesh to change. It does not. The operator walks the
        vertex list, builds a spatial hash, and returns a{" "}
        <code>targetmap</code> dict mapping each <em>source</em> vertex to
        the <em>target</em> it should be merged into. You must then pass that
        dict to <code>weld_verts</code> to perform the actual collapse.
      </p>
      <pre>{`# What find_doubles actually returns:
# {'targetmap': {<BMVert index=3>: <BMVert index=0>,
#                <BMVert index=15>: <BMVert index=12>, ...}}
# Each key is a duplicate; each value is the vertex it will collapse into.
# keep_verts=[] → lowest-index vertex in each pair wins.
# keep_verts=[v] → v is exempt from being a key (it can still be a target).

# Guard before weld_verts — empty map means zero duplicates found:
if ret['targetmap']:
    bmesh.ops.weld_verts(bm, targetmap=ret['targetmap'])

# After weld: invalidation. ALWAYS refresh.
bm.verts.ensure_lookup_table()
bm.edges.ensure_lookup_table()
bm.faces.ensure_lookup_table()`}</pre>

      <h2>Why welding before recalculating matters</h2>
      <p>
        <code>recalc_face_normals</code> works by approximating the mesh
        volume centroid, then treating any face whose normal points toward
        that centroid as inward-facing and flipping it. This relies on the
        mesh being a connected, closed surface — or at least a surface where
        the flood-fill can travel continuously from face to face across shared
        edges. A seam with duplicate vertices looks, topologically, like two
        separate shells touching at a boundary. The flood-fill crosses from
        the upper crown into the lower pavilion through shared edges, but if
        those edges&apos; vertices are still duplicated the edges are{" "}
        <em>not</em> shared — they are parallel wire edges belonging to
        different loops. The flood-fill stalls at the seam and leaves the
        pavilion faces in whatever winding order they arrived in.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-dissolve-topology-reduction-degenerate-cleanup-webxr"
          className={lk}
        >
          dissolve pipeline
        </Link>{" "}
        has the same ordering constraint:{" "}
        <code>dissolve_degenerate</code> must run before{" "}
        <code>dissolve_limit</code> for the identical reason — operators that
        reason about face connectivity need the topology clean before they
        begin.
      </p>

      <h2>recalc_face_normals — what it can and cannot fix</h2>
      <pre>{`# Works correctly on:
#   closed volumes (sphere, box, gem)
#   open shells with a dominant outward-facing majority
#   mesh with some flipped faces isolated by sharp edges

# Fails silently on:
#   Möbius strips and other non-orientable surfaces
#   Separate disconnected components (only the component with the centroid
#   wins; isolated floating pieces may be flipped relative to intent)
#   Meshes with zero volume (flat planes) — centroid is ON the surface,
#   so the "inside" direction is undefined; result is arbitrary.

# After recalc, verify with:
for f in bm.faces:
    assert f.normal.dot(f.calc_center_median() - bm.calc_center_of_mass()) > 0, \
        f"Face {f.index} still inward after recalc"
# This assertion fails for flat planes — expected, not a pipeline error.`}</pre>
      <p>
        If you need to flip a known subset rather than auto-recalculate, use{" "}
        <code>bmesh.ops.flip_normals(bm, faces=target_faces)</code> — it
        reverses the winding of exactly the faces you pass, without any
        centroid heuristic.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-split-edges-hard-normals-angle-threshold-uv-seam-webxr"
          className={lk}
        >
          split-edges & hard-normals tutorial
        </Link>{" "}
        explains how the custom normal layer (split normals) interacts with
        face winding — a recalc that flips a face also reverses its custom
        normals if the layer exists, which can undo a carefully baked normal
        map workflow.
      </p>

      <h2>holes_fill — sides, fans, and pole count</h2>
      <pre>{`# edges= must be BOUNDARY edges only: e.is_boundary is True when the
# edge has exactly one adjacent face.  Passing interior edges is silently
# ignored — the operator only acts on perimeter loops.
boundary = [e for e in bm.edges if e.is_boundary]

# sides=0  → fill with a single n-gon regardless of vertex count.
#             A 12-vertex hole becomes one 12-gon.  Flat caps look fine;
#             the GLB exporter triangulates it with arbitrary diagonals.
# sides=4  → tries to create quads; falls back to a fan of tris when the
#             loop vertex count is not cleanly divisible into quad patches.
#             For FACETS=12 (this blueprint) it creates a 3-patch quad star.
# sides=3  → triangle fan from hole centroid — always succeeds, highest
#             poly count, safe for any hole shape.
bmesh.ops.holes_fill(bm, edges=boundary, sides=4)

# After holes_fill, the table cap vertices are NEW — they are not in any
# pre-existing lookup table.  Ensure tables again before subsequent index
# access.  Normal update is also required: holes_fill does not call it.
bm.verts.ensure_lookup_table()
bm.normal_update()`}</pre>
      <p>
        Holes with a very large vertex count (e.g. a circular hole with 64
        segments) produce an extremely dense fan when <code>sides=3</code>.
        In that case call{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-triangulate-join-triangles-quad-retopo-glb-webxr"
          className={lk}
        >
          triangulate + join_triangles
        </Link>{" "}
        after <code>holes_fill</code> to reconstitute quads from the triangle
        fan under a maximum angle constraint.
      </p>

      <h2>Blueprint walkthrough — broken → repaired pendant</h2>
      <p>
        The blueprint builds a faceted teardrop gem pendant in three stages:
      </p>
      <ol>
        <li>
          <strong>Build upper crown</strong> (UPPER_LVLS rings, table left
          open) and <strong>lower pavilion</strong> (LOWER_LVLS rings to
          culet) — with a deliberate equator duplicate layer and reversed
          winding on the first pavilion ring.
        </li>
        <li>
          <strong>Pipeline</strong>:{" "}
          <code>find_doubles → weld_verts → recalc_face_normals → holes_fill</code>.
        </li>
        <li>
          <strong>Material</strong>: Principled BSDF at IOR 2.4
          (diamond), 90 % transmission, 0.05 roughness — maximises the
          facet-reflection contrast that makes winding defects obvious in
          Material Preview.
        </li>
      </ol>
      <pre>{`import bpy, bmesh, math

FACETS      = 12
EQUATOR_R   = 0.40
UPPER_LVLS  = 3
LOWER_LVLS  = 4
WELD_DIST   = 1e-4

bm = bmesh.new()

def ring(z, r):
    verts = []
    for i in range(FACETS):
        a = 2.0 * math.pi * i / FACETS
        verts.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
    return verts

upper = [ring(i/UPPER_LVLS * 0.25, EQUATOR_R * (1.0 - i/UPPER_LVLS * 0.85))
         for i in range(UPPER_LVLS + 1)]

# Equator duplicate layer (the import seam)
equator_dupe = [bm.verts.new(v.co.copy()) for v in upper[0]]
lower = [equator_dupe]
for lvl in range(1, LOWER_LVLS + 1):
    t = lvl / LOWER_LVLS
    lower.append(ring(-t * 0.35, EQUATOR_R * (1.0 - t)))
culet = bm.verts.new((0.0, 0.0, -0.35))

# Upper crown quads (table left OPEN)
for lvl in range(UPPER_LVLS):
    lo, hi = upper[lvl], upper[lvl + 1]
    for i in range(FACETS):
        j = (i + 1) % FACETS
        bm.faces.new([lo[i], lo[j], hi[j], hi[i]])

# Lower pavilion: ring 0 BACKWARDS, rings 1–3 correct, tris to culet
for lvl in range(LOWER_LVLS - 1):
    lo, hi = lower[lvl], lower[lvl + 1]
    for i in range(FACETS):
        j = (i + 1) % FACETS
        if lvl == 0:
            bm.faces.new([lo[j], lo[i], hi[i], hi[j]])  # flipped
        else:
            bm.faces.new([lo[i], lo[j], hi[j], hi[i]])
for i in range(FACETS):
    j = (i + 1) % FACETS
    bm.faces.new([lower[-1][i], culet, lower[-1][j]])

# ── INTEGRITY PIPELINE ─────────────────────────────────────────────
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

ret = bmesh.ops.find_doubles(bm, verts=bm.verts[:], keep_verts=[], dist=WELD_DIST)
if ret['targetmap']:
    bmesh.ops.weld_verts(bm, targetmap=ret['targetmap'])
bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table(); bm.faces.ensure_lookup_table()

bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])

boundary = [e for e in bm.edges if e.is_boundary]
if boundary:
    bmesh.ops.holes_fill(bm, edges=boundary, sides=4)

bm.normal_update()
for f in bm.faces: f.smooth = False`}</pre>

      <h2>Comparing with the bpy.ops approach</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-context-temp-override-mesh-repair-pipeline"
          className={lk}
        >
          context-override mesh repair pipeline
        </Link>{" "}
        uses <code>bpy.context.temp_override()</code> to call
        Edit-mode UI operators (<code>bpy.ops.mesh.remove_doubles</code>,{" "}
        <code>bpy.ops.mesh.normals_make_consistent</code>,{" "}
        <code>bpy.ops.mesh.fill_holes</code>). The bmesh approach here is
        faster (no mode-switch overhead), fully composable (results stay in
        memory between steps), and dependency-free (no active object, no
        screen context). Use the <code>bpy.ops</code> route when writing an
        interactive operator whose undo step must appear in the Blender undo
        stack.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>find_doubles returns an empty targetmap despite visible seam.</strong>{" "}
          The default <code>dist=1e-4</code> (0.1 mm) is calibrated for
          prop-scale objects at Blender&apos;s default unit (1 unit = 1 m).
          Imported meshes at millimetre scale (1 unit = 1 mm, common in
          engineering CAD) need <code>dist=0.1</code> (10 % of 1 mm unit).
          Check <code>bpy.context.scene.unit_settings.scale_length</code>.
        </li>
        <li>
          <strong>recalc_face_normals leaves some faces still inward.</strong>{" "}
          The flood-fill stalls at non-manifold edges (three or more faces
          sharing one edge). Clean those first with{" "}
          <code>bmesh.ops.delete</code> targeting interior duplicate faces,
          or set <code>use_face_split=True</code> in a preceding
          <code>dissolve_edges</code> call to split the T-junction.
        </li>
        <li>
          <strong>holes_fill creates a very high pole count in the centre.</strong>{" "}
          A 12-vertex circle with <code>sides=3</code> produces a 12-triangle
          fan with a 12-valence pole at the centre. For smoother shading, run{" "}
          <code>bmesh.ops.poke(bm, faces=[cap_face])</code> to split the
          resulting n-gon uniformly if <code>sides=0</code> was used, or
          increase <code>sides</code> to 4 so the operator attempts a quad-grid
          fill instead of a fan. The{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-poke-face-faceted-crystal-boss-webxr"
            className={lk}
          >
            poke tutorial
          </Link>{" "}
          covers high-pole mitigation strategies.
        </li>
        <li>
          <strong>
            <code>ensure_lookup_table()</code> raises AttributeError after
            holes_fill.
          </strong>{" "}
          This happens when Blender&apos;s internal validation invalidates the
          bmesh entirely after a large structural change. Free with{" "}
          <code>bm.free()</code>, fetch the mesh back from the object with{" "}
          <code>bm = bmesh.from_edit_mesh(ob.data)</code> (or{" "}
          <code>bm.from_mesh(ob.data)</code>), and continue from the
          refreshed handle.
        </li>
        <li>
          <strong>
            GLB export still reports non-manifold geometry after the full
            pipeline.
          </strong>{" "}
          The three operators cover the three most common defects; they do not
          cover T-junctions (one edge shared by three faces) or internal
          duplicate faces. Run{" "}
          <code>
            [e for e in bm.edges if len(e.link_faces) != 2 and not
            e.is_boundary]
          </code>{" "}
          to enumerate remaining non-manifold edges. If the list is non-empty,
          follow with a targeted{" "}
          <code>bmesh.ops.dissolve_edges</code> or face-delete pass.
        </li>
      </ul>

      <h2>Further reading</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            bmesh.ops — Blender 5.1 Python API
          </a>{" "}
          (CC-BY-SA 4.0 · Blender Documentation Team). Canonical parameter
          reference for <code>find_doubles</code>, <code>weld_verts</code>,{" "}
          <code>recalc_face_normals</code>, <code>holes_fill</code>, and{" "}
          <code>flip_normals</code>. Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            blender/blender source
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF 2.0 Specification — §Meshes
          </a>{" "}
          (Apache-2.0 · Khronos Group). The spec&apos;s non-manifold geometry
          note explains exactly which topology conditions are flagged as
          validation warnings and why some runtimes refuse to render the
          affected primitive. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noreferrer"
            className={lk}
          >
            glTF-Blender-IO
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-find-doubles-recalc-normals-holes-fill-mesh-integrity-glb-webxr",
  title:
    "Python bmesh.ops.find_doubles + weld_verts + recalc_face_normals + holes_fill — Merge-by-Distance, Winding Repair & Hole Fill: Faceted Gem Pendant Integrity Pipeline (Blender 5.1)",
  description:
    "Three bmesh operators — find_doubles → weld_verts, recalc_face_normals, and holes_fill — form a pure-Python import repair pipeline that fixes the three defects most likely to corrupt a WebXR GLB: seam duplicate vertices, inverted winding order, and open boundary holes. Covers why find_doubles returns a targetmap rather than mutating the mesh, why ensure_lookup_table is mandatory after weld_verts, why welding must precede normal recalculation for the flood-fill to cross the seam, and how holes_fill's sides parameter controls whether the cap uses a triangle fan or a quad patch.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "find-doubles",
    "weld-verts",
    "merge-by-distance",
    "recalc-face-normals",
    "holes-fill",
    "mesh-repair",
    "import-pipeline",
    "webxr",
    "glb",
    "non-manifold",
    "winding-order",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-find-doubles-recalc-normals-holes-fill-mesh-integrity-glb-webxr",
  Body,
  keyInsights: [
    "find_doubles returns {'targetmap': {src: tgt}} and does NOT merge — it is a spatial query; you must pass its output to weld_verts to perform the collapse",
    "call bm.verts.ensure_lookup_table(), bm.edges.ensure_lookup_table(), bm.faces.ensure_lookup_table() immediately after weld_verts — the merge remaps all element indices and any handle obtained before the weld may reference the wrong element or a deleted one",
    "recalc_face_normals uses a volume-centroid flood-fill: it crosses from face to face via shared edges — if the seam vertices are still duplicated the faces either side of the seam share no edges, the flood-fill stalls at the seam, and the pavilion normals remain inverted; always weld first",
    "holes_fill edges= must be boundary edges only (e.is_boundary == True means exactly one adjacent face); interior edges are silently ignored, not an error, so the guard 'if boundary_edges:' is the only check needed",
    "sides=0 in holes_fill creates a single n-gon cap regardless of vertex count — clean for flat caps but the GLB exporter triangulates it with arbitrary diagonals; sides=4 attempts quad patches (for FACETS=12 produces a 3-patch star), sides=3 always succeeds with a triangle fan from the hole centroid",
    "recalc_face_normals fails on flat planes (zero volume): the centroid lies on the plane, so 'inward' is undefined and the result is arbitrary; use flip_normals(bm, faces=target) for zero-thickness panels instead",
    "keep_verts in find_doubles exempts a list of vertices from being a source (map key) — those vertices are never collapsed into another vertex; use it to protect anchor points such as boundary-ring verts that must not move",
    "after holes_fill, newly created cap vertices are not in any prior lookup table; always call ensure_lookup_table and normal_update before subsequent index-based operations or before calling bm.to_mesh()",
  ],
});
