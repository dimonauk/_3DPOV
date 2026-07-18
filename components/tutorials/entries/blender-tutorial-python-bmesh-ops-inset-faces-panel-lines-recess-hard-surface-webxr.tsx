import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.inset_faces</code> is the context-free kernel behind
        Blender&apos;s Inset Faces operator (the <kbd>I</kbd> key). Unlike the
        interactive operator it accepts an explicit Python list of{" "}
        <code>BMFace</code> objects and returns the resulting inner faces —
        there is no 3D Viewport, no active selection, no undo stack, and no
        dependency on operator context. That makes it the correct primitive for
        headless pipeline scripts, batch-processing tools, and any situation
        where you want to drive panel-line geometry entirely from code. This
        blueprint uses it to construct a hard-surface console panel with three
        distinct inset zones in one pass.
      </p>

      <h2>How inset_faces works internally</h2>
      <p>
        The operator traces each input face inward by <code>thickness</code>{" "}
        world-units. It inserts a ring of new narrow quad faces along the
        original perimeter — the groove or panel line — then returns the
        central, inset polygon in <code>result[&apos;faces&apos;]</code>. In
        pseudo-code:
      </p>
      <pre>{`for every input face (or group, depending on use_individual):
    1. Slide each boundary edge inward by 'thickness'
    2. Build quad strip between original edge and inset edge  ← the groove
    3. Translate the inner face along its normal by 'depth'   ← the recess
    4. Return inner face in result['faces']`}</pre>
      <p>
        The crucial invariant: <code>depth</code> acts relative to the{" "}
        <strong>face normal</strong>, not world Z. On a horizontal{" "}
        <code>+Z</code> face, <code>depth=-0.018</code> pushes the inner face
        18 mm into the mesh. On a vertical <code>+Y</code> face the same value
        pushes 18 mm in Y. This is almost always what you want for hard-surface
        work, but breaks on heavily curved or twisted surfaces — test on both
        flat and angled faces before deploying in a production rig.
      </p>

      <h2>The single most important parameter: use_individual</h2>
      <p>
        Everything else is tuning. This parameter determines the fundamental
        shape of the output.
      </p>
      <pre>{`# COLLECTIVE inset (use_individual=False, the default)
# → One continuous groove ring around the ENTIRE selection perimeter.
# Interior shared edges between selected faces are absorbed.
# Use this for: decorative panel zones, surface section borders, frame insets.
bmesh.ops.inset_faces(bm, faces=panel_group, use_individual=False,
                      thickness=0.025, depth=-0.006)

# INDIVIDUAL inset (use_individual=True)
# → Each face gets its OWN isolated groove ring regardless of neighbours.
# Adjacent grooves share no vertices — parallel independent quad loops.
# Use this for: button grids, rivet arrays, tile inlays, per-cell stamps.
bmesh.ops.inset_faces(bm, faces=button_group, use_individual=True,
                      thickness=0.030, depth=-0.018)`}</pre>
      <p>
        The difference is visible immediately: collective inset treats a
        selection of twelve faces as one polygon boundary; individual inset
        treats the same twelve faces as twelve separate operations, each with
        its own groove ring. Mixing the two modes on the same mesh — by
        partitioning <code>top_faces</code> into groups and calling{" "}
        <code>inset_faces</code> twice with different settings — is how the
        blueprint produces three visually distinct zones on one surface.
      </p>

      <h2>use_even_offset: compensating for non-square faces</h2>
      <p>
        On a uniform square grid every face has equal edge lengths and{" "}
        <code>thickness</code> maps directly to a consistent groove width.
        When faces are rectangular (wider than tall, or vice-versa) the inset
        distance measured along a short edge differs visually from the same
        distance on a long edge. Setting <code>use_even_offset=True</code>{" "}
        scales the inset per-edge so the groove appears the same width all
        around — a near-mandatory option for non-square panels, consoles, or
        any extruded profile with mixed aspect-ratio faces.
      </p>
      <pre>{`# Non-square faces without even offset — groove looks narrower on short edges:
bmesh.ops.inset_faces(bm, faces=f, thickness=0.030, use_even_offset=False)

# With even offset — consistent groove width regardless of aspect ratio:
bmesh.ops.inset_faces(bm, faces=f, thickness=0.030, use_even_offset=True)`}</pre>

      <h2>use_outset: raising bosses instead of cutting grooves</h2>
      <p>
        Setting <code>use_outset=True</code> reverses the inset direction: the
        operator traces outward from the face perimeter rather than inward,
        generating a raised boss or stud geometry. The{" "}
        <code>result[&apos;faces&apos;]</code> in outset mode are the original
        faces, now surrounded by an elevated rim rather than a sunken groove.
        Combine with <code>depth &gt; 0</code> to raise the boss above the
        surrounding surface, or with <code>depth = 0</code> for a flat raised
        border only.
      </p>
      <p>
        Outset mode is used less often than standard inset for hard-surface
        props, but is correct for: VRM pauldron rivets, control-panel raised
        housing borders, screw-head protrusions, and any geometry that needs
        to sit above the host surface rather than sink into it.
      </p>

      <h2>use_edge_rail: controlling corner behaviour</h2>
      <p>
        On faces with obtuse or acute corners — non-rectangular quads and all
        n-gons — the inset algorithm must decide how to handle the geometry
        where two groove edges meet. <code>use_edge_rail=True</code> guides
        the inset verts along the existing face edges (like rails), keeping
        the corner geometry predictable and crease-free. Without it, inset
        corners can spiral inward at steep angles, producing geometry that
        looks correct in Blender but causes artefacts under flat-shade export.
        Enable it for any non-square input faces or when insetting at high
        thickness values relative to the face size.
      </p>

      <h2>The result[&apos;faces&apos;] handle and chaining</h2>
      <p>
        <code>bmesh.ops.inset_faces</code> returns{" "}
        <code>{`{'faces': [BMFace, ...]}`}</code> — the inner faces after
        inset. This handle lets you chain further bmesh operations without any
        index arithmetic:
      </p>
      <pre>{`res = bmesh.ops.inset_faces(bm, faces=zone, thickness=0.025, depth=-0.006)
inner = res['faces']

# Assign a different material index to the groove inner faces:
for f in inner:
    f.material_index = 1

# Extrude the inner faces further for a deep channel:
ext = bmesh.ops.extrude_face_region(bm, geom=inner)
new_verts = [e for e in ext['geom'] if isinstance(e, bmesh.types.BMVert)]
bmesh.ops.translate(bm, verts=new_verts, vec=Vector((0, 0, -0.04)))`}</pre>
      <p>
        This pattern — inset then extrude inner — produces a recessed channel
        with a ledge, which is the canonical hard-surface panel-button geometry
        across games and film assets. Compare it with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
          className={lk}
        >
          bmesh.ops extrude + bevel + bridge prop tutorial
        </Link>
        , which chains bmesh operators in a single headless pass for a complete
        standalone prop rather than surface-detail work.
      </p>

      <h2>Partitioning top_faces by position</h2>
      <p>
        After <code>bmesh.ops.create_grid</code> generates a flat quad grid,
        the face objects themselves carry no explicit row or column index. The
        correct way to partition them is by face centre coordinate:
      </p>
      <pre>{`# Sort all top faces by Y then X — gives a stable row-major order.
top_faces.sort(key=lambda f: (round(f.calc_center_median().y, 4),
                               round(f.calc_center_median().x, 4)))

# Slice into COLS-wide rows (bottom-to-top after sort):
rows = [top_faces[i * COLS:(i + 1) * COLS] for i in range(ROWS)]
# rows[0] = bottom row, rows[-1] = top row

# Select alternating columns for the vent grille zone:
vent_faces = [f for i, f in enumerate(rows[0]) if i % 2 == 0]`}</pre>
      <p>
        The <code>round(..., 4)</code> guards against floating-point noise in{" "}
        <code>calc_center_median()</code> when faces are near-coplanar but not
        perfectly so after extrusion. Four decimal places is tight enough to
        keep faces in the same row together while leaving four orders of
        magnitude of headroom before coincident-face ambiguity.
      </p>

      <h2>Collective inset on a grouped selection</h2>
      <p>
        The vent-grille zone in the blueprint selects only the even-column
        faces from the bottom row, then passes them as a group to a single
        collective inset call. Because the selected faces are not adjacent
        (odd-column faces separate them), the collective inset traces a
        separate groove ring around each disjoint island. This produces the
        louvred-slot appearance without requiring individual mode — each slot
        is the interior of a disconnected island, so collective and individual
        produce identical topology when the face islands do not share edges.
      </p>
      <p>
        The distinction matters only when selected faces <em>share interior
        edges</em>: collective dissolves those shared edges into a single
        polygon boundary; individual preserves them and insets each face in
        isolation.
      </p>

      <h2>Connecting to the BevelModifier</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
          className={lk}
        >
          BevelModifier tutorial
        </Link>{" "}
        covers the non-destructive, stack-based approach to hard-surface
        chamfering. <code>bmesh.ops.inset_faces</code> is its destructive,
        context-free counterpart: it runs immediately on the bmesh, requires
        no modifier stack, and produces topology that is final at call time.
        Choose the BevelModifier when you need live iteration and non-destructive
        workflow; choose <code>inset_faces</code> when you are generating
        geometry programmatically in a headless script or when you want to
        immediately chain bmesh ops on the resulting inner faces.
      </p>

      <h2>WebXR export considerations</h2>
      <p>
        The flat-shaded faceted look (<code>f.smooth = False</code> on all
        faces) requires <code>export_apply=True</code> in the GLB exporter.
        Without it, the EEVEE/Cycles depsgraph re-evaluates normals using its
        own smoothing heuristic and may smooth over the crisp groove edges that
        make inset panel lines legible at WebXR viewing distances. With{" "}
        <code>export_apply=True</code>, the computed normals from the flat-shade
        flag are baked directly into the GLB <code>NORMAL</code> accessor.
      </p>
      <p>
        This is the same export pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          limited_dissolve + poke faceted ornament tutorial
        </Link>
        , which also relies on <code>f.smooth = False</code> baked into the
        GLB for the flat faceted look to survive Three.js import. Draco level 6
        compresses the groove geometry efficiently — the per-face quads in the
        groove strips are highly regular and compress to near-zero overhead.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Groove width inconsistent across face edges</strong> —{" "}
          <code>use_even_offset=False</code> on non-square faces. Enable it.
        </li>
        <li>
          <strong>Inner faces face the wrong way after inset</strong> — Call
          <code>bmesh.ops.recalc_face_normals</code> after all inset operations.
          Manual face creation (caps, fills) does not auto-correct winding.
        </li>
        <li>
          <strong>Button grooves bleed into each other</strong> —{" "}
          <code>use_individual=False</code> on adjacent faces. Switch to{" "}
          <code>use_individual=True</code>.
        </li>
        <li>
          <strong>Inset ignores boundary edges</strong> —{" "}
          <code>use_boundary=False</code>. Set it to <code>True</code> so the
          groove extends to the outer perimeter of the selection.
        </li>
        <li>
          <strong>Flat-shade grooves lost in GLB</strong> —{" "}
          <code>export_apply=False</code>. Enable it so baked normals reach the
          exporter.
        </li>
        <li>
          <strong>result[&apos;faces&apos;] is empty</strong> — thickness is so
          large it has overtaken the face centre (inset collapsed). Reduce
          thickness below half the shortest face edge length.
        </li>
        <li>
          <strong>Corner geometry kinks at high thickness</strong> —{" "}
          <code>use_edge_rail=False</code> on non-rectangular faces. Enable it.
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
          (CC-BY-SA-4.0). Authoritative reference for all bmesh operator
          signatures including <code>inset_faces</code> parameter types,
          defaults, and return values. Related upstream:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org
          </a>{" "}
          — the C implementation of <code>BM_mesh_inset_individual</code> and{" "}
          <code>BM_mesh_inset_region</code> that power the operator.
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
          (Apache-2.0). The official Blender GLB exporter. The
          <code>export_apply</code> flag that bakes flat-shade normals is
          documented in its source at{" "}
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
          (Apache-2.0) which defines the NORMAL accessor format the exporter
          targets.
        </li>
      </ul>

      <h2>Further study in this library</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
            className={lk}
          >
            bmesh.ops.limited_dissolve + poke — dense-to-faceted topology reduction
          </Link>{" "}
          — companion bmesh op that dissolves over-tessellated mesh regions
          into the minimal clean-faceted topology needed for WebXR export;
          pairs naturally with inset_faces as a post-processing step.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-spin-lathe-arch-faceted-webxr"
            className={lk}
          >
            bmesh.ops.spin — surface of revolution & partial arc
          </Link>{" "}
          — the rotational-extrude counterpart; shares the same context-free
          bmesh pattern and the same <code>export_apply=True</code> flat-shade
          export rule.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-extrude-bevel-bridge-hard-surface-prop"
            className={lk}
          >
            bmesh.ops — extrude, bevel, bridge: hard-surface prop construction
          </Link>{" "}
          — chains multiple bmesh operators in a single headless pass, the
          same compositional approach used here when chaining inset_faces with
          extrude_face_region on the inner result faces.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
            className={lk}
          >
            BevelModifier — hard-surface edge chamfer & harden normals
          </Link>{" "}
          — the non-destructive modifier-stack counterpart; covers when to
          prefer a live modifier over a destructive bmesh op and how both
          integrate with the same Draco-compressed WebXR GLB export pipeline.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr",
  title:
    "Python bmesh.ops.inset_faces — Collective & Individual Inset: Panel-Line Grooves, Button Recesses & Vent Grilles for WebXR (Blender 5.1)",
  description:
    "Build a hard-surface console panel with three inset strategies — collective groove border (use_individual=False), per-button recess (use_individual=True + depth), and alternating-face vent louvers — using bmesh.ops.inset_faces with expert coverage of thickness, depth, use_even_offset, use_outset, use_edge_rail, and the result['faces'] chaining handle.",
  date: "2026-07-18",
  topic: "scripting",
  tags: [
    "blender",
    "python",
    "scripting",
    "bmesh",
    "inset-faces",
    "panel-lines",
    "hard-surface",
    "console",
    "webxr",
    "glb",
    "faceted",
  ],
  libraryPath:
    "blends/scripting/python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr",
  Body,
  keyInsights: [
    "use_individual=False traces ONE groove ring around the entire selection perimeter — interior shared edges are dissolved; use_individual=True gives every face its own isolated groove ring regardless of neighbours",
    "depth acts relative to the FACE NORMAL, not world Z — depth=-0.018 pushes the inner face 18 mm away from you on a +Z face, but 18 mm in Y on a +Y side face",
    "result['faces'] returns the inner (inset) faces as BMFace objects — chain bmesh.ops.extrude_face_region or material_index assignment directly without any index arithmetic",
    "use_even_offset=True is near-mandatory on non-square faces — without it the groove appears narrower on short edges and wider on long edges, breaking the uniform panel-line look",
    "use_outset=True reverses direction: generates a raised boss around the face perimeter instead of a sunken groove — combine with depth > 0 for VRM rivets and stud protrusions",
    "thickness collapsing to zero (result['faces'] empty) means thickness ≥ half the shortest face edge — reduce thickness or the face is too small for the chosen groove width",
  ],
});
