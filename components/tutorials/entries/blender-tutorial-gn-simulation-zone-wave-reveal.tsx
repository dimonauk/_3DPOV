import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSimWaveRevealBody() {
  return (
    <>
      <p>
        A Geometry Nodes{" "}
        <strong>Repeat Zone</strong> runs a fixed number of iterations inside a
        single frame evaluation — you saw it accumulate twelve crystal shards in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          GN Repeat Zone tutorial
        </Link>
        . A <strong>Simulation Zone</strong> works in the opposite direction: it
        runs exactly once per frame, but its output becomes the input for the
        NEXT frame. That single architectural difference transforms it from a
        within-frame accumulator into an across-frame state machine — the
        conceptual equivalent of a feedback loop or a shader storage buffer.
        Both zones use <code>pair_with_output()</code> and body channels, but
        the API property is <code>state_items</code> rather than{" "}
        <code>repeat_items</code>, and the semantics are temporal rather than
        iterative.
      </p>

      <p>
        This tutorial builds the canonical Simulation Zone use case: an
        activation wave propagates outward from the centre of a flat 20&times;20
        grid, frame by frame. Each vertex stores a float attribute called{" "}
        <code>wave_time</code> — 0.0 while inactive, and the{" "}
        <code>SceneTime.Seconds</code> value at the moment it first enters the
        wave front. Because the timestamp is written once and frozen, the
        attribute becomes a permanent record of each vertex&rsquo;s activation
        order. The EEVEE emission material reads that record via{" "}
        <code>ShaderNodeAttribute</code>, normalises it, and maps it through a
        dark-navy &rarr; cobalt &rarr; cyan-white ramp. For WebXR materialisation
        effects see the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>{" "}
        for how to drive visual effects from custom attributes without UV
        unwrapping.
      </p>

      <p>
        The zone carries two state items. <code>Geometry</code> is the implicit
        default body channel — the grid mesh with its per-vertex float attribute
        flows through the zone each frame. <code>Radius</code> is an additional
        scalar state item declared with{" "}
        <code>sim_out.state_items.new(&ldquo;FLOAT&rdquo;, &ldquo;Radius&rdquo;)</code>{" "}
        on the OUTPUT node; the INPUT node gains a matching socket automatically
        after <code>pair_with_output()</code>. On frame&nbsp;1, the INPUT
        node&rsquo;s <code>Radius</code> socket accepts the initial value (0.0);
        on every subsequent frame it receives the previous frame&rsquo;s cached
        output. A single <code>Math(ADD, STEP_PER_FRAME)</code> node inside the
        zone increments it by 0.025&nbsp;m per frame — no driver, no keyframe,
        no custom property. Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-drivers-parametric-shader"
          className={lk}
        >
          Animation Drivers tutorial
        </Link>
        , where a driver ties a shader socket to an object property over the
        timeline. Simulation Zones are self-contained; they do not need an
        external property to drive their evolution.
      </p>

      <p>
        The activation logic inside the zone uses a double{" "}
        <code>GeometryNodeSwitch</code> pattern. First, a{" "}
        <code>Math(GREATER_THAN, 0.0)</code> node marks already-active vertices
        as 1.0. Second, a <code>VectorMath(LENGTH)</code> node on the position
        gives each vertex&rsquo;s distance from the origin. A{" "}
        <code>Math(LESS_THAN)</code> node compares that distance to the new
        radius to flag vertices entering the front this frame. The{" "}
        <em>inner</em> switch picks between 0.0 (not reached) and the current
        scene-seconds timestamp (just reached). The <em>outer</em> switch then
        guards the inner result: if the vertex was already active, it discards
        the inner switch&rsquo;s output and keeps the original timestamp
        instead. This two-layer guard is necessary because the inner switch
        alone would overwrite an existing timestamp on any frame where the
        distance is still smaller than the radius. The outer guard makes
        activation permanent — a property the{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          vertex colour attributes tutorial
        </Link>{" "}
        achieves differently, by painting colour channels directly in Sculpt
        mode rather than computing them algorithmically.
      </p>

      <p>
        Reading the attribute back inside the zone requires{" "}
        <code>GeometryNodeInputNamedAttribute</code> with{" "}
        <code>data_type=&ldquo;FLOAT&rdquo;</code> and the exact attribute name.
        This is distinct from reading a colour attribute or a named attribute
        exposed via the group interface — the node reads directly from the
        geometry&rsquo;s attribute data block, which the Simulation Zone
        preserves across frames as part of its body channel geometry. When
        Blender builds the frame cache in headless mode, you must iterate
        sequentially with <code>scene.frame_set(N)</code> from frame&nbsp;1 to
        your target frame; jumping directly to frame&nbsp;60 produces incorrect
        results because the zone has no previous-frame state to read from.
        The blueprint&rsquo;s <code>for frame in range(1, GLB_FRAME + 1):</code>{" "}
        loop is not boilerplate — it is the only correct way to populate the
        cache in a headless script.
      </p>

      <p>
        <strong>Outside reference — Blender Manual: Simulation Zone</strong> (
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        , CC-BY-SA&nbsp;4.0, Blender Documentation Team). The manual covers the
        zone&rsquo;s skip input, cache behaviour, and bake workflow. Related
        project from the same organisation:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/time/scene_time.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Scene Time Node
        </a>{" "}
        (CC-BY-SA&nbsp;4.0) — documents the <code>Seconds</code> and{" "}
        <code>Frame</code> outputs that the blueprint uses for timestamping
        activation events.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-simulation-zone-wave-reveal",
  title:
    "GN Simulation Zone — Wave Reveal on Grid (Blender 5.1)",
  date: "2026-05-24",
  kind: "tutorial",
  excerpt:
    "Build a Geometry Nodes Simulation Zone that propagates a radial activation wave across a flat grid. Per-vertex wave_time timestamps freeze permanently on first contact; an EEVEE emission material maps them to a dark-navy → cobalt → cyan-white glow reveal.",
  Body: GnSimWaveRevealBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "intermediate",
    prerequisites: [
      "Understand the Repeat Zone from the crystal-cluster tutorial — pair_with_output() and body channels are the shared foundation.",
      "Know what a POINT-domain float attribute is and how Store Named Attribute writes one.",
      "Comfortable with ShaderNodeMath and ShaderNodeSwitch node wiring via Python.",
      "Blender 5.1 installed. Can run scripts headlessly.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Simulation Zones were introduced in Blender 3.6. The state_items API on the OUTPUT node and GeometryNodeInputNamedAttribute require Blender 4.0 or later. The blueprint targets 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand what a Simulation Zone is and is not",
        body:
          "A Simulation Zone is NOT a particle system and NOT a physics simulation in the traditional sense. It is a pair of GN nodes (SimulationInput + SimulationOutput) that Blender treats as a temporal feedback loop:\n\n  Frame N:   zone input  = cached output from frame N-1\n  Frame N+1: zone input  = cached output from frame N\n\nOn frame 1 (or when the cache is cleared), the zone uses the 'skip input' — the geometry connected to SimulationInput from outside the zone — as the initial state. This is why the blueprint connects the initial grid to sim_in.inputs['Geometry'] before the zone body.\n\nThe zone can carry any number of state items (body channels):\n  Geometry  — the mesh with per-vertex attributes, face data, curves, etc.\n  FLOAT     — a scalar float persisted between frames (e.g. growing radius)\n  INT, VECTOR, BOOLEAN, RGBA — other scalar types\n\nThe key constraint: the zone evaluates once per frame during animation playback or headless iteration. There is no within-frame looping; for that you use a Repeat Zone instead.",
      },
      {
        title: "Create the base mesh and initialise the wave_time attribute",
        body:
          "The base mesh is a flat 20×20 grid created via bmesh.ops.create_grid:\n\n  bm = bmesh.new()\n  bmesh.ops.create_grid(\n      bm,\n      x_segments=19,\n      y_segments=19,\n      size=1.5,    # bmesh size = half-extent; full width = 3.0 m\n  )\n  bm.to_mesh(mesh)\n  bm.free()\n\nThe initial wave_time attribute is added to the MESH OBJECT (not inside the GN tree) so it exists on the geometry flowing into the zone's skip input:\n\n  mesh.attributes.new(name='wave_time', type='FLOAT', domain='POINT')\n\nBlender initialises all float attribute data to 0.0 automatically. The Simulation Zone will preserve this attribute on the geometry across frames, modifying it each frame inside the zone body.\n\nImportant: adding the attribute to the base mesh (outside GN) means it survives even if the GN modifier is disabled. The zone reads it via GeometryNodeInputNamedAttribute, which will find it by name on whatever geometry the zone receives.",
      },
      {
        title: "Declare the Simulation Zone and add the Radius state item",
        body:
          "Create and pair the zone nodes:\n\n  sim_in  = nodes.new('GeometryNodeSimulationInput')\n  sim_out = nodes.new('GeometryNodeSimulationOutput')\n  sim_in.pair_with_output(sim_out)   # must come BEFORE state_items.new()\n\nThen add the Radius scalar state — declared on the OUTPUT node:\n\n  sim_out.state_items.new('FLOAT', 'Radius')\n\nAfter this call, the zone has:\n  sim_in.outputs['Radius']  → cached radius from previous frame\n  sim_out.inputs['Radius']  → radius to cache for next frame\n  sim_in.inputs['Radius']   → initial Radius for frame 1 (default 0.0, which is correct)\n\nNote the asymmetry vs Repeat Zone:\n  Repeat Zone: repeat_in.repeat_items.new('GEOMETRY', 'Accumulated')   — INPUT node\n  Simulation Zone: sim_out.state_items.new('FLOAT', 'Radius')           — OUTPUT node\n\nBoth calls sync matching sockets to the paired sibling node, but the declaration lives on different nodes for each zone type. This is a Blender API design decision, not an error.",
      },
      {
        title: "Build the radius growth and position distance nodes",
        body:
          "Inside the zone body:\n\n  # Grow radius by a fixed amount each frame\n  n_rad_grow = nodes.new('ShaderNodeMath')\n  n_rad_grow.operation = 'ADD'\n  n_rad_grow.inputs[1].default_value = 0.025  # metres per frame\n  links.new(sim_in.outputs['Radius'], n_rad_grow.inputs[0])\n  links.new(n_rad_grow.outputs['Value'], sim_out.inputs['Radius'])\n\n  # Vertex distance from grid centre (which is at the origin)\n  n_pos = nodes.new('GeometryNodeInputPosition')\n  n_len = nodes.new('ShaderNodeVectorMath')\n  n_len.operation = 'LENGTH'\n  links.new(n_pos.outputs['Position'], n_len.inputs[0])\n  # n_len.outputs['Value'] is the scalar distance (not outputs['Vector'])\n  # LENGTH fills the second output socket ('Value'), not the first ('Vector')\n\nThe distance is in mesh object space. Since the grid is centred at the object origin and the object has no parent transform, this is also world-space distance — the centre of the grid has distance 0.0, corners have distance ~2.12 m (√2 × 1.5).",
      },
      {
        title: "Build the double-Switch activation logic",
        body:
          "Read the existing wave_time attribute:\n  n_read_wt = nodes.new('GeometryNodeInputNamedAttribute')\n  n_read_wt.data_type = 'FLOAT'\n  n_read_wt.inputs['Name'].default_value = 'wave_time'\n\n  # was_active = 1.0 if wave_time > 0, else 0.0\n  n_was_active.operation = 'GREATER_THAN'\n  n_was_active.inputs[1].default_value = 0.0\n  links.new(n_read_wt.outputs['Attribute'], n_was_active.inputs[0])\n\n  # just_reached = (dist < radius) AND (NOT was_active)\n  # — done as float MULTIPLY of two 0/1 values\n  n_in_range.operation = 'LESS_THAN'  # 1.0 if vertex inside wave front\n  n_not_active.operation = 'SUBTRACT'; n_not_active.inputs[0].default_value = 1.0\n  n_just_reached.operation = 'MULTIPLY'  # AND gate\n\n  # Inner switch: value for currently-inactive vertices\n  n_sw_inner.input_type = 'FLOAT'\n  # inputs[0] = condition (just_reached)\n  # inputs[1] = False value (0.0 — not yet reached)\n  # inputs[2] = True value  (scene_seconds — just activated)\n\n  # Outer switch: preserve existing timestamp for already-active vertices\n  n_sw_outer.input_type = 'FLOAT'\n  # inputs[0] = condition (was_active)\n  # inputs[1] = False value (n_sw_inner output — inactive path)\n  # inputs[2] = True value  (old wave_time — preservation path)\n\nThe outer guard is critical. Without it, any vertex whose distance remains smaller than the radius on a later frame would have its timestamp overwritten with the later scene_seconds value, corrupting the 'first contact' semantics.",
      },
      {
        title: "Wire Store Named Attribute and connect to zone output",
        body:
          "Write the new wave_time back to the geometry flowing through the zone:\n\n  n_store = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_store.data_type = 'FLOAT'\n  n_store.domain    = 'POINT'\n  n_store.inputs['Name'].default_value = 'wave_time'\n\n  links.new(sim_in.outputs['Geometry'],       n_store.inputs['Geometry'])\n  links.new(n_sw_outer.outputs['Output'],     n_store.inputs['Value'])\n  links.new(n_store.outputs['Geometry'],      sim_out.inputs['Geometry'])\n\nThe geometry from sim_in (previous frame's state) flows INTO n_store's Geometry input. The updated geometry flows OUT of n_store INTO sim_out — which caches it for the next frame. This wiring pattern (sim_in → process → sim_out) is the fundamental Simulation Zone idiom.\n\nAfter the zone, add SetShadeSmooth(False) and connect to the GroupOutput.",
      },
      {
        title: "Build the emission material and advance the simulation headlessly",
        body:
          "Material using ShaderNodeAttribute to read the wave_time GN attribute:\n\n  attr_n = nt.nodes.new('ShaderNodeAttribute')\n  attr_n.attribute_name = 'wave_time'\n  # outputs: Color (zero for inactive), Fac (scalar float), Alpha\n\n  norm_n.inputs[1].default_value = TOTAL_FRAMES / 24.0  # normalise to 0-1\n  # → ColorRamp(B_SPLINE): 0.0=dark-navy, 0.45=cobalt, 1.0=cyan-white\n  # → Emission(strength=4.0) → Material Output\n\nHeadless simulation advance:\n\n  for frame in range(1, GLB_FRAME + 1):\n      scene.frame_set(frame)\n      bpy.context.view_layer.update()\n\nThis loop is mandatory. Calling scene.frame_set(60) directly on a fresh scene produces only the frame-1 state (or worse, all-zero state) because the simulation cache is built incrementally. The view_layer.update() call forces the GN modifier to evaluate and write the new state to Blender's cache. Without it, frame_set() alone may not trigger full evaluation in headless mode.",
      },
    ],
    finalResult:
      "A .blend containing a flat 20×20 grid with a live Simulation Zone that propagates a radial activation wave from the centre outward over 120 frames. Each vertex stores the scene-seconds timestamp of its first activation in the wave_time attribute, which the EEVEE emission material reads to produce a dark-navy → cobalt → cyan-white reveal. The GLB snapshot captures the wave at frame 60 — roughly halfway across the grid — baked into the mesh geometry.",
    variations: [
      "Irregular seed: instead of seeding from the origin, use a Named Attribute node outside the zone to pre-seed a specific vertex (e.g. nearest to a custom property position vector). The activation then propagates from that point. Useful for touch-activated materialisation in WebXR.",
      "Multiple wave fronts: add a second Radius state item (Radius2) seeded at a different frame or a different origin. Inside the zone, run the in_range check twice (once per radius/seed) and OR the two just_reached results before feeding the outer switch.",
      "Decay after activation: add a second attribute (active_age) that increments each frame for active vertices. Drive the emission strength from active_age — vertices reach peak brightness immediately on activation, then fade. This requires an extra Float state item and an additional ADD node per active vertex.",
    ],
    troubleshooting: [
      {
        symptom: "All wave_time values stay 0.0 — wave never propagates",
        cause:
          "The simulation cache was not built frame-by-frame before export. The GN modifier has no previous-frame state and falls back to the skip input every frame.",
        fix:
          "Ensure the headless script iterates range(1, GLB_FRAME + 1) with both frame_set(N) and view_layer.update() on every step. Verify by printing obj.data.attributes['wave_time'].data[0].value after the loop — it should be non-zero for at least the centre vertex.",
      },
      {
        symptom: "AttributeError: 'GeometryNodeSimulationOutput' object has no attribute 'state_items'",
        cause:
          "Running on Blender older than 3.6 or using the wrong node type name.",
        fix:
          "Confirm you are on Blender 5.1 and that nodes.new('GeometryNodeSimulationOutput') returns the correct type. In Blender 3.6 the property may have been on the INPUT node; try sim_in.state_items.new('FLOAT', 'Radius') as a fallback.",
      },
      {
        symptom: "wave_time attribute not visible in ShaderNodeAttribute material",
        cause:
          "The attribute was written by GN but the material is evaluated before the GN modifier in the stack, or the attribute name has a typo.",
        fix:
          "Check attr_n.attribute_name exactly matches the string in blueprint.py (ATTR_NAME constant). Confirm the GN modifier is above the material in the modifier stack (there is no material modifier — the material reads from the GN-evaluated mesh). Also check Blender's Spreadsheet editor to confirm the attribute exists on the evaluated mesh.",
      },
      {
        symptom: "Already-active vertices have their wave_time updated on subsequent frames",
        cause:
          "The outer Switch node (preservation guard) is missing or wired incorrectly — the was_active condition is feeding the inner switch rather than the outer.",
        fix:
          "Trace the wiring: n_was_active → n_sw_outer.inputs[0]. If n_was_active is instead feeding n_sw_inner, swap the connections. The outer switch MUST gate on was_active; the inner switch gates on just_reached.",
      },
    ],
  },
  base,
);
