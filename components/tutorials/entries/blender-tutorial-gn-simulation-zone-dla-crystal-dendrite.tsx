import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSimulationZoneDlaCrystalDendriteBody() {
  return (
    <>
      <p>
        <strong>Diffusion-Limited Aggregation</strong> (Witten &amp; Sander, 1981)
        is the algorithm underneath electrochemical zinc trees, snowflake arms, and
        lightning-strike paths. A single seed point at the origin collects
        random-walking particles that stick permanently on first contact, building a
        self-similar fractal dendrite whose Hausdorff dimension approaches ≈&nbsp;2.5
        in three dimensions. Implementing DLA in a Blender&nbsp;5.1 Simulation Zone
        teaches two-channel geometry state, the field-node semantics of{" "}
        <code>Geometry Proximity</code>, and why the ratio{" "}
        <code>STEP_SIZE / AGG_RADIUS</code> controls branch density more than any
        other parameter.
      </p>

      <h2>How DLA produces fractal branching</h2>
      <p>
        Random walkers launched far from the crystal reach peripheral tips more
        often than interior concavities — the tips &lsquo;shadow&rsquo; the inner
        region probabilistically. This tip-preference is the only ingredient
        required for fractal geometry; no explicit branching rule is programmed.
        The characteristic tip-shielding is also the reason DLA is studied as a
        model for dielectric breakdown and viscous fingering: in each physical
        system, the &lsquo;particle&rsquo; is a field line, and first-contact is
        the moment the field exceeds local breakdown threshold.
      </p>
      <p>
        Compare this to the Repeat Zone crystal cluster tutorial (
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          GN Repeat Zone crystal cluster
        </Link>
        ), which grows geometry deterministically by iterating a fixed subdivision
        rule. DLA branching is stochastic — two runs with identical parameters
        produce visually distinct dendrites.
      </p>

      <h2>Two-channel Simulation Zone state</h2>
      <p>
        The standard Simulation Zone carries a single Geometry channel: what
        exits <code>GeometryNodeSimulationOutput</code> is fed back into{" "}
        <code>GeometryNodeSimulationInput</code> on the next frame. For DLA we
        need two separate point clouds — the frozen Crystal and the mobile
        Walkers — with completely different per-frame processing. The solution is{" "}
        <code>sim_out.state_items.new(&quot;GEOMETRY&quot;, &quot;Walkers&quot;)</code>
        , called in Python after{" "}
        <code>sim_in.pair_with_output(sim_out)</code>. After that call the zone
        has four sockets: <code>sim_in.outputs[&quot;Geometry&quot;]</code> (Crystal
        read), <code>sim_in.outputs[&quot;Walkers&quot;]</code> (Walkers read),{" "}
        <code>sim_out.inputs[&quot;Geometry&quot;]</code> (Crystal write), and{" "}
        <code>sim_out.inputs[&quot;Walkers&quot;]</code> (Walkers write). The{" "}
        <em>order matters</em>: pair before adding items, or the sockets appear
        on only one node.
      </p>
      <p>
        This two-channel approach is structurally the same as what the boid flock
        tutorial uses to keep position and velocity separate — see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          GN Simulation Zone boid flock
        </Link>
        . In that entry velocity is a VECTOR state item; here the second channel
        is a full GEOMETRY because walkers are a variable-count point cloud that
        cannot fit a fixed-size attribute array.
      </p>

      <h2>GeometryNodeProximity as a field node</h2>
      <p>
        <code>Geometry Proximity</code> is a <em>field node</em> in Blender&rsquo;s
        GN system: it does not have a geometry passthrough input. Its{" "}
        <code>Target</code> input accepts the Crystal geometry from{" "}
        <code>sim_in.outputs[&quot;Geometry&quot;]</code>; its{" "}
        <code>Distance</code> output is a float field evaluated lazily on whatever
        geometry domain uses it downstream. When that field is wired to{" "}
        <code>Separate Geometry.Selection</code> — whose{" "}
        <code>Geometry</code> input carries the moved Walkers — Blender evaluates
        &ldquo;distance from <em>this walker&rsquo;s</em> position to the nearest
        crystal point&rdquo; for each walker point in turn. No explicit loop, no
        intermediate store. This is the same lazy-evaluation contract used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-of-nearest-neural-web"
          className={lk}
        >
          Index of Nearest neural web tutorial
        </Link>
        , though Index of Nearest returns an index while Proximity returns a
        distance field.
      </p>

      <h2>Node wiring: per-frame inside the zone</h2>
      <p>
        The zone body runs in this order each frame:
      </p>
      <ol>
        <li>
          <strong>Random walk.</strong>{" "}
          <code>FunctionNodeRandomValue(FLOAT_VECTOR)</code> generates a random
          unit vector per walker (element-index hash varies per point; frame hash
          varies per frame). <code>VectorMath(NORMALIZE)</code> then{" "}
          <code>VectorMath(SCALE, STEP_SIZE)</code> gives the displacement.{" "}
          <code>SetPosition(Offset=step)</code> moves the walkers.
        </li>
        <li>
          <strong>Aggregation test.</strong>{" "}
          <code>GeometryNodeProximity(target=Crystal)</code> → distance field →{" "}
          <code>FunctionNodeCompare(LESS_THAN, B=AGG_RADIUS)</code> → boolean
          selection field.
        </li>
        <li>
          <strong>Partition.</strong>{" "}
          <code>SeparateGeometry(domain=POINT, selection=aggr_mask)</code> splits
          the walker cloud into an aggregating subset and a continuing subset.
        </li>
        <li>
          <strong>Age stamp.</strong>{" "}
          <code>GeometryNodeInputSceneTime.Frame</code> →{" "}
          <code>StoreNamedAttribute(&quot;agg_frame&quot;, INT, POINT)</code> on
          the aggregating subset. Post-zone, dividing by{" "}
          <code>SIM_FRAME_END</code> and clamping gives{" "}
          <code>agg_norm</code> in [0,1] — the cobalt-to-gold colour ramp input.
        </li>
        <li>
          <strong>Cull distant walkers.</strong>{" "}
          <code>VectorMath(LENGTH)</code> on position →{" "}
          <code>Compare(GREATER_THAN, CULL_RADIUS)</code> →{" "}
          <code>DeleteGeometry</code>. Without this, walkers that escape accumulate
          indefinitely.
        </li>
        <li>
          <strong>Spawn fresh walkers.</strong>{" "}
          <code>GeometryNodePoints(Count=WALKERS_PER_FRAME)</code> with{" "}
          <code>Position</code> input wired to{" "}
          <code>FunctionNodeRandomValue(FLOAT_VECTOR, Seed=Frame)</code> normalised
          and scaled to <code>SPAWN_RADIUS</code>. Feeding Frame to the Seed socket
          gives a different spawn set each frame.
        </li>
        <li>
          <strong>Rebuild states.</strong> Two{" "}
          <code>JoinGeometry</code> nodes: Crystal ← old Crystal + age-stamped
          aggregators; Walkers ← culled survivors + new spawns.
        </li>
      </ol>

      <h2>The STEP_SIZE / AGG_RADIUS ratio and failure modes</h2>
      <p>
        This ratio is the single most important DLA parameter in any implementation:
      </p>
      <ul>
        <li>
          <strong>Ratio &gt; 2.0</strong>: walkers &lsquo;jump over&rsquo; the
          crystal in one step (tunnelling). The outer rim aggregates; interior
          concavities are never filled. Crystal looks like a spiky crown.
        </li>
        <li>
          <strong>Ratio ≈ 0.85</strong> (defaults 0.30/0.35): natural interior
          fill — some walkers diffuse through gaps — with prominent tip branching.
          Matches the Hausdorff statistics of physical DLA.
        </li>
        <li>
          <strong>Ratio &lt; 0.25</strong>: walkers move very small steps relative
          to stick distance. Interior fill is dense; less fractal, more &lsquo;blob&rsquo;.
          Increases the number of frames required for the same cluster size.
        </li>
      </ul>
      <p>
        For the Grey-Scott comparison where a completely different mechanism —
        reaction-diffusion — also produces branching crystal-like patterns, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Simulation Zone reaction-diffusion tutorial
        </Link>
        . The visual results are superficially similar; the physics are entirely
        distinct.
      </p>

      <h2>WebXR export path</h2>
      <p>
        The GLB at frame&nbsp;120 carries the crystal as realised icosphere
        geometry with <code>agg_norm</code> and <code>agg_frame</code> per-point
        accessors. In Three.js, read them via{" "}
        <code>geometry.attributes.agg_norm</code> to drive a custom{" "}
        <code>ShaderMaterial</code> colour gradient matching the Blender
        material. The{" "}
        <code>export_apply=True</code> flag in the GLB exporter is required —
        without it, the Simulation Zone modifier is exported unevaluated and
        Three.js receives an empty geometry.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Simulation Zone — Blender Manual
          </a>{" "}
          · CC-BY-SA 4.0 · Blender Documentation Team. Authoritative reference for
          zone evaluation order, cache semantics, state_items API, and the
          frame-0 initialisation / skip-input behaviour used here.
        </li>
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Diffusion-limited_aggregation"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Diffusion-limited aggregation — Wikipedia
          </a>{" "}
          · CC-BY-SA 3.0 · Wikipedia contributors. Covers the Witten &amp; Sander
          (1981) original paper, Hausdorff dimension measurements, and physical
          analogues (electrodeposition, dielectric breakdown, viscous fingering).
          Sister article:{" "}
          <a
            href="https://en.wikipedia.org/wiki/Eden_growth_model"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Eden growth model
          </a>{" "}
          — perimeter-only aggregation without random walk, produces compact circular
          clusters instead of fractal dendrites.
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
          · Apache-2.0 · Khronos Group. The Blender GLB exporter source; the{" "}
          <code>export_attributes</code> flag (enabled here) writes custom accessor
          arrays for named attributes. Sibling project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Assets"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Assets
          </a>{" "}
          (CC0/various) — reference GLBs for testing custom accessor round-trips.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-dla-crystal-dendrite",
    time: "one session",
    difficulty: "advanced",
    goal:
      "Implement Diffusion-Limited Aggregation in a Blender 5.1 Geometry Nodes Simulation Zone using two-channel geometry state (Crystal + Walkers), Geometry Proximity as a field-domain aggregation test, per-frame random-walk movement, and age-stamped colour export to GLB.",
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
      "Comfortable with Simulation Zone basics — see gn-simulation-zone-wave-reveal",
      "Understand field-node evaluation: Named Attribute, Store Named Attribute",
      "Know how SeparateGeometry and JoinGeometry work on point domains",
    ],
    steps: [
      {
        title: "Create host mesh and GN modifier",
        body: "Add a UV Sphere at radius 0.001 — the host for the GN modifier; all real geometry comes from the Simulation Zone. Add a Geometry Nodes modifier named 'GN_DLACrystal'. Add a single NodeSocketGeometry Output to the group.",
      },
      {
        title: "Wire the Simulation Zone with two geometry state items",
        body: "Add GeometryNodeSimulationInput and GeometryNodeSimulationOutput. Call sim_in.pair_with_output(sim_out). Then sim_out.state_items.new('GEOMETRY', 'Walkers'). The zone now has Crystal (default Geometry) and Walkers sockets on both nodes.",
      },
      {
        title: "Pre-zone: seed Crystal and initial Walkers",
        body: "Crystal seed: MeshLine(count=1) → MeshToPoints → StoreNamedAttribute('agg_frame', INT, value=0) → sim_in.inputs['Geometry']. Walker seed: GeometryNodePoints(count=36, Position=random-normalised×SPAWN_RADIUS) → sim_in.inputs['Walkers'].",
      },
      {
        title: "Inside zone: random-walk step on Walkers",
        body: "FunctionNodeRandomValue(FLOAT_VECTOR, min=-1, max=1) → VectorMath(NORMALIZE) → VectorMath(SCALE, STEP_SIZE) → SetPosition(Geometry=sim_in.Walkers, Offset=step). The random value changes per-walker (element-index hash) and per-frame (frame hash) automatically.",
      },
      {
        title: "Aggregation test and partition",
        body: "GeometryNodeProximity(Target=sim_in.Geometry/Crystal) → Distance field → FunctionNodeCompare(FLOAT, LESS_THAN, B=AGG_RADIUS) → bool field. SeparateGeometry(Geometry=moved_walkers, Selection=aggr_bool, domain=POINT). Outputs: Selection=aggregating, Inverted=continuing.",
      },
      {
        title: "Stamp age, cull far walkers, spawn fresh ones",
        body: "On aggregating walkers: StoreNamedAttribute('agg_frame', INT, value=Scene.Frame). On continuing walkers: VectorMath(LENGTH) on position → Compare(GREATER_THAN, CULL_RADIUS) → DeleteGeometry. Spawn: GeometryNodePoints(WALKERS_PER_FRAME, Position=random-sphere) with Frame as Seed → join with survivors.",
      },
      {
        title: "Rebuild states and post-zone colour",
        body: "JoinGeometry: Crystal ← old Crystal + stamped aggregators → sim_out.Geometry. JoinGeometry: Walkers ← survivors + new spawns → sim_out.Walkers. Post-zone: read agg_frame, divide by SIM_FRAME_END, clamp → StoreNamedAttribute('agg_norm'). Instance icospheres on Crystal, apply DLA_Crystal material (cobalt→gold ramp on agg_norm).",
      },
    ],
    troubleshooting: [
      {
        symptom: "Crystal never grows — stays as a single point forever",
        cause: "Simulation Zone cache not being written, or Walkers state is unconnected",
        fix: "Verify sim_in.inputs['Walkers'] is wired in pre-zone. Delete the modifier cache (X button). Play from frame 1 — never scrub backwards from a later frame on first run.",
      },
      {
        symptom: "Crystal grows but stops after a few frames and freezes",
        cause: "All walkers culled immediately — CULL_RADIUS too small or SPAWN_RADIUS > CULL_RADIUS",
        fix: "Ensure SPAWN_RADIUS < CULL_RADIUS. Default values: SPAWN_RADIUS=3.5, CULL_RADIUS=7.0. Also verify JoinGeometry for Walkers is wired to sim_out.inputs['Walkers'] (not Crystal channel).",
      },
      {
        symptom: "Crystal is a solid blob with no branching",
        cause: "STEP_SIZE / AGG_RADIUS < 0.25 — walkers stick everywhere without tip preference",
        fix: "Increase STEP_SIZE toward AGG_RADIUS × 0.85. Clear cache and replay.",
      },
      {
        symptom: "GLB exports but geometry is empty in Three.js",
        cause: "export_apply=False — GN modifier not evaluated at export time",
        fix: "export_apply=True is required for any GN modifier output. Also ensure bpy.context.scene.frame_set(EXPORT_FRAME) is called before the export operator.",
      },
    ],
    voiceMode: "aura",
  },
  {
    slug: "blender-tutorial-gn-simulation-zone-dla-crystal-dendrite",
    title:
      "GN Simulation Zone — Diffusion-Limited Aggregation: Crystal Dendrite Growth",
    date: "2026-06-27",
    kind: "tutorial",
    excerpt:
      "Build a DLA (Witten & Sander 1981) fractal crystal in a Blender 5.1 Geometry Nodes Simulation Zone: two-channel geometry state (Crystal + Walkers), Geometry Proximity as a lazy field-domain aggregation test, per-frame random-walk stepping, and age-stamped GLB export for WebXR.",
    Body: GnSimulationZoneDlaCrystalDendriteBody,
  },
);
