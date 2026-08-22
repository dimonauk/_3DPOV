import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnVerletRopeBody() {
  return (
    <>
      <p>
        Position-Based Dynamics (PBD) is the physics method behind most game-engine
        rope, cloth, and soft-body simulations — and it stores{" "}
        <em>no explicit velocity</em>. Instead, velocity is encoded as the
        difference between the current and previous-frame positions: this is
        Verlet integration. The key consequence is that when a constraint
        projects a point to satisfy a rest length, the implicit velocity is
        automatically corrected too — no separate velocity correction step, no
        phantom energy, no separate damping coefficient. The solver is
        unconditionally stable. A{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Simulation Zone
        </Link>{" "}
        carries the previous-frame positions as a{" "}
        <code>FLOAT_VECTOR</code> named attribute called{" "}
        <code>prev_pos</code> on the curve geometry — exactly the same pattern
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          Boid Flock tutorial
        </Link>{" "}
        uses for per-boid velocity. A single implicit{" "}
        <code>Geometry</code> body channel carries the full state across frames;
        no explicit zone state items are needed.
      </p>

      <p>
        The ordering of operations inside the zone is the critical correctness
        detail. The <code>StoreNamedAttribute</code> node that saves{" "}
        <code>prev_pos&nbsp;≔&nbsp;pos</code> must fire on the{" "}
        <em>incoming</em> geometry — before any new position is committed — so
        that the Verlet velocity on the next frame recovers the correct delta.
        GN field nodes evaluate lazily on whatever geometry is upstream of
        them, so the <code>InputPosition</code> field feeding the Verlet math
        reads the incoming frame&rsquo;s positions even though the{" "}
        <code>StoreNamedAttribute</code> node sits in between; the geometry
        data flow and the field evaluation domain are separate concerns. After
        <code>prev_pos</code> is stored and new positions are committed via{" "}
        <code>SetPosition</code>, the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-antenna-webxr"
          className={lk}
        >
          Repeat Zone
        </Link>{" "}
        runs <code>CONSTRAINT_ITERS</code> passes of distance projection to
        enforce segment rest lengths.
      </p>

      <p>
        Inside the Repeat Zone, each iteration is a Jacobi update: every point
        reads its neighbour&rsquo;s position from the{" "}
        <em>current iteration&rsquo;s</em> geometry (via{" "}
        <code>OffsetPointInCurve</code> + <code>SampleIndex</code>), computes
        the stretch error, and moves by half the correction toward the next
        point. Because GN evaluates all points simultaneously, each point sees
        the pre-correction positions of its neighbours — this is Jacobi, not
        Gauss-Seidel. Convergence is slower per-pass than Gauss-Seidel, but
        stability is guaranteed, and six passes gives a cable that reads as stiff
        at 24&nbsp;fps. After the constraint loop, a final{" "}
        <code>SetPosition</code> with <code>Selection&nbsp;=&nbsp;(index&nbsp;==&nbsp;0)</code>{" "}
        overrides point&nbsp;0 with the anchor empty&rsquo;s world position —
        the hard-pin boundary condition that prevents Verlet drift from walking
        the top of the rope away from its socket. The finished tube, built via{" "}
        <code>CurveToMesh</code> with a circle profile, exports cleanly to GLB
        because the Simulation Zone bakes to per-frame geometry inside the
        modifier with no Alembic round-trip, unlike Blender&rsquo;s cloth
        solver. Compare this against the static{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-catenary-curve-cable-array-webxr"
          className={lk}
        >
          catenary cable
        </Link>{" "}
        (mathematical formula, no simulation) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bake-node-simulation-growth"
          className={lk}
        >
          Bake Node growth tutorial
        </Link>{" "}
        for how to freeze and scrub simulation frames.
      </p>

      <p>
        <strong>Outside reference — Blender Manual: Simulation Zone</strong>{" "}
        (
        <a
          href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        , CC-BY-SA&nbsp;4.0, Blender Foundation). Documents the skip-path
        initialisation pattern, the body channel, and the{" "}
        <code>pair_with_output()</code> API. The same organisation maintains the{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/curve/topology/offset_point_in_curve.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Offset Point in Curve manual
        </a>{" "}
        (CC-BY-SA&nbsp;4.0) — critical for understanding the{" "}
        <code>Is Valid</code> output that zeroes the constraint at rope endpoints.
      </p>

      <p>
        <strong>
          Outside reference — Müller et al., &ldquo;Position Based Dynamics&rdquo; (2006)
        </strong>{" "}
        (
        <a
          href="https://matthias-research.github.io/pages/publications/posBasedDyn.pdf"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          matthias-research.github.io
        </a>
        , freely redistributed academic paper; the GN implementation here is an
        independent CC0 re-interpretation). Section&nbsp;3 covers the distance
        constraint used in this tutorial; Section&nbsp;4 covers Verlet
        integration. The algorithm is actively maintained as open-source C++ at{" "}
        <a
          href="https://github.com/InteractiveComputerGraphics/PositionBasedDynamics"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          InteractiveComputerGraphics/PositionBasedDynamics
        </a>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics",
  title:
    "GN Simulation Zone — Verlet Rope: Position-Based Dynamics Cable Physics (Blender 5.1)",
  date: "2026-07-04",
  kind: "tutorial",
  excerpt:
    "Simulate a hanging rubber cable with Position-Based Dynamics inside a GN Simulation Zone. Verlet integration stores no velocity — prev_pos named attribute encodes momentum implicitly. A nested Repeat Zone runs 6 Jacobi constraint passes per frame to enforce segment rest lengths. Pin point 0 to an anchor empty. Exports directly to GLB with no Alembic round-trip.",
  Body: GnVerletRopeBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "advanced",
    prerequisites: [
      "Complete the Wave Reveal Simulation Zone tutorial — understand pair_with_output(), the body channel, and frame-by-frame cache building.",
      "Understand Named Attributes: FLOAT_VECTOR type, POINT domain, Store vs Read patterns.",
      "Know the Repeat Zone from the Crystal Antenna tutorial — iteration count, paired input/output, geometry passthrough.",
      "Blender 5.1 installed. Comfortable running scripts headlessly.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone requires Blender 3.6 minimum; Repeat Zone requires 4.1+. This tutorial targets 5.1 APIs.",
      },
    ],
    steps: [
      {
        title: "Build the initial rope curve and seed prev_pos",
        body: "Create a CurveLine from anchor to an offset bottom point, resample to 20 points, then seed the prev_pos attribute on the frame-1 skip path:\n\n  n_line = nodes.new('GeometryNodeCurveLine')\n  n_line.inputs['Start'].default_value = (0,0,0)\n  n_line.inputs['End'].default_value   = (0.7, 0, -2.0)\n  n_resamp = nodes.new('GeometryNodeResampleCurve')\n  n_resamp.mode = 'COUNT'\n  n_resamp.inputs['Count'].default_value = 20\n\n  n_seed = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_seed.data_type = 'FLOAT_VECTOR'; n_seed.domain = 'POINT'\n  n_seed.inputs['Name'].default_value = 'prev_pos'\n  # Value input unconnected → defaults to InputPosition\n\nThis is the skip-path: on frame 1 the Simulation Zone uses the seed geometry as its initial state. prev_pos and pos are identical at rest so vel=0 on frame 1, which means only gravity acts — the rope starts to fall cleanly without a snap.",
      },
      {
        title: "Wire the Simulation Zone and Verlet integration",
        body: "Create the zone pair, then inside wire the Verlet step:\n\n  sim_out = nodes.new('GeometryNodeSimulationOutput')\n  sim_in  = nodes.new('GeometryNodeSimulationInput')\n  sim_in.pair_with_output(sim_out)\n  links.new(n_seed.outputs['Geometry'], sim_in.inputs['Geometry'])\n\n  # Read state\n  n_prev = nodes.new('GeometryNodeNamedAttribute')\n  n_prev.data_type = 'FLOAT_VECTOR'\n  n_prev.inputs['Name'].default_value = 'prev_pos'\n  n_pos  = nodes.new('GeometryNodeInputPosition')\n\n  # vel = pos - prev_pos\n  n_vel = nodes.new('ShaderNodeVectorMath'); n_vel.operation = 'SUBTRACT'\n  links.new(n_pos.outputs['Position'], n_vel.inputs[0])\n  links.new(n_prev.outputs['Attribute'], n_vel.inputs[1])\n\n  # gravity delta = (0, 0, g × dt²)\n  n_dt2 = nodes.new('ShaderNodeValue'); n_dt2.outputs[0].default_value = (1/24)**2\n  n_gdt = nodes.new('ShaderNodeMath'); n_gdt.operation = 'MULTIPLY'\n  links.new(g_in.outputs['Gravity Z'], n_gdt.inputs[0])\n  links.new(n_dt2.outputs[0], n_gdt.inputs[1])\n  n_gv = nodes.new('ShaderNodeCombineXYZ')\n  links.new(n_gdt.outputs[0], n_gv.inputs[2])  # Z only\n\n  # new_pos = pos + vel + g_vec\n  n_pv = nodes.new('ShaderNodeVectorMath'); n_pv.operation = 'ADD'\n  links.new(n_pos.outputs['Position'], n_pv.inputs[0])\n  links.new(n_vel.outputs['Vector'],   n_pv.inputs[1])\n  n_np = nodes.new('ShaderNodeVectorMath'); n_np.operation = 'ADD'\n  links.new(n_pv.outputs['Vector'],  n_np.inputs[0])\n  links.new(n_gv.outputs['Vector'],  n_np.inputs[1])",
      },
      {
        title: "Store prev_pos then commit new positions",
        body: "The StoreNamedAttribute must operate on the incoming geometry — before SetPosition commits new_pos. GN field nodes (n_pos, n_vel, n_np) evaluate on the incoming geometry regardless of where they appear in the graph; the geometry data path is separate from the field evaluation domain.\n\n  n_spp = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_spp.data_type = 'FLOAT_VECTOR'; n_spp.domain = 'POINT'\n  n_spp.inputs['Name'].default_value = 'prev_pos'\n  links.new(sim_in.outputs['Geometry'],    n_spp.inputs['Geometry'])\n  links.new(n_pos.outputs['Position'],     n_spp.inputs['Value'])\n\n  n_spv = nodes.new('GeometryNodeSetPosition')\n  links.new(n_spp.outputs['Geometry'], n_spv.inputs['Geometry'])\n  links.new(n_np.outputs['Vector'],    n_spv.inputs['Position'])\n\nOn the next frame, the zone reads this geometry. n_prev reads prev_pos (which is last frame's pos), n_pos reads the committed new_pos (which is this frame's pos). The delta is the actual displacement — the implicit velocity.",
      },
      {
        title: "Build the Repeat Zone constraint loop",
        body: "Create the zone pair and wire geometry through it:\n\n  rep_out = nodes.new('GeometryNodeRepeatOutput')\n  rep_out.repeat_items.new('GEOMETRY', 'Geometry')\n  rep_in  = nodes.new('GeometryNodeRepeatInput')\n  rep_in.pair_with_output(rep_out)\n  links.new(g_in.outputs['Iterations'], rep_in.inputs['Iterations'])\n  links.new(n_spv.outputs['Geometry'], rep_in.inputs['Geometry'])\n\n  # Inside repeat: Offset +1 to find next point's index\n  n_off = nodes.new('GeometryNodeOffsetPointInCurve')\n  n_off.inputs['Offset'].default_value = 1  # Point Index → implicit Index field\n\n  n_pf   = nodes.new('GeometryNodeInputPosition')  # field to sample\n  n_samp = nodes.new('GeometryNodeSampleIndex')\n  n_samp.data_type = 'FLOAT_VECTOR'; n_samp.domain = 'POINT'\n  links.new(rep_in.outputs['Geometry'],      n_samp.inputs['Geometry'])\n  links.new(n_pf.outputs['Position'],        n_samp.inputs['Value'])\n  links.new(n_off.outputs['Point Index'],    n_samp.inputs['Index'])\n\nThe SampleIndex node reads the Position field at the index returned by OffsetPointInCurve — effectively pos[i+1]. Note: n_pf (InputPosition) connected to Value tells SampleIndex WHICH field to sample. If left unconnected, Value defaults to 0.",
      },
      {
        title: "Compute and apply constraint projection",
        body: "Inside the Repeat Zone, compute the correction scalar and apply via Offset:\n\n  n_ci  = nodes.new('GeometryNodeInputPosition')   # pos[i]\n  n_dlt = nodes.new('ShaderNodeVectorMath'); n_dlt.operation = 'SUBTRACT'\n  links.new(n_samp.outputs['Value'],  n_dlt.inputs[0])\n  links.new(n_ci.outputs['Position'], n_dlt.inputs[1])\n\n  n_len = nodes.new('ShaderNodeVectorMath'); n_len.operation = 'LENGTH'\n  links.new(n_dlt.outputs['Vector'], n_len.inputs[0])\n\n  # correction_scalar = (dist - rest_length) * 0.5 / dist\n  n_dr = nodes.new('ShaderNodeMath'); n_dr.operation = 'SUBTRACT'\n  links.new(n_len.outputs['Value'],       n_dr.inputs[0])\n  links.new(g_in.outputs['Rest Length'], n_dr.inputs[1])\n  n_h  = nodes.new('ShaderNodeMath'); n_h.operation = 'MULTIPLY'; n_h.inputs[1].default_value = 0.5\n  links.new(n_dr.outputs[0], n_h.inputs[0])\n  n_sc = nodes.new('ShaderNodeMath'); n_sc.operation = 'DIVIDE'; n_sc.use_clamp = True\n  links.new(n_h.outputs[0],          n_sc.inputs[0])\n  links.new(n_len.outputs['Value'],  n_sc.inputs[1])  # use_clamp guards div-by-zero\n\n  n_cv = nodes.new('ShaderNodeVectorMath'); n_cv.operation = 'SCALE'\n  links.new(n_dlt.outputs['Vector'], n_cv.inputs[0])\n  links.new(n_sc.outputs[0],         n_cv.inputs[3])  # Scale socket is inputs[3]\n\n  # Zero correction at last point — Switch(VECTOR): inputs[4]=False, inputs[5]=True\n  n_sw = nodes.new('GeometryNodeSwitch'); n_sw.input_type = 'VECTOR'\n  links.new(n_off.outputs['Is Valid'], n_sw.inputs[0])   # condition\n  links.new(n_cv.outputs['Vector'],    n_sw.inputs[5])   # True; False stays (0,0,0)\n\n  n_spc = nodes.new('GeometryNodeSetPosition')\n  links.new(rep_in.outputs['Geometry'], n_spc.inputs['Geometry'])\n  links.new(n_sw.outputs['Output'],     n_spc.inputs['Offset'])  # ← Offset, not Position\n  links.new(n_spc.outputs['Geometry'],  rep_out.inputs['Geometry'])",
      },
      {
        title: "Pin point 0 to the anchor empty",
        body: "After the constraint loop, override point 0 with the anchor's world location:\n\n  n_anc = nodes.new('GeometryNodeObjectInfo')\n  n_anc.transform_space = 'ORIGINAL'\n  n_anc.inputs['Object'].default_value = anchor_obj\n\n  n_idx = nodes.new('GeometryNodeIndex')\n  n_eq0 = nodes.new('FunctionNodeCompare')\n  n_eq0.data_type = 'INT'; n_eq0.operation = 'EQUAL'\n  links.new(n_idx.outputs['Index'], n_eq0.inputs[2])  # A int socket; B defaults to 0\n\n  n_pin = nodes.new('GeometryNodeSetPosition')\n  links.new(rep_out.outputs['Geometry'], n_pin.inputs['Geometry'])\n  links.new(n_eq0.outputs['Result'],     n_pin.inputs['Selection'])\n  links.new(n_anc.outputs['Location'],   n_pin.inputs['Position'])\n  links.new(n_pin.outputs['Geometry'],   sim_out.inputs['Geometry'])\n\nUsing Selection instead of a Switch node is cleaner — unselected points keep whatever position the constraint loop gave them. The anchor empty can be keyframed or driven: the rope will follow because ObjectInfo evaluates at the depsgraph level each frame.",
      },
      {
        title: "Add Curve-to-Mesh tube and bake the simulation",
        body: "Outside the zone, sweep a circle profile along the simulated curve:\n\n  n_circ = nodes.new('GeometryNodeCurvePrimitiveCircle')\n  n_circ.mode = 'RADIUS'\n  n_circ.inputs['Radius'].default_value     = 0.025\n  n_circ.inputs['Resolution'].default_value = 8\n\n  n_c2m = nodes.new('GeometryNodeCurveToMesh')\n  n_c2m.inputs['Fill Caps'].default_value = True\n  links.new(sim_out.outputs['Geometry'], n_c2m.inputs['Curve'])\n  links.new(n_circ.outputs['Curve'],     n_c2m.inputs['Profile Curve'])\n\nTo advance the simulation headlessly:\n\n  scene.frame_start, scene.frame_end = 1, 96\n  for f in range(1, 97):\n      scene.frame_set(f)\n      bpy.context.view_layer.update()\n\nSkipping any frame leaves the cache in the previous state. You cannot jump directly to frame 48 — the zone reads from its previous-frame cache, so every intermediate frame must be evaluated in order.\n\nExport at frame 48:\n  bpy.ops.export_scene.gltf(filepath='verlet_rope_frame48.glb',\n      use_selection=True, export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6, export_image_format='WEBP',\n      export_apply=True, export_animations=False)",
      },
    ],
    finalResult:
      "A .blend containing rope_anchor (sphere empty), rope_cable_host (GN Simulation Zone PBD rope). The cable hangs from (0,0,0) angled to (0.7,0,-2.0) at frame 1, swings under gravity with Verlet integration, settles under 6-pass constraint damping over 96 frames (4 seconds). verlet_rope_frame48.glb captures the cable at mid-swing, Draco 6 compressed with WebP texture encoding. The Repeat Zone approach: 6 Jacobi iterations per frame, one-sided projection (point i → point i+1), endpoint handled by the is_valid Switch. Changing CONSTRAINT_ITERS to 2 produces a stretchy bungee cord; 12 produces near-rigid cable.",
    variations: [
      "Animated anchor: keyframe the anchor empty's X location (0 → 1 → 0 over 48 frames) to make the rope swing like a pendulum on a moving mount. ObjectInfo evaluates per-frame, so the pin follows automatically without any GN changes.",
      "Multiple ropes: add more CurveLine sources with different offsets, run each through a separate GN modifier stack on the same host, or use a ForEachElement zone to iterate over a collection of anchor empties and emit one rope per anchor.",
      "Chain links: replace the tube with an InstanceOnPoints inside the zone, instancing a torus at each curve point. The torus axis follows the curve tangent (FunctionNodeAlignEulerToVector against the delta vector). Disable constraint for every other point to produce alternating-axis chain links.",
      "Wind force: add a time-varying horizontal force vector inside the zone. Frame time from the Scene Time node, fed through a Math SINE node, gives an oscillating crosswind. Add the result to new_pos alongside the gravity vec.",
      "Droop-only (catenary approximation): set INITIAL_SWING_X=0, use a very small GRAVITY_Z (-0.5), and increase CONSTRAINT_ITERS to 12. The rope converges quickly to a static droop that closely approximates the mathematical catenary without any external formula.",
    ],
    troubleshooting: [
      {
        symptom: "Rope stays rigid — no swing",
        cause: "The simulation cache was not built frame-by-frame. Jumping to frame 48 gives only the initial state because the zone has no previous-frame cache to read from.",
        fix: "Run the headless advance loop: for f in range(1, 97): scene.frame_set(f); view_layer.update(). Interactively, press Space from frame 1 and let the timeline play forward rather than scrubbing.",
      },
      {
        symptom: "SampleIndex returns zero vector for all points",
        cause: "The Value input on SampleIndex was left unconnected. Without a field input, it defaults to 0.",
        fix: "Connect a GeometryNodeInputPosition node output ('Position') to the SampleIndex 'Value' input. This tells the node to sample the Position field of the geometry at the given index.",
      },
      {
        symptom: "Rope explodes outward after a few frames",
        cause: "Division by zero in the constraint scalar when two adjacent points overlap (dist → 0). The correction becomes infinite.",
        fix: "Enable use_clamp=True on the DIVIDE Math node (n_sc). This clamps the result to [0, 1], capping correction at 100% of delta per iteration. Alternatively, add a Maximum node clamping the distance to a minimum of 0.001 before the divide.",
      },
      {
        symptom: "Point 0 drifts away from the anchor over time",
        cause: "The FunctionNodeCompare INT inputs use the wrong socket indices. INT comparison uses inputs[2] (A) and inputs[3] (B), not inputs[0] and inputs[1].",
        fix: "Print socket names after setting data_type='INT': [print(i, s.name) for i, s in enumerate(n_eq0.inputs)]. Wire Index to inputs[2]; inputs[3] defaults to 0.",
      },
      {
        symptom: "Constraint has no effect — rope stretches freely",
        cause: "SetPosition was given the correction as Position (absolute) rather than Offset. Setting an absolute position to the correction vector moves every point to a tiny near-origin location.",
        fix: "Wire the Switch output to n_spc.inputs['Offset'], not n_spc.inputs['Position']. The Offset socket adds the vector to the existing position; Position replaces it.",
      },
    ],
  },
  base,
);
