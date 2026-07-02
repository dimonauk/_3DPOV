import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnCurveArcDialGaugeBody() {
  return (
    <>
      <p>
        Most GN curve primitives produce fixed geometry you then manipulate.{" "}
        <strong>Curve Arc</strong> generates any portion of a circle using two
        angle values — making it the correct primitive for anything that
        expresses a <em>fraction</em>: a progress indicator, a compass bearing,
        a fuel gauge, a countdown ring. Where{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fill-curve-logo-extrusion-webxr-badge"
          className={lk}
        >
          Fill Curve
        </Link>{" "}
        needs a pre-drawn closed outline, Curve Arc generates the arc
        mathematically. Its <code>connect_center</code> parameter closes the arc
        into a pie slice in-node — no extra topology, no Merge by Distance step.
      </p>

      <h2>RADIUS mode vs POINTS mode</h2>
      <p>
        <strong>RADIUS mode</strong> specifies <code>Start Angle</code>,{" "}
        <code>End Angle</code>, <code>Radius</code>, and <code>Resolution</code>.
        Angles are in radians, counter-clockwise from +X. Use this for gauges
        where start and end positions are computed.{" "}
        <strong>POINTS mode</strong> fits an arc through three supplied 3-D
        points and auto-computes the centre and radius — useful when the centre
        is unknown. Both modes share <code>Offset Angle</code> (rotates the
        whole arc) and <code>Invert Arc</code> (selects the complementary arc).
      </p>

      <h2>Resolution semantics</h2>
      <p>
        <code>Resolution</code> is the number of <em>segments</em>, not points.
        A non-cyclic arc at Resolution=64 has 65&nbsp;curve points. Do{" "}
        <em>not</em> try to match Resolution to a tick count — use{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path"
          className={lk}
        >
          Resample Curve
        </Link>{" "}
        (COUNT mode) on a separate tick arc: <code>Count=11</code> gives exactly
        11 evenly-spaced points regardless of arc resolution.
      </p>

      <h2>connect_center: the pie-slice shortcut</h2>
      <p>
        With <code>Connect Center = True</code>, Curve Arc appends two line
        segments: arc_end → centre and centre → arc_start. After{" "}
        <strong>Set Spline Cyclic</strong> (Cyclic=True), the result is a closed
        pie-slice spline that{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fill-curve-logo-extrusion-webxr-badge"
          className={lk}
        >
          Fill Curve
        </Link>{" "}
        triangulates directly — no Merge by Distance, no manual centre vertex.
        The <code>Center</code> output socket (a Point geometry) can instance
        a gauge needle pivot. Compare{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-fillet-curve-neon-sign"
          className={lk}
        >
          Fillet Curve
        </Link>
        , which rounds existing poly corners; connect_center closes the arc
        topologically before Fill Curve ever sees it.
      </p>

      <h2>Mapping a 0–1 value to a sweep angle</h2>
      <p>
        A 270° gauge face (3π/2 radians) runs from 7 o&rsquo;clock to
        5 o&rsquo;clock, CCW via 12 o&rsquo;clock. Two Math nodes drive the
        sector&rsquo;s End Angle from a Group Input Float (0–1):
      </p>
      <pre className="overflow-x-auto rounded bg-neutral-900 p-4 text-sm">
        {`End Angle = GAUGE_START + Value × GAUGE_SWEEP
         = −π/4    + Value × 3π/2`}
      </pre>
      <p>
        At Value=0: End Angle = Start Angle → zero-width sector. At Value=1:
        End Angle = GAUGE_END → full sweep. The linear map means any 0–1
        source — keyframe, driver, WebXR sensor — connects without conversion.
        Contrast with{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-rolling-sphere-euler-physics"
          className={lk}
        >
          Simulation Zone
        </Link>
        , where a value accumulates frame-by-frame; here the sector re-evaluates
        fresh every frame from the single input.
      </p>

      <h2>Outer ring and tick marks</h2>
      <p>
        Border ring: <code>CurveArc(0, 2π)</code> → <code>CurveToMesh</code>{" "}
        with a Curve Circle profile (Radius=RING_WIDTH, Resolution=8).{" "}
        <code>Fill Caps = False</code> avoids z-fighting at the 0°/360° seam.
        Ticks: a second arc spanning the 270° gauge face →{" "}
        <code>ResampleCurve(COUNT=11)</code>. Feed <code>Resample.Tangent</code>{" "}
        into <strong>Align Euler to Vector</strong> (Axis=X, Pivot=Z) →{" "}
        <code>InstanceOnPoints.Rotation</code>. Without this every tick quad
        faces +Z — correct at 12 o&rsquo;clock, wrong everywhere else. Tick
        shape is a <code>from_pydata</code> quad referenced via{" "}
        <code>ObjectInfo</code> — the same{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-instance-on-points"
          className={lk}
        >
          instance-then-realise
        </Link>{" "}
        pattern.
      </p>

      <h2>WebXR export and live driving</h2>
      <p>
        <code>export_apply=True</code> is mandatory — Curve Arc outputs curves;
        the exporter needs a realised mesh. The GLB bakes the gauge at the
        current Value. For a live WebXR gauge, export at Value=0 and drive the
        arc mask via a Three.js shader uniform or morph target; the GN modifier
        is the design tool. For Blender prototyping, right-click the
        modifier&rsquo;s Value field → <em>Insert Keyframe</em>;{" "}
        <code>record.py</code> uses this for the 90-frame viewport sweep.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/primitives/arc.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Curve Arc Node — Blender 5.1 Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Canonical parameter
          reference for RADIUS/POINTS modes, <code>connect_center</code>,{" "}
          <code>invert_arc</code>, and <code>offset_angle</code>. Related nodes
          in the same Curve Primitives section:{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/primitives/circle.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Curve Circle
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/primitives/spiral.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Curve Spiral
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          · MIT · Nicolas Janakiev. Reference for{" "}
          <code>bpy.data.meshes.from_pydata</code> (used for the tick quad) and
          the scene-setup / GN-modifier-assignment pattern. Sibling:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/tree/master/scripts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            /scripts
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          · Apache-2.0 · Khronos Group. The exporter that realises the GN mesh
          and converts emission materials to{" "}
          <code>KHR_materials_emissive_strength</code>. Sibling:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/geometry-nodes/gn-curve-arc-dial-gauge-webxr-hud",
    time: "one session",
    difficulty: "intermediate",
    goal:
      "Use GeometryNodeCurveArc (RADIUS mode) to build a parametric 270° dial gauge: a border ring via Curve to Mesh, a Value-driven progress sector via connect_center + Fill Curve + Extrude Mesh, and 11 tick marks via Resample Curve + Instance on Points. Export as a WebXR GLB with emission materials.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Know how to add a GN modifier and wire Group Input / Group Output",
      "Understand Curve to Mesh and Fill Curve basics",
      "Familiar with Instance on Points and Realize Instances",
    ],
    steps: [
      {
        title: "Create the host object and materials",
        body: "Empty mesh host: bpy.data.meshes.new('gauge_host') + bpy.data.objects.new('dial_gauge', mesh). Three materials: MAT_Ring (Principled, metallic 0.9, near-black base col), MAT_Sector (Emission, green, strength 3.0), MAT_Ticks (Emission, off-white, strength 1.8). Tick quad mesh via from_pydata: 4 verts at ±TICK_WIDTH/2, ±TICK_HEIGHT/2, one quad face. Link to scene; store as tick_obj for later ObjectInfo reference.",
      },
      {
        title: "Group Input Value socket and angle maths",
        body: "ng.interface.new_socket('Value', in_out='INPUT', socket_type='NodeSocketFloat', default=0.65, min=0.0, max=1.0). Two ShaderNodeMath nodes: MULTIPLY(Value, GAUGE_SWEEP=3π/2) → ADD(result, GAUGE_START=−π/4). The ADD output is the sector End Angle. At Value=0 it equals GAUGE_START (zero-width sector). At Value=1 it equals GAUGE_END (full 270° sweep). Linear mapping: any 0–1 signal connects without extra normalisation.",
      },
      {
        title: "Outer border ring",
        body: "CurveArc: mode='RADIUS', Resolution=64, Radius=GAUGE_RADIUS, Start=0, End=math.tau. → CurveToMesh; Profile=CurvePrimitiveCircle(mode='RADIUS', Resolution=8, Radius=RING_WIDTH); Fill Caps=False (prevents z-fight at 0°/360° seam). → SetMaterial(MAT_Ring). Optional: Merge by Distance (0.0001) before GLB export to weld the seam gap for fully closed topology.",
      },
      {
        title: "Progress sector with connect_center",
        body: "CurveArc: mode='RADIUS', Resolution=48, Radius=GAUGE_RADIUS − RING_WIDTH×2.2, Start=GAUGE_START, Connect Center=True; End=driven from Math chain. → SetSplineCyclic(True) — closes the pie-slice path. → FillCurve(TRIANGLES) → ExtrudeMesh(FACES, Offset=(0,0,FILL_DEPTH)) → SetMaterial(MAT_Sector). connect_center turns the open arc into three connected segments (arc + two radii); SetSplineCyclic closes the junction so FillCurve finds a valid closed spline.",
      },
      {
        title: "Tick marks: Resample + Instance on Points",
        body: "Tick CurveArc: mode='RADIUS', Resolution=48, Radius=GAUGE_RADIUS + RING_WIDTH×0.5, Start=GAUGE_START, End=GAUGE_END. → ResampleCurve(COUNT=TICK_COUNT=11). → InstanceOnPoints: Instance=ObjectInfo(tick_obj, ORIGINAL); Rotation=AlignEulerToVector(Axis='X', Pivot='Z', Vector=Resample.Tangent). → RealizeInstances → SetMaterial(MAT_Ticks). Tangent-to-rotation via AlignEulerToVector is the only way to get radial orientation; default identity rotation leaves all ticks facing +Z.",
      },
      {
        title: "Join, holoflow flag, export",
        body: "JoinGeometry collects ring, sector, ticks. StoreNamedAttribute(domain='FACE', data_type='FLOAT', name='holoflow:facet', value=1.0) → GroupOutput. Export: bpy.ops.export_scene.gltf(export_apply=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_image_format='WEBP'). export_apply=True is mandatory — without it the exporter serialises the unevaluated empty mesh (zero faces).",
      },
    ],
    troubleshooting: [
      {
        symptom: "Progress sector always empty regardless of Value",
        cause:
          "Sector arc End Angle socket is not driven. If End Angle = Start Angle the arc has zero length and connect_center produces a degenerate spline Fill Curve cannot fill.",
        fix: "Hover over the sector CurveArc End Angle socket while sliding the Value modifier input — the value must change. If it stays fixed, verify the ShaderNodeMath chain output connects to the sector arc's End Angle specifically (each arc node has its own socket). Confirm in the Spreadsheet editor: CurveArc output Curve should have points > 1.",
      },
      {
        symptom: "Sector is a full disc; gauge ignores Value",
        cause:
          "Connect Center is False or Set Spline Cyclic node is missing. Without connect_center the arc endpoints are open; without SetSplineCyclic the three-segment path is still open — Fill Curve produces no output in either case.",
        fix: "Enable Connect Center on the sector CurveArc AND add SetSplineCyclic (Cyclic=True) between CurveArc and FillCurve. The required order is strict: CurveArc → SetSplineCyclic → FillCurve. Swapping or removing either breaks closure.",
      },
      {
        symptom: "Tick marks all face the same direction",
        cause:
          "Rotation socket on Instance on Points is unwired. Default rotation is identity — all instances face +Z, correct at 12 o'clock, wrong everywhere else on the arc.",
        fix: "Wire ResampleCurve.outputs['Tangent'] → AlignEulerToVector.inputs['Vector'] (Axis='X', Pivot='Z'), then AlignEulerToVector.outputs['Rotation'] → InstanceOnPoints.inputs['Rotation']. This rotates each tick quad so its local +X points along the curve tangent, which is radially outward for a circular arc.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-curve-arc-dial-gauge-webxr-hud",
    title:
      "GN Curve Arc — Parametric Dial Gauge: connect_center Pie Sector, Resample Ticks & WebXR HUD Export (Blender 5.1)",
    date: "2026-07-02",
    kind: "tutorial",
    excerpt:
      "GeometryNodeCurveArc (RADIUS mode) generates exact circular arcs without a base mesh. connect_center turns a partial arc into a pie-slice spline for Fill Curve, a Float Group Input drives the sector end angle linearly, and Resample Curve (COUNT) places tick marks with exact spacing. Exports as a WebXR GLB with emission materials.",
    Body: GnCurveArcDialGaugeBody,
  },
);
