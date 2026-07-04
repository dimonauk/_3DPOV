import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s <code>bmesh.ops</code> module is the pre-packaged mesh
        operation library — a layer above the raw topology API
        (<code>bm.verts.new</code>, <code>bm.faces.new</code>) and a layer below
        the UI-bound <code>bpy.ops.mesh.*</code> operators.  Each function
        accepts and returns explicit geometry sets, runs at native C speed, and
        requires no active object, no Edit Mode, and no selection state.  This
        tutorial builds a 2&thinsp;m &times; 1.2&thinsp;m sci-fi wall panel
        to demonstrate four of its most practical functions:
        <code>extrude_face_region</code>, <code>inset_individual</code>,
        <code>bevel</code>, and <code>bridge_loops</code>.
      </p>

      <h2>bmesh.ops vs the other two layers</h2>
      <p>
        Three distinct levels exist for mesh mutation in Python.  Understanding
        which to reach for saves hours of debugging context errors.
      </p>
      <p>
        <strong>bpy.ops.mesh.*</strong> — UI operators.  Require an active Object
        in Edit Mode; return <code>{'{"FINISHED"}'}</code> with no reference to
        new geometry; add undo-stack entries; fail entirely in background
        (<code>-b</code>) renders.  Use when you specifically want the exact
        behaviour of a menu item and are running in interactive mode.
      </p>
      <p>
        <strong>bmesh topology API</strong> — raw element construction.
        <code>bm.verts.new(co)</code>, <code>bm.faces.new([v…])</code>.
        You build topology element by element — the approach covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr"
          className={lk}
        >
          bmesh gem construction tutorial
        </Link>
        .  Use when you need precise control over every vertex and face winding.
      </p>
      <p>
        <strong>bmesh.ops</strong> — this tutorial.  Pre-packaged operations
        that take geometry sets and return new geometry sets immediately.  No
        mode switches.  The return values are live Python references — you chain
        further ops on them before ever touching <code>bpy.data</code>.
      </p>

      <h2>The extrude + translate pattern</h2>
      <p>
        <code>bmesh.ops.extrude_face_region(bm, geom=faces)</code> duplicates
        the selected faces and their boundary geometry.  The originals stay at
        their original position; the copies land on top of them (zero thickness
        initially).  <code>ret[&apos;geom&apos;]</code> contains every new
        element — you filter for <code>bmesh.types.BMVert</code> and pass those
        to <code>bmesh.ops.translate</code> to push the cap to its final depth:
      </p>
      <pre>{`ret = bmesh.ops.extrude_face_region(bm, geom=[front_face])
new_verts = [e for e in ret['geom'] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=new_verts, vec=Vector((0, -PANEL_D, 0)))`}</pre>
      <p>
        This two-step idiom appears throughout bmesh.ops scripting.{" "}
        <code>bpy.ops.mesh.extrude_region_move</code> combines both steps but
        returns nothing — you lose the geometry references and cannot chain.  The
        bmesh.ops version is also roughly 10&times; faster for large meshes because
        there is no selection-state update, no undo push, and no viewport refresh
        inside the loop.
      </p>
      <p>
        The companion{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph batch export tutorial
        </Link>{" "}
        uses <code>bmesh.from_object(ob, depsgraph)</code> to read post-modifier
        geometry into a bmesh for processing — the same bmesh context, now seeded
        from the evaluated mesh rather than built from scratch.
      </p>

      <h2>inset_individual — recessed panel windows</h2>
      <p>
        <code>bmesh.ops.inset_individual(bm, faces, thickness, depth)</code>{" "}
        replaces each selected face with a raised border ring plus a central face.
        The <code>depth</code> parameter moves the inner face along the face
        normal direction — negative depth recesses it into the mesh:
      </p>
      <pre>{`bmesh.ops.inset_individual(
    bm,
    faces=[front_face],
    thickness=INSET_BORDER,   # width of the outer frame
    depth=-INSET_DEPTH,       # ← negative = into the panel
    use_even_offset=True,
)`}</pre>
      <p>
        For a face with normal&nbsp;=&nbsp;+Y, <code>depth=-0.045</code> pushes
        the inner face to Y&nbsp;=&nbsp;&minus;0.045&thinsp;m.  The four border
        strips stay at Y&nbsp;=&nbsp;0 and remain connected to the adjacent side
        faces from the extrude step above.
      </p>
      <p>
        Use <code>inset_individual</code> when each face needs its own border.
        Use <code>bmesh.ops.inset_region</code> instead when you want a single
        border around a contiguous face selection.
      </p>

      <h2>bevel — highlight loops on hard edges</h2>
      <p>
        <code>bmesh.ops.bevel</code> chamfers selected edges.  The{" "}
        <code>segments</code> parameter controls how many faces the chamfer
        receives per original edge:
      </p>
      <pre>{`bmesh.ops.bevel(
    bm,
    geom=silhouette_edges,
    offset=BEVEL_OFFSET,   # chamfer half-width
    segments=2,            # one intermediate loop = highlight strip
    affect='EDGES',
    profile=0.5,           # circular arc (0 = flat, 1 = convex)
    loop_slide=True,       # slides verts along adjacent edges
)`}</pre>
      <p>
        <code>segments=2</code> inserts one midpoint edge loop between the two
        chamfer boundary loops.  In real-time rendering (EEVEE, Three.js PBR)
        that midpoint loop catches a narrow specular highlight — the classic
        hard-surface look that answers &ldquo;how do I get sharp speculars
        without SubD?&rdquo;  <code>segments=1</code> gives a flat cut
        (one face, no highlight); <code>segments≥3</code> adds geometry without
        a visible payoff at typical asset scales.
      </p>
      <p>
        The selection criterion in the blueprint targets edges where one
        adjacent face points in +Y (front/back) and one points in a non-Y
        direction (side/top/bottom) — the four corner edges of the panel slab.
        Interior edges from the inset step are skipped automatically.
      </p>

      <h2>bridge_loops — conduit tubes</h2>
      <p>
        Two <code>bmesh.ops.create_circle</code> calls build closed horizontal
        edge rings at different Z heights.  <code>bmesh.ops.bridge_loops</code>{" "}
        then fills quads between them:
      </p>
      <pre>{`mat_top = Matrix.Translation(Vector((x_pos, y_pos, z_top)))
ret_top = bmesh.ops.create_circle(
    bm, cap_ends=False, segments=CONDUIT_SEGS,
    radius=CONDUIT_R, matrix=mat_top,
)
top_edges = [e for e in bm.edges
             if e.verts[0] in top_vset and e.verts[1] in top_vset]

bmesh.ops.bridge_loops(bm, edges=top_edges + bot_edges)`}</pre>
      <p>
        <code>create_circle</code> with <code>cap_ends=False</code> creates only
        the edge ring — no faces.  After <code>bridge_loops</code> fills the
        cylinder walls, the top and bottom edges are still open; <code>fill</code>{" "}
        + <code>triangulate</code> caps them and converts the n-gon caps to
        triangles for glTF compatibility.
      </p>
      <p>
        Both rings must be in the same BMesh and have identical segment counts.
        The vert-set gathering approach (<code>e.verts[0] in top_vset</code>) is
        O(E) and handles any mesh size without integer indexing fragility.
        The same pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr"
          className={lk}
        >
          BVHTree surface scatter tutorial
        </Link>{" "}
        where convex hull output verts are gathered the same way.
      </p>

      <h2>recalc_face_normals — after every topology change</h2>
      <p>
        Every extrude or inset step can introduce inside-out side-wall faces —
        the winding depends on whether the source face was built CW or CCW from
        the extrusion direction.  Rather than tracking winding manually,
        <code>bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))</code>
        flood-fills consistent outward orientation from the first reachable face.
        It is O(F) and safe to call after each phase.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>bevel does nothing</strong> — the silhouette edge list is empty.
          After <code>inset_individual</code>, some edge normals shift; the
          <code>normal.y &gt; 0.8</code> threshold may need tuning.  Print
          <code>[(e, [f.normal for f in e.link_faces]) for e in bm.edges]</code>{" "}
          to inspect before the bevel call.
        </li>
        <li>
          <strong>bridge_loops creates no faces</strong> — the two edge loops
          have different segment counts, or one is not a closed ring.  Assert
          <code>len(top_edges) == len(bot_edges) == CONDUIT_SEGS</code> before
          the bridge call.
        </li>
        <li>
          <strong>inset depth direction reversed</strong> — the front face
          normal is &minus;Y (facing away from the viewer).  Add{" "}
          <code>bmesh.ops.recalc_face_normals</code> after the slab extrude step
          to correct winding before inset.
        </li>
        <li>
          <strong>GLB loads inside-out</strong> — call{" "}
          <code>me.calc_normals_split()</code> after <code>bm.to_mesh(me)</code>{" "}
          to bake custom split normals; skip this and Three.js&apos;s
          double-sided default may hide the issue locally but break on Quest.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.ops Python API (Blender 5.1)
          </a>
          {" "}— CC-BY-SA-4.0.  Sibling:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh module reference
          </a>
          .
        </li>
        <li>
          Nathan Jankowski,{" "}
          <a
            href="https://github.com/njankowski/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-scripting
          </a>
          {" "}— MIT.  Sibling:{" "}
          <a
            href="https://github.com/njankowski/blenderpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blenderpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop",
  title:
    "Python bmesh.ops — Extrude, Bevel & Bridge: Hard-Surface Panel Prop (Blender 5.1)",
  libraryPath:
    "blends/scripting/python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop",
  blenderVersion: "5.1",
  date: "2026-07-04",
  tags: ["blender", "python", "bmesh", "hard-surface", "scripting", "webxr"],
  Body,
});
