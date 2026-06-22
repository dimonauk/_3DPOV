import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 4.1 introduced the <strong>Repeat Zone</strong> — a pair of
        nodes (<em>Repeat Input</em> + <em>Repeat Output</em>) that evaluate a
        body of Geometry Nodes N times within a single frame. Unlike the{" "}
        <Link href="/tutorials/blender-tutorial-gn-simulation-zone-conways-game-of-life" className={lk}>
          Simulation Zone
        </Link>{" "}
        (which propagates state across time frames and writes a disk cache),
        the Repeat Zone completes all its iterations during one modifier
        evaluation and writes nothing to disk. This makes it the right tool
        for within-frame structural iteration: fractals, L-systems, iterative
        mesh refinement, progressive LOD generation.
      </p>
      <p>
        This tutorial builds a <strong>fractal spike ball</strong>: a unit
        icosphere whose every face is extruded outward — then every newly
        extruded top face is extruded again at a smaller scale — repeated N
        times. The&nbsp;<code>Iterations</code> slider on the modifier panel
        controls depth in real time. At iteration 5 the mesh has roughly 640
        faces; at iteration 8 it crosses 5&nbsp;000.
      </p>

      <h2>Repeat Zone vs Simulation Zone — the one-line rule</h2>
      <p>
        <em>Repeat</em> = N passes, one frame, no cache.{" "}
        <em>Simulation</em> = one pass per frame, accumulates across time,
        writes cache. Choose Simulation when your result depends on the
        previous frame&rsquo;s physics state. Choose Repeat when you want a
        deterministic structural result that depends only on the current
        modifier inputs.
      </p>

      <h2>The is_tip attribute pattern</h2>
      <p>
        The zone needs to know <em>which</em> faces to extrude on each pass.
        The solution is a BOOLEAN FACE-domain attribute called{" "}
        <code>is_tip</code>:
      </p>
      <ol>
        <li>
          <strong>Before the zone</strong> — a{" "}
          <code>StoreNamedAttribute</code> node sets{" "}
          <code>is_tip&nbsp;= True</code> on every face of the seed icosphere.
        </li>
        <li>
          <strong>Inside the zone</strong> — <code>NamedAttribute(&apos;is_tip&apos;)</code>{" "}
          feeds the <em>Selection</em> socket of <code>ExtrudeMesh</code>.
          Only tip faces are extruded.
        </li>
        <li>
          <strong>After extrusion</strong> — <code>ExtrudeMesh.Top</code>{" "}
          is a Boolean field that is True on every newly created top face and
          False on walls and pre-existing faces. Another{" "}
          <code>StoreNamedAttribute</code> overwrites{" "}
          <code>is_tip</code> with that field. Old tips (now walls) become
          False; new tops become True.
        </li>
        <li>
          The next iteration receives the updated geometry and extrudes only
          the new tops.
        </li>
      </ol>
      <p>
        This pattern requires <em>zero</em> explicit bookkeeping nodes — the
        ExtrudeMesh topology output does the work.
      </p>

      <h2>Loop variables (socket types that cross the zone)</h2>
      <p>
        Sockets on the Repeat Input and Output are called{" "}
        <em>loop variables</em>. In Blender 5.1 the supported types are:{" "}
        <code>Geometry</code>, <code>Float</code>, <code>Int</code>,{" "}
        <code>Vector</code>, <code>Bool</code>, <code>Rotation</code>,{" "}
        <code>Matrix</code>. Color and String cannot cross zone boundaries.
        Via <code>bpy</code> you add items with:
      </p>
      <pre>{`repeat_out.repeat_items.new(
    socket_type="NodeSocketGeometry", name="Geometry")
repeat_out.repeat_items.new(
    socket_type="NodeSocketFloat",    name="Scale")`}</pre>
      <p>
        Adding items to the <em>Output</em> node automatically adds matching
        sockets to the <em>Input</em> node. The Input&rsquo;s{" "}
        <code>outputs[0]</code> is always the{" "}
        <strong>Iteration index</strong> (Int, 0-based); loop variable sockets
        begin at <code>outputs[1]</code>.
      </p>

      <h2>Shrink factor — convergence control</h2>
      <p>
        The <code>Scale</code> loop variable carries the current extrude offset.
        Each iteration multiplies it by the <code>Shrink</code> input (default
        0.68) via a Math MULTIPLY node before passing it to Repeat Output. This
        keeps the geometry divergence under control — without shrinkage the
        spike-tips of iteration 5 would be the same length as the trunk, and
        the fractal would explode past the unit sphere.
      </p>
      <p>
        A <code>Shrink</code> value above 1.0 produces outward growth (each
        generation longer than the last) — useful for stylised coral or antenna
        arrays. A value below 0.5 makes spikes telescope inward aggressively.
      </p>

      <h2>bpy: pairing and socket access</h2>
      <pre>{`repeat_in  = ng.nodes.new('GeometryNodeRepeatInput')
repeat_out = ng.nodes.new('GeometryNodeRepeatOutput')
# repeat_items lives on the Output — adding here creates sockets on both
repeat_out.repeat_items.new('NodeSocketGeometry', 'Geometry')
repeat_out.repeat_items.new('NodeSocketFloat',    'Scale')
# outputs[0] on Input = Iteration index; loop vars start at [1]
ng.links.new(repeat_in.outputs[1], extrude.inputs[0])    # Geometry
ng.links.new(repeat_in.outputs[2], extrude.inputs[3])    # Offset Scale
ng.links.new(store_tip.outputs[0], repeat_out.inputs[0]) # Geometry back
ng.links.new(shrink_mult.outputs[0], repeat_out.inputs[1]) # Scale shrunk`}</pre>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-simulation-zone-conways-game-of-life" className={lk}>GN Simulation Zone — Conway&rsquo;s Game of Life</Link>{" "}
          — temporal counterpart: state across frames, disk cache, physics-like evolution.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-extrude-mesh-procedural-panel-inset" className={lk}>GN Extrude Mesh — Procedural Panel Inset</Link>{" "}
          — full ExtrudeMesh reference: modes, Individual Faces, Side/Top topology outputs.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-geonodes-tree-build-bpy" className={lk}>Python — Programmatic Geometry Nodes Tree via bpy</Link>{" "}
          — wiring node groups from Python; node interface API in Blender 5.1.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/repeat_zone.html"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            Blender Manual — Repeat Zone
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation. Related: the Blender source
          repository at{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            projects.blender.org
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation_zone.html"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            Blender Manual — Simulation Zone
          </a>{" "}
          · CC-BY-SA-4.0 · Blender Foundation. Sibling page; directly contrasts temporal vs structural iteration.
        </li>
      </ul>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-repeat-zone-iterative-lsystem-branch-growth",
  title:
    "GN Repeat Zone — Iterative Branch Growth: Within-Frame Fractal Loops in Blender 5.1",
  date: "2026-06-22",
  kind: "tutorial",
  excerpt:
    "Use Blender 5.1's Repeat Zone to evaluate a Geometry Nodes body N times in one frame — building a fractal spike ball via iterative ExtrudeMesh, is_tip attribute handoff, and a shrinking-scale loop variable.",
  Body,
};

export const entry = buildInstructable(
  {
    topic: "geometry-nodes",
    subtopic: "Repeat Zone / Iteration",
    sources: [
      {
        title: "Blender Manual — Repeat Zone",
        url: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/repeat_zone.html",
        licence: "CC-BY-SA-4.0",
        author: "Blender Foundation",
      },
      {
        title: "Blender Manual — Simulation Zone",
        url: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation_zone.html",
        licence: "CC-BY-SA-4.0",
        author: "Blender Foundation",
      },
    ],
    libraryPath:
      "public/library/blends/geometry-nodes/gn-repeat-zone-iterative-lsystem-branch-growth/",
    time: "45–75 minutes",
    difficulty: "intermediate",
    overview:
      "Build the Repeat Zone loop pipeline — StoreNamedAttribute(is_tip=True) pre-zone → ExtrudeMesh(selection=is_tip) inside zone → StoreNamedAttribute(is_tip=Top) after ExtrudeMesh → Scale×Shrink → Repeat Output — on a unit icosphere to create a fractal spike ball, then animate Iterations 0→5 and export to WebXR GLB.",
    prerequisites: [
      "Can open Blender 5.1 and run a Python script from the Text Editor.",
      "Familiar with GeoNodes: Group Input/Output, at least one topology node (e.g. Extrude Mesh).",
      "Has completed or read the GN Extrude Mesh tutorial (or is comfortable with ExtrudeMesh.Top output).",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    steps: [
      {
        title: "Run blueprint.py",
        body: "File → New → General. Open the Text Editor (Shift+F11), load blueprint.py, click Run Script. Creates: branch_ball icosphere with HF_RepeatBranch modifier at Iterations=5, Branch Scale=0.55, Shrink=0.68. Exports branch_ball.glb.",
      },
      {
        title: "Inspect the node tree",
        body: "Select branch_ball → Properties → Modifier → HF_RepeatBranch → Edit (pencil icon). Pan the Node Editor left-to-right: Group Input → StoreNamedAttribute(is_tip) → Repeat Input (blue zone start) → NamedAttribute → ExtrudeMesh → StoreNamedAttribute(Top→is_tip) → Math MULTIPLY → Repeat Output (blue zone end) → SetShadeSmooth → Group Output.",
      },
      {
        title: "Understand the zone boundary",
        body: "Click the Repeat Input header and look at its output sockets: Iteration (Int, greys out to 0-based index), Geometry, Scale. These are the state variables that thread through each pass. The Repeat Output's inputs accept the updated values at the end of each pass.",
      },
      {
        title: "Step through iterations live",
        body: "In the Modifier panel, set Iterations to 0 (bare icosphere, 20 faces). Step to 1 (first shell of spikes), 2, 3, 4, 5. Watch the N panel → Item → Vertices/Faces counters grow. Note how face count roughly doubles each step.",
      },
      {
        title: "Adjust Shrink",
        body: "With Iterations=5, set Shrink to 0.9 (long, elegant spines), then 0.5 (squat, aggressive), then 1.05 (CAUTION: outward-growing spikes — GPU may spike). Undo to 0.68.",
      },
      {
        title: "Animate Iterations",
        body: "Right-click Iterations → Insert Single Keyframe at frame 1 (value=0). Advance to frame 90, set Iterations=5, Insert Single Keyframe. In the Graph Editor set both keyframes to Constant interpolation so the loop pops cleanly.",
      },
      {
        title: "Run record.py",
        body: "Text Editor → Open record.py → Run Script. Animates Iterations 0→5 as Constant keyframes and calls bpy.ops.render.opengl(animation=True) to produce viewport.mp4.",
      },
      {
        title: "GLB inspection",
        body: "File → Import → glTF 2.0 → branch_ball.glb. Confirm all five spike generations appear as realised geometry. Face count should match the modifier-applied count.",
      },
    ],
    troubleshooting: [
      {
        symptom: "AttributeError: 'GeometryNodeRepeatOutput' has no attribute 'repeat_items'",
        cause: "Running Blender older than 4.1. The Repeat Zone was introduced in 4.1.",
        fix: "Upgrade to Blender 4.1 or later. In 5.1 repeat_items is the stable API.",
      },
      {
        symptom: "Spike ball is an unchanged icosphere (no spikes)",
        cause: "is_tip not stored before the zone — first iteration found no True faces, ExtrudeMesh selected nothing.",
        fix: "StoreNamedAttribute(is_tip=True) must be wired before Repeat Input, not inside the zone.",
      },
      {
        symptom: "All faces extrude every pass (no convergence)",
        cause: "StoreNamedAttribute inside the zone wired to constant True instead of ExtrudeMesh.Top.",
        fix: "Wire extrude.outputs[1] (Top field) into store_tip inputs['Value'], not a Boolean True node.",
      },
      {
        symptom: "GLB has 20 faces — same as unmodified icosphere",
        cause: "export_apply=True not set; modifier unapplied on export.",
        fix: "Enable Apply Modifiers in the glTF export dialog.",
      },
      {
        symptom: "repeat_in.inputs[0] refuses Iterations from Group Input",
        cause: "grp_in output index depends on interface socket order — Iterations may be outputs[1], not [0].",
        fix: "Wire grp_in.outputs[1] to repeat_in.inputs[0]. blueprint.py uses L(grp_in, 1, repeat_in, 0).",
      },
    ],
    finalResult:
      "Fractal spike ball with Iterations/Branch Scale/Shrink parameters on the modifier panel, real-time viewport feedback, animated Iterations 0→5 viewport.mp4, and a Draco-L6 GLB with fully realised spike geometry for WebXR.",
    variations: [
      "L-system divergence: add a Vector loop variable for branch direction; rotate each tip face normal by ±divergence_angle via AxisAngleToRotation before passing to ExtrudeMesh Offset.",
      "Colour by generation: pass an Int loop variable through the zone; StoreNamedAttribute(FACE, 'gen') → Attribute node in material → ColorRamp for generation-coded colouring.",
      "Alternating axis twist: wire Math MODULO(Iteration, 2) to choose X vs Z as ExtrudeMesh offset direction for an alternating-plane spike pattern.",
    ],
  },
  base,
);
