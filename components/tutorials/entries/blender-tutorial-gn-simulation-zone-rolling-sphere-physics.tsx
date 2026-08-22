import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnSimRollingBody() {
  return (
    <>
      <p>
        A{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Simulation Zone
        </Link>{" "}
        feeds its output back as its own input on the next frame — a temporal
        feedback loop rather than a within-frame accumulator. That single
        property is enough to implement a physics integrator entirely inside
        Geometry Nodes: carry <strong>Position</strong> and{" "}
        <strong>Velocity</strong> as <code>VECTOR</code> state items, update
        them each frame using the Euler method, and the zone handles
        checkpointing automatically. The Euler method integrates Newton&rsquo;s
        second law discretely: <code>v += a·Δt</code>, then{" "}
        <code>p += v·Δt</code>. At 24 fps the time step is ≈41 ms — short
        enough that first-order accuracy is visually indistinguishable from
        higher-order methods for a sphere rolling across a game-scale terrain.
        No rigid body solver, no Python driver, no NLA track: everything lives
        in the GN modifier.
      </p>

      <p>
        The scene has three objects. <code>rolling_terrain</code> is a
        subdivided plane displaced with a two-frequency sine–cosine sum into
        gentle hills. <code>sphere_source</code> is an icosphere template placed
        off-screen at y=−100 with <code>hide_render=True</code>; it is never
        rendered directly. <code>physics_host</code> is an empty mesh that
        carries the GN modifier and outputs a realised icosphere instance at the
        simulated position. Separating the terrain from the host is deliberate:{" "}
        <code>GeometryNodeObjectInfo</code> inside the GN tree references the
        terrain directly, so the Raycast node tests against the terrain&rsquo;s
        actual mesh rather than a proxy. Both objects share the world origin
        with transforms applied, so local space equals world space throughout —
        there is no matrix multiplication to worry about. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-projection"
          className={lk}
        >
          terrain raycast tutorial
        </Link>{" "}
        explains why <code>transform_space=&lsquo;ORIGINAL&rsquo;</code> is the
        safe choice when objects are at the origin; with parent transforms or
        instance offsets you would need{" "}
        <code>&lsquo;RELATIVE&rsquo;</code> instead.
      </p>

      <p>
        The Simulation Zone body is a single-point <code>GeometryNodePoints</code>{" "}
        cloud (count=1). Inside the zone, a first <code>SetPosition</code> node
        moves that body point to the <em>predicted</em> position (old position +
        new velocity × Δt). The <code>GeometryNodeRaycast</code> node that
        follows fires exactly one ray downward per frame because the body
        contains exactly one point; its <code>Ray Origin</code> socket is left
        unconnected and defaults to <code>InputPosition</code> — which at this
        point in the graph equals the predicted position. After the
        collision-correction switch, a second <code>SetPosition</code> updates
        the body to the <em>final</em> corrected position and passes it through
        to <code>sim_out</code>. Outside the zone,{" "}
        <code>sim_out.outputs[&lsquo;Geometry&rsquo;]</code> delivers the body
        point at the final position; <code>InstanceOnPoints</code> places the
        sphere template there. Compare this body-as-carrier pattern with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-boid-flock"
          className={lk}
        >
          boid flock tutorial
        </Link>
        , where the body is a full point cloud carrying hundreds of agents with
        named attributes per boid.
      </p>

      <p>
        The bounce logic uses the specular reflection formula{" "}
        <code>v&prime; = v − 2·(v·n̂)·n̂</code> scaled by a restitution
        coefficient. In GN that is four nodes:{" "}
        <code>VectorMath(DOT_PRODUCT)</code> for the scalar projection (note:
        the DOT result lives in <code>outputs[1]</code>, not{" "}
        <code>outputs[0]</code>), <code>Math(MULTIPLY, 2.0)</code>,{" "}
        <code>VectorMath(SCALE)</code> to get{" "}
        <code>2·dot·n̂</code> (Scale socket is <code>inputs[3]</code>, not
        inputs[1]), and <code>VectorMath(SUBTRACT)</code>. Penetration is
        detected with <code>FunctionNodeCompare(FLOAT, LESS_THAN)</code>{" "}
        checking <code>hit_distance &lt; sphere_radius</code>, combined with the
        Raycast&rsquo;s boolean <code>Is&nbsp;Hit</code> via{" "}
        <code>FunctionNodeBooleanMath(AND)</code>. Two{" "}
        <code>GeometryNodeSwitch(input_type=&lsquo;VECTOR&rsquo;)</code> nodes
        (condition at inputs[0], false branch at inputs[4], true at inputs[5])
        select the correct velocity and position depending on whether a collision
        occurred. The corrected position uses{" "}
        <code>hit_pos + hit_normal × sphere_radius</code> rather than simply
        clamping to the hit point: that offset ensures the sphere centre sits one
        radius above the surface, preventing the sphere from embedding into
        sloped terrain where the normal is not vertical. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          reaction-diffusion tutorial
        </Link>{" "}
        for another example of this switch-gated state-item update pattern, where
        it is used to freeze cell values that have already committed.
      </p>

      <p>
        Advancing the simulation headlessly requires iterating{" "}
        <code>range(1, N+1)</code> and calling both{" "}
        <code>scene.frame_set(f)</code> and{" "}
        <code>bpy.context.view_layer.update()</code> on every step. Jumping
        directly to frame 60 gives only the frame-1 state because the zone has
        no previous-frame cache to read from. The GLB snapshot is exported at
        frame 60 — midway through the 120-frame simulation, typically after one
        or two bounces — using Draco level 6 and WebP textures per the{" "}
        <Link href="/atelier" className={lk}>
          atelier export convention
        </Link>
        . The <code>physics_host</code> modifier output (the sphere instance) and
        the terrain mesh are exported together as a single GLB; the off-screen
        sphere template is excluded because it is not selected. Compare the
        headless bake pattern with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-dla-crystal-dendrite"
          className={lk}
        >
          DLA crystal dendrite tutorial
        </Link>
        , where the same sequential frame loop populates a growth simulation
        before export.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-simulation-zone-rolling-sphere-physics",
  title:
    "GN Simulation Zone — Euler-Integrated Rolling Sphere: Gravity, Raycast Collision & Bounce for Procedural Physics (Blender 5.1)",
  date: "2026-07-02",
  kind: "tutorial",
  excerpt:
    "Build a physics integrator inside a Geometry Nodes Simulation Zone: two VECTOR state items carry position and velocity across frames, a Raycast node detects surface contact, and the specular reflection formula v − 2·dot(v,n)·n drives bouncing — no Blender physics engine required.",
  Body: GnSimRollingBody,
};

export const entry = buildInstructable(
  {
    time: "two hours",
    difficulty: "advanced",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: ["Geometry Nodes editor", "Spreadsheet editor", "Python console"],
    },
    steps: [
      {
        title: "Build terrain and sphere template",
        body: "Create a subdivided plane and displace vertices with a sin/cos sum:\n\n  bpy.ops.mesh.primitive_plane_add(size=5.0)\n  obj = bpy.context.active_object\n  bm = bmesh.new()\n  bm.from_mesh(obj.data)\n  bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=18, use_grid_fill=True)\n  for v in bm.verts:\n      x, y = v.co.x, v.co.y\n      v.co.z = 0.28*sin(x*2.4+0.7)*cos(y*1.9+1.1) + 0.14*sin(x*5.2+2.0)*cos(y*4.0+0.4)\n  bm.to_mesh(obj.data)\n  bm.free()\n\nCreate the icosphere template (subdivisions=2, radius=0.12 m) at y=-100 with hide_render=True. This object is never directly rendered — only instanced.",
      },
      {
        title: "Set up the Simulation Zone state items",
        body: "Create a GN node group on an empty mesh host object. Add the Simulation Output node first, then declare state items:\n\n  sim_out = nodes.new('GeometryNodeSimulationOutput')\n  sim_out.state_items.new('VECTOR', 'Position')\n  sim_out.state_items.new('VECTOR', 'Velocity')\n  sim_in = nodes.new('GeometryNodeSimulationInput')\n  sim_in.pair_with_output(sim_out)\n\nAfter pair_with_output(), sim_in gains output sockets 'Position' and 'Velocity' (previous frame) and input sockets of the same names (initial/skip values for frame 1).\n\nCreate the body: Points(count=1) with position=initial_pos → sim_in.inputs['Geometry']. Connect initial_pos and initial_vel from Group Input → sim_in.inputs['Position'/'Velocity'].",
      },
      {
        title: "Integrate gravity and predict next position",
        body: "Inside the zone (all nodes wired between sim_in and sim_out):\n\n  # gravity per frame\n  n_dt.outputs[0].default_value = 1/24  # 0.04167 s\n  n_grav_dt.operation = 'MULTIPLY'      # gravity_z × dt\n  n_grav_vec = CombineXYZ(z=n_grav_dt)  # Vector(0,0,-0.409)\n\n  n_vel_new.operation = 'ADD'\n  # inputs: sim_in.outputs['Velocity'] + grav_vec\n\n  # vel × dt  →  position delta\n  n_vel_dt.operation = 'SCALE'\n  # Vector socket = inputs[0], Scale socket = inputs[3]  (NOT inputs[1])\n  L(n_vel_new.outputs['Vector'], n_vel_dt.inputs[0])\n  L(n_dt.outputs[0],            n_vel_dt.inputs[3])\n\n  n_pos_pred.operation = 'ADD'\n  # sim_in.outputs['Position'] + vel_dt → predicted position",
      },
      {
        title: "SetPosition and Raycast",
        body: "Move the body point to the predicted position before the Raycast fires:\n\n  n_sp1 = SetPosition(geometry=sim_in.Geometry, position=pos_pred)\n\nThe Raycast implicitly uses InputPosition — which is now pos_pred for the single body point:\n\n  n_terrain.inputs['Object'].default_value = terrain_obj\n  n_terrain.transform_space = 'ORIGINAL'\n  n_ray = GeometryNodeRaycast\n  n_ray.data_type = 'FLOAT'\n  n_ray.inputs['Ray Length'].default_value = 8.0\n  L(n_terrain.outputs['Geometry'], n_ray.inputs['Target Geometry'])\n  L(down_dir, n_ray.inputs['Ray Direction'])\n  # Ray Origin: NOT connected — uses InputPosition = pos_pred\n\nOutputs used: n_ray.outputs['Is Hit'] (bool), 'Hit Position' (vec), 'Hit Normal' (vec), 'Hit Distance' (float).",
      },
      {
        title: "Collision detection and reflection",
        body: "is_penetrating = FunctionNodeCompare(FLOAT, LESS_THAN, hit_distance, sphere_radius)\nshould_collide  = FunctionNodeBooleanMath(AND, is_hit, is_penetrating.Result)\n\nReflection formula — v′ = v − 2·(v·n̂)·n̂ · restitution:\n\n  n_dot.operation = 'DOT_PRODUCT'\n  L(vel_new, n_dot.inputs[0]); L(hit_normal, n_dot.inputs[1])\n  # DOT scalar lives in n_dot.outputs[1] ('Value'), NOT outputs[0]\n\n  n_2dot.operation = 'MULTIPLY'\n  L(n_dot.outputs[1], n_2dot.inputs[0]); n_2dot.inputs[1].default_value = 2.0\n\n  n_ns.operation = 'SCALE'\n  L(hit_normal, n_ns.inputs[0])      # Vector input\n  L(n_2dot.outputs[0], n_ns.inputs[3])  # Scale input (index 3!)\n\n  n_vr.operation = 'SUBTRACT'   # v - 2·dot·n\n  then SCALE by restitution (inputs[3] again)\n\nCorrected position: hit_pos + hit_normal × sphere_radius\n  (offset keeps sphere centre one radius above the surface)",
      },
      {
        title: "Switch nodes and SimOut wiring",
        body: "Two Switch nodes (input_type='VECTOR') select free-flight or bounce paths:\n\n  n_sw_v.input_type = 'VECTOR'\n  L(should_collide, n_sw_v.inputs[0])  # condition\n  L(vel_new,        n_sw_v.inputs[4])  # False (free flight)\n  L(v_reflect,      n_sw_v.inputs[5])  # True  (bounce)\n  # inputs[4] and [5] for VECTOR — skips the FLOAT/INT/BOOL socket groups\n\nSame pattern for position switch.\n\nSecond SetPosition commits the final position to the body, then connects to sim_out:\n\n  n_sp2 = SetPosition(geometry=n_sp1.Geometry, position=pos_final)\n  L(n_sp2.Geometry, sim_out.inputs['Geometry'])\n  L(pos_final,      sim_out.inputs['Position'])\n  L(vel_final,      sim_out.inputs['Velocity'])\n\nOutside zone: sim_out.outputs['Geometry'] (body at pos_final) → InstanceOnPoints → RealizeInstances → GroupOutput.",
      },
      {
        title: "Bake the simulation and export GLB",
        body: "The Simulation Zone must be advanced frame-by-frame in headless mode:\n\n  for f in range(1, SIM_FRAMES + 1):\n      scene.frame_set(f)\n      bpy.context.view_layer.update()\n\nframe_set(60) alone gives only the frame-1 state because the zone has no previous-frame cache to read from. view_layer.update() forces the GN modifier to evaluate and write the new zone state.\n\nExport GLB at frame 60:\n  bpy.ops.export_scene.gltf(\n      filepath=OUTPUT_GLB,\n      use_selection=True,\n      export_format='GLB',\n      export_draco_mesh_compression_enable=True,\n      export_draco_mesh_compression_level=6,\n      export_image_format='WEBP',\n      export_apply=True,\n      export_animations=False,\n  )\n\nSelect physics_host and rolling_terrain before export; sphere_source (y=-100) should NOT be selected.",
      },
    ],
    finalResult:
      "A .blend containing rolling_terrain (undulating 5 m × 5 m plane), sphere_source (off-screen icosphere template), and physics_host (GN Simulation Zone rolling physics). The sphere launches from (0, 1.8, 2.2) at (0.28, -0.65, 0) m/s, arcs under gravity, bounces off the terrain using specular reflection with restitution=0.55, and completes ~3 bounces over 120 frames. GLB snapshot captures the sphere mid-bounce at frame 60, with Draco 6 compression and WebP textures.",
    variations: [
      "Multiple spheres: replace the single-point body with Points(count=N), each carrying its own initial_pos/velocity via named attributes. The Raycast fires N rays per frame (one per body point), making the system run N simultaneous independent simulations at near-zero overhead increase.",
      "Orbital gravity: replace the constant gravity vector with VectorMath(SUBTRACT, planet_centre, body_position) → VectorMath(NORMALIZE) → SCALE by G×M/r² (computed via Math nodes). The sphere orbits a spherical terrain body.",
      "Trail: inside the zone, additionally store the last K positions in a ring buffer using repeat+index-shift, then instance small trail spheres at each buffer slot outside the zone. See the Boid Flock tutorial for the ring-buffer accumulate pattern.",
      "Friction: on contact frames, decompose velocity into normal and tangential components. Scale the tangential component by (1 - friction_coefficient) before recombining. This prevents sliding on steep slopes.",
    ],
    troubleshooting: [
      {
        symptom: "Sphere stays at initial position every frame",
        cause:
          "The simulation cache was not built frame-by-frame. frame_set() jumped directly to a later frame without a sequential evaluate.",
        fix: "Ensure the script iterates range(1, N+1) with frame_set(f) + view_layer.update() on every step. If running interactively, press Space from frame 1 and let the timeline play through rather than scrubbing.",
      },
      {
        symptom: "AttributeError: state_items not found on SimulationOutput node",
        cause: "Running on Blender older than 3.6, or the node type name changed.",
        fix: "Confirm the node type is 'GeometryNodeSimulationOutput' (not 'GeometryNodeSimulationInput'). In Blender 5.1, state_items is on the OUTPUT node. The INPUT node gets matching sockets via pair_with_output().",
      },
      {
        symptom: "Sphere tunnels through the terrain on fast bounces",
        cause:
          "At high speeds, pos_pred overshoots the terrain surface in a single frame. The Raycast fires from pos_pred (above the surface), hits terrain, but hit_distance may exceed sphere_radius if the sphere moved more than its diameter in one step.",
        fix: "Reduce INITIAL_VEL magnitude, increase FPS (reduce DT), or add a sub-step loop inside the zone using a Repeat Zone wrapping the integration nodes (1–4 sub-steps per frame).",
      },
      {
        symptom: "Sphere reflects at wrong angle (slides sideways unexpectedly)",
        cause:
          "The terrain normals are face normals (flat-shaded). On a steep slope, the face normal may point far from vertical, producing a steep reflection. This is physically correct but may look odd on coarse terrain meshes.",
        fix: "Increase TERRAIN_DIVS for finer faces, or smooth-shade the terrain so the Raycast sees interpolated vertex normals instead of flat face normals.",
      },
      {
        symptom: "Switch node Vector sockets not connecting (wrong inputs index)",
        cause:
          "The VECTOR type sockets on GeometryNodeSwitch are at inputs[4] and inputs[5], not inputs[1] and inputs[2] as for FLOAT. Connecting to inputs[1]/[2] wires a FLOAT switch instead.",
        fix: "After setting input_type='VECTOR', print the node's input socket names: [print(i, s.name) for i, s in enumerate(n_sw.inputs)]. The False/True vector sockets should appear at indices 4 and 5 in Blender 5.1.",
      },
    ],
  },
  base,
);
