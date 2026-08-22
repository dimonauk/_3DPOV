import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.solidify</code> turns a surface — any contiguous set of
        BMesh faces — into a hollow shell. It offsets each face inward along its
        local normal by <code>thickness</code> units, then bridges every boundary
        edge between the outer and inner shells with a quad rim face. The
        operation returns a result dictionary whose <code>geom</code> field
        contains the complete set of newly created elements: inner verts, inner
        edges, and inner faces including the rim quads. Filtering that sequence
        by <code>isinstance(e, bmesh.types.BMFace)</code> gives a deterministic
        handle to every cavity face — no normal-direction heuristics required.
      </p>
      <p>
        The studio prop is a faceted crystal relic case: an elongated icosahedron
        (subdivisions=1) with its top cap removed via{" "}
        <code>bmesh.ops.bisect_plane</code>, solidified to produce a hollow urn
        with visible wall thickness at the open lid, and exported as a two-slot
        GLB (outer blue-crystal material, inner dark-teal cavity material). The
        rim faces — the wall cross-section visible from above — are tagged with
        the inner material, reinforcing the hollow impression in flat-shaded
        WebXR renderers.
      </p>

      <h2>Signature</h2>
      <pre>{`bmesh.ops.solidify(bm, geom=[], thickness=0.0002)
# Returns: {'geom': BMElemSeq}
#
# bm        — the active BMesh
# geom      — list[BMVert | BMEdge | BMFace]; only BMFace elements are used;
#              verts and edges in the list are silently ignored
# thickness — float; positive = inner shell offsets INWARD along face normals
#                             (correct for convex-outward meshes)
#             negative = inner shell offsets OUTWARD (use for adding outer
#                             layers on top of existing geometry)
#
# result['geom'] contains:
#   new BMVert  — inner shell vertex copies
#   new BMEdge  — inner shell edges + rim edges
#   new BMFace  — inner shell face copies + rim quad faces
#
# The original outer faces remain unchanged in bm.faces.`}</pre>

      <h2>Difference from SolidifyModifier</h2>
      <pre>{`# bpy.types.SolidifyModifier — modifier stack, non-destructive
mod = obj.modifiers.new("Solidify", 'SOLIDIFY')
mod.thickness          = 0.045
mod.use_even_offset    = True   # even-thickness mode (unavailable in bmesh op)
mod.use_quality_normals = True
mod.use_rim            = True   # auto-creates a rim cap (always on in bmesh op)
mod.material_offset    = 1      # inner faces use mat_index + offset

# bmesh.ops.solidify — in-memory, destructive, no even-thickness
result = bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=0.045)
inner  = [e for e in result['geom'] if isinstance(e, bmesh.types.BMFace)]
for f in inner:
    f.material_index = 1        # explicit per-face index, not an offset

# Use the bmesh op when:
#   • you are already in a bmesh session with other ops (bisect → solidify → inset)
#   • you want direct, indexable inner-face handles for custom material logic
#   • you do not need even-thickness or complex-mode crease handling
#   • the modifier stack would add unnecessary overhead (batch pipeline)`}</pre>

      <h2>Open-top bowl pattern</h2>
      <pre>{`import bpy, bmesh, mathutils

WALL_THICKNESS = 0.045
LID_CUT_Z      = 0.34

bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=1, diameter=0.9)

# Elongate into urn proportions before the cut.
bmesh.ops.transform(
    bm,
    matrix=mathutils.Matrix.Scale(1.55, 4, (0.0, 0.0, 1.0)),
    verts=list(bm.verts),
)

# bisect_plane + clear_outer=True deletes faces above the plane.
# The cut introduces a boundary edge loop at the lid rim.
bmesh.ops.bisect_plane(
    bm,
    geom        = list(bm.verts) + list(bm.edges) + list(bm.faces),
    dist        = 0.0001,
    plane_co    = (0.0, 0.0, LID_CUT_Z),
    plane_no    = (0.0, 0.0, 1.0),
    clear_outer = True,
    clear_inner = False,
)
# CRITICAL: recalc normals after bisect before passing to solidify.
# bisect can invert winding on newly created cap-edge triangles.
bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))

# Solidify — the open lid boundary becomes visible wall-thickness rim.
result      = bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=WALL_THICKNESS)
inner_faces = [e for e in result['geom'] if isinstance(e, bmesh.types.BMFace)]
for f in inner_faces:
    f.material_index = 1   # cavity + rim quads share the inner material`}</pre>

      <h2>Why recalc_face_normals before solidify matters</h2>
      <p>
        <code>bmesh.ops.bisect_plane</code> creates new edge-loop verts along the
        cut plane. On an icosphere the triangles adjacent to the cut are reused
        with one vertex replaced — this can flip their winding if the original
        ordering put the new vert before the kept verts. A solidify with one
        inverted face produces a local outward bubble on the inner shell at that
        face position. Calling{" "}
        <code>bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))</code>{" "}
        after every bisect and before solidify is a cheap safeguard with zero
        topology cost.
      </p>

      <h2>Identifying inner vs outer faces after solidify</h2>
      <pre>{`# Method 1 — result dict (recommended, O(1) per face, no heuristics)
result      = bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=0.045)
inner_faces = [e for e in result['geom'] if isinstance(e, bmesh.types.BMFace)]

# Method 2 — normal direction dot product (fragile on non-convex meshes)
centre = mathutils.Vector((0, 0, 0))
for f in bm.faces:
    to_centre = (centre - f.calc_center_median()).normalized()
    if f.normal.dot(to_centre) > 0.0:   # normal points inward = inner face
        f.material_index = 1

# Method 1 is always correct.  Method 2 fails on concave regions and on
# faces whose normals are nearly tangential to the radial direction.
# After solidify, inner face normals DO point inward for a convex mesh — but
# result['geom'] is guaranteed correct regardless of mesh shape.`}</pre>

      <h2>Rim faces</h2>
      <p>
        Rim faces appear wherever the input face selection has a boundary edge —
        an edge shared by fewer than two selected faces. For the open-top bowl,
        the lid cut introduces a single boundary loop, so solidify produces one
        ring of rim quads bridging the outer and inner lid edges. These quads
        are part of <code>result['geom']</code> and are included in the inner
        face list above, which is why they receive the inner material index. If
        you prefer a distinct rim material, filter by comparing face normal
        direction against Z: rim faces have normals near horizontal (|Z| &lt; 0.3),
        inner shell faces have normals pointing inward (dot with -outward &gt; 0).
      </p>

      <h2>Troubleshooting</h2>
      <pre>{`# Symptom: solidify produces no inner shell, result['geom'] is empty.
# Cause:   geom list was empty or contained no BMFace elements.
# Fix:     pass list(bm.faces), not list(bm.verts).

# Symptom: inner and outer shells interpenetrate near vertices.
# Cause:   thickness exceeds the minimum face-to-face distance in the mesh.
# Fix:     reduce thickness or subdivide the mesh to increase face area.

# Symptom: rim faces appear on all edges, not just the lid boundary.
# Cause:   the mesh is not manifold — some edges are only adjacent to one face
#          after the bisect operation (dangling or isolated faces).
# Fix:     run bmesh.ops.find_doubles + bmesh.ops.weld_verts before solidify.

# Symptom: material index set on inner faces but GLB shows only one material.
# Cause:   mesh.materials list has fewer slots than the highest material_index.
# Fix:     append both material slots before bm.to_mesh(), in index order.`}</pre>

      <h2>Blueprint walkthrough</h2>
      <p>
        The complete <code>blueprint.py</code> in this library entry runs
        end-to-end from an empty Blender scene: icosphere creation via{" "}
        <code>bmesh.ops.create_icosphere(subdivisions=1, diameter=0.9)</code>,
        Z-scale transform, lid bisect, solidify with inner-face material tagging,
        flat-shading of all polygons, material slot append, and Draco L6 GLB
        export with Y-up. The output <code>hf_relic_case.glb</code> is
        WebXR-ready with two material slots (outer crystal slot 0, inner cavity
        slot 1) and no smooth normals, preserving the faceted aesthetic.
      </p>

      <h2>Cross-references</h2>
      <h3>Studio</h3>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bmesh-ops-offset-edgeloops-support-loop-panel-trench-armour-webxr"
          >
            bmesh.ops.offset_edgeloops — Support-Loop Insertion & Armour Plate
          </Link>{" "}
          — the armour plate blueprint uses <code>bmesh.ops.solidify</code> as a
          one-liner helper to thicken the plate walls; this tutorial gives the
          full standalone treatment of that operation.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr"
          >
            Python bpy.types.SolidifyModifier — Simple vs Complex Mode, Even Thickness
          </Link>{" "}
          — the modifier-stack counterpart covering even-thickness, complex mode,
          rim cap, and the <code>material_offset</code> property.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr"
          >
            bmesh.ops.bisect_plane — Cross-Section, Cutaway & Symmetry Seal
          </Link>{" "}
          — the bisect operation used here to cut the lid opening.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          >
            bmesh.ops.inset_faces — Panel-Line Grooves, Button Recesses & Vent Grilles
          </Link>{" "}
          — apply <code>inset_faces</code> on the solidified outer shell to add
          bevelled panel-line detail before export.
        </li>
      </ul>
      <h3>External sources</h3>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender 5.1 Python API — bmesh.ops reference
          </a>{" "}
          — Blender Foundation — CC-BY-SA 4.0 (documentation, reference only).{" "}
          Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org/blender/blender
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF specification
          </a>{" "}
          — The Khronos Group — Apache-2.0. Defines the{" "}
          <code>primitives[].material</code> index that maps each face material
          slot to a glTF material object in the output GLB. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Models
          </a>{" "}
          — Apache-2.0 / CC0 reference meshes with multi-material primitives.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  id: "blender-tutorial-python-bmesh-ops-solidify-hollow-shell-faceted-crystal-case-webxr",
  title:
    "Python bmesh.ops.solidify — Hollow-Shell Extrusion & Inner-Face Material Tagging: Faceted Crystal Relic Case for WebXR (Blender 5.1)",
  description:
    "Use bmesh.ops.solidify to extrude a face set into a hollow shell in a single bmesh session — covers the result['geom'] inner-face handle, the open-top bowl pattern with bisect_plane, two-material-slot GLB export, and comparison with SolidifyModifier's even-thickness and complex mode.",
  tags: [
    "blender",
    "blender-5.1",
    "bmesh",
    "python",
    "scripting",
    "solidify",
    "bmesh-ops",
    "hollow-shell",
    "wall-thickness",
    "material-index",
    "crystal",
    "relic-case",
    "faceted",
    "hard-surface",
    "webxr",
    "glb",
    "export",
  ],
  body: Body,
  level: "intermediate",
});
