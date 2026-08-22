import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender 5.1&rsquo;s Simulation Zone works on any geometry type —
        including the <strong>Curves</strong> (HairCurves) object introduced
        in Blender 4.0. This tutorial applies a spring-chain physics simulation
        directly to a Curves data block so that guide strands sway under
        gravity, bounce back toward their rest pose, and respond to a sinusoidal
        wind gust — all inside the GN graph, evaluated on every frame change,
        with no Mantaflow, no VRM Spring Bone runtime, and no cloth physics.
      </p>
      <p>
        The key difference from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Verlet rope tutorial
        </Link>{" "}
        is the data type: ropes live on a{" "}
        <em>Mesh</em> object as vertex positions, whereas hair strands live on a{" "}
        <em>Curves</em> object with <code>POINT</code> and <code>SPLINE</code>{" "}
        domains. The{" "}
        <code>GeometryNodeOffsetPointInCurve</code> node, which traverses the
        curve&rsquo;s point chain by a signed offset, is the topology primitive
        that makes spring-chain physics possible within a field — it replaces
        the index-arithmetic hacks you&rsquo;d need on a plain mesh.
      </p>

      <h2>The Curves object vs. the old Hair particle system</h2>
      <p>
        <code>bpy.data.hair_curves.new(name)</code> creates a <em>new-style</em>{" "}
        Curves block (<code>bpy.types.Curves</code>, plural). This is entirely
        distinct from <code>bpy.data.curves.new(name, type=&apos;CURVE&apos;)</code>,
        which creates a Bezier/NURBS curve object. The new type was designed for
        hair grooming: each &ldquo;spline&rdquo; is a guide strand, each{" "}
        <code>POINT</code>-domain element is a control point along that strand.
        Adding guide strands is a single call:
      </p>
      <pre>{`hc = bpy.data.hair_curves.new('HairGuides')
hc.add_curves([STRAND_PTS] * N_GUIDES)
# STRAND_PTS control points per strand, N_GUIDES strands total`}</pre>
      <p>
        Attributes seeded at this stage — <code>rest</code> (rest-pose
        positions) and <code>vel</code> (initial velocities, all zero) — ride
        the Geometry body channel through the Simulation Zone exactly as they
        would on a mesh. No extra state items on the zone are needed; the entire
        per-point state is a named attribute.
      </p>

      <h2>Root detection via Offset Point in Curve</h2>
      <p>
        Unlike a mesh, where every vertex is in an undirected graph, a Curves
        strand has a strict ordering: point 0 is the root (closest to the
        scalp), point N-1 is the free tip. The{" "}
        <strong>Offset Point in Curve</strong> node traverses this ordering:
        given the current point index and an offset of{" "}
        <code>-1</code>, it returns the index of the point one step toward the
        root <em>within the same spline</em> and a boolean{" "}
        <code>Is Valid Offset</code>. At the root point itself, offset
        <code>-1</code> would leave the spline — so{" "}
        <code>Is Valid Offset = False</code>. This is the root-detection signal:
      </p>
      <pre>{`n_off = nodes.new('GeometryNodeOffsetPointInCurve')
# Index → Point Index input, default offset = -1
is_valid_parent = n_off.outputs['Is Valid Offset']
# NOT(is_valid_parent) → is_root`}</pre>
      <p>
        Why this is better than modulo arithmetic (<code>index % STRAND_PTS ==
        0</code>): modulo assumes all strands have exactly the same number of
        points, which breaks the moment you mix strand lengths. The{" "}
        <code>Offset Point in Curve</code> approach is topology-intrinsic — it
        respects actual strand boundaries regardless of point counts. Compare
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-deform-curves-on-surface-vrm-hair"
          className={lk}
        >
          Deform Curves on Surface tutorial
        </Link>
        , which uses the same strand structure but applies a different technique
        (UV barycentric binding to a scalp mesh) to keep roots anchored.
      </p>

      <h2>Spring chain force model</h2>
      <p>
        Each non-root point receives four force contributions every frame:
      </p>
      <pre>{`spring_force = K_SPRING * (parent_pos − current_pos)
gravity      = (0, 0, −GRAVITY)
wind         = (WIND_AMP · sin(t · WIND_FREQ · 2π), 0, 0)
drag         = −DRAG · velocity

net_force = spring_force + gravity + wind + drag
new_vel   = old_vel + net_force * DT
new_pos   = old_pos + new_vel * DT`}</pre>
      <p>
        The spring force acts toward the <em>parent</em> point (one step
        toward the root), not toward the rest position. This creates a chain
        dynamic where stiffness propagates from root to tip: moving the root
        pulls the whole chain via the spring links. The rest attribute is used
        only for the root&rsquo;s hard pin — not for the spring target. This is
        the same model used in VRM Spring Bones at runtime, except here it runs
        in the GN graph at design time.
      </p>
      <p>
        The wind is sinusoidal and uses <code>GeometryNodeInputSceneTime</code>{" "}
        to read elapsed seconds, so the oscillation period is frame-rate
        independent. A <code>WIND_FREQ</code> of 0.8 Hz produces one full gust
        cycle every 1.25 seconds — just slow enough that the strands don&rsquo;t
        resonate chaotically at the default stiffness. Compare the purely
        physics-driven excitation in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum tutorial
        </Link>
        , where the forcing frequency was tuned to hit Lissajous resonance.
      </p>

      <h2>Root pinning with the Switch node</h2>
      <p>
        After computing physics values for every point, roots must be
        overridden:
      </p>
      <pre>{`# Switch(is_root, physics_value, pinned_value)
# False input  = physics (non-root)
# True  input  = pinned  (root → rest position, zero velocity)
n_sw_pos.input_type  = 'VECTOR'
n_sw_pos.inputs[0]   = is_root           # condition
n_sw_pos.inputs[1]   = new_pos           # False: physics position
n_sw_pos.inputs[2]   = rest_attribute    # True:  rest position`}</pre>
      <p>
        This Switch fires on the <code>is_root = NOT(Is Valid Offset)</code>{" "}
        boolean. Because the zone evaluates all points simultaneously as a
        field, this is a per-point conditional — not a loop. Every root gets
        pinned in one node evaluation; every non-root gets its physics result.
      </p>

      <h2>Tuning the parameters</h2>
      <p>
        Three sockets are exposed on the modifier for live tuning:
      </p>
      <ul>
        <li>
          <strong>Spring K</strong> (default 90): lower → softer, more sway;
          higher → stiffer, quicker recovery. Above ≈ 120, strands may go
          numerically unstable at 24 fps — reduce DT or add more drag.
        </li>
        <li>
          <strong>Gravity</strong> (default 3.0): real gravity is 9.8 m/s²,
          but hair strands at 0.14 m length need amplified gravity for a
          physically plausible visual result at the GN timestep. Scale with
          strand length.
        </li>
        <li>
          <strong>Drag</strong> (default 14): controls how quickly oscillations
          damp out. At zero drag, strands oscillate indefinitely. At ≈ 2× the
          critical damping value they settle in one swing.
        </li>
      </ul>
      <p>
        The critical damping coefficient for a spring-mass system is{" "}
        <code>c_crit = 2 · √(K_SPRING · m)</code>. Assuming unit mass,{" "}
        <code>c_crit ≈ 2·√90 ≈ 19</code>. The default drag of 14 gives slight
        under-damping (strands overshoot once before settling) — the most
        visually lively option for performance animation. This connects to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi"
          className={lk}
        >
          Van der Pol limit cycle tutorial
        </Link>
        , which studied oscillation stability for poi dynamics using a similar
        damping analysis.
      </p>

      <h2>GLB export and WebXR integration</h2>
      <p>
        Blender&rsquo;s glTF exporter cannot export live Simulation Zone state
        as animation — the GN cache is a Blender-internal structure with no
        glTF equivalent. The only export path is a frame-frozen snapshot:{" "}
        <code>scene.frame_set(N)</code>, then{" "}
        <code>export_apply=True</code> which evaluates the full GN stack at
        frame N and bakes the result to raw mesh geometry. The GLB therefore
        contains the hair strands at one moment of the swing, not the full
        animation. For animated hair in WebXR, the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM Spring Bones approach
        </Link>{" "}
        (where the runtime viewer applies physics) is the correct production
        path; this GN technique is for Blender-side previsualization and for
        baking a specific styled pose to GLB.
      </p>
    </>
  );
}

const data = {
  title:
    "GN Simulation Zone — Hair Curves Spring Dynamics: Inertia, Drag & Wind for VRM Flowing Hair (Blender 5.1)",
  lede:
    "Apply a per-point spring-chain physics simulation directly to a Curves (HairCurves) object via a Geometry Nodes Simulation Zone. Root points are hard-pinned via Offset Point in Curve's Is Valid Offset signal; every other point integrates gravity, spring restoration, air drag, and sinusoidal wind as a concurrent field computation — no Mantaflow, no VRM Spring Bone runtime required.",
  date: "2026-07-25",
  prerequisites: [
    "Familiarity with Geometry Nodes Simulation Zone basics (Simulation Input / Output, body channel pattern)",
    "Understanding of the new Curves object type vs. legacy NURBS/Bezier curves",
    "Basic Python bpy scripting knowledge for running blueprint.py",
  ],
  steps: [
    {
      title: "Understand why Curves need a different topology primitive than Mesh",
      body:
        "On a Mesh, every vertex is an unordered member of a vertex array — there is no inherent 'parent' concept. Modulo arithmetic (index % STRAND_PTS == 0) fakes strand structure but breaks when strand lengths vary.\n\nThe CURVES data type has an explicit strand ordering: each spline is a directed chain from root (index 0 within the spline) to tip. GeometryNodeOffsetPointInCurve navigates this ordering safely: offset -1 gives the parent; Is Valid Offset = False at the root because offset -1 would leave the strand. This signal is the physically correct root detector:\n\n  is_root = NOT(Offset Point in Curve(Index, offset=-1).Is Valid Offset)\n\nThis also handles variable strand lengths gracefully — short strands and long strands work identically, because the boundary test is strand-intrinsic, not arithmetic.",
    },
    {
      title: "Create the HairCurves object and seed named attributes",
      body:
        "bpy.data.hair_curves.new() — note: hair_curves, not curves — creates the new-style Curves block:\n\n  hc = bpy.data.hair_curves.new('HairGuides')\n  hc.add_curves([STRAND_PTS] * N_GUIDES)\n  # allocates STRAND_PTS * N_GUIDES points in one contiguous flat array\n\nSeed two named attributes before adding the GN modifier:\n\n  rest_attr = hc.attributes.new('rest', 'FLOAT_VECTOR', 'POINT')\n  vel_attr  = hc.attributes.new('vel',  'FLOAT_VECTOR', 'POINT')\n  for gi in range(N_GUIDES * STRAND_PTS):\n      rest_attr.data[gi].vector = (rx, ry, local_z)   # upright rest pose\n      vel_attr.data[gi].vector  = (0.0, 0.0, 0.0)     # zero initial velocity\n\nThese attributes ride the Geometry body channel through the Simulation Zone. The zone needs no state_items at all — the only per-point evolving state is velocity, which lives in 'vel'. Position is the implicit attribute of every geometry type.\n\nRoot scatter: distribute N_GUIDES root positions on a small disc (SCATTER_R = 0.06 m) using polar coordinates with sqrt(uniform) for uniform area density. Each strand grows straight upward — rest pose is a perfect vertical line.",
    },
    {
      title: "Build the Simulation Zone — Geometry body channel only",
      body:
        "Pair SimulationInput and SimulationOutput:\n\n  sim_in  = nodes.new('GeometryNodeSimulationInput')\n  sim_out = nodes.new('GeometryNodeSimulationOutput')\n  sim_in.pair_with_output(sim_out)\n  links.new(g_in.outputs['Geometry'], sim_in.inputs['Geometry'])\n\nNo state_items.new() calls. The single Geometry body channel carries the Curves geometry — with all its named attributes, including 'vel' — across frames. Compare the Boid Flock tutorial, which also keeps velocity as a named attribute rather than a state item: the principle is the same on Curves as on Mesh.\n\nInside the zone, read the three fields needed for force computation:\n  Position node → current position (changes each frame)\n  InputNamedAttribute('vel') → last frame's velocity\n  InputNamedAttribute('rest') → rest pose (constant; used for root pinning only)",
    },
    {
      title: "Wire Offset Point in Curve for parent-position sampling",
      body:
        "The spring force requires the parent point's current position:\n\n  n_off = nodes.new('GeometryNodeOffsetPointInCurve')\n  links.new(n_idx.outputs['Index'], n_off.inputs['Point Index'])\n  n_off.inputs['Offset'].default_value = -1\n  # outputs: Point Index (INT), Is Valid Offset (BOOL)\n\n  n_sp_pos = nodes.new('GeometryNodeSampleIndex')\n  n_sp_pos.data_type = 'FLOAT_VECTOR'\n  n_sp_pos.domain    = 'POINT'\n  links.new(sim_in.outputs['Geometry'],      n_sp_pos.inputs['Geometry'])\n  links.new(n_pos.outputs['Position'],       n_sp_pos.inputs['Value'])\n  links.new(n_off.outputs['Point Index'],    n_sp_pos.inputs['Index'])\n  # Value output = parent point's world position\n\nFor root points, Offset Point in Curve returns an undefined index. The SampleIndex node will read whatever is at that index — but it doesn't matter, because the Switch node downstream will discard physics results for roots and substitute the rest position instead. The undefined parent-position read at the root is a don't-care.",
    },
    {
      title: "Assemble forces and integrate",
      body:
        "Spring force: K_SPRING * (parent_pos − current_pos)\n  VectorMath(SUBTRACT, parent_pos, current_pos) → spring_dir\n  VectorMath(SCALE, spring_dir, K_SPRING socket) → spring_force\n\nGravity: (0, 0, −GRAVITY)\n  Math(MULTIPLY, GRAVITY socket, −1) → neg_g\n  CombineXYZ(X=0, Y=0, Z=neg_g) → grav_vec\n\nWind (sinusoidal, frame-rate independent):\n  SceneTime.outputs['Seconds'] * WIND_FREQ * 2π → wind_arg\n  Math(SINE, wind_arg) * WIND_AMP → wind_x\n  CombineXYZ(X=wind_x, Y=0, Z=0) → wind_vec\n\nDrag: −DRAG * velocity\n  Math(MULTIPLY, DRAG socket, −1) → neg_drag_coeff\n  VectorMath(SCALE, vel, neg_drag_coeff) → drag_vec\n\nIntegration:\n  f_net   = spring_force + grav_vec + wind_vec + drag_vec\n  new_vel = old_vel + f_net * DT\n  new_pos = old_pos + new_vel * DT\n\nDT = 1/24 for 24 fps. At higher K_SPRING, reduce DT or add a substep loop (run the integration N times per frame with DT/N) to prevent numerical blow-up.",
    },
    {
      title: "Apply root pinning with the Switch node",
      body:
        "After computing new_vel and new_pos for every point, override root points:\n\n  n_boolnot = nodes.new('FunctionNodeBooleanMath')\n  n_boolnot.operation = 'NOT'\n  links.new(n_off.outputs['Is Valid Offset'], n_boolnot.inputs[0])\n  # is_root = NOT(is_valid_parent)\n\n  # Position switch\n  n_sw_pos = nodes.new('GeometryNodeSwitch')\n  n_sw_pos.input_type = 'VECTOR'\n  links.new(n_boolnot.outputs['Boolean'],    n_sw_pos.inputs[0])  # condition\n  links.new(new_pos,                         n_sw_pos.inputs[1])  # False → physics\n  links.new(n_rest.outputs['Attribute'],     n_sw_pos.inputs[2])  # True  → rest pin\n\n  # Velocity switch\n  n_sw_vel = nodes.new('GeometryNodeSwitch')\n  n_sw_vel.input_type = 'VECTOR'\n  links.new(n_boolnot.outputs['Boolean'],    n_sw_vel.inputs[0])\n  links.new(new_vel,                         n_sw_vel.inputs[1])  # False → physics\n  n_sw_vel.inputs[2].default_value = (0, 0, 0)                    # True  → zero\n\nThe Switch node evaluates per-point in the field context — all 40 root points get the rest position simultaneously; all 280 non-root points get their physics result. No loop, no conditional branch in the traditional sense.",
    },
    {
      title: "Set position and store velocity for next frame",
      body:
        "  n_set_pos = nodes.new('GeometryNodeSetPosition')\n  links.new(sim_in.outputs['Geometry'],  n_set_pos.inputs['Geometry'])\n  links.new(n_sw_pos.outputs[0],         n_set_pos.inputs['Position'])\n\n  n_store = nodes.new('GeometryNodeStoreNamedAttribute')\n  n_store.data_type = 'FLOAT_VECTOR'\n  n_store.domain    = 'POINT'\n  n_store.inputs['Name'].default_value = 'vel'\n  links.new(n_set_pos.outputs['Geometry'], n_store.inputs['Geometry'])\n  links.new(n_sw_vel.outputs[0],           n_store.inputs['Value'])\n\n  links.new(n_store.outputs['Geometry'], sim_out.inputs['Geometry'])\n\nOrder: SetPosition first, StoreNamedAttribute second. If reversed, the Geometry that arrives at SimOut would have updated velocity but stale positions — the cache would store the position lag one frame behind.\n\nThe 'rest' attribute is never written back inside the zone (it is a constant). Only 'vel' is stored, because that is the only evolving per-point state beyond position itself.",
    },
    {
      title: "Warm the cache and export a GLB snapshot",
      body:
        "The Simulation Zone builds its cache incrementally — jumping to frame 30 without stepping through frames 1-29 reads uninitialised state:\n\n  for f in range(1, EXPORT_FRAME + 1):\n      scene.frame_set(f)\n      bpy.context.view_layer.update()\n\nview_layer.update() forces the depsgraph to evaluate the GN modifier and write the result to Blender's cache. Without it, frame_set() may not trigger GN evaluation in headless background mode.\n\nGLB snapshot at frame 30 (mid-swing):\n  bpy.ops.export_scene.gltf(\n      filepath      = GLB_OUT,\n      export_format = 'GLB',\n      export_apply  = True,\n  )\n\nexport_apply=True evaluates the full GN stack at the current frame and bakes the Curves geometry to its computed form. Note: glTF has no equivalent of a Simulation Zone animation — the GLB contains only the posed snapshot, not the motion.",
    },
  ],
  finalResult:
    "A Blender 5.1 .blend containing a HairCurves object (40 strands, 8 points each) with a Geometry Nodes modifier that runs spring-chain physics via a Simulation Zone. Root points are hard-pinned using Offset Point in Curve's Is Valid Offset signal; tip points swing under gravity, spring restoration, air drag, and a 0.8 Hz sinusoidal wind gust. The simulation is tuned for slight under-damping so strands overshoot once before settling. A GLB snapshot captures the strands at frame 30 (mid-swing, maximum displacement).",
  variations: [
    "Bind to a scalp mesh: set hc.surface = scalp_obj and hc.surface_uv_map = 'UVMap', then prepend a DeformCurvesOnSurface node before the Simulation Zone. The DeformCOS updates the rest attribute each frame by following scalp deformation, so pinned roots travel with a moving armature.",
    "Variable stiffness: add a 'stiffness' FLOAT attribute on the POINT domain, set higher values near the root and lower at the tip (exponential falloff: stiffness[i] = K * exp(-i/STRAND_PTS)). Inside the zone, multiply spring_dir by SampleNamedAttribute('stiffness') instead of the global K_SPRING socket.",
    "Collision response: add a floor plane. After computing new_pos, add an AttributeStatistic comparison: if new_pos.Z < 0, set new_pos.Z = 0 and new_vel.Z = max(0, new_vel.Z). This is penetration correction, not a proper collision, but it looks convincing for gentle floor contacts.",
    "Export as animated GLB: instead of a single snapshot, bake N frames to separate GLBs (hair_{frame:04d}.glb) and stitch them client-side as a frame sequence in Three.js using a custom GLB morph-target loader.",
  ],
  troubleshooting: [
    {
      symptom: "All strands remain rigid — no physics motion",
      cause:
        "The Simulation Zone cache was not warmed from frame 1. If you scrub to frame 20 directly, the zone reads uninitialised 'vel' attribute data (all zero) and has no previous-frame state to integrate from.",
      fix:
        "In Python, always step through every frame: 'for f in range(1, target_frame + 1): scene.frame_set(f); bpy.context.view_layer.update()'. In the UI, set the timeline to frame 1 and press Play — never jump forward.",
    },
    {
      symptom: "Strands explode (positions blow up to infinity) after a few frames",
      cause:
        "Numerical instability. With Euler integration, the stability condition is DT < 2/DRAG and DT² < 2/K_SPRING. At K_SPRING=90, DT must be < 0.149 s. The default DT=1/24 ≈ 0.042 s satisfies this, but if K_SPRING is raised above ~275 the system goes unstable.",
      fix:
        "Reduce K_SPRING or increase DRAG. Alternatively, implement a sub-step: run the force integration 4× per frame with DT/4, which shifts the stability threshold to K_SPRING < 4400.",
    },
    {
      symptom: "Root points drift from their rest positions over time",
      cause:
        "The Switch condition is inverted — the True branch (rest position) is wired where the False branch (physics) should be, or vice versa.",
      fix:
        "Verify: Switch inputs[1] = new_pos (False / non-root / physics), inputs[2] = rest_attribute (True / root / pin). The is_root signal is True for root points, so the True branch must carry the pinned value.",
    },
    {
      symptom: "Offset Point in Curve returns the wrong neighbours for strands",
      cause:
        "The 'Point Index' input is connected to the global Index node correctly, but the offset default_value was left at 0 instead of −1, so every point reads its own position as 'parent'.",
      fix:
        "Confirm: n_off.inputs['Offset'].default_value = -1. In the node graph, check the Offset input socket shows '−1'. If the Value input is unconnected and the default is 0, the spring force will always be zero (parent = self, zero displacement).",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Manual — Simulation Zone (Geometry Nodes) — CC-BY-SA-4.0 — Blender Documentation Team",
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
    },
    {
      label:
        "Blender Manual — Offset Point in Curve — CC-BY-SA-4.0 — Blender Documentation Team",
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/curve/topology/offset_point_in_curve.html",
    },
    {
      label:
        "bpy.types.Curves — HairCurves API Reference — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Curves.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Deform Curves on Surface — Hair Strand Binding for VRM Armature Deformation",
      href: "/tutorials/blender-tutorial-gn-deform-curves-on-surface-vrm-hair",
    },
    {
      label:
        "VRM Spring Bones — Bone Collections + Hair-Chain Runtime Physics",
      href: "/tutorials/blender-tutorial-vrm-spring-bones-hair-chain",
    },
    {
      label:
        "GN Simulation Zone — Verlet Rope & Cable Physics",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics",
    },
    {
      label:
        "Curves Hair Grooming — Guide-Based Strand Sculpting for VRM Characters",
      href: "/tutorials/blender-tutorial-curves-hair-grooming",
    },
    {
      label:
        "GN Simulation Zone — Van der Pol Nonlinear Limit Cycle for Poi Dynamics",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi",
    },
  ],
  software: [
    {
      name: "Blender",
      version: "5.1",
      url: "https://www.blender.org/download/",
      cost: "open-source",
      platforms: ["windows", "macos", "linux"],
      note:
        "bpy.data.hair_curves requires Blender ≥ 4.0. GeometryNodeOffsetPointInCurve requires Blender ≥ 4.0. Simulation Zone requires Blender ≥ 3.6. GeometryNodeInputSceneTime requires Blender ≥ 3.6. Tested on Blender 5.1.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-hair-curves-spring-dynamics-vrm",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "curves",
      "hair",
      "vrm",
      "physics",
    ],
    body: Body,
  },
  data,
);
