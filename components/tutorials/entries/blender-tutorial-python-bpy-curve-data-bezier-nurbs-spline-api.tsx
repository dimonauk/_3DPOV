import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s <code>bpy.types.Curve</code> data-block underpins every
        curve object — Bézier paths, NURBS circles, poly-splines, and text
        outlines all share this single type. Most tutorials reach for{" "}
        <code>bpy.ops.curve.*</code> operators, but operators poll for an active
        3D Viewport in Curve Edit Mode, which never exists in a headless or
        background script. The data API carries no such restriction: it runs
        anywhere, gives exact control over every handle, weight, and bevel
        parameter, and produces deterministic results with no operator overhead.
      </p>

      <h2>CurveData → Spline → Points</h2>
      <p>
        Three spline types live on one data-block:{" "}
        <strong>BEZIER</strong> (independent handles per point),{" "}
        <strong>NURBS</strong> (weighted rational B-spline with configurable
        order), and <strong>POLY</strong> (straight edges, no interpolation). A
        single <code>bpy.types.Curve</code> can hold multiple splines of
        different types simultaneously — useful for SVG logos built from Bézier
        outlines and NURBS arc fillets in the same data-block.
      </p>
      <pre>{`cu            = bpy.data.curves.new("cable", type='CURVE')
cu.dimensions = '3D'          # '2D' locks Z — correct for logos, wrong for 3-D paths
spl_bz = cu.splines.new(type='BEZIER')  # adds one Bézier spline
spl_nu = cu.splines.new(type='NURBS')   # adds a NURBS spline to the same block
obj = bpy.data.objects.new("cable", cu)
bpy.context.collection.objects.link(obj)`}</pre>

      <h2>Bézier control points</h2>
      <p>
        <code>splines.new(&apos;BEZIER&apos;)</code> creates one control point.{" "}
        <code>bezier_points.add(n)</code> appends <em>n</em> more. Points are
        indexed and written directly — no mode switch, no selection required.
      </p>
      <pre>{`spl = cu.splines.new('BEZIER')
spl.bezier_points.add(3)   # new() gives 1; add(3) → 4 total

p = spl.bezier_points[0]
p.co               = Vector((-1.0, 0.0, 0.0))
p.handle_left_type = 'VECTOR'  # tracks to neighbour — sharp corner
p.handle_right_type = 'VECTOR'`}</pre>
      <p>Handle type reference:</p>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Behaviour</th>
            <th>Studio use</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>VECTOR</code>
            </td>
            <td>Tracks to neighbour position; Blender recomputes on move</td>
            <td>Cable mount points, hard right-angle corners</td>
          </tr>
          <tr>
            <td>
              <code>AUTO</code>
            </td>
            <td>Blender solves smoothest handle; magnitude updates automatically</td>
            <td>Organic mid-route waypoints, natural S-curves</td>
          </tr>
          <tr>
            <td>
              <code>ALIGNED</code>
            </td>
            <td>Both handles collinear; magnitudes editable independently</td>
            <td>Smooth entry/exit with deliberate acceleration</td>
          </tr>
          <tr>
            <td>
              <code>FREE</code>
            </td>
            <td>Fully independent left and right handles</td>
            <td>Cusps, inflections, hand-tweaked paths</td>
          </tr>
        </tbody>
      </table>
      <p>
        Explicitly setting <code>handle_left</code> /{" "}
        <code>handle_right</code> Vector positions is only respected for{" "}
        <code>FREE</code> and <code>ALIGNED</code> types. For{" "}
        <code>AUTO</code> and <code>VECTOR</code>, Blender recomputes them on
        the next evaluation and silently ignores any values you wrote — a common
        source of confusion when porting scripts from external curve tooling.
      </p>
      <pre>{`# AUTO midpoints: write .co only; handles are computed on evaluation
for i, co in enumerate([(-0.3, 0.4, 0.3), (0.3, -0.4, 0.3)]):
    p = spl.bezier_points[i + 1]
    p.co                = Vector(co)
    p.handle_left_type  = 'AUTO'
    p.handle_right_type = 'AUTO'`}</pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-tangent-normal-frenet-ribbon-beam-webxr"
          className={lk}
        >
          Frenet-Serret ribbon beam tutorial
        </Link>{" "}
        shows how Geometry Nodes reads the evaluated tangent and normal vectors
        downstream. AUTO handles produce smooth Frenet frames with no
        discontinuities; VECTOR corners create sharp kinks in the frame that
        propagate into any GN ribbon or tube built on the same spline.
      </p>

      <h2>NURBS control points</h2>
      <p>
        NURBS points carry homogeneous (x, y, z, w) coordinates. Equal weights
        produce a uniform B-spline; setting w &gt; 1 on a control point pulls the
        curve towards it (conic sections use specific rational weights).{" "}
        <code>order_u</code> is degree + 1 — value 4 gives cubic smoothness, the
        minimum order for a visually round closed ring.{" "}
        <code>use_cyclic_u = True</code> closes the loop across the
        last-to-first gap. Never combine cyclic with{" "}
        <code>use_endpoint_u = True</code> — they contradict each other and
        Blender silently ignores the endpoint-clamping flag.
      </p>
      <pre>{`import math

spl             = cu.splines.new('NURBS')
spl.points.add(7)          # new() gives 1; total → 8
spl.order_u     = 4
spl.use_cyclic_u = True
spl.use_endpoint_u = False  # cyclic + endpoint_u is contradictory

N = 8; R = 0.5
for i, pt in enumerate(spl.points):
    a = 2 * math.pi * i / N
    pt.co = (math.cos(a) * R, math.sin(a) * R, 0.0, 1.0)  # w=1 → uniform`}</pre>

      <h2>Bevel for tube geometry</h2>
      <p>
        <code>cu.bevel_depth</code> sweeps a circle of that radius along the
        path, turning the wire into a tube. <code>cu.bevel_resolution</code>{" "}
        sets the cross-section vertex count — 4 gives an octagon; 0 gives a
        square. For WebXR, keep this at 3–4; a cable with 4 cross-section edges
        costs 8 faces per path segment versus 256 for the default 32.{" "}
        <code>fill_mode = &apos;FULL&apos;</code> closes the bevel end-caps —
        without it the tube is open-ended and normals flip on export.
      </p>
      <pre>{`cu.bevel_depth      = 0.04    # tube radius in metres
cu.bevel_resolution = 4       # octagon cross-section
cu.fill_mode        = 'FULL'  # close end caps
cu.resolution_u     = 6       # path sampling rate (default 12 is over-dense for WebXR)`}</pre>
      <p>
        <code>bevel_factor_start</code> / <code>bevel_factor_end</code> (0–1)
        trim the tube from either end. Animating{" "}
        <code>bevel_factor_end</code> from 0 to 1 produces a &ldquo;self-writing
        cable&rdquo; reveal without any Geometry Nodes — just insert keyframes
        on the <code>CurveData</code> block directly. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path"
          className={lk}
        >
          railing along a Bézier path tutorial
        </Link>{" "}
        for the Geometry Nodes approach to the same curve-to-profile sweep.
      </p>
      <pre>{`cu.bevel_factor_end = 0.0
cu.keyframe_insert('bevel_factor_end', frame=1)
cu.bevel_factor_end = 1.0
cu.keyframe_insert('bevel_factor_end', frame=48)  # cable writes itself over 2 s`}</pre>

      <h2>Converting to mesh for GLB export</h2>
      <p>
        glTF 2.0 has no native curve primitive — the exporter cannot serialise
        bevel geometry from a CurveData block. Conversion is required and needs
        OBJECT mode with the object active and selected.
      </p>
      <pre>{`bpy.ops.object.select_all(action='DESELECT')
obj.select_set(True)
bpy.context.view_layer.objects.active = obj
bpy.ops.object.convert(target='MESH', keep_original=False)
# obj.data is now bpy.types.Mesh; original CurveData is freed`}</pre>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-batch-glb-exporter"
          className={lk}
        >
          batch GLB exporter tutorial
        </Link>{" "}
        wraps this conversion in a try/finally block so that the source
        CurveData survives in the <code>.blend</code> even when export fails
        mid-batch.
      </p>

      <h2>Reading existing curve data from Python</h2>
      <p>
        The data API is bidirectional. To inspect or modify a curve object
        imported from SVG, DXF, or created by a GN node tool:
      </p>
      <pre>{`for obj in bpy.data.objects:
    if obj.type != 'CURVE':
        continue
    for spl in obj.data.splines:
        n = len(spl.bezier_points) if spl.type == 'BEZIER' else len(spl.points)
        print(spl.type, n, "points")
        if spl.type == 'BEZIER':
            for pt in spl.bezier_points:
                print("  co", pt.co, "hl", pt.handle_left_type)`}</pre>
      <p>
        For GN-side curve manipulation on data built this way, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-offset-point-in-curve-chain-links"
          className={lk}
        >
          Offset Point in Curve chain-link tutorial
        </Link>{" "}
        — those nodes evaluate the same CurveData output downstream.
      </p>

      <h2>Studio pipeline context</h2>
      <p>
        The Holoflow WebXR scene format stores cable routes as JSON arrays of
        control points exported from the Three.js spatial editor.{" "}
        <code>tools/blender-addon/holoflow_macros/curve_from_json.py</code>{" "}
        reads those arrays and rebuilds Bézier curves in Blender via the data
        API so the routing can be refined in a full 3-D environment before
        re-export. See the{" "}
        <Link href="/tutorials/blender-to-site-asset-pipeline" className={lk}>
          Holoflow asset pipeline overview
        </Link>{" "}
        for where this round-trip sits.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>NURBS ring looks like a peanut or straight line</strong> —
          fewer control points than <code>order_u</code>. NURBS requires at
          least <code>order_u</code> points to evaluate; with 3 points and
          order 4 the curve degenerates. Raise points or lower order.
        </li>
        <li>
          <strong>Bevel caps missing on export</strong> — <code>fill_mode</code>{" "}
          was not set to <code>&apos;FULL&apos;</code>. The default{" "}
          <code>&apos;HALF&apos;</code> generates open-ended tubes.
        </li>
        <li>
          <strong>
            <code>convert(target=&apos;MESH&apos;)</code> errors in headless
          </strong>{" "}
          — the operator polls for a screen context. Use{" "}
          <code>
            bpy.context.temp_override(window=bpy.context.window_manager.windows[0])
          </code>{" "}
          or evaluate via <code>depsgraph.objects[name].to_mesh()</code> and
          write the result to a new mesh data-block manually.
        </li>
        <li>
          <strong>AUTO handles wrong after add()</strong> — <code>add(n)</code>{" "}
          places new points at the world origin. Set <code>.co</code> on all
          points before any render or export call; Blender updates AUTO handles
          at evaluation time, not when you write <code>.co</code>, so all
          positions must be final first.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <em>bpy.types.Curve Python API reference</em> — CC-BY-SA —{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.Curve.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            docs.blender.org/api/current/bpy.types.Curve.html
          </a>{" "}
          — field-by-field documentation for CurveData, Spline,
          BezierSplinePoint, and SplinePoint; sibling pages cover
          bpy.types.Object and the full curve modifier stack.
        </li>
        <li>
          Robert Guetzkow —{" "}
          <em>blender-python-examples</em> — MIT —{" "}
          <a
            href="https://github.com/robertguetzkow/blender-python-examples"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/robertguetzkow/blender-python-examples
          </a>{" "}
          — practical add-on patterns for operators, panels, and property
          groups; sibling resources in the same repository cover bpy.props and
          registration patterns directly applicable to a curve-import pipeline
          add-on.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-python-bpy-curve-data-bezier-nurbs-spline-api",
  title:
    "Python bpy.types.Curve — Bézier & NURBS Spline Data API for Procedural Path Generation (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Build Bézier S-curves and NURBS rings directly from the Python data API — no operators, no context dependencies. Covers spline types, handle modes (VECTOR/AUTO/ALIGNED/FREE), NURBS order + cyclic, bevel tube geometry, resolution_u, bevel_factor keyframe animation, and mesh conversion for GLB export.",
  tags: [
    "blender",
    "python",
    "scripting",
    "curves",
    "bezier",
    "nurbs",
    "animation",
    "export",
    "glb",
    "webxr",
    "pipeline",
  ],
  Body,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/scripting/python-bpy-curve-data-bezier-nurbs-spline-api",
    time: "one to two hours",
    difficulty: "advanced",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    prerequisites: [
      "Comfortable with the Blender Scripting workspace and running Python scripts",
      "Understands Blender curve objects (Add > Curve > Bézier / NURBS)",
      "Familiar with the bpy.data vs bpy.ops distinction",
    ],
  },
  base,
);
