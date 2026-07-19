import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.offset_edgeloops</code> takes a connected set of edges
        — a closed loop or open path — and inserts two new parallel edge loops
        flanking the input on either side, by sliding new vertices along the
        geometry of adjacent quad faces.  It is the headless equivalent of Edit
        Mode&apos;s <em>Offset Edge Loop Slide</em> operator, but it operates
        directly on a BMesh: no active Object, no mode switch, no undo-stack
        overhead.
      </p>
      <p>
        The studio prop is a Sci-Fi Armour Plate — a 2.4 × 1.6 m hard-surface
        shell with a raised central boss, two horizontal panel-line trenches, and
        a solidified back panel.  The same script demonstrates three distinct
        applications of the operator: support-loop insertion around the boss base
        (closed loop), panel-line trench creation via an open horizontal row
        (open path), and implicit bevel-prep — the support loops are equally
        valid as guide loops for a downstream{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
          className={lk}
        >
          BevelModifier
        </Link>
        .
      </p>

      <h2>Signature</h2>
      <pre>{`result = bmesh.ops.offset_edgeloops(
    bm,
    edges           = list_of_BMEdge,  # required: connected loop or open path
    use_cap_endpoint = False,           # True for open paths with boundary ends
)
new_edges = result['edges']  # list[BMEdge] — the newly inserted parallel loops`}</pre>
      <p>
        The input edges <strong>remain in place</strong>; the return value
        contains only the newly created parallel edges.  Every call changes the
        mesh topology, so call{" "}
        <code>bm.verts.ensure_lookup_table()</code>,{" "}
        <code>bm.edges.ensure_lookup_table()</code>, and{" "}
        <code>bm.faces.ensure_lookup_table()</code> before any subsequent
        index-based access.
      </p>

      <h2>use_cap_endpoint — closed loop vs open path</h2>
      <pre>{`# Closed loop (boss perimeter — no dangling endpoints)
bmesh.ops.offset_edgeloops(
    bm, edges=boss_perim, use_cap_endpoint=False
)

# Open path (groove row touching plate boundary at both ends)
bmesh.ops.offset_edgeloops(
    bm, edges=groove_row, use_cap_endpoint=True
)`}</pre>
      <p>
        A boss perimeter is a closed rectangular path — eight edges with no
        dangling endpoints.{" "}
        <code>use_cap_endpoint=False</code> is correct: there is nowhere to
        extend a cap.  A horizontal groove row is an <em>open</em> path — it
        starts and ends at the plate boundary.{" "}
        <code>use_cap_endpoint=True</code> tells the operator to extend the
        offset loops to meet those boundary vertices correctly, otherwise the
        ends of the groove are left open and the panel-line trench is unclosed.
        Contrast this with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          bmesh.ops.inset_faces
        </Link>
        , which creates per-face inset borders and does not require connected
        loops at all — useful when each face needs its own independent recess
        rather than a continuous groove line.
      </p>

      <h2>Grid topology for clean round numbers</h2>
      <pre>{`# SEG_X=4 (4 columns) → x step = PLATE_W / SEG_X = 2.4 / 4 = 0.6 m
# SEG_Y=8 (8 rows)    → y step = PLATE_H / SEG_Y = 1.6 / 8 = 0.2 m
#
# After create_grid(x_segments=4, y_segments=8, size=1.0) + scale:
#   x verts: −1.2, −0.6, 0.0, 0.6, 1.2
#   y verts: −0.8, −0.6, −0.4, −0.2, 0.0, 0.2, 0.4, 0.6, 0.8
#
# Face centres in x: ±0.9, ±0.3
# Face centres in y: ±0.7, ±0.5, ±0.3, ±0.1
#
# Boss faces: |x_centre| < 0.35 AND |y_centre| < 0.15
#             → cols ±0.3 × rows ±0.1 = 4 central faces
# Boss perimeter: edges at x=±0.6 (y-span) and y=±0.2 (x-span)
# Groove rows:    edges at y=±0.4 — safely between boss ±0.2 and boundary ±0.6`}</pre>
      <p>
        Choosing segment counts that divide plate dimensions evenly gives
        integer vertex positions — every coordinate in the grid is a neat 0.2 m
        multiple.  That makes coordinate-based edge filtering with a small EPS
        tolerance reliable without floating-point drift.  An irregular grid (e.g.
        5 × 7) produces irrational y-steps that require larger tolerances and risk
        accidentally catching adjacent rows.
      </p>

      <h2>Boss perimeter detection (before extrusion)</h2>
      <pre>{`boss_faces = [
    f for f in bm.faces
    if abs(f.calc_center_median().x) < 0.35
    and abs(f.calc_center_median().y) < 0.15
]
boss_set = set(boss_faces)

# A perimeter edge has exactly ONE adjacent boss face.
# If count == 0: fully outside (plate face).
# If count == 2: fully inside (boss interior edge — skip).
# If count == 1: boundary — the perimeter we want.
boss_perim = [
    e for e in bm.edges
    if sum(1 for f in e.link_faces if f in boss_set) == 1
]
# → 8 edges: the closed rectangular frame around the 2×2 boss patch`}</pre>
      <p>
        Collecting the perimeter <strong>before</strong> extruding the boss is
        essential: the BMEdge objects survive the extrusion (they are not
        deleted, only their link_faces change) and can be passed directly into
        offset_edgeloops.  Collecting them after extrusion would require
        coordinate filtering at z≈0 on the newly complex topology — more
        fragile.  This matches the pattern used in{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-face-region-panel-push-control-deck-webxr"
          className={lk}
        >
          extrude_face_region
        </Link>{" "}
        where geometry references are best captured before the structural change.
      </p>

      <h2>Support loop insertion</h2>
      <pre>{`# BEFORE offset_edgeloops:
# boss perimeter sits at z=0 between plate faces and boss side walls
#
# AFTER offset_edgeloops(edges=boss_perim, use_cap_endpoint=False):
# Two new loops appear:
#   outer loop → slides into the plate face (plate-side support)
#   inner loop → slides into the boss wall face (boss-side support)
#
# Each adjacent quad face is split into THREE sub-faces:
#   [large plate face][narrow outer strip][original perimeter edge][narrow inner strip][side wall]
#
# These narrow strips are the support loops.  On a SubD surface they
# pull the surface crease tight to the boss edge with no pinching.
# With BevelModifier(limit_method='WEIGHT') they define the chamfer extent.

supp_ret = bmesh.ops.offset_edgeloops(
    bm, edges=boss_perim, use_cap_endpoint=False
)
supp_edges = supp_ret['edges']  # the two flanking loops`}</pre>
      <p>
        Support loops prevent the characteristic <em>pinch</em> artefact that
        appears when a SubD surface or bevel tries to round a sharp edge without
        guide geometry on either side.  The offset loops constrain how much the
        surface relaxes away from the edge.  The closer to the edge they sit,
        the sharper the resulting corner — which is controlled here by the width
        of the adjacent faces in the source grid.  Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr"
          className={lk}
        >
          subdivide_edges tutorial
        </Link>{" "}
        where loop cuts are placed manually at specific parametric positions.
      </p>

      <h2>Panel-line trench</h2>
      <pre>{`def horiz_edges_at_y(bm, y_val, eps=0.02):
    return [
        e for e in bm.edges
        if abs(e.verts[0].co.y - y_val) < eps
        and abs(e.verts[1].co.y - y_val) < eps
        and abs(e.verts[0].co.x - e.verts[1].co.x) > eps   # x-span: horizontal
        and e.verts[0].co.z < eps                            # plate level only
        and e.verts[1].co.z < eps
    ]

groove_row = horiz_edges_at_y(bm, 0.4)   # 4 edges spanning x=−1.2 → 1.2

bmesh.ops.offset_edgeloops(bm, edges=groove_row, use_cap_endpoint=True)
bm.faces.ensure_lookup_table()

# Faces sandwiched between the two new offset loops sit near y=0.4
groove_faces = [
    f for f in bm.faces
    if abs(f.calc_center_median().y - 0.4) < 0.08
    and abs(f.calc_center_median().z) < 0.02   # still at plate level
]

# Extrude groove floor down to create panel-line trench
gret = bmesh.ops.extrude_face_region(bm, geom=groove_faces)
g_verts = [g for g in gret['geom'] if isinstance(g, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=g_verts, vec=Vector((0.0, 0.0, -0.015)))`}</pre>
      <p>
        The key insight is that <code>offset_edgeloops</code> splits the face on
        each side of the groove row into two sub-faces: a large remainder face
        and a narrow strip adjacent to the original groove edge.  The{" "}
        <em>narrow strip</em> is what becomes the groove floor once extruded
        downward.  Filtering by <code>calc_center_median().y</code> with a
        generous EPS of 0.08 catches these narrow faces regardless of exactly
        where the operator placed the offset (which is determined by each face&apos;s
        local width).  The same panel-line aesthetic can be achieved via{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr"
          className={lk}
        >
          SolidifyModifier rim cap
        </Link>{" "}
        non-destructively — but offset_edgeloops commits the geometry for clean
        GLB export without a modifier stack.
      </p>

      <h2>Bevel preparation — implicit bonus</h2>
      <pre>{`# The support loops inserted around the boss perimeter are ALSO valid bevel
# guides.  After exporting the GLB and re-importing (or directly on the object
# before export), adding a BevelModifier in WEIGHT mode with a bevel weight
# on the boss perimeter edges produces a crisp, pinch-free chamfer:

# In blueprint.py, before building the object:
bevel_weight_layer = bm.edges.layers.float.new("bevel_weight_edge")
for e in boss_perim:
    e[bevel_weight_layer] = 1.0   # mark original boss edge for BevelModifier

# Then on the resulting Object:
# ob.modifiers.new('Bevel', 'BEVEL')
# bevel.limit_method = 'WEIGHT'
# bevel.width = 0.02
# The two support loops constrain the bevel stripe to the boss edge strip`}</pre>
      <p>
        This is the <em>bevel prep</em> interpretation: you are not bevelling
        in this script, but the support loop topology is identical to what a
        BevelModifier needs to produce a clean result.  The two flanking loops
        act as guard rails.  Without them, bevel on a low-poly grid produces
        visible stretching; with them, the bevel stripe is confined and the
        surrounding surface stays flat.
      </p>

      <h2>Solidify backing shell</h2>
      <pre>{`# bmesh.ops.solidify extrudes each face along its (inverted) normal.
# Negative thickness → faces push in their −normal direction (downward for
# upward-facing plate).
bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=-0.035)
bm.normal_update()`}</pre>
      <p>
        Applying solidify <em>after</em> all the groove and support topology is
        in place avoids a common mistake: solidifying first and then trying to
        find groove faces on a double-layered mesh.  The ordering is:
        grid → boss → support → grooves → solidify → export.  Note that
        <code>bmesh.ops.solidify</code> also thickens the boss walls and groove
        side walls — for a display prop this is acceptable; for a 3D-print shell
        you would want to solidify only the base plate faces.
      </p>

      <h2>Export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath="//hf_armour_plate.glb",
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
    use_selection=True,
)`}</pre>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.ops API Reference — Blender 5.1
          </a>{" "}
          — CC-BY-SA-4.0.{" "}
          Related:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender source (projects.blender.org)
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.types.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            bmesh.types reference
          </a>
          .
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0.{" "}
          Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>
          ,{" "}
          <a
            href="https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF 2.0 spec
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  id: "blender-tutorial-python-bmesh-ops-offset-edgeloops-support-loop-panel-trench-armour-webxr",
  title:
    "Python bmesh.ops.offset_edgeloops — Support-Loop Insertion, Panel-Line Trench & Pinch-Free Bevel Prep: Sci-Fi Armour Plate for WebXR (Blender 5.1)",
  description:
    "Insert parallel flanking edge loops from Python with bmesh.ops.offset_edgeloops — covering closed-loop boss support loops that prevent SubD pinching, open-path panel-line trench grooves, and implicit bevel-guide prep — built into a hard-surface Sci-Fi Armour Plate GLB for WebXR.",
  tags: [
    "blender",
    "blender-5.1",
    "bmesh",
    "python",
    "scripting",
    "hard-surface",
    "offset-edgeloops",
    "support-loops",
    "panel-lines",
    "bevel-prep",
    "armour",
    "webxr",
    "glb",
    "export",
  ],
  body: Body,
  level: "intermediate",
});
