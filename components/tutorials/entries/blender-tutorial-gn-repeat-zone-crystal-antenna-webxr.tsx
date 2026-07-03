import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender has two iterative zones in Geometry Nodes. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-rolling-sphere-physics"
          className={lk}
        >
          Simulation Zone
        </Link>{" "}
        advances one timestep per playback frame — it is time-coupled, which
        means you must play back to frame N to see N iterations. The{" "}
        <strong>Repeat Zone</strong> collapses all N iterations into a single
        depsgraph evaluation. Every time you adjust a parameter the entire
        structure rebuilds in milliseconds, with no cache to invalidate.
        Keyframe the <code>Iterations</code> modifier input and scrub: the
        crystal grows and shrinks in real-time. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-iterative-lsystem-branch-growth"
          className={lk}
        >
          L-system spike-ball tutorial
        </Link>{" "}
        covers the same zone via face-extrude; this tutorial uses a
        point-cloud carrier and <code>CurveLine + CurveToMesh +
        InstanceOnPoints</code> to grow a WebXR antenna tree. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          crystal cluster tutorial
        </Link>{" "}
        for a Voronoi-seeded variation of the same zone principle.
      </p>

      <p className="mt-4">
        The mechanism is named items: user-defined sockets that thread a value
        from one iteration into the next. Here we carry three — an{" "}
        <code>Accum</code> geometry that accumulates branch tubes, a{" "}
        <code>Tips</code> point cloud of current branch endpoints, and a{" "}
        <code>Scale</code> float that shrinks by <code>SHRINK_RATIO</code> each
        generation to taper the tubes. This is directly analogous to the
        carried state in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-foreach-element-zone-stone-chisel-wall"
          className={lk}
        >
          Foreach Element Zone
        </Link>
        , where the Output node&apos;s <code>items</code> attribute defines
        both input and output sockets simultaneously.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The CurveLine + CurveToMesh tube trick
      </h2>
      <p className="mt-2">
        The conventional approach for oriented tube instances is{" "}
        <code>InstanceOnPoints</code> with a cylinder template, plus{" "}
        <code>AlignEulerToVector</code> to rotate each instance toward its
        child. That requires an external object reference and a rotation
        argument. There is a cleaner route: set{" "}
        <code>CurveLine.End = branch_offset_vector</code>. The line now lives
        from <code>(0,0,0)</code> to the branch endpoint in local space. Sweep
        a hex-circle profile along it with <code>CurveToMesh</code> (Fill Caps
        on) and you have a tube that already points in the right direction.
        When <code>InstanceOnPoints</code> places this tube geometry at each
        tip, the tip maps to the instance local origin; the tube root coincides
        with the tip and the far end coincides with the child position. No
        rotation argument, no reference object.
      </p>
      <p className="mt-2">
        The same trick powers the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-resample-curve-railing-balustrade-bezier-path"
          className={lk}
        >
          railing balustrade tutorial
        </Link>{" "}
        (profile swept along a path) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-catenary-curve-cable-array-webxr"
          className={lk}
        >
          catenary cable array
        </Link>{" "}
        (curve shape drives instance geometry). In all three cases the insight
        is the same: when the geometry itself encodes orientation, the
        instancing step becomes trivial.
      </p>

      <h2 className="mt-6 text-lg font-semibold">L-system branch directions</h2>
      <p className="mt-2">
        The three branch directions are unit vectors on a cone of half-angle
        38° centred on +Z, separated by 120° in azimuth. We pre-compute them
        in Python before building the node tree:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-xs leading-relaxed text-neutral-100">
        {`_s = math.sin(math.radians(38))
_c = math.cos(math.radians(38))
BRANCH_DIRS = [
    (_s * math.sin(az), _s * math.cos(az), _c)
    for az in (0.0, math.tau / 3, 2 * math.tau / 3)
]`}
      </pre>
      <p className="mt-2">
        Each tuple is a guaranteed unit vector (sin²+cos² = 1), so
        multiplying by <code>BRANCH_LENGTH × Scale</code> gives the exact
        endpoint with no normalisation step. These constants plug directly into{" "}
        <code>vm.inputs[0].default_value</code> on three separate{" "}
        <code>ShaderNodeVectorMath(SCALE)</code> nodes — no VectorRotate nodes
        inside the zone body. Fewer nodes means a simpler wiring diagram and
        faster evaluation.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Adding Repeat Zone items in Python
      </h2>
      <p className="mt-2">
        Items are declared on the <em>Output</em> node; Blender
        automatically creates matching sockets on the Input node:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-neutral-900 px-4 py-3 text-xs leading-relaxed text-neutral-100">
        {`rpt_in  = nodes.new('GeometryNodeRepeatInput')
rpt_out = nodes.new('GeometryNodeRepeatOutput')
rpt_out.items.new('GEOMETRY', 'Accum')   # index 0 on rpt_out.inputs / outputs
rpt_out.items.new('GEOMETRY', 'Tips')    # index 1
rpt_out.items.new('FLOAT',    'Scale')   # index 2

# rpt_in.inputs  : [0]=Iterations, [1]=Accum_init, [2]=Tips_init, [3]=Scale_init
# rpt_in.outputs : [0]=Iteration Index, [1]=Accum, [2]=Tips, [3]=Scale
# rpt_out.inputs : [0]=Accum_next, [1]=Tips_next, [2]=Scale_next
# rpt_out.outputs: [0]=Accum_final, [1]=Tips_final, [2]=Scale_final`}
      </pre>
      <p className="mt-2">
        The <code>Iteration Index</code> output (index 0 on rpt_in) holds the
        current zero-based iteration counter. We do not use it here — the
        taper is handled by multiplying the carried <code>Scale</code> by{" "}
        <code>SHRINK_RATIO</code> inside the zone body. If you need
        iteration-dependent behaviour (e.g. alternate left/right branching
        every other pass) you can use <code>rpt_in.outputs[0]</code> with a
        Modulo node.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Vertex budget and WebXR export
      </h2>
      <p className="mt-2">
        At five iterations the structure holds 3+9+27+81+243 = 363 tube
        segments. Each hex-capped tube has 14 vertices (two rings of 6, two
        cap centres); the raw count before <code>MergeByDistance</code> is
        ~5 100 vertices. Draco compression level 6 typically reduces the GLB
        to 80–120 KB — comfortably under the 500 KB guideline for a single
        WebXR prop. The weld threshold in the blueprint is set to{" "}
        <code>TUBE_RADIUS × 0.04</code>, which cleans the branching joints
        without collapsing the fine tip geometry.
      </p>
      <p className="mt-2">
        Export with <code>export_apply=True</code>; the Repeat Zone modifier
        must be baked into mesh vertices before GLB packing. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-viewer-node-debug-inspect-attributes"
          className={lk}
        >
          Viewer node debug tutorial
        </Link>{" "}
        shows how to inspect the <code>Tips</code> geometry at any iteration
        boundary — attach a Viewer to <code>rpt_in.outputs[&apos;Tips&apos;]</code>{" "}
        and use the Spreadsheet editor to confirm tip counts are 1, 3, 9, 27,
        81 at iterations 1 through 5.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Failure modes</h2>
      <p className="mt-2">
        <strong>Zone items missing after creation.</strong> Items must be added
        to <code>rpt_out.items</code> (the Output node). If you accidentally
        call <code>rpt_in.items.new()</code> instead, no sockets are created.
        Verify with <code>print(len(rpt_out.items))</code> immediately after
        the calls — it should equal 3.
      </p>
      <p className="mt-2">
        <strong>Iteration count has no visible effect.</strong> The{" "}
        <code>Iterations</code> input only updates the zone count if it is
        wired to <code>rpt_in.inputs[0]</code>. If left at the default value
        but the Group Input socket is not connected, the node tree evaluates
        with the socket&apos;s own default. Confirm the link with{" "}
        <code>print(len(rpt_in.inputs[0].links))</code> — it should be 1.
      </p>
      <p className="mt-2">
        <strong>Tips grow unboundedly.</strong> If <code>child_tip_outs</code>{" "}
        from all three directions are joined correctly but the{" "}
        <code>Tips</code> item feeds into <code>rpt_out.inputs[1]</code>{" "}
        (correct) instead of index 2 (wrong geometry type), Blender may silently
        accept the mistyped connection and pass empty geometry. Always check
        socket type strings: <code>GEOMETRY</code> for geometry,{" "}
        <code>FLOAT</code> for scalar — they are not interchangeable.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-repeat-zone-crystal-antenna-webxr",
  title:
    "GN Repeat Zone — Iterative L-System Crystal Antenna for WebXR (Blender 5.1)",
  date: "2026-07-03",
  kind: "tutorial",
  excerpt:
    "Use the Geometry Nodes Repeat Zone to grow a 3-way symmetric fractal crystal antenna iteratively: each pass expands a tip-point cloud into three branch tubes via CurveLine + CurveToMesh + InstanceOnPoints, accumulates geometry across items, and tapers tube radius by SHRINK_RATIO. Five iterations yield 363 segments at ~5 k vertices, exported as a Draco-6 WebXR GLB.",
  tags: [
    "blender",
    "geometry-nodes",
    "repeat-zone",
    "l-system",
    "fractal",
    "procedural",
    "webxr",
  ],
  Body,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/geometry-nodes/gn-repeat-zone-crystal-antenna-webxr/",
    time: "an afternoon",
    difficulty: "advanced",
    cost: "open-source",
    supplies: {
      tools: [
        {
          name: "Blender 5.1",
          url: "https://www.blender.org/download/releases/5-1/",
          note: "Repeat Zone requires Blender 4.0 or later; 5.1 has the stable API used here.",
        },
        { name: "Geometry Nodes editor" },
        { name: "Spreadsheet editor (attribute debug)" },
        { name: "Python scripting console (blueprint.py runner)" },
      ],
    },
    prerequisites: [
      "Comfortable building Geometry Node trees by hand (add node, connect socket)",
      "Understands what a point cloud is in GN context",
      "Has run at least one blueprint.py file via the Scripting workspace",
    ],
    steps: [
      {
        title: "Understand the Repeat Zone item flow",
        body: "Open the Geometry Nodes editor on any mesh object.  Add a Repeat Input\nnode (Shift+A → Geometry Nodes → Repeat Input) and a Repeat Output node.\nBlender auto-pairs them.\n\nIn the N-panel → Node → Repeat Output, click '+' to add items:\n  Accum   GEOMETRY\n  Tips    GEOMETRY\n  Scale   FLOAT\n\nSocket layout after adding:\n  rpt_in.inputs  [0]=Iterations  [1]=Accum_init  [2]=Tips_init  [3]=Scale_init\n  rpt_in.outputs [0]=Iteration Index  [1]=Accum  [2]=Tips  [3]=Scale\n  rpt_out.inputs [0]=Accum_next  [1]=Tips_next   [2]=Scale_next\n  rpt_out.outputs[0]=Accum_final [1]=Tips_final  [2]=Scale_final\n\nAnything wired into rpt_out.inputs[N] in iteration K becomes the value\navailable on rpt_in.outputs[N+1] in iteration K+1.",
      },
      {
        title: "Set initial values: root tip at origin, empty accum",
        body: "Add a Points node (Shift+A → Point → Points):\n  Count    = 1\n  Position = (0, 0, 0)\nWire Points.outputs['Geometry'] → rpt_in.inputs[2] (Tips_init).\n\nLeave rpt_in.inputs[1] (Accum_init) unconnected — empty geometry by default.\n\nSet rpt_in.inputs[3].default_value = 0.030 (the first-generation tube radius).\n\nWire a Group Input 'Iterations' (INT, default=5, range 1-8) to rpt_in.inputs[0].",
      },
      {
        title: "Compute shared per-iteration scalars",
        body: "Inside the zone, add two Math nodes:\n\n  m_bl: MULTIPLY — inputs[0]=0.38 (BRANCH_LENGTH), inputs[1]=rpt_in.outputs[3]\n        outputs['Value'] = BRANCH_LENGTH × current_Scale\n\n  m_tr: MULTIPLY — inputs[0]=0.030 (TUBE_RADIUS), inputs[1]=rpt_in.outputs[3]\n        outputs['Value'] = TUBE_RADIUS × current_Scale\n\nBoth nodes evaluate to scalars that shrink each iteration as Scale does.",
      },
      {
        title: "Build the three-direction branch chain",
        body: "For each of three branch directions i ∈ {0, 120°, 240°} (pre-compute unit\nvectors outside Blender):\n\n  VectorMath SCALE:\n    inputs[0] = (bx, by, bz)  — hardcoded unit vector\n    inputs['Scale'] = m_bl.outputs['Value']\n    → branch_offset_i\n\n  CurvePrimitiveLine:\n    Start  = (0,0,0) (default)\n    End    ← vm.outputs['Vector']   ← branch_offset_i\n    → a line from origin to child position, in local space\n\n  CurvePrimitiveCircle (mode=RADIUS):\n    Resolution = 6\n    Radius     ← m_tr.outputs['Value']\n\n  CurveToMesh:\n    Curve         ← CurveLine.outputs['Curve']\n    Profile Curve ← CurvePrimitiveCircle.outputs['Curve']\n    Fill Caps     = True\n    → hex tube mesh, root at (0,0,0), tip at branch_offset_i\n\n  InstanceOnPoints:\n    Points   ← rpt_in.outputs[2]     (current Tips)\n    Instance ← CurveToMesh.outputs['Mesh']\n    → one tube per tip, correctly oriented by local geometry\n\n  SetPosition:\n    Geometry ← rpt_in.outputs[2]     (current Tips)\n    Offset   ← vm.outputs['Vector']  (branch_offset_i)\n    → child tip positions",
      },
      {
        title: "Accumulate branches and new tips; shrink Scale",
        body: "After building all three direction chains:\n\n  JoinGeometry: collect three InstanceOnPoints outputs → jb\n  RealizeInstances: jb → realize  (bakes instances to mesh for export)\n  JoinGeometry: [rpt_in.outputs[1], realize.outputs['Geometry']] → jacc\n    → new Accum = old Accum + this iteration's branches\n\n  JoinGeometry: collect three SetPosition outputs → jt\n    → new Tips = all three child clouds\n\n  Math MULTIPLY:\n    inputs[0] ← rpt_in.outputs[3]  (current Scale)\n    inputs[1]  = 0.63              (SHRINK_RATIO)\n    → new Scale\n\n  Wire → Repeat Output:\n    rpt_out.inputs[0] ← jacc.outputs['Geometry']  (new Accum)\n    rpt_out.inputs[1] ← jt.outputs['Geometry']    (new Tips)\n    rpt_out.inputs[2] ← m_sh.outputs['Value']     (new Scale)",
      },
      {
        title: "Post-zone: weld, material, export",
        body: "After the zone, take rpt_out.outputs[0] (final Accum):\n\n  MergeByDistance:\n    Geometry ← rpt_out.outputs[0]\n    Distance  = 0.0012  (TUBE_RADIUS × 0.04 — welds branching joints)\n\n  SetMaterial → connect your crystal_metal material\n\n  Group Output ← SetMaterial.outputs['Geometry']\n\nExport:\n  bpy.ops.export_scene.gltf(\n      filepath='//crystal_antenna.glb',\n      export_format='GLB',\n      export_apply=True,          # bake modifier stack\n      export_yup=True,\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_materials='EXPORT',\n  )\n\nExpected: 363 tubes, ~5 100 verts, ~80-120 KB GLB.",
      },
    ],
    finalResult:
      "A 3-way symmetric L-system crystal antenna (5 generations, 363 hex-tube segments, ~5 100 vertices) built entirely inside a Geometry Nodes Repeat Zone with a live Iterations parameter. Exports as crystal_antenna.glb (Draco 6, +Y up, ~100 KB) for immediate use in WebXR scenes or Three.js.",
    variations: [
      "4-branch antenna (BRANCH_DIRS = 4, 90° apart): replace math.tau/3 with math.tau/4 and add a fourth CurveLine+CurveToMesh chain in the loop. At 5 iterations: 4^5 = 1 024 tips — still < 20 k verts with SHRINK_RATIO 0.60.",
      "Asymmetric organic growth: instead of hardcoded unit vectors, generate BRANCH_DIRS inside the zone using FunctionNodeRandomValue seeded by rpt_in.outputs['Iteration Index']. Each iteration bends in a different direction — produces a coral or mycelium look rather than a crystal lattice.",
      "Animated growth shader: in Three.js, drive a custom GLSL attribute on the exported GLB that encodes which generation each tube belongs to (store as a vertex colour via Store Named Attribute before the zone writes to Accum). Fade tubes in sequentially by generation index for a growth animation without re-exporting.",
    ],
    troubleshooting: [
      {
        symptom: "No geometry visible after applying the GN modifier",
        cause:
          "Repeat Zone items were not created correctly, so Accum remains empty geometry through all iterations.",
        fix:
          "Check len(rpt_out.items) in the Python console — it should be 3. If 0, the items.new() calls failed or targeted rpt_in instead of rpt_out. Re-run blueprint.py from a clean scene (clear_scene() first).",
      },
      {
        symptom: "Changing Iterations has no effect on the mesh",
        cause:
          "The Group Input 'Iterations' socket is not wired to rpt_in.inputs[0], or the GN modifier node group does not expose the Iterations interface socket.",
        fix:
          "In the Python console: print([l.from_node.name for l in rpt_in.inputs[0].links]). It should show 'Group Input'. If empty, run L(links, gin.outputs['Iterations'], rpt_in.inputs[0]) manually.",
      },
      {
        symptom: "GLB export produces 0 triangles",
        cause: "export_apply=False — the Repeat Zone modifier was not baked before export.",
        fix:
          "Pass export_apply=True to bpy.ops.export_scene.gltf(). In the UI: File → Export → glTF 2.0 → Data tab → Apply Modifiers. Validate with gltf-validator; mesh.primitives[0].attributes.POSITION should report > 5 000 vertices.",
      },
      {
        symptom: "Tube cross-sections are visible as flat circles, not capped",
        cause: "Fill Caps is False on the CurveToMesh node.",
        fix:
          "Set c2m.inputs['Fill Caps'].default_value = True for each of the three CurveToMesh nodes. Or in the node editor: select each CurveToMesh → Properties panel → Fill Caps = on.",
      },
    ],
  },
  base,
);
