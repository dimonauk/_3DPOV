import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.symmetrize</code> is the headless form of{" "}
        <em>Mesh → Symmetrize</em>. Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr"
          className={lk}
        >
          Mirror Modifier
        </Link>{" "}
        — which stays live in the stack — symmetrize is{" "}
        <strong>destructive</strong>: it bakes the reflected copy into the
        BMesh, merges seam verts within a configurable threshold, and returns
        clean final topology with no modifier overhead. That makes it the
        correct choice for VRM character work where weight-painting, shape
        keys, and GLB export all need to run against a single unified mesh.
        The studio use-case here is a sci-fi helmet shell: craft the right
        half (X ≥ 0) using the same context-free bmesh pattern from the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr"
          className={lk}
        >
          bisect_plane
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset_faces
        </Link>{" "}
        tutorials, then call <code>symmetrize</code> once.
      </p>

      <h2>Signature</h2>
      <pre>{`result = bmesh.ops.symmetrize(
    bm,
    input       = [],    # list[BMVert | BMEdge | BMFace] — source geometry
    direction   = 'X',  # 'X'|'-X'|'Y'|'-Y'|'Z'|'-Z'
    dist        = 0.0001,# merge threshold for verts at mirror plane
    use_shapekey = False,# propagate symmetry into shape key data
)
# returns {'geom': [all resulting elements]}`}</pre>
      <p>
        The <code>input</code> list must contain{" "}
        <strong>all three geometry types</strong> — verts, edges, and faces —
        just like <code>bisect_plane</code>. Passing only faces leaves edge
        adjacency unresolved and can produce T-junction artefacts at the seam.
      </p>

      <h2>The direction parameter</h2>
      <p>
        This is the most common source of confusion. The value specifies which
        side is the <em>source</em> (the half that survives and gets mirrored):
      </p>
      <pre>{`'X'   → positive-X is the SOURCE → mirrors to negative-X
'-X'  → negative-X is the SOURCE → mirrors to positive-X
'Y'   → positive-Y is the SOURCE → mirrors to negative-Y
# …and so on for Z / -Z`}</pre>
      <p>
        When the helmet half-mesh lives at X ≥ 0 and you want the mirror to
        fill negative-X, use <code>direction="-X"</code>. If you accidentally
        pass <code>"X"</code> you will mirror in the wrong direction and the op
        will delete your half-mesh, leaving you with an empty BMesh — silent,
        no exception.
      </p>

      <h2>Seam preparation</h2>
      <p>
        The default <code>dist=0.0001</code> suits objects at 1 BU ≈ 1 m.
        At helmet scale, snap seam verts to X=0 explicitly before the call —
        more reliable than relying on threshold tolerance alone:
      </p>
      <pre>{`for v in bm.verts:
    if abs(v.co.x) < SEAM_MERGE_DIST * 4:
        v.co.x = 0.0   # guarantee clean merge`}</pre>

      <h2>Inverted winding — recalc_face_normals is not optional</h2>
      <p>
        The mirrored copy is a reflection: face winding is inverted relative to
        the source. Without a normal recalculation the inside faces of the
        mirrored half face outward, producing visible black patches in any
        renderer that culls back-faces. Always call:
      </p>
      <pre>{`bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])`}</pre>
      <p>
        This is the same rule that applies after{" "}
        <code>bmesh.ops.mirror</code> and after applying a Mirror Modifier
        manually — any reflection operation reverses winding.
      </p>

      <p>
        Symmetrize <strong>replaces</strong> the destination side — any
        existing geometry there is deleted and overwritten. Pre-delete or
        bisect it before calling if the mesh has content on both sides.
      </p>

      <h2>Core pattern</h2>
      <pre>{`bm = bmesh.new()
_build_helmet_half(bm)          # X ≥ 0 only, seam verts at X = 0

all_geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
bmesh.ops.symmetrize(
    bm, input=all_geom,
    direction="-X",             # positive-X source → fills negative-X
    dist=SEAM_MERGE_DIST,
    use_shapekey=False,
)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])  # mandatory

sharp_layer = bm.edges.layers.bool.get("sharp_edge") \\
              or bm.edges.layers.bool.new("sharp_edge")
for e in bm.edges:             # re-tag: layer doesn't propagate to new elems
    e[sharp_layer] = True
for f in bm.faces:
    f.smooth = False
bm.to_mesh(me)
bm.free()`}</pre>

      <h2>Mirror Modifier vs symmetrize — when to use which</h2>
      <ul>
        <li>
          <strong>Non-destructive sculpting</strong>: use the Mirror Modifier
          — the stack stays live and editable.
        </li>
        <li>
          <strong>GLB / VRM export</strong>: use symmetrize — no apply step,
          no risk of seam duplicates from a dirty stack, real verts for
          weight-painting.
        </li>
        <li>
          <strong>Shape keys</strong>: Mirror Modifier handles these live;
          symmetrize needs <code>use_shapekey=True</code>.
        </li>
        <li>
          <strong>Headless scripts</strong>: only symmetrize works without an
          active object or view layer context.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Empty BMesh after symmetrize</strong> — wrong direction; the
          source half was deleted. Swap <code>'X'</code> ↔ <code>'-X'</code>.
        </li>
        <li>
          <strong>Seam gap</strong> — <code>dist</code> too small; increase to{" "}
          <code>0.001</code> or flatten seam verts to X=0 before the call.
        </li>
        <li>
          <strong>Black faces on mirrored side</strong> — forgot{" "}
          <code>recalc_face_normals</code>; the mirrored copy always has
          inverted winding.
        </li>
        <li>
          <strong>sharp_edge missing on new faces</strong> — the boolean layer
          does not auto-propagate; re-tag all edges after the op.
        </li>
        <li>
          <strong>Destination geometry not cleared</strong> — use{" "}
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr"
            className={lk}
          >
            bisect_plane clear_outer=True
          </Link>{" "}
          to pre-clean the destination side.
        </li>
      </ul>

      <p>
        After symmetrize the helmet has real verts on both sides and no
        modifier stack — it is immediately ready for VRM weight-painting and
        GLB export via the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-skin-modifier-wire-to-mesh-bmesh-radius-character-blockout-webxr"
          className={lk}
        >
          Skin Modifier character blockout workflow
        </Link>
        . Symmetric topology also keeps the VRM spring-bone solver balanced,
        avoiding asymmetric physics artefacts.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation · related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/symmetrize.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Symmetrize — Blender Manual
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Documentation Team · related:{" "}
          <a
            href="https://projects.blender.org/blender/blender-manual"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender-manual
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
            glTF spec
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr",
  title:
    "Python bmesh.ops.symmetrize — Half-Mesh Mirror & Merge: Faceted Helmet Shell for VRM & WebXR (Blender 5.1)",
  description:
    "Destructive in-BMesh symmetrize: build the right half of a sci-fi helmet shell, call bmesh.ops.symmetrize to mirror across X=0 and merge seam verts, recalculate inverted winding, re-tag sharp_edge on mirrored faces, and export as Draco-L6 GLB. Covers direction semantics, dist threshold prep, the Mirror Modifier trade-off table, and VRM rigging readiness.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "symmetrize",
    "mirror",
    "hard-surface",
    "faceted",
    "helmet",
    "vrm",
    "character",
    "webxr",
    "glb",
    "low-poly",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-symmetrize-half-mesh-vrm-character-helmet-webxr",
  Body,
  keyInsights: [
    "symmetrize is destructive — it bakes the mirrored copy into mesh data immediately and merges seam verts; use it instead of the Mirror Modifier when you need clean final topology for VRM export or GLB pipeline",
    "direction='-X' means positive-X is the SOURCE and the op mirrors it to negative-X; passing 'X' when your half lives at positive-X silently deletes it and returns an empty BMesh",
    "input must include all three geometry types: bm.verts[:]+bm.edges[:]+bm.faces[:] — omitting edges leaves T-junction artefacts at the seam",
    "flatten seam verts to X=0 exactly before calling (for v in bm.verts: if abs(v.co.x) < threshold: v.co.x=0.0) — more reliable than relying solely on dist",
    "the mirrored copy always has inverted winding — bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]) is mandatory",
    "sharp_edge boolean layer does not auto-propagate to new mirrored elements — re-tag all edges after the op to preserve faceted shading in the GLB NORMAL accessor",
    "destination side is replaced, not supplemented — anything already on the destination half is deleted; pre-bisect or pre-delete before calling if the mesh has content on both sides",
  ],
});
