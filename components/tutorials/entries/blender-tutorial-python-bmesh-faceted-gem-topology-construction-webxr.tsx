import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&rsquo;s <code>bmesh</code> module is the direct, context-free
        path into mesh topology: create a <code>BMesh</code>, build vertices
        and faces in pure Python, then push the result into a{" "}
        <code>bpy.data.Mesh</code> with a single <code>bm.to_mesh()</code>{" "}
        call.  No Edit Mode, no operator context, no modal overhead.  This
        tutorial constructs an octagonal brilliant-cut gem from scratch —
        three vertex rings, seventeen faces, per-loop UVs, and hard-sharp
        edges — then exports a WebXR GLB.
      </p>

      <h2>bmesh vs bpy.ops — when to use each</h2>
      <p>
        <code>bpy.ops.mesh.*</code> operators require an active object in Edit
        Mode — they fail in background renders and headless batch scripts, and
        add mode-switching and undo-stack overhead even for geometry you never
        intend to keep.  <code>bmesh.new()</code> is context-free: mutations
        happen at the C level and the result is handed off to{" "}
        <code>bpy.data</code> in one call.  When you need the evaluated
        (post-modifier) mesh, build a bmesh from the depsgraph copy via{" "}
        <code>bmesh.from_object(ob, depsgraph)</code> — as in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          Depsgraph evaluated-geometry batch export tutorial
        </Link>
        , or the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr"
          className={lk}
        >
          BVHTree ray-cast surface scatter tutorial
        </Link>{" "}
        which calls <code>bmesh.ops.convex_hull</code> on the hit-point cloud.
      </p>

      <h2>The BMesh lifecycle</h2>
      <p>
        Four steps: <code>bmesh.new()</code> allocates a C-side container;
        mutations accumulate; <code>bm.to_mesh(me)</code> writes the result
        to a <code>bpy.data.Mesh</code>; <code>bm.free()</code> releases the C
        allocation.  Skipping <code>bm.free()</code> leaks memory — the
        lifetime is managed by Blender&rsquo;s C side, not Python&rsquo;s GC.
        Wrap in <code>try / finally</code> if an exception is plausible.
      </p>

      <h2>Vertex rings and ensure_lookup_table</h2>
      <p>
        <code>bm.verts.new(co)</code> appends a <code>BMVert</code> and returns
        it.  The internal lookup table — a C array mapping integer index to
        pointer — is marked stale after any structural change.  Calling{" "}
        <code>bm.verts[3]</code> before{" "}
        <code>bm.verts.ensure_lookup_table()</code> raises{" "}
        <code>IndexError</code> even when the vert exists.  Build all rings
        first, collect Python references, then call{" "}
        <code>ensure_lookup_table()</code> once — O(n) rebuild is cheaper per
        vert than per call.  Same rule applies to <code>bm.edges</code> and{" "}
        <code>bm.faces</code>.
      </p>

      <h2>Face winding and recalc_face_normals</h2>
      <p>
        <code>bm.faces.new([v0, v1, v2, v3])</code> winds the face in the
        order given — correct outward normals require counterclockwise winding
        when viewed from outside.  Manually tracking this for every face across
        several vertex rings is tedious and fragile.  Instead, the blueprint
        builds faces with approximate winding and then calls{" "}
        <code>bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))</code>{" "}
        once.  This operator flood-fills consistent orientation outward from
        the first face it encounters, flipping any face whose normal points
        inward.  It handles non-manifold geometry gracefully and is the
        canonical Blender approach for procedurally generated meshes.
      </p>

      <h2>Per-loop UV data — bm.loops.layers.uv</h2>
      <p>
        UV coordinates live on <em>loops</em> (half-edges), not vertices —
        one vertex can have different UVs in adjacent faces, enabling seams.
        Add a layer: <code>uv_layer = bm.loops.layers.uv.new(&quot;UVMap&quot;)</code>,
        then iterate{" "}
        <code>for face in bm.faces: for loop in face.loops:</code> and write{" "}
        <code>loop[uv_layer].uv = (u, v)</code>.  The blueprint uses
        cylindrical projection: U = <code>atan2(y, x) / 2π</code>, V =
        normalised height.  For per-face planar projection and atlas packing
        using the same layer API, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-uv-map-read-write-atlas-pack"
          className={lk}
        >
          bmesh UV map read/write atlas pack tutorial
        </Link>
        .
      </p>

      <h2>Sharp edges in Blender 5.1</h2>
      <p>
        Since Blender 4.1 the smooth/sharp state of edges is stored as the
        built-in boolean mesh attribute <code>&quot;sharp_edge&quot;</code> on
        the edge domain.  The Python accessor is{" "}
        <code>mesh.edges[i].use_edge_sharp = True</code> — this writes to the
        same underlying attribute, so both paths are equivalent.  The blueprint
        marks <em>all</em> edges sharp after <code>bm.to_mesh()</code> because
        every edge in a brilliant cut is a facet boundary: the table edge, each
        crown kite edge, the girdle ring, and every pavilion ridge.  A{" "}
        <em>Smooth by Angle</em> modifier with a 0° threshold achieves the
        same result non-destructively; direct attribute assignment is
        preferable in scripts because it has no modifier stack dependency.
        For the studio&rsquo;s crystal proximity workflow built on this same
        hard-facet aesthetic, see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-self-object-world-height-proximity-crystal-webxr"
          className={lk}
        >
          GN Self Object — world-height proximity crystal for WebXR
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh module — Blender 5.1 Python API
          </a>{" "}
          (CC-BY-SA-4.0, Blender Foundation) — BMesh type hierarchy, layer
          system, and all operators.  Related:{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.ops catalogue
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njankowski/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njankowski/blender-scripting
          </a>{" "}
          (MIT, Nick Jankowski) — community collection of bmesh construction
          examples including loop traversal, UV assignment, and custom
          attribute patterns.  Sibling repo:{" "}
          <a
            href="https://github.com/njankowski/blenderpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njankowski/blenderpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bmesh-faceted-gem-topology-construction-webxr",
  title:
    "Python bmesh — Faceted Gem: Direct Topology Construction via BMesh Context API (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Build an octagonal brilliant-cut gem from scratch using bmesh.new() — no bpy.ops, no Edit Mode. Lay table, girdle, and culet vertex rings; stitch crown and pavilion faces; flood-recalculate normals; assign cylindrical per-loop UVs; mark all edges sharp for hard-facet rendering; export WebXR GLB.",
  Body,
};

export const entry = buildInstructable(
  {
    time: "one afternoon",
    difficulty: "intermediate",
    cost: "free — Blender 5.1 and this script",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from this library entry",
        "record.py for the viewport render",
      ],
      tools: [
        "Blender Text Editor (Shift+F11)",
        "3D Viewport — Wireframe shading to inspect topology",
        "System Console (Window > Toggle System Console)",
      ],
    },
    steps: [
      {
        title: "Open a fresh file and run blueprint.py",
        description:
          "Open Blender 5.1, File > New > General. Save the .blend to a local " +
          "folder — the // export path resolves relative to it. Open the Text " +
          "Editor (Shift+F11), paste blueprint.py, press Alt+P. " +
          "System Console output: [bmesh gem] 17V  24E  17F → //faceted_gem.glb.",
      },
      {
        title: "Inspect the topology in Wireframe mode",
        description:
          "Press Z > Wireframe. Select the gem, press Tab to enter Edit Mode. " +
          "You will see 17 vertices, 24 edges, and 17 faces arranged as one " +
          "table N-gon, 8 crown trapezoids, and 8 pavilion triangles. " +
          "All edges appear highlighted orange — Overlay > Edge Angle confirms " +
          "every edge is marked sharp (angle threshold 0°).",
      },
      {
        title: "Verify ensure_lookup_table behaviour",
        description:
          "Comment out bm.verts.ensure_lookup_table() and add print(bm.verts[0]) " +
          "after vert creation. Re-run: Blender raises IndexError: BMVertSeq[index] " +
          "out of range. Restore the call. The C lookup table is invalidated by any " +
          "structural change and must be rebuilt before integer indexing.",
      },
      {
        title: "Test recalc_face_normals with inverted winding",
        description:
          "Change one crown face line to reverse its vertex order: " +
          "[table_verts[j], girdle_verts[j], girdle_verts[i], table_verts[i]]. " +
          "Run without the recalc call — that crown face appears inside-out in " +
          "Material Preview (face normal points inward). Add the recalc call back: " +
          "the flood-fill corrects it. This proves recalc_face_normals is more " +
          "robust than hand-winding.",
      },
      {
        title: "Inspect UV coordinates in the UV Editor",
        description:
          "Switch to Material Preview (Z). Open a UV Editor (Shift+F10). " +
          "In Edit Mode, select all (A). The cylindrical projection maps azimuth " +
          "to U, height to V: culet=0.0, table=1.0. Table and culet facets fan " +
          "out at the UV edges.",
      },
      {
        title: "Run record.py for the viewport animation",
        description:
          "Keep the gem scene open. Open record.py in the Text Editor and press " +
          "Alt+P. The script adds a fixed camera and three directional lights, " +
          "keyframes a full Z rotation over 72 frames (LINEAR), and calls " +
          "bpy.ops.render.render(animation=True). EEVEE writes viewport.mp4 — " +
          "play it to see each facet catching the three-point lights in sequence.",
      },
    ],
    finalResult:
      "Octagonal brilliant-cut gem (17 faces, all edges sharp) exported as " +
      "faceted_gem.glb with Draco L6 compression and cylindrical UVs. " +
      "A 72-frame viewport.mp4 shows catch-lights across the hard-faceted " +
      "surfaces under three-point EEVEE lighting.",
    variations: [
      "Round brilliant (58 facets): add a crown-bezel ring between table and girdle " +
      "and split each pavilion triangle into main + lower half facet — same bmesh " +
      "construction pattern, just more rings.",
      "Topology traversal: after bm.to_mesh(), iterate me.edges and use " +
      "edge.link_faces to distinguish girdle edges (shared crown+pavilion) from " +
      "table-only edges — tag them with a custom float layer for glTF extras.",
      "bmesh.ops.bevel on girdle edges: call bmesh.ops.bevel(bm, geom=girdle_edges, " +
      "offset=0.01, segments=2) before recalc_face_normals to add a thin " +
      "catch-light band at the gem equator.",
    ],
    troubleshooting: [
      {
        symptom: "IndexError: BMVertSeq[index]: index out of range",
        cause: "ensure_lookup_table() was not called after structural changes.",
        fix: "Call bm.verts.ensure_lookup_table() after all additions and before " +
          "integer indexing. Same applies to bm.edges and bm.faces.",
      },
      {
        symptom: "Gem appears inside-out (faces dark in Material Preview)",
        cause: "recalc_face_normals not called, or disconnected manifolds confused the flood-fill.",
        fix: "Call bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces)) after all faces. " +
          "Interactively: Edit Mode > Mesh > Normals > Recalculate Outside.",
      },
      {
        symptom: "bm.free() causes a crash on the next script run",
        cause: "A BMVert, BMEdge, or BMFace Python reference is used after bm.free() invalidates the C-side allocations.",
        fix: "Set bm = None after bm.free(). Never cache BMesh element handles across script runs.",
      },
    ],
  },
  base,
);
