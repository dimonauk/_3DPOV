import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.bisect_plane</code> cuts any BMesh with a mathematical
        plane defined by a point (<code>plane_co</code>) and a unit normal (
        <code>plane_no</code>). Crossing edges are subdivided at their exact
        intersection; optional <code>clear_outer</code> / <code>clear_inner</code>{" "}
        flags then remove the geometry on one or both sides. The return dict key{" "}
        <code>&apos;geom_cut&apos;</code> delivers only the new verts and edges
        at the cut boundary — the clean edge ring you need for downstream{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr"
          className={lk}
        >
          bmesh.ops.bridge_loops
        </Link>
        ,{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
          className={lk}
        >
          bmesh.ops.grid_fill
        </Link>
        , or a manual <code>bmesh.ops.fill</code>.
      </p>
      <p>
        Unlike the Boolean modifier, bisect_plane operates on the raw BMesh
        (no depsgraph evaluation), never produces N-gons at the cut boundary, and
        hands you the cut edge ring immediately — no topology cleanup required
        before further construction.
      </p>

      <h2>The geom= invariant</h2>
      <p>
        This is the most common source of silent failures: the{" "}
        <code>geom=</code> argument must include ALL THREE element types —
        vertices, edges, and faces. Passing only faces leaves boundary edges
        uncut; passing only edges misses the interior cuts on large polygons. The
        correct idiom is always:
      </p>
      <pre>{`res = bmesh.ops.bisect_plane(
    bm,
    geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
    dist=0.0001,
    plane_co=Vector((0, 0, 0)),
    plane_no=Vector((0, 0, 1)),
    clear_outer=True,
    clear_inner=False,
)`}</pre>
      <p>
        When you only want to cut a <em>selection</em> rather than the entire
        mesh, build a filtered list — for instance all faces in a loop island —
        but always include the verts and edges that bound those faces:
      </p>
      <pre>{`selected_faces = [f for f in bm.faces if f.select]
boundary_edges = {e for f in selected_faces for e in f.edges}
boundary_verts = {v for e in boundary_edges for v in e.verts}
res = bmesh.ops.bisect_plane(
    bm,
    geom=list(boundary_verts) + list(boundary_edges) + selected_faces,
    ...
)`}</pre>
      <p>
        This prevents stray cuts on adjacent mesh islands that happen to cross
        the plane.
      </p>

      <h2>Defining the plane: plane_co + plane_no</h2>
      <p>
        The bisect plane is the locus of points{" "}
        <code>P</code> satisfying{" "}
        <code>(P − plane_co) · plane_no = 0</code>. Any point on the plane
        works as <code>plane_co</code>; only the normal direction matters for
        face-side classification. A face is &quot;outer&quot; (positive side)
        when:
      </p>
      <pre>{`dot = (face.calc_center_median() - plane_co).dot(plane_no)
is_outer = dot > 0`}</pre>
      <p>
        Common planes and how to construct their normals:
      </p>
      <pre>{`from mathutils import Vector
import math

# Horizontal floor cut at Z=0 (removes top half)
plane_co = Vector((0, 0, 0))
plane_no = Vector((0, 0, 1))   # +Z points up; clear_outer removes top

# Vertical mirror plane X=0 (removes +X half)
plane_no = Vector((1, 0, 0))

# 45° diagonal tilted toward +Y in the YZ plane
angle = math.radians(45)
plane_no = Vector((0, math.sin(angle), math.cos(angle))).normalized()

# Arbitrary plane through two mesh edge midpoints (a + b):
a, b = some_edge.verts[0].co, some_edge.verts[1].co
plane_co = (a + b) / 2
plane_no = (b - a).normalized()   # bisect perpendicular to this edge`}</pre>
      <p>
        <code>plane_no</code> does <em>not</em> need to be normalised before
        passing — the operator normalises internally — but passing a unit vector
        avoids floating-point scale surprises on very small or very large meshes.
      </p>

      <h2>clear_outer and clear_inner</h2>
      <p>
        These two booleans control which sides survive the cut:
      </p>
      <pre>{`# Half-space removal — cross-section view, hard cutaway:
clear_outer=True,  clear_inner=False   # removes positive-normal side

# Inverted removal:
clear_outer=False, clear_inner=True    # removes negative-normal side

# Cut only — both halves survive (symmetry snap, section-ring extraction):
clear_outer=False, clear_inner=False   # inserts new verts/edges only

# Destroys all geometry (almost always a mistake):
clear_outer=True,  clear_inner=True`}</pre>
      <p>
        The blueprint uses <code>clear_outer=True, clear_inner=False</code> on
        both objects. For the halfshell the plane normal points +Z, so the top
        hemisphere is removed. For the cutaway casing the normal tilts 45°
        toward +Y, removing the upper-front wedge.
      </p>

      <h2>The geom_cut return value</h2>
      <p>
        The return dict has two keys:{" "}
        <code>&apos;geom&apos;</code> (all surviving geometry) and{" "}
        <code>&apos;geom_cut&apos;</code> (only the new verts and edges AT the
        cut line). Always filter by type before downstream use:
      </p>
      <pre>{`res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:]+bm.edges[:]+bm.faces[:],
                             plane_co=..., plane_no=...,
                             clear_outer=True, clear_inner=False)

cut_verts = [v for v in res['geom_cut'] if isinstance(v, bmesh.types.BMVert)]
cut_edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
# cut_edges is the exact edge ring at the cut boundary — use it for fill/bridge`}</pre>
      <p>
        <code>geom_cut</code> never contains faces — the operator only
        inserts verts at crossing points and edges connecting them. Any faces
        you need to build from the cut ring must be created explicitly (
        <code>bmesh.ops.fill</code>, <code>bridge_loops</code>, etc.).
      </p>

      <h2>Sealing the cut ring: bmesh.ops.fill vs grid_fill</h2>
      <p>
        For a circular or arbitrary closed ring,{" "}
        <code>bmesh.ops.fill(bm, edges=cut_edges, use_beauty=True)</code> is
        the correct choice. It triangulates the interior as a radial fan and
        returns the new faces in{" "}
        <code>fill_res[&apos;faces&apos;]</code>:
      </p>
      <pre>{`fill_res = bmesh.ops.fill(bm, edges=cut_edges, use_beauty=True)
for f in fill_res['faces']:
    f.smooth         = False
    f.material_index = 1   # cap face gets its own material slot`}</pre>
      <p>
        Reserve{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
          className={lk}
        >
          bmesh.ops.grid_fill
        </Link>{" "}
        for rectangular rings with exactly two equal-length opposing rails —
        its N×M all-quad result is unsuitable for the irregular winding of a
        bisect cut ring unless the mesh was a perfect grid to begin with.
      </p>
      <p>
        For a cut ring you intend to bridge rather than cap, pass{" "}
        <code>cut_edges</code> directly to{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr"
          className={lk}
        >
          bmesh.ops.bridge_loops
        </Link>{" "}
        alongside a second loop you construct from scratch — for instance a
        smaller ring set back inside the body to form a hollow bore:
      </p>
      <pre>{`inner_verts, inner_edges = make_ring(bm, N=len(cut_verts), radius=R*0.6, z=-0.4)
bmesh.ops.bridge_loops(bm, edges=cut_edges + inner_edges, use_cyclic=True)`}</pre>

      <h2>dist: snap tolerance and symmetry sealing</h2>
      <p>
        Any vertex within <code>dist</code> of the plane is snapped to it
        rather than being assigned to one side. This gives bisect_plane a
        secondary role as a <em>mirror-axis weld tool</em>: when verts have
        drifted within ±0.005 of the X=0 mirror plane due to sculpting or
        procedural noise, a single bisect call with{" "}
        <code>clear_outer=False, clear_inner=False, dist=0.005</code> snaps all
        of them to the plane — cleaner and faster than a manual loop-select +
        S, X, 0 flatten:
      </p>
      <pre>{`# Symmetry-snap: snap stray verts to X=0 without removing either side
res = bmesh.ops.bisect_plane(
    bm,
    geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
    dist=0.005,              # any vert within 5mm snapped to plane
    plane_co=Vector((0, 0, 0)),
    plane_no=Vector((1, 0, 0)),
    clear_outer=False,       # keep both sides — snap only
    clear_inner=False,
)
# Follow immediately with Mirror modifier or bmesh.ops.mirror to weld across the seam.`}</pre>
      <p>
        This pattern is the complement of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr"
          className={lk}
        >
          MirrorModifier bisect_axis option
        </Link>
        , which snaps at modifier evaluation time. The bmesh version lets you
        snap in a script and inspect the result before committing to any modifier.
      </p>

      <h2>HALFSHELL construction walk-through</h2>
      <p>
        The halfshell demonstrates the full pipeline: sphere → bisect → fill → material.
      </p>
      <pre>{`import bmesh
from mathutils import Vector

bm = bmesh.new()

# 1. UV sphere — 32 longitude × 16 latitude = 512 quad faces
bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=0.55)

# 2. Bisect at Z=0 — clear_outer removes the top 256 faces
res = bmesh.ops.bisect_plane(
    bm,
    geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
    dist=0.0001,
    plane_co=Vector((0, 0, 0)),
    plane_no=Vector((0, 0, 1)),
    clear_outer=True, clear_inner=False,
)

# 3. Extract the equatorial cut ring (32 edges — one per longitude segment)
cut_edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
# len(cut_edges) == 32  (one per longitude segment)

# 4. Fill the disc with a triangulated radial fan
fill_res = bmesh.ops.fill(bm, edges=cut_edges, use_beauty=True)

# 5. Flat-shade everything; cap faces get material slot 1
for f in bm.faces:
    f.smooth = False
for f in fill_res['faces']:
    f.material_index = 1

# 6. Recalculate normals — the fill fan may have flipped winding
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])`}</pre>

      <h2>CUTAWAY construction walk-through</h2>
      <p>
        The cutaway shows how subdividing before bisect produces a smooth
        diagonal section edge ring instead of a coarse 4-edge square:
      </p>
      <pre>{`import math, bmesh
from mathutils import Vector

bm = bmesh.new()

# 1. Cube (2 cuts of subdivision gives enough edges for a readable diagonal ring)
bmesh.ops.create_cube(bm, size=1.8)
bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=2,
                          use_grid_fill=True, use_single_divide=False)

# 2. 45° plane normal in the YZ plane
angle = math.radians(45)
n = Vector((0, math.sin(angle), math.cos(angle))).normalized()

res = bmesh.ops.bisect_plane(
    bm,
    geom=bm.verts[:] + bm.edges[:] + bm.faces[:],
    dist=0.0001,
    plane_co=Vector((0, 0, 0)),
    plane_no=n,
    clear_outer=True, clear_inner=False,
)

# 3. Assign cut-adjacent faces to material slot 1 (the exposed cross-section)
cut_edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
for e in cut_edges:
    for f in e.link_faces:
        f.material_index = 1

bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])`}</pre>
      <p>
        Without the <code>subdivide_edges</code> step, each cube face contributes
        only a single crossing edge per large quad — the cut ring has just four
        edges (one per cube side), reading as an ugly square notch rather than a
        crisp 45° diagonal across the full face. Two cuts give each face a 3×3
        sub-grid, so the diagonal ring has roughly 3× as many edges and curves
        cleanly across the face.
      </p>

      <h2>Inset + bisect: combining operators</h2>
      <p>
        A useful hard-surface sequence pairs{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          bmesh.ops.inset_faces
        </Link>{" "}
        with bisect_plane to produce an embossed panel with a diagonal
        reveal slot: inset first to create a panel border, then bisect across
        the inset region to shear off the upper corner, then fill the cut
        ring to seal the slot:
      </p>
      <pre>{`# 1. Inset the top face of the cube
res_inset = bmesh.ops.inset_faces(bm, faces=[top_face], thickness=0.08, depth=0.0)
inner_face = res_inset['faces'][0]

# 2. Bisect only the inset region (pass only its geometry)
inset_geom = [inner_face] + list(inner_face.edges) + list(inner_face.verts)
bmesh.ops.bisect_plane(
    bm, geom=inset_geom, dist=0.0001,
    plane_co=inner_face.calc_center_median(),
    plane_no=Vector((0, 1, 1)).normalized(),
    clear_outer=True, clear_inner=False,
)`}</pre>
      <p>
        The limited <code>geom=</code> scope protects the surrounding panel
        border from accidental cuts — this is the decisive advantage of
        bisect_plane over the Bisect operator (which defaults to the full
        mesh in interactive mode).
      </p>

      <h2>WebXR export</h2>
      <p>
        Set <code>f.smooth = False</code> on all faces before{" "}
        <code>bm.to_mesh()</code> and use{" "}
        <code>export_apply=True</code> in the GLB exporter. Without the apply
        flag, Blender&apos;s depsgraph re-evaluates smooth-by-angle at export
        time and may re-smooth the flat-shade facets. The same export pattern
        appears in every other bmesh tutorial in this library — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          limited_dissolve + poke tutorial
        </Link>{" "}
        for the canonical GLB export call.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>geom_cut is empty</strong> — the plane does not intersect any
          edges in the mesh. Check <code>plane_co</code> is actually inside the
          mesh bounding box and <code>plane_no</code> is not zero. A common
          cause: passing only <code>bm.faces[:]</code> without edges — faces
          alone yield no crossing edges.
        </li>
        <li>
          <strong>Some faces survive on the wrong side</strong> — partial{" "}
          <code>geom=</code> scope: faces connected to the cut region but not
          included in <code>geom=</code> are not evaluated. Expand the geom list
          or use <code>bm.verts[:] + bm.edges[:] + bm.faces[:]</code> for a
          global cut.
        </li>
        <li>
          <strong>fill raises RuntimeError</strong> — the cut edges do not form
          a single closed ring (isolated loops from multiple disconnected
          islands). Either bisect each island separately, or call{" "}
          <code>bmesh.ops.fill</code> once per connected edge-loop component.
        </li>
        <li>
          <strong>Normals flip on the cap faces</strong> — the fill fan winding
          opposes the surrounding shell. Always follow fill with{" "}
          <code>bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])</code> —
          the closed solid topology corrects all normals in one pass.
        </li>
        <li>
          <strong>dist snaps too aggressively</strong> — a large dist value
          snaps verts that are genuinely on one side (not stray) to the plane.
          Keep dist below the smallest intentional offset from the plane in your
          mesh; 0.0001 is safe for most production scales.
        </li>
        <li>
          <strong>Diagonal cut ring has only 4 edges on a cube</strong> — the
          cube faces were not subdivided before bisect. Call{" "}
          <code>bmesh.ops.subdivide_edges</code> with <code>cuts=2</code> first
          to give each face enough internal edges to produce a smooth ring.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender bmesh.ops API Reference — 5.1</strong> — Blender
          Foundation,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>{" "}
          (CC-BY-SA-4.0). Authoritative reference for the{" "}
          <code>bisect_plane</code> signature including all keyword arguments,
          their types, default values, and the structure of the return dict.
          Related upstream:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>{" "}
          — the C implementation in{" "}
          <code>bmesh_operator_api.h</code> and the bisect plane algorithm in
          <code>bmesh_intersect.cc</code>.
        </li>
        <li>
          <strong>KhronosGroup/glTF-Blender-IO</strong> — Khronos Group,{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0). The official Blender GLB exporter. The{" "}
          <code>export_apply</code> flag that bakes flat-shade normals into the
          glTF NORMAL accessor is implemented in{" "}
          <code>io_scene_gltf2/blender/exp/gltf2_blender_gather_mesh.py</code>.
          Related: the Khronos{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification repo
          </a>{" "}
          (Apache-2.0), which defines the NORMAL accessor and Draco extension
          format.
        </li>
      </ul>

      <h2>Further study in this library</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr"
            className={lk}
          >
            bmesh.ops.bridge_loops — cylindrical bore & tapered port socket
          </Link>{" "}
          — the natural downstream operator for a bisect cut ring: pass
          <code>geom_cut</code> edges directly to bridge_loops alongside a
          second inner ring to form a hollow bore or recessed slot without any
          Boolean modifier.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
            className={lk}
          >
            bmesh.ops.grid_fill — structured quad fill for display panels
          </Link>{" "}
          — grid_fill patches rectangular rings with N×M all-quad topology; use
          it instead of <code>bmesh.ops.fill</code> when the bisect produces a
          rectangular cut ring on a subdivided flat face.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
            className={lk}
          >
            bmesh.ops.inset_faces — panel-line grooves & vent grilles
          </Link>{" "}
          — combine inset_faces with bisect_plane to scope the cut to just the
          inset inner region, protecting the surrounding border from stray cuts.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr"
            className={lk}
          >
            MirrorModifier — bisect_axis, bisect_threshold & off-origin mirror
          </Link>{" "}
          — the modifier-level equivalent: <code>bisect_axis</code> clips the
          mesh at the mirror plane non-destructively, whereas bisect_plane
          commits the cut permanently to the BMesh. Use the modifier when you
          want a live preview; use bisect_plane when you need the cut ring for
          further BMesh construction.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
            className={lk}
          >
            bmesh.ops.limited_dissolve + poke — faceted topology reduction
          </Link>{" "}
          — poke is an alternative to <code>bmesh.ops.fill</code> for sealing a
          circular cut ring: it produces a star-fan of N triangles from a
          centroid vertex rather than a beauty-filled fan. The choice affects
          only the cap polygon count; for WebXR export both are equivalent.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr",
  title:
    "Python bmesh.ops.bisect_plane — Planar Cross-Section, Decorative Cutaway & Symmetry Seal for WebXR (Blender 5.1)",
  description:
    "Cut any BMesh with a mathematical plane using bmesh.ops.bisect_plane — covering the geom= all-three-types invariant, clear_outer/clear_inner half-space semantics, the geom_cut edge-ring return value, dist as a mirror-axis snap tolerance, and two production objects: a UV sphere halfshell sealed with bmesh.ops.fill (two-material cap), and a subdivided cube cutaway with a 45° diagonal reveal section.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "bisect-plane",
    "cross-section",
    "cutaway",
    "symmetry",
    "hard-surface",
    "halfshell",
    "webxr",
    "glb",
    "faceted",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr",
  Body,
  keyInsights: [
    "geom= must include ALL THREE types — bm.verts[:] + bm.edges[:] + bm.faces[:] — passing only faces leaves boundary edges uncut; passing only edges misses interior polygon cuts",
    "geom_cut returns ONLY the new verts and edges at the cut line — filter by isinstance(x, bmesh.types.BMEdge) to get the edge ring for downstream fill or bridge",
    "clear_outer removes faces where (centroid − plane_co)·plane_no > 0; clear_outer=False, clear_inner=False with a dist tolerance doubles as a mirror-axis snap without removing any geometry",
    "bmesh.ops.fill(bm, edges=cut_edges, use_beauty=True) is correct for circular cut rings; bmesh.ops.grid_fill requires rectangular N×M topology and will fail on a circular bisect ring",
    "subdivide_edges before bisect multiplies the cut-ring edge count — on a cube, 2 cuts gives ~3× more edges per face diagonal, producing a smooth reveal instead of a 4-edge square notch",
    "always follow mixed-winding construction with bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]) — the fill fan and the shell may have opposing winding orders after clear_outer removes half the topology",
  ],
});
