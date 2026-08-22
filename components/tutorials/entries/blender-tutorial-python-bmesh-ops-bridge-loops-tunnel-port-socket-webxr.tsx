import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.bridge_loops</code> connects two spatially separated
        edge loops with a clean quad strip. It is the context-free kernel
        behind Blender&apos;s Bridge Edge Loops mesh tool (Ctrl+E in Edge
        Select mode). Unlike{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-spin-lathe-arch-faceted-webxr"
          className={lk}
        >
          bmesh.ops.spin
        </Link>{" "}
        — which revolves a single profile around one axis — and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
          className={lk}
        >
          bmesh.ops.grid_fill
        </Link>{" "}
        — which patches a single rectangular hole in one plane —
        bridge_loops works across ANY two compatible loops, even on
        disconnected mesh islands. That makes it the correct primitive for
        cylindrical bores through chassis panels, tapered port sockets,
        connector collars, and any saddle strip joining two boundary rails.
      </p>

      <h2>The single most important API invariant</h2>
      <p>
        Most BMesh beginners expect <code>bridge_loops</code> to accept two
        separate lists, one per loop. It does not. The <code>edges</code>{" "}
        argument is a <strong>flat list containing all edges from both loops
        combined</strong>. The operator traces the connected edge graph from
        that pool to discover each loop independently. Order within the list
        is irrelevant; only edge connectivity determines loop membership:
      </p>
      <pre>{`ring_a_verts, ring_a_edges = make_ring(bm, N=12, radius=0.12, z=0.00)
ring_b_verts, ring_b_edges = make_ring(bm, N=12, radius=0.12, z=-0.10)

# Correct — flat list of all 24 edges:
ret = bmesh.ops.bridge_loops(bm, edges=ring_a_edges + ring_b_edges,
                              use_cyclic=True)

# Wrong — this signature does not exist; bridge_loops takes one 'edges' kwarg:
# bmesh.ops.bridge_loops(bm, loop_a=ring_a_edges, loop_b=ring_b_edges)  ← TypeError`}</pre>
      <p>
        The return value is{" "}
        <code>{`{'faces': [BMFace, ...], 'edges': [BMEdge, ...]}`}</code>.{" "}
        <code>ret['faces']</code> contains the bridge quad faces — use this
        handle immediately after the call to assign material slots, set
        smoothing flags, or chain further bmesh operations before any index
        invalidation.
      </p>

      <h2>use_cyclic: closed rings versus open rails</h2>
      <p>
        This flag governs the fundamental topology of the result:
      </p>
      <pre>{`# CLOSED RINGS (use_cyclic=True)
# Each loop must be a cycle — no free endpoints, every vertex has exactly
# two loop-edge neighbours.  Produces a closed tube or ring bridge.
# Use for: bores, sockets, collars, tunnel transitions.
bmesh.ops.bridge_loops(bm, edges=ring_a + ring_b, use_cyclic=True)

# OPEN RAILS (use_cyclic=False)
# Each loop is a sequential rail with two free endpoints.
# The bridge fills between the two rails as a flat strip or saddle surface.
# Use for: panel transitions, curved ramps, saddle fillets.
bmesh.ops.bridge_loops(bm, edges=arc_a + arc_b, use_cyclic=False)`}</pre>
      <p>
        Passing a closed ring with <code>use_cyclic=False</code> produces
        degenerate geometry — the operator attempts to locate free endpoints
        that do not exist and typically emits a Python RuntimeError or a
        silent empty result. Always match the flag to the actual loop
        topology.
      </p>

      <h2>num_cuts: mid-span edge loops</h2>
      <p>
        By default the bridge produces a single row of quad faces per span
        between the two loops. <code>num_cuts=N</code> inserts N additional
        intermediate edge loops, dividing the bridge length into N+1 rows.
        The blueprint uses <code>num_cuts=2</code> on the cylindrical bore,
        producing three quad rows along the tube:
      </p>
      <pre>{`bmesh.ops.bridge_loops(bm, edges=ea + eb, use_cyclic=True, num_cuts=2)
# → 3 rows × 12 columns = 36 quad faces for a 12-vert ring bore
# Mid-span edge loops are essential for any tube that will later be deformed
# by an Armature or Lattice modifier — without them, a long span kinks at
# the attachment point rather than bending smoothly along its length.`}</pre>

      <h2>interpolation and smoothness: controlling the bridge profile</h2>
      <p>
        On a straight bore the profile shape is irrelevant (both rings are
        identical). On a tapered socket — where the front ring is wider than
        the back — <code>interpolation</code> determines whether the wall
        cross-section follows a straight line or a curve:
      </p>
      <pre>{`# LINEAR (default) — straight frustum walls, hard chamfer
bmesh.ops.bridge_loops(bm, edges=et + eb, use_cyclic=True,
                        interpolation='LINEAR')

# SURFACE — smoothed B-spline profile; produces a slight outward shoulder bulge
# at the midpoint, which reads as a machined transition rather than a raw cone
bmesh.ops.bridge_loops(bm, edges=et + eb, use_cyclic=True,
                        interpolation='SURFACE', smoothness=0.45)

# PATH   — follows the shortest geodesic path; useful for twisted or
#           non-coplanar loops where LINEAR produces shearing artefacts
bmesh.ops.bridge_loops(bm, edges=et + eb, use_cyclic=True,
                        interpolation='PATH', smoothness=0.6)`}</pre>
      <p>
        <code>smoothness</code> is bounded [0.0–1.0]. Values above 0.6 on a
        short taper can push the shoulder beyond the outer ring radius —
        inspect in wireframe view before committing to the mesh. The
        blueprint sets 0.45, which gives a readable shoulder without
        exceeding the front ring diameter.
      </p>

      <h2>twist_offset: the silent topology wrecker</h2>
      <p>
        <code>twist_offset</code> (int) shifts which vertex on loop B aligns
        with vertex 0 on loop A before the quad strip is constructed. At
        zero the operator uses its internal nearest-vertex heuristic to align
        the two loops — this works correctly for coaxial symmetric rings but
        fails silently for asymmetric profiles or hexagonal loops rotated 30°
        relative to each other:
      </p>
      <pre>{`# Default: twist_offset=0 — operator chooses the alignment automatically.
# Usually correct for coaxial circles.
bmesh.ops.bridge_loops(bm, edges=ea + eb, use_cyclic=True, twist_offset=0)

# Non-zero: manually offset the matching.
# On a 12-vert ring, twist_offset=1 rotates loop-B matching by 1 vertex (30°).
# Twist_offset=3 → 90° rotation; twist_offset=6 → 180° flip.
# Use when one ring is rotated relative to the other and the auto-align
# produces diagonal stripes in the quad strip.
bmesh.ops.bridge_loops(bm, edges=ea + eb, use_cyclic=True, twist_offset=3)`}</pre>
      <p>
        A non-zero twist on a symmetric ring produces a spiral quad strip
        (the topology wraps helically around the tube). This is occasionally
        intentional — spiral topology distributes edge flow evenly on twisted
        architectural columns — but is almost always a bug on functional
        connector geometry. Always verify <code>twist_offset=0</code> on
        coaxial rings before experimenting with rotation.
      </p>

      <h2>use_merge and merge_factor: collapsing a bridge to a crease</h2>
      <p>
        Setting <code>use_merge=True</code> collapses the bridge to a crease
        at the <code>merge_factor</code> position between the two loops.
        Rather than filling the gap with quads, the operator merges all
        bridge-span vertices to a single intermediate ring:
      </p>
      <pre>{`# merge_factor=0.0 → merge all verts to loop A's plane (loop B disappears)
# merge_factor=0.5 → merge at the midpoint (the classic "collapse to crease")
# merge_factor=1.0 → merge all verts to loop B's plane (loop A disappears)
bmesh.ops.bridge_loops(bm, edges=ea + eb, use_cyclic=True,
                        use_merge=True, merge_factor=0.5)
# Result: loop A and loop B are gone; a single N-vert ring at the midpoint
# remains, with the surrounding faces pinched to it.  This creates a hard
# crease edge at the merge ring — useful for a taper that terminates in a
# knife-edge silhouette rather than a flat cap.`}</pre>
      <p>
        The blueprint does not use merge mode — both port objects retain
        separate caps. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr"
          className={lk}
        >
          SolidifyModifier tutorial
        </Link>{" "}
        for the complementary technique of collapsing rim geometry on shell
        objects in non-destructive modifier stacks.
      </p>

      <h2>Capping rings after bridge_loops</h2>
      <p>
        A bridged tube has two open ring boundaries — the two input loops.
        The blueprint closes them with a <em>poke cap</em>: a centre vertex
        connected to all ring vertices by spoke edges, forming N triangles.
        This is equivalent to{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          bmesh.ops.poke
        </Link>{" "}
        applied to a single-face fill. The key detail is that the ring edges
        are reused — <code>bm.faces.new((v_i, v_j, centre))</code> finds the
        existing edge <code>(v_i, v_j)</code> from the ring automatically;
        no duplicate edges are created:
      </p>
      <pre>{`def poke_cap(bm, verts, mat_idx=0):
    n      = len(verts)
    centre = bm.verts.new(Vector((
        sum(v.co.x for v in verts) / n,
        sum(v.co.y for v in verts) / n,
        verts[0].co.z,
    )))
    for i in range(n):
        f = bm.faces.new((verts[i], verts[(i + 1) % n], centre))
        f.smooth         = False
        f.material_index = mat_idx
    return centre`}</pre>
      <p>
        Always call{" "}
        <code>bmesh.ops.recalc_face_normals(bm, faces=bm.faces)</code> after
        capping. The poke triangles have a defined winding order that may
        differ from the bridge faces; recalculation using the connected solid
        topology corrects all of them in one pass.
      </p>

      <h2>
        Connecting bridge_loops to{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset_faces
        </Link>
      </h2>
      <p>
        A common hard-surface sequence combines both operators: inset a face
        to create a square or hexagonal port opening, delete the inner face
        to create the hole, then bridge that opening&apos;s edge loop to a
        second ring further inside the body to form the bore wall. This
        produces a fully-modelled connector socket with a surrounding bezel
        inset — no Boolean modifier required:
      </p>
      <pre>{`# 1. Inset to create the port opening border
res = bmesh.ops.inset_faces(bm, faces=[front_face], thickness=0.020, depth=0.0)
inner_face = res['faces'][0]

# 2. Delete the inner face to open the hole
bmesh.ops.delete(bm, geom=[inner_face], context='FACES_ONLY')

# 3. Collect the hole boundary edges
hole_edges = [e for e in bm.edges if e.is_boundary]

# 4. Create a smaller ring inside the body
back_verts, back_edges = make_ring(bm, N=12, radius=0.09, origin=back_origin)

# 5. Bridge from hole boundary to back ring → bore wall
bmesh.ops.bridge_loops(bm, edges=hole_edges + back_edges, use_cyclic=True)`}</pre>

      <h2>WebXR export considerations</h2>
      <p>
        Set <code>f.smooth = False</code> on all bridge faces before calling
        <code>bm.to_mesh()</code>. Without this, Blender&apos;s depsgraph
        applies its own smooth-by-angle heuristic at export time, which
        smooths across the bore-wall quads and erases the crisp faceted look.
        <code>export_apply=True</code> in the GLB exporter bakes the
        flat-shade normals into the GLB <code>NORMAL</code> accessor — this
        is the same export pattern used by{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
          className={lk}
        >
          bmesh.ops.grid_fill
        </Link>{" "}
        and every other bmesh tutorial in this library.
      </p>
      <p>
        Draco level 6 compresses the bridge geometry efficiently. The quad
        strip faces are highly regular (constant edge valence, predictable
        position deltas), so Draco&apos;s parallelogram predictor achieves
        near-zero overhead per face on long straight tubes.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>RuntimeError or empty result['faces']</strong> —
          mismatched loop topology. The two loops have different vertex
          counts (N on loop A, M on loop B where N ≠ M). bridge_loops
          requires equal counts for a clean quad bridge. Either rebuild both
          rings with the same N, or accept triangulated fill from the
          operator (which it produces silently for mismatched counts on some
          Blender builds — inspect the result before accepting it).
        </li>
        <li>
          <strong>Twisted spiral topology</strong> —{" "}
          <code>twist_offset ≠ 0</code> on a symmetric coaxial ring. Reset
          to 0. If the spiral persists, the internal auto-align matched
          vertex 0 on loop A to a rotated vertex on loop B — set
          twist_offset to the rotation step that corrects the diagonal
          stripes (for a 12-vert ring, try 1, 3, 6 in succession).
        </li>
        <li>
          <strong>Bridge faces all point inward</strong> — the ring winding
          orders are opposite (one CCW, one CW). Call{" "}
          <code>bmesh.ops.recalc_face_normals(bm, faces=bm.faces)</code>{" "}
          after capping; this uses the closed topology to orient all normals
          outward correctly.
        </li>
        <li>
          <strong>Flat-shade facets lost in GLB</strong> —{" "}
          <code>export_apply=False</code>. Set it to True so baked normals
          reach the glTF NORMAL accessor.
        </li>
        <li>
          <strong>use_cyclic mismatch crash</strong> — passing a closed ring
          with <code>use_cyclic=False</code>. The operator looks for free
          endpoints that do not exist. Verify the ring has no boundary edges
          before passing it, or always use <code>use_cyclic=True</code> for
          rings built with <code>bm.edges.new((v_i, v_j))</code> in a closed
          loop.
        </li>
        <li>
          <strong>Centre vertex protrudes from cap surface</strong> — the
          ring is not exactly planar (floating-point Z drift between ring
          vertices). Snap all ring vertices to the same Z before calling
          <code>poke_cap</code>:{" "}
          <code>v.co.z = target_z</code> for each vertex in the ring.
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
          <code>bridge_loops</code> signature including all keyword
          arguments, their types, default values, and return structure.
          Related upstream:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>{" "}
          — the C implementation in <code>bmesh_opdefines.c</code> that
          defines the operator slot types and the bridge algorithm in
          <code>bmesh_operator_api.h</code>.
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
          <code>export_apply</code> flag that bakes flat-shade normals is
          implemented in{" "}
          <code>io_scene_gltf2/blender/exp/gltf2_blender_gather_mesh.py</code>
          . Related: the Khronos{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification repo
          </a>{" "}
          (Apache-2.0), which defines the NORMAL accessor format and Draco
          extension specification the exporter targets.
        </li>
      </ul>

      <h2>Further study in this library</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
            className={lk}
          >
            bmesh.ops.inset_faces — panel-line grooves, button recesses & vent grilles
          </Link>{" "}
          — the most natural companion to bridge_loops: inset a panel face to
          create a bordered opening, delete the inner face, then bridge its
          edge loop to a bore ring inside the body. Together they produce a
          fully-modelled port socket without any Boolean modifier.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-spin-lathe-arch-faceted-webxr"
            className={lk}
          >
            bmesh.ops.spin — surface of revolution & partial arc
          </Link>{" "}
          — the rotational complement; spin revolves one profile around one
          axis whereas bridge_loops connects two independent loops across
          space. For rotationally symmetric connector housings, spin is
          faster; for asymmetric tunnels or non-coaxial loops, bridge_loops
          is the only option.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
            className={lk}
          >
            bmesh.ops.limited_dissolve + poke — dense-to-faceted topology reduction
          </Link>{" "}
          — the poke-cap helper in this tutorial is a direct application of
          the poke primitive covered there: a centroid-fan star-split of an
          N-gon into N triangles. Limited_dissolve post-processing can reduce
          the cap triangles to a single n-gon face when a flat disc (rather
          than a triangle fan) is needed for the GLB.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
            className={lk}
          >
            bmesh.ops.grid_fill — structured quad fill for a display panel
          </Link>{" "}
          — grid_fill patches a rectangular hole in a single plane (N×M
          all-quad result); bridge_loops patches the gap between two
          loops at different depths or in different planes (single-row or
          multi-row quad strip). They are complementary: grid_fill fills
          the screen face; bridge_loops forms the recessed bezel bore
          connecting the screen plane to the back plate.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr",
  title:
    "Python bmesh.ops.bridge_loops — Cylindrical Bore, Tapered Port Socket & Saddle Bridge for WebXR (Blender 5.1)",
  description:
    "Build a straight cylindrical bore (num_cuts=2, use_cyclic=True) and a tapered connector socket (interpolation='SURFACE', smoothness=0.45) using bmesh.ops.bridge_loops — the context-free kernel behind Bridge Edge Loops. Expert coverage of the flat-list edges invariant, use_cyclic vs open-rail topology, twist_offset alignment, use_merge collapse mode, poke-cap winding, and the recalc_face_normals requirement after mixed-winding construction.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "bridge-loops",
    "hard-surface",
    "port-socket",
    "tunnel",
    "bore",
    "webxr",
    "glb",
    "faceted",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr",
  Body,
  keyInsights: [
    "edges= takes a FLAT list of all edges from BOTH loops combined — the operator traces connectivity to discover loop membership; order within the list is irrelevant",
    "use_cyclic=True requires closed rings (no free endpoints); use_cyclic=False requires open rails with two free endpoints — passing closed rings with False causes a RuntimeError or silent empty result",
    "twist_offset (int) rotates the loop-B vertex matching before quad construction; non-zero twist on a symmetric coaxial ring produces helical spiral topology — verify at 0 first",
    "interpolation='SURFACE' with smoothness=0.45 produces a slight outward shoulder bulge on a tapered frustum, reading as a machined chamfer rather than a raw cone",
    "poke_cap reuses existing ring edges automatically (bm.faces.new finds the pre-existing edge); always follow with recalc_face_normals to correct mixed winding between bridge and cap faces",
    "use_merge=True with merge_factor=0.5 collapses the bridge to a midpoint crease ring rather than filling with quads — useful for knife-edge taper silhouettes but destroys both input loops",
  ],
});
