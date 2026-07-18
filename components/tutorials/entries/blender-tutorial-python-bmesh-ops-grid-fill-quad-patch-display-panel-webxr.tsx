import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>bmesh.ops.grid_fill</code> closes a rectangular hole in a mesh
        with a clean N×M quad patch — all quads, no triangles, predictable flow.
        It is the context-free kernel behind Blender&apos;s interactive{" "}
        <strong>Grid Fill</strong> tool (the <kbd>F</kbd> key in Edge select mode
        with a structured loop selected). Unlike{" "}
        <code>bmesh.ops.holes_fill</code>, which triangulates arbitrary n-gon
        boundaries with no regard for edge flow, <code>grid_fill</code> produces
        a uniform grid that UV-unwraps cleanly and deforms predictably under
        animation. The trade-off is strict: the boundary must be
        &ldquo;rectangular&rdquo; in topological terms or the operator fails
        silently. This blueprint builds a sci-fi terminal display panel in one
        headless session to show exactly how to satisfy that constraint.
      </p>

      <h2>How grid_fill works internally</h2>
      <p>
        The operator analyses the input edge loop to find four corner vertices —
        vertices whose edge valence inside the loop is 1 (a bend, not a straight
        run). It then partitions the loop into four rails: top, bottom, left,
        right. The prerequisite for success is:
      </p>
      <pre>{`len(top_rail)    == len(bottom_rail)   # e.g. 6 == 6
len(left_rail)   == len(right_rail)    # e.g. 4 == 4`}</pre>
      <p>
        When the counts match, the operator lofts a{" "}
        <code>top_count × left_count</code> quad grid between the four rails
        using cubic Bezier interpolation (<code>use_interp_simple=False</code>)
        or strict linear interpolation (<code>use_interp_simple=True</code>).
        On a flat surface both modes produce identical results; on a curved
        surface the default cubic mode follows the surface&apos;s natural arc.
      </p>

      <h2>The silent-fail trap</h2>
      <p>
        When the boundary rail counts do not match, <code>grid_fill</code>{" "}
        returns an empty list with{" "}
        <strong>no Python exception</strong>. The script continues running as
        though nothing happened, and you discover the missing geometry only when
        you inspect the mesh. Always assert immediately after the call:
      </p>
      <pre>{`result = bmesh.ops.grid_fill(bm, edges=hole_edges, mat_nr=MAT_SCREEN)
assert len(result['faces']) == SCREEN_COLS * SCREEN_ROWS, (
    f"grid_fill returned {len(result['faces'])} faces; expected {SCREEN_COLS * SCREEN_ROWS}\\n"
    "Check that opposing rails have equal edge counts"
)`}</pre>
      <p>
        Contrast with <code>bmesh.ops.inset_faces</code> (covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-inset-faces-panel-lines-recess-hard-surface-webxr"
          className={lk}
        >
          inset_faces panel-line tutorial
        </Link>
        ), which returns an empty <code>result[&apos;faces&apos;]</code> when
        thickness overtakes the face centre — the same silent pattern. Treat
        every bmesh op that returns geometry as requiring a post-call assertion.
      </p>

      <h2>Boundary loop construction strategy</h2>
      <p>
        Building the boundary loop manually (creating individual{" "}
        <code>BMVert</code> objects and connecting them with{" "}
        <code>bmesh.ops.contextual_create</code>) is error-prone and verbose.
        The blueprint uses a cleaner path:
      </p>
      <pre>{`# 1. Create a PANEL_COLS × PANEL_ROWS uniform quad grid
bmesh.ops.create_grid(bm, x_segments=8, y_segments=6, size=1.0, calc_uvs=False)

# 2. Identify the inner "screen" faces by their centroid coordinates
screen_faces = [f for f in bm.faces if sx_min < f.calc_center_median().x < sx_max
                                    and sy_min < f.calc_center_median().y < sy_max]

# 3. Record boundary edges BEFORE deletion — edges shared by exactly one screen face
from collections import Counter
edge_in_screen: Counter = Counter()
for f in screen_faces:
    for e in f.edges:
        edge_in_screen[e] += 1
hole_edges = [e for e, cnt in edge_in_screen.items() if cnt == 1]

# 4. Delete screen faces (context='FACES' removes interior dangling edges too)
bmesh.ops.delete(bm, geom=screen_faces, context='FACES')

# 5. Fill the hole — hole_edges still valid; they're attached to bezel faces
result = bmesh.ops.grid_fill(bm, edges=hole_edges, mat_nr=MAT_SCREEN)`}</pre>
      <p>
        Step 3 is the critical timing: collect the boundary edges while the
        screen faces still exist. Once you delete those faces, the only reliable
        way to retrieve the boundary edges is a coordinate-range query, which is
        more fragile. The <code>Counter</code> approach is topologically exact.
      </p>
      <p>
        The <code>context=&apos;FACES&apos;</code> delete mode removes the
        selected faces AND any edges or vertices that would be left dangling
        (i.e. connected to no remaining face). Interior screen edges lose both
        their adjacent screen faces and are removed. Boundary edges keep one
        bezel face and survive. This gives a clean hole with a closed loop.
      </p>

      <h2>use_interp_simple: cubic vs linear</h2>
      <p>
        <code>use_interp_simple=False</code> (the default) uses cubic Bezier
        interpolation. Each interior vertex is placed according to the
        curvature of the boundary rails, which matters when the rails are
        curved — for example, filling a rectangular hole on a sphere surface.
        On a flat panel the distinction is invisible.{" "}
        <code>use_interp_simple=True</code> strictly linearly interpolates
        between opposing rail vertex pairs — useful when you need perfectly
        straight interior rows on a curved boundary, for instance a flat LCD
        panel embedded in a cylindrical bezel. In practice: leave it{" "}
        <code>False</code> unless you&apos;re deliberately flattening curved
        interpolation for a hard-surface panel-on-cylinder scenario.
      </p>

      <h2>mat_nr and multi-material workflow</h2>
      <p>
        The <code>mat_nr</code> parameter assigns a material index to every
        new face returned by <code>grid_fill</code>. In this blueprint, bezel
        faces carry <code>MAT_BEZEL = 0</code> (dark metallic Principled BSDF)
        and the new screen patch carries <code>MAT_SCREEN = 1</code> (teal
        Emission node). The material slots on the mesh object must match these
        indices — <code>me.materials.append(mat_bezel)</code> places{" "}
        <code>mat_bezel</code> at slot 0 and{" "}
        <code>me.materials.append(mat_screen)</code> places{" "}
        <code>mat_screen</code> at slot 1. Getting this ordering wrong produces
        a silent face/material mismatch that is difficult to debug once the GLB
        is in a WebXR viewer.
      </p>
      <p>
        The holographic panel emission technique (strength, colour temperature,
        and fresnel rim) is explored in depth in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel"
          className={lk}
        >
          holographic panel emission + Fresnel shader tutorial
        </Link>
        . Apply that shader to <code>mat_screen</code> for a production-quality
        glow.
      </p>

      <h2>WebXR export considerations</h2>
      <p>
        <code>export_apply=True</code> in the GLB exporter bakes the flat-shade
        flag (<code>f.smooth = False</code>) into the GLB{" "}
        <code>NORMAL</code> accessor as explicit per-corner normals. Without it,
        the viewer&apos;s material system re-evaluates normals and may smooth
        over the crisp boundary between the bezel ring and the screen patch —
        destroying the visible seam that separates the two materials. This is
        the same export rule that governs every flat-shaded faceted asset in
        this library. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
          className={lk}
        >
          limited_dissolve + poke faceted ornament tutorial
        </Link>{" "}
        for the complete reasoning behind the flat-shade + export_apply pairing.
      </p>
      <p>
        The panel is built in the XY plane and exported with{" "}
        <code>export_yup=True</code>, which rotates it to{" "}
        <code>+Y up</code> convention for Three.js / WebXR. If you rotate the
        object in Blender to stand it upright before export, call{" "}
        <code>bpy.ops.object.transform_apply(rotation=True)</code> first so the
        applied rotation is baked into vertex positions and not left as a node
        transform in the GLB (node transforms can conflict with instancing rigs
        in WebXR scenes).
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>
            <code>result[&apos;faces&apos;]</code> is empty, no error
          </strong>{" "}
          — grid_fill failed silently. Inspect rail counts: print{" "}
          <code>len(hole_edges)</code> and verify it equals{" "}
          <code>2 * SCREEN_COLS + 2 * SCREEN_ROWS</code>. Unequal opposing
          rails are the most common cause.
        </li>
        <li>
          <strong>Interior edges not removed after delete</strong> — used{" "}
          <code>context=&apos;FACES_ONLY&apos;</code> instead of{" "}
          <code>context=&apos;FACES&apos;</code>. The former keeps all edges
          and vertices, leaving dangling interior geometry that confuses
          grid_fill&apos;s corner detection.
        </li>
        <li>
          <strong>Hole boundary edges invalidated after delete</strong> — the
          boundary edges were attached to screen faces, not bezel faces, at
          collection time. Re-check the Counter logic:{" "}
          <code>cnt == 1</code> means the edge touches exactly ONE screen face
          (it also touches a bezel face from the other side). Interior edges
          have <code>cnt == 2</code> and are correctly excluded.
        </li>
        <li>
          <strong>Grid fill warps on a curved surface</strong> — set{" "}
          <code>use_interp_simple=True</code> to force straight rows, then
          manually relax interior verts with{" "}
          <code>bmesh.ops.smooth_laplacian_vert</code> for a compromise.
        </li>
        <li>
          <strong>Screen patch normals inverted in viewer</strong> — run{" "}
          <code>bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces[:]))</code>{" "}
          after grid_fill and after the extrusion step. The extrusion can flip
          the winding of the back-face cap.
        </li>
        <li>
          <strong>Wrong material on screen patch in GLB</strong> — material
          slots are order-dependent. Ensure{" "}
          <code>me.materials.append(mat_bezel)</code> runs first (slot 0) and{" "}
          <code>me.materials.append(mat_screen)</code> second (slot 1), matching{" "}
          <code>MAT_BEZEL = 0</code> and <code>MAT_SCREEN = 1</code>.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Blender bmesh.ops API — 5.1</strong> — Blender Foundation,{" "}
          <a
            href="https://docs.blender.org/api/5.1/bmesh.ops.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org/api/5.1/bmesh.ops.html
          </a>{" "}
          (CC-BY-SA-4.0). Authoritative operator signatures for{" "}
          <code>grid_fill</code>, <code>create_grid</code>,{" "}
          <code>extrude_face_region</code>, and the <code>delete</code> context
          enum. Related upstream:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            projects.blender.org/blender/blender
          </a>{" "}
          — the C implementation lives in{" "}
          <code>source/blender/bmesh/operators/bmo_fill_grid.cc</code>.
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
          (Apache-2.0). The official Blender GLB exporter; the{" "}
          <code>export_apply</code> and <code>export_yup</code> flags used in
          this blueprint are documented in its source. Related:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF
          </a>{" "}
          (Apache-2.0) — the specification defining the NORMAL accessor and
          multi-material mesh primitive format the exporter targets.
        </li>
      </ul>

      <h2>Further study in this library</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-spin-lathe-arch-faceted-webxr"
            className={lk}
          >
            bmesh.ops.spin — surface of revolution & partial arc
          </Link>{" "}
          — rotational-extrude counterpart to grid_fill; shares the same
          context-free bmesh pattern and the same flat-shade export rule, and
          produces radially symmetric geometry where grid_fill produces
          rectangular patches.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bmesh-ops-limited-dissolve-poke-faceted-ornament-webxr"
            className={lk}
          >
            bmesh.ops.limited_dissolve + poke — faceted ornament
          </Link>{" "}
          — the dissolution complement: where grid_fill adds structured quads to
          fill a hole, limited_dissolve removes over-tessellated quads to reach
          the minimal faceted topology.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-holographic-panel-emission-fresnel"
            className={lk}
          >
            Shader — holographic panel: Emission + Fresnel rim
          </Link>{" "}
          — the production shader for the screen patch built in this tutorial;
          adds a Fresnel rim glow to the Emission node so the display reads as
          lit from within at shallow viewing angles.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr"
            className={lk}
          >
            BevelModifier — hard-surface edge chamfer & harden normals
          </Link>{" "}
          — add a BevelModifier above the base mesh to chamfer the bezel corners
          for a polished device look; the modifier stack approach keeps the
          blueprint mesh clean while adding visual complexity non-destructively.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bmesh-ops-grid-fill-quad-patch-display-panel-webxr",
    title:
      "Python bmesh.ops.grid_fill — Structured Quad Fill: Rectangular Hole → Clean N×M Patch for Hard-Surface Display Panels & WebXR (Blender 5.1)",
    blurb:
      "bmesh.ops.grid_fill fills a rectangular hole in a mesh with a clean N×M all-quad patch — no triangles, predictable flow. Learn the silent-fail trap (no exception on bad rails), the Counter-based boundary-edge collection strategy, and how to pair it with a two-material bezel/screen display panel for WebXR GLB export.",
    body: <Body />,
    image: "/library/reference-images/bmesh-grid-fill-display-panel.jpg",
    date: "2026-07-18",
    tags: ["blender", "python", "bmesh", "hard-surface", "webxr", "scripting"],
    expertise: [
      "Run blueprint.py headless to produce a two-material display panel GLB",
      "Satisfy grid_fill's rectangular boundary prerequisite using a Counter-based edge audit",
      "Use context='FACES' delete to open a clean hole with no dangling interior edges",
      "Understand use_interp_simple: cubic Bezier vs linear rail interpolation",
      "Assert result['faces'] is non-empty after every grid_fill call",
      "Export flat-shaded multi-material GLB with export_apply=True for WebXR",
    ],
  },
  "blender"
);
