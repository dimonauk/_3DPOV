import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.subdivide_edges</code> inserts new vertices along a
        targeted edge selection without a modifier stack or UI context. Unlike{" "}
        <code>bpy.ops.mesh.subdivide</code> — which requires an active Edit
        Mode window and acts on ALL selected edges — this operator runs
        headlessly from any script, accepts an arbitrary Python list of{" "}
        <code>BMEdge</code> objects, and returns the newly created geometry in a
        structured result dict. The studio uses it for three distinct jobs:
        inserting SubD support loops on hard-surface props, adding fractal
        displacement noise to stone or terrain geometry, and punching recessed
        panel insets via the <code>INNER_VERT</code> corner mode — all without
        touching the modifier stack or leaving a live SubD on the object.
      </p>
      <p>
        Compare this with{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-bisect-plane-cross-section-cutaway-symmetry-webxr"
          className={lk}
        >
          bmesh.ops.bisect_plane
        </Link>
        , which also pre-multiplies edge count before a cut: passing a
        subdivided mesh to <code>bisect_plane</code> increases the resolution
        of the boundary ring — a useful composition pattern.
      </p>

      <h2>Signature and return dict</h2>
      <pre>{`result = bmesh.ops.subdivide_edges(
    bm,
    edges          = selected_edges,   # list[BMEdge] — targeted selection
    cuts           = 1,                # new verts PER edge
    smooth         = 0.0,              # Catmull-Clark interior vert smoothing [0,1]
    fractal        = 0.0,              # random displacement ∝ edge length
    fractal_along_normal = 0.0,        # additional height-field displacement
    seed           = 0,                # deterministic seed (0 = fixed default)
    quad_corner_type = 'STRAIGHT_CUT', # 'STRAIGHT_CUT'|'INNER_VERT'|'PATH'|'FAN'
    use_grid_fill  = True,             # fill subdivided face interior as quad grid
    use_sphere     = False,            # project new verts toward bounding sphere
)
# result['geom_inner'] — new verts/edges created INSIDE face patches
# result['geom_split'] — sub-edge segments replacing each original selected edge
# result['geom']       — union of both (every element the op created)`}</pre>
      <p>
        <strong>
          <code>geom_inner</code> vs <code>geom_split</code>:
        </strong>{" "}
        when you subdivide the 4 vertical edges of a box with{" "}
        <code>cuts=2</code>, <code>geom_split</code> contains the 12 shorter
        sub-edges that replaced the originals (3 per edge), and{" "}
        <code>geom_inner</code> contains the 8 new horizontal ring edges that
        connect the newly inserted midpoint verts around the perimeter. For
        support-loop tagging you want <code>geom_inner</code> — those are the
        panel lines. For inheriting sharp flags from the original corner edges
        you would iterate <code>geom_split</code> instead.
      </p>

      <h2>Demo 1 — STRAIGHT_CUT support loops (cap lid)</h2>
      <p>
        This is the headless equivalent of Blender&apos;s Ctrl+R Loop Cut. By
        filtering for vertical edges before calling the op, exactly two
        horizontal rings are inserted — no side-effect on horizontal loops, no
        UI context required.
      </p>
      <pre>{`bm.edges.ensure_lookup_table()
z_up = Vector((0, 0, 1))
vert_edges = [
    e for e in bm.edges
    if abs((e.verts[1].co - e.verts[0].co).normalized().dot(z_up)) > 0.98
]
res = bmesh.ops.subdivide_edges(
    bm,
    edges=vert_edges,
    cuts=2,
    quad_corner_type='STRAIGHT_CUT',
    use_grid_fill=True,
    smooth=0.0,
    fractal=0.0,
)
# Tag the new ring edges as panel lines / SubD support creases.
sl = bm.edges.layers.bool.new("sharp_edge")
for elem in res['geom_inner']:
    if isinstance(elem, bmesh.types.BMEdge):
        elem[sl] = True`}</pre>
      <p>
        This feeds directly into a{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-subsurf-modifier-crease-edge-render-level-glb-webxr"
          className={lk}
        >
          SubsurfModifier workflow
        </Link>
        : the two support loops hold the lid&apos;s square silhouette under
        Catmull-Clark subdivision rather than rounding the corners away. The
        alternative — a{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
          className={lk}
        >
          BevelModifier chamfer
        </Link>{" "}
        — is a live modifier; <code>subdivide_edges</code> bakes the geometry
        and leaves a clean quad mesh for the exporter.
      </p>

      <h2>Demo 2 — fractal stone noise (shaft)</h2>
      <p>
        <code>fractal</code> displaces each new vertex laterally, perpendicular
        to the edge direction, by a random amount proportional to{" "}
        <strong>edge length × fractal amplitude</strong>. This means long edges
        produce large displacement. Always pre-subdivide with a sufficient{" "}
        <code>cuts</code> count so each sub-edge is short enough to keep the
        noise sub-centimetre.{" "}
        <code>fractal_along_normal</code> adds a second displacement component
        along the face normal — height-field style — which lifts the stone
        surface rather than just jittering it laterally.
      </p>
      <pre>{`bmesh.ops.subdivide_edges(
    bm,
    edges=bm.edges[:],          # all edges — uniform dense noise
    cuts=3,                     # shorten sub-edges before displacement
    quad_corner_type='STRAIGHT_CUT',
    use_grid_fill=True,
    smooth=0.0,
    fractal=0.055,              # amplitude in Blender units × edge length
    fractal_along_normal=0.030, # height-field lift component
    seed=7,                     # NON-ZERO seed for deterministic output
)
# seed=0 is NOT random — it is Blender's fixed internal default.
# Use a non-zero integer for reproducible cross-run GLB exports.`}</pre>
      <p>
        Smooth-shade the faces after this call (
        <code>f.smooth = True</code>) for a weathered stone reading. Flat-shade
        would produce faceted cut-crystal, which is the wrong look for the
        material. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
          className={lk}
        >
          Auto-Smooth / Smooth-by-Angle migration guide
        </Link>{" "}
        for the 5.1 attribute-based workflow if you later need to mix sharp and
        smooth regions on the same object.
      </p>

      <h2>Demo 3 — INNER_VERT recessed panel (base)</h2>
      <p>
        <code>INNER_VERT</code> places a centre vertex inside each quad patch
        that the subdivision creates, connecting it to all four patch corners.
        For a single quad face with all four perimeter edges cut once (
        <code>cuts=1</code>), this produces a 4-triangle star fan — visually
        equivalent to{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          bmesh.ops.inset_faces
        </Link>{" "}
        but without the inset offset. Use it when you want a pure radial
        subdivision pattern without moving the perimeter edges inward.
      </p>
      <pre>{`bm.faces.ensure_lookup_table()
top_face = max(bm.faces, key=lambda f: f.calc_center_bounds().z)

res = bmesh.ops.subdivide_edges(
    bm,
    edges=list(top_face.edges),  # only the 4 perimeter edges of the top quad
    cuts=1,
    quad_corner_type='INNER_VERT',
    use_grid_fill=True,
    smooth=0.0,
    fractal=0.0,
)
# The star-fan spokes land in geom_inner.
sl = bm.edges.layers.bool.new("sharp_edge")
for elem in res['geom_inner']:
    if isinstance(elem, bmesh.types.BMEdge):
        elem[sl] = True`}</pre>
      <p>
        All four side and bottom faces are untouched — this is the targeted
        per-face-perimeter capability that has no equivalent in the modifier
        stack without additional boolean geometry.
      </p>

      <h2>Export notes</h2>
      <p>
        All three objects export cleanly to GLB via{" "}
        <code>export_apply=True</code>. The <code>sharp_edge</code> boolean
        attribute on edges is read by the glTF exporter in Blender 5.1 — it
        splits vertex normals at tagged edges, producing hard creases in the{" "}
        <code>NORMAL</code> accessor without a separate Auto-Smooth modifier.
        <code>fractal_along_normal</code> displacement is already baked into
        the vertex positions; no displacement map is needed in the GLB material.
      </p>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bmesh.ops API reference — Blender 5.1
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation · related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/meshes/editing/mesh/subdivide.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Subdivide manual page
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
  slug: "blender-tutorial-python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr",
  title:
    "Python bmesh.ops.subdivide_edges — Support Loops, Fractal Stone & INNER_VERT Panel: Architectural Plinth for WebXR (Blender 5.1)",
  description:
    "Three production patterns for bmesh.ops.subdivide_edges — the headless context-free alternative to Ctrl+R Loop Cut: STRAIGHT_CUT for targeted SubD support loops, fractal displacement for procedural stone noise, and INNER_VERT for recessed panel insets — covering the geom_inner vs geom_split distinction, fractal amplitude scaling by edge length, deterministic seed usage, and GLB export of the sharp_edge attribute.",
  date: "2026-07-19",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "subdivide-edges",
    "support-loops",
    "loop-cut",
    "fractal",
    "inner-vert",
    "hard-surface",
    "faceted",
    "stone",
    "architectural",
    "webxr",
    "glb",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-subdivide-edges-catmull-loop-cut-faceted-plinth-webxr",
  Body,
  keyInsights: [
    "subdivide_edges is headless and context-free — unlike bpy.ops.mesh.subdivide it accepts any BMEdge list and returns geom_inner (new interior edges) and geom_split (sub-edge segments replacing originals)",
    "filter geom_inner for isinstance(elem, BMEdge) to collect the new loop-ring edges; filter geom_split for the sub-segments of the original selected edges",
    "fractal amplitude is multiplied by EDGE LENGTH — pre-subdivide with sufficient cuts so each sub-edge is short enough to keep displacement sub-centimetre",
    "seed=0 is NOT random — it is Blender's fixed internal default; use a non-zero integer for deterministic fractal results across repeated script runs",
    "INNER_VERT places a centre vert inside each quad patch; for a single top-face quad with all 4 edges cut once this produces a 4-triangle star fan with no perimeter movement",
    "STRAIGHT_CUT new ring edges land in geom_inner — tag them as sharp_edge for SubD support loop creases that hold hard-surface silhouettes under Catmull-Clark",
    "smooth-shade after fractal subdivision for stone weathering; flat-shade after STRAIGHT_CUT for hard-surface panel lines — the mode choice is a visual decision, not a technical one",
  ],
});
