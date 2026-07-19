import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.extrude_face_region</code> is the context-free kernel
        behind Blender&apos;s Extrude Region operator (
        <kbd>E</kbd> › Extrude Faces in Face Select mode). Unlike{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          bmesh.ops.inset_faces
        </Link>{" "}
        — which shrinks a face inward within the same plane — and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bridge-loops-tunnel-port-socket-webxr"
          className={lk}
        >
          bmesh.ops.bridge_loops
        </Link>{" "}
        — which spans two pre-existing boundary loops — extrude_face_region
        selects an arbitrary group of faces, treats them as one connected
        surface, copies their cap geometry, and constructs bridging side faces
        along the selection boundary. The cap then gets translated to wherever
        you need it. The studio use-case here is a sci-fi control deck: a
        flat{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr"
          className={lk}
        >
          subdivided grid
        </Link>{" "}
        whose face groups are extruded to different heights to produce a display
        panel surround, button banks, and decorative strips — then exported as a
        Draco-L6 GLB for WebXR.
      </p>

      <h2>The single most important invariant</h2>
      <p>
        <code>extrude_face_region</code> does{" "}
        <strong>not move the new geometry</strong>. The cap it creates sits
        exactly on top of the original faces until you translate it. Forgetting
        this produces a mesh that looks correct in face count but is completely
        flat — no error, no warning, just zero extrusion:
      </p>
      <pre>{`ret = bmesh.ops.extrude_face_region(bm, geom=face_list)
# ← at this point the cap is at the SAME z as the original faces
# you must translate it yourself:
new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=new_verts, vec=Vector((0, 0, HEIGHT)))`}</pre>
      <p>
        This two-step design is intentional: a single operator cannot assume
        the extrusion direction (perpendicular to the average normal? along an
        axis? toward a target object?), so it separates geometry creation from
        displacement.
      </p>

      <h2>Signature</h2>
      <pre>{`ret = bmesh.ops.extrude_face_region(
    bm,
    geom                     = [],    # list[BMFace] — selected face set
    edges_exclude            = set(), # set[BMEdge]  — skip these boundary edges
    use_keep_orig            = False, # True → duplicate originals (stamp mode)
    use_normal_flip          = False, # True → flip cap face winding
    use_normal_from_adjacent = False, # True → side faces inherit adjacent normals
    use_dissolve_ortho_edges = False, # True → dissolve 90° seam edges
)
# returns {'geom': [BMVert | BMEdge | BMFace, ...]}`}</pre>
      <p>
        You may pass just faces in <code>geom</code> — the operator traces
        their edges automatically. Passing edges or verts alongside the faces is
        also valid and matches behaviour when you select a group in Edit Mode
        before pressing E.
      </p>

      <h2>Filtering the return value</h2>
      <p>
        <code>ret[&apos;geom&apos;]</code> is a flat list of mixed BMesh
        element types. The standard filter pattern:
      </p>
      <pre>{`new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
new_edges = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMEdge)]
new_faces = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMFace)]`}</pre>
      <p>
        In practice you only need <code>new_verts</code> to translate the cap.
        The <code>new_faces</code> handle is useful when you want to continue
        chaining operations — for instance, passing the new cap faces straight
        into{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr"
          className={lk}
        >
          bmesh.ops.grid_fill
        </Link>{" "}
        or another extrude call.
      </p>

      <h2>Computing the extrusion normal</h2>
      <p>
        For a flat grid of upward-facing quads the normal is trivially{" "}
        <code>Vector((0, 0, 1))</code>. For a curved surface — a panel on a
        helmet cheek, a button on a sphere — sum the face normals and
        normalise:
      </p>
      <pre>{`bm.normal_update()           # ensure face.normal is current before reading
avg_n = Vector((0, 0, 0))
for f in face_list:
    avg_n += f.normal
avg_n = avg_n.normalized()   # safe — all inputs are unit normals, sum > 0

bmesh.ops.translate(bm, verts=new_verts, vec=avg_n * HEIGHT)`}</pre>
      <p>
        Always call <code>bm.normal_update()</code> before reading
        <code>face.normal</code> after any bmesh topology change.
        Adding vertices or faces marks normals dirty; reading stale normals
        returns the previous-frame value silently.
      </p>

      <h2>extrude_face_region vs. extrude_discrete_faces</h2>
      <p>
        This is the most common decision point in hard-surface scripting:
      </p>
      <pre>{`# extrude_face_region — connected surface, one shared push direction
# Use for: display surrounds, raised slabs, panel features, cover plates.
#   selects 4 faces in a 2×2 block → one raised quad platform
bmesh.ops.extrude_face_region(bm, geom=[f00, f01, f10, f11])

# extrude_discrete_faces — each face in its OWN normal direction, independently
# Use for: button arrays (each button rises from its own centre),
#           spike arrays, rivets, individual studs.
#   same 4 faces → four separate square pillars
bmesh.ops.extrude_discrete_faces(bm, faces=[f00, f01, f10, f11])`}</pre>
      <p>
        Internally, <code>extrude_discrete_faces</code> calls the same BMesh
        kernel per-face, but does not share any boundary geometry between faces —
        each gets its own independent side walls. That is why an array of buttons
        produced by the discrete variant has clean seams between pillars while
        the region variant produces a single flush surface with walls only on
        the outer boundary.
      </p>

      <h2>use_keep_orig: stamping without consuming the base</h2>
      <pre>{`# Default (use_keep_orig=False):
# Original faces BECOME the base of the extruded feature.
# The cap is the new top. Original selection boundary is now an interior crease.
bmesh.ops.extrude_face_region(bm, geom=face_list, use_keep_orig=False)

# use_keep_orig=True:
# Original faces are duplicated and kept intact; the cap is the copy.
# Use when you want the original flat surface preserved underneath a boss feature.
bmesh.ops.extrude_face_region(bm, geom=face_list, use_keep_orig=True)`}</pre>
      <p>
        The default (<code>False</code>) is correct for the control deck — the
        original grid face at z=0 becomes the floor of the raised feature.
        Passing <code>True</code> is useful for a &ldquo;stamp&rdquo; operation
        where a logo or symbol is embossed atop an existing unbroken surface.
      </p>

      <h2>Grid construction pattern</h2>
      <p>
        The blueprint builds an NC × NR quad grid by hand so that face indices
        are addressable by (row, col). This avoids the ambiguity of sorting
        faces returned by <code>primitive_grid_add</code>, whose order is
        undefined across Blender builds:
      </p>
      <pre>{`# verts[r][c] → BMVert at row r, column c
verts = [
    [bm.verts.new((c/NC*W - W/2, r/NR*H - H/2, 0.0))
     for c in range(NC + 1)]
    for r in range(NR + 1)
]
# faces[r][c] → BMFace at that cell
faces = [
    [bm.faces.new([
         verts[r][c], verts[r][c+1],
         verts[r+1][c+1], verts[r+1][c],
     ]) for c in range(NC)]
    for r in range(NR)
]`}</pre>
      <p>
        Selection by region is then a simple list comprehension:
      </p>
      <pre>{`panel = [faces[r][c] for r in range(1, 5) for c in range(2, 6)]
left  = [faces[r][c] for r in range(1, 5) for c in range(0, 2)]`}</pre>

      <h2>Slab body: extrude everything downward first</h2>
      <p>
        The deck needs physical thickness. The blueprint extrudes the full 48
        top faces downward by <code>SLAB_D</code> before touching any feature
        group. The key point: the original top faces at z=0 are not consumed —
        they remain the deck surface and can be passed to subsequent feature
        extrusions:
      </p>
      <pre>{`all_top = [faces[r][c] for r in range(NR) for c in range(NC)]
ret = bmesh.ops.extrude_face_region(bm, geom=all_top)
slab_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=slab_verts, vec=Vector((0, 0, -SLAB_D)))
# ← all_top faces are now the TOP of the slab and still valid handles`}</pre>

      <h2>Sharp-edge marking</h2>
      <p>
        Each extrusion boundary creates 90° angle changes between the side
        walls and the cap. Mark these sharp so the{" "}
        <strong>SMOOTH_BY_ANGLE</strong> modifier or the GLB NORMAL accessor
        preserves the hard-surface look:
      </p>
      <pre>{`sharp_layer = bm.edges.layers.bool.get("sharp_edge") \\
              or bm.edges.layers.bool.new("sharp_edge")
for edge in bm.edges:
    if len(edge.link_faces) == 2:
        a, b = edge.link_faces[0].normal, edge.link_faces[1].normal
        dot  = max(-1.0, min(1.0, a.dot(b)))  # clamp for float safety
        if math.acos(dot) > SMOOTH_ANGLE:
            edge[sharp_layer] = True`}</pre>

      <h2>Full helper</h2>
      <pre>{`def extrude_region_up(bm, face_list, height):
    bm.normal_update()
    avg_n = sum((f.normal for f in face_list), Vector()).normalized()
    ret = bmesh.ops.extrude_face_region(bm, geom=face_list)
    new_verts = [g for g in ret['geom'] if isinstance(g, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, verts=new_verts, vec=avg_n * height)
    return ret`}</pre>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Flat result, no error</strong> — forgot the translate step.
          The cap was created but sits at the same position as the original.
        </li>
        <li>
          <strong>RuntimeError: BMesh is freed</strong> — called
          <code>bm.free()</code> before the translate. Keep the BMesh open
          until <code>bm.to_mesh(me)</code> completes.
        </li>
        <li>
          <strong>Side walls inside the mesh</strong> — passed a face set that
          included interior faces (faces entirely surrounded by other selected
          faces). Interior faces do not have a boundary edge and contribute no
          side walls; only the outer perimeter matters. This is not an error —
          the side walls still form on the outer boundary — but be aware that
          interior topology changes.
        </li>
        <li>
          <strong>Normals inverted on cap</strong> — the face list was wound
          clockwise. Use{" "}
          <code>bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])</code>{" "}
          or pass <code>use_normal_flip=True</code>.
        </li>
        <li>
          <strong>TypeError: geom must be a sequence</strong> — passed a
          generator expression instead of a list. Always materialise to
          <code>list()</code> before passing to any{" "}
          <code>bmesh.ops.*</code> call.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/current/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.ops — Blender Python API
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation · related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
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
          · Apache-2.0 · Khronos Group · related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF specification
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr",
  title:
    "Python bmesh.ops.extrude_face_region — Panel-Push, Raised Features & Sci-Fi Control Deck for WebXR (Blender 5.1)",
  description:
    "Context-free extrude kernel: build a grid of faces, select sub-groups by row/col, call bmesh.ops.extrude_face_region, filter ret['geom'] by isinstance to isolate new verts, translate the cap to height. Covers the two-step create+translate invariant, extrude_face_region vs. extrude_discrete_faces, use_keep_orig stamping mode, slab-body pattern, and sharp-edge marking for Draco-L6 GLB / WebXR export.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "extrude",
    "extrude_face_region",
    "hard-surface",
    "faceted",
    "control-deck",
    "sci-fi",
    "webxr",
    "glb",
    "low-poly",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr",
  Body,
  keyInsights: [
    "extrude_face_region creates cap geometry at the SAME position as the original faces — always follow with bmesh.ops.translate; forgetting produces a silent flat mesh with no error",
    "ret['geom'] is a flat mixed list: filter by isinstance(g, bmesh.types.BMVert) to get the verts to translate; filter BMFace to chain into a second extrude or grid_fill",
    "always call bm.normal_update() before reading face.normal — topology changes mark normals dirty; stale normals return the previous-frame value silently",
    "extrude_face_region treats the selection as one connected region (one shared push); extrude_discrete_faces extrudes each face independently in its own normal — choose based on whether the feature is a panel or individual buttons",
    "use_keep_orig=True stamps a copy atop the originals without consuming them — useful for logo/emboss features on an intact base surface",
    "the geom argument must be a materialised list(), not a generator — passing a generator raises TypeError with a message that obscures the real cause",
    "slab-body pattern: extrude ALL top faces downward first; the original top faces at z=0 remain valid handles and are passed to subsequent feature extrusions",
  ],
});
