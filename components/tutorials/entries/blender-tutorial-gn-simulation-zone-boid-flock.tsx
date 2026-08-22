import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GnBoidFlockBody() {
  return (
    <>
      <p>
        Craig Reynolds published &ldquo;Flocks, Herds, and Schools: A
        Distributed Behavioral Model&rdquo; at SIGGRAPH 1987 — and{" "}
        <em>nothing</em> about the algorithm is secret or patented. Three
        weighted steering forces are applied per agent, every frame, using only
        local information: push away from neighbours that are too close
        (Separation), steer toward the group&rsquo;s average heading
        (Alignment), steer toward the group&rsquo;s centre of mass (Cohesion).
        Combine them, clamp the resulting speed, integrate position — repeat.
        The emergent behaviour looks uncanny because the rules are genuinely
        simple; the complexity is a consequence of many agents running the same
        cheap loop simultaneously. This tutorial implements exactly those three
        rules inside a Geometry Nodes{" "}
        <strong>Simulation Zone</strong> so you can see every node in the chain
        and tune the weights live.
      </p>

      <p>
        The architecture decision that makes everything else follow: per-boid
        velocity is stored as a{" "}
        <code>FLOAT_VECTOR</code> named attribute called{" "}
        <code>vel</code> on the Points cloud geometry, not as a separate
        Simulation Zone state item. This means the single implicit{" "}
        <code>Geometry</code> body channel carries both position and momentum
        across frames — an extension of the pattern you first saw in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Wave Reveal tutorial
        </Link>
        , where <code>wave_time</code> was stored the same way. A VECTOR state
        item on the zone itself would give you one vector for the{" "}
        <em>entire</em> geometry — a global scalar, not a per-point field.
        Named attributes on geometry are the correct domain for per-element
        data that needs to evolve across time.
      </p>

      <p>
        Separation and Alignment both start with{" "}
        <code>GeometryNodeIndexOfNearest</code>, which returns the index of the
        nearest <em>other</em> point for every point simultaneously (it
        excludes self by design). That index feeds two{" "}
        <code>GeometryNodeSampleIndex</code> nodes:{" "}
        one reads the nearest boid&rsquo;s <em>position</em> (via the{" "}
        <code>Position</code> field node), the other reads its{" "}
        <em>velocity</em> (via <code>GeometryNodeInputNamedAttribute</code> on{" "}
        <code>vel</code>). Separation is the normalised vector from the
        nearest boid&rsquo;s position to self, scaled by{" "}
        <code>SEP_WEIGHT</code>. Alignment is the difference between the
        nearest boid&rsquo;s velocity and self&rsquo;s velocity, scaled by{" "}
        <code>ALIGN_WEIGHT</code> — it steers toward matching speed and
        direction without copying it instantly. Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-index-of-nearest-neural-web"
          className={lk}
        >
          Index of Nearest neural web tutorial
        </Link>
        , which uses the same node to create edges rather than to read
        neighbour attributes.
      </p>

      <p>
        Cohesion does not use <code>IndexOfNearest</code> at all. Instead,{" "}
        <code>GeometryNodeAttributeStatistic</code> with{" "}
        <code>data_type=&lsquo;FLOAT_VECTOR&rsquo;</code> computes the{" "}
        <strong>Mean</strong> of the <code>Position</code> field over all
        points — the global flock centroid — in a single node. Every boid
        then subtracts its own position from that centroid and scales by{" "}
        <code>COH_WEIGHT</code> (a gentle 0.005 by default, because cohesion
        pulls toward one global point and would collapse the flock if too
        strong). This approximation — global mean rather than k-nearest-
        neighbour mean — is entirely valid for a single-flock scenario and
        matches the performance profile you need when N ≥ 32. Contrast this
        with the per-element Turing computation in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing"
          className={lk}
        >
          Reaction-Diffusion Simulation Zone tutorial
        </Link>
        , which used <code>BlurAttribute</code> to diffuse values across
        topology — a different strategy for spatial averaging that respects
        mesh connectivity rather than Euclidean proximity.
      </p>

      <p>
        The three weighted forces are summed onto the previous frame&rsquo;s
        velocity, then speed-clamped via a{" "}
        <code>NORMALIZE</code> + <code>Math(MIN)</code> + <code>SCALE</code>{" "}
        chain rather than a divide. Dividing by the current speed risks a
        zero-speed edge case; normalising first produces a clean direction
        vector of length 1.0 (or the zero vector for a stationary boid, which
        propagates correctly through <code>SCALE</code>). The clamped speed
        from <code>Math(MIN)</code> replaces the scale factor. Position is then
        Euler-integrated:{" "}
        <code>new_pos = old_pos + new_vel</code> via{" "}
        <code>VectorMath(ADD)</code> feeding <code>SetPosition</code>. Finally,{" "}
        <code>StoreNamedAttribute</code> writes the new velocity back to the
        geometry flowing into <code>SimulationOutput</code>, where Blender
        caches it for the next frame — closing the loop. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-repeat-zone-crystal-cluster"
          className={lk}
        >
          Repeat Zone tutorial
        </Link>{" "}
        explained <code>pair_with_output()</code> and body channels; the only
        conceptual difference here is temporal rather than iterative: the
        Simulation Zone runs once per frame, not once per iteration.
      </p>

      <p>
        Outside the zone, <code>FunctionNodeAlignEulerToVector</code> reads
        the updated <code>vel</code> attribute (a second{" "}
        <code>GeometryNodeInputNamedAttribute</code> node, this time outside
        the zone body) and rotates each cone instance&rsquo;s Z-axis to face
        the travel direction. <code>GeometryNodeInstanceOnPoints</code> consumes
        the rotation and a reference to the cone object — no{" "}
        <code>RotateInstances</code> node needed because{" "}
        <code>InstanceOnPoints</code> has a native{" "}
        <code>Rotation</code> input. The cone is never visible in the final
        render at its seed position (it spawns at Y = -9999) because GN
        instancing creates read-only copies; the seed object is just a shape
        template.
      </p>

      <p>
        <strong>
          Outside reference — Blender Manual: Index of Nearest Node
        </strong>{" "}
        (
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/field/index_of_nearest.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          docs.blender.org
        </a>
        , CC-BY-SA&nbsp;4.0, Blender Documentation Team). Documents the
        Position and Group ID inputs, the Index and Has Neighbour outputs, and
        the important note that the node always excludes the querying element
        from its result. The same organisation maintains the{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/attribute/attribute_statistic.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Attribute Statistic Node manual page
        </a>{" "}
        (CC-BY-SA&nbsp;4.0) — which documents the{" "}
        <code>FLOAT_VECTOR</code> data type, the Mean output, and the domain
        options used for the Cohesion centroid computation in this blueprint.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-gn-simulation-zone-boid-flock",
  title:
    "GN Simulation Zone — Boid Flocking: Cohesion + Separation + Alignment (Blender 5.1)",
  date: "2026-06-17",
  kind: "tutorial",
  excerpt:
    "Implement Craig Reynolds' three steering rules inside a Geometry Nodes Simulation Zone. Per-boid velocity lives as a FLOAT_VECTOR named attribute on the Points cloud; IndexOfNearest + SampleIndex drives Separation and Alignment; AttributeStatistic Mean drives Cohesion. 64 cone instances orient to their travel direction via FunctionNodeAlignEulerToVector.",
  Body: GnBoidFlockBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "advanced",
    prerequisites: [
      "Complete the Wave Reveal Simulation Zone tutorial first — pair_with_output(), Geometry body channel, and the sequential frame_set() cache-building requirement are all shared foundations.",
      "Understand Named Attributes: FLOAT_VECTOR type, POINT domain, Store Named Attribute vs Input Named Attribute.",
      "Know what Index of Nearest does from the Neural Web tutorial — the difference here is that you're reading attributes at the returned index, not creating edges.",
      "Blender 5.1 installed. Can run scripts headlessly with blender --background --python.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Simulation Zones require Blender ≥ 3.6. GeometryNodeAttributeStatistic with FLOAT_VECTOR data_type and the Mean VECTOR output requires Blender ≥ 4.0. FunctionNodeAlignEulerToVector has existed since 3.0 but its pivot_axis property changed in 4.1 — set pivot_axis='AUTO' for safe behaviour in 5.1.",
      },
    ],
    steps: [
      {
        title: "Understand why velocity goes on the geometry, not the zone",
        body:
          "A Simulation Zone VECTOR state item holds one vector for the entire zone — a global value, like a growing radius or a wave speed. Per-element data (one vector per boid) must live on the geometry's attribute layer.\n\nThe correct pattern:\n  me.attributes.new('vel', 'FLOAT_VECTOR', 'POINT')\n  # POINT domain → one vector per vertex\n\nThis attribute rides the Geometry body channel of the zone. Each frame:\n  - SimulationInput.outputs['Geometry'] = last frame's Points cloud WITH 'vel' written\n  - Zone body reads 'vel' via InputNamedAttribute, computes new_vel, writes it back\n  - StoreNamedAttribute → SimulationOutput.inputs['Geometry'] caches the updated cloud\n\nIf you used a state item instead:\n  sim_out.state_items.new('VECTOR', 'Velocity')\n  # gives ONE velocity socket — not per-point\n  # VectorMath nodes would apply the same delta to all boids identically\n  # → no flocking, just collective drift\n\nThe distinction matters: use state items for scalars that govern the simulation globally (Radius in Wave Reveal, diffusion rate in Reaction-Diffusion). Use named attributes for per-element state.",
      },
      {
        title: "Build the Points cloud with seeded velocity attribute",
        body:
          "Create BOID_COUNT (64) vertices scattered uniformly inside a sphere using rejection sampling:\n\n  me = bpy.data.meshes.new('boid_flock')\n  bm = bmesh.new()\n  rng = random.Random(42)\n  for _ in range(BOID_COUNT):\n      while True:\n          x, y, z = rng.uniform(-1,1), rng.uniform(-1,1), rng.uniform(-1,1)\n          if x*x + y*y + z*z <= 1.0: break\n      bm.verts.new((x*SPAWN_RADIUS, y*SPAWN_RADIUS, z*SPAWN_RADIUS))\n  bm.to_mesh(me); bm.free()\n\nRejection sampling: discard points outside the unit sphere. Acceptance rate is π/6 ≈ 52 %. Alternative: spherical coordinates, but that clusters at poles unless you use acos(uniform(-1,1)) for phi.\n\nSeed velocity with Marsaglia's method (Gaussian triplet normalised to unit sphere — no trig, no pole bias):\n  vel_attr = me.attributes.new('vel', 'FLOAT_VECTOR', 'POINT')\n  for i in range(BOID_COUNT):\n      while True:\n          u, v, w = rng2.gauss(0,1), rng2.gauss(0,1), rng2.gauss(0,1)\n          m = sqrt(u*u + v*v + w*w)\n          if m > 1e-6: break\n      vel_attr.data[i].vector = (u/m*INITIAL_SPEED, v/m*INITIAL_SPEED, w/m*INITIAL_SPEED)\n\nTwo separate RNGs with different seeds (42 for position, 7 for velocity) keep the two distributions orthogonal — changing one doesn't perturb the other.",
      },
      {
        title: "Build the Simulation Zone — no extra state items needed",
        body:
          "Create and pair the zone nodes:\n  sim_in  = nodes.new('GeometryNodeSimulationInput')\n  sim_out = nodes.new('GeometryNodeSimulationOutput')\n  sim_in.pair_with_output(sim_out)\n  links.new(g_in.outputs['Geometry'], sim_in.inputs['Geometry'])\n\nThe pair_with_output() call creates the implicit Geometry body channel. No state_items.new() calls are needed — compare this with Wave Reveal, which needed sim_out.state_items.new('FLOAT', 'Radius') for the growing radius. Here there is no global simulation parameter that changes over time; all evolving data is per-point and lives on the geometry.\n\nInside the zone, the reading nodes:\n  n_pos = nodes.new('GeometryNodeInputPosition')\n  # outputs: Position (VECTOR) — self-position for each boid, per-frame\n\n  n_read_vel = nodes.new('GeometryNodeInputNamedAttribute')\n  n_read_vel.data_type = 'FLOAT_VECTOR'\n  n_read_vel.inputs['Name'].default_value = 'vel'\n  # outputs: Attribute (VECTOR) — last frame's velocity for each boid",
      },
      {
        title: "Wire Separation: IndexOfNearest + SampleIndex on Position",
        body:
          "IndexOfNearest — leave Position input unconnected:\n  n_nearest = nodes.new('GeometryNodeIndexOfNearest')\n  # Position input unconnected → uses implicit position attribute\n  # outputs: Index (INT), Has Neighbour (BOOL)\n  # Has Neighbour is False only when BOID_COUNT = 1; safe to ignore here.\n\nSampleIndex to read nearest boid's position:\n  n_samp_pos = nodes.new('GeometryNodeSampleIndex')\n  n_samp_pos.data_type = 'FLOAT_VECTOR'\n  n_samp_pos.domain    = 'POINT'\n  links.new(sim_in.outputs['Geometry'],  n_samp_pos.inputs['Geometry'])\n  links.new(n_pos.outputs['Position'],   n_samp_pos.inputs['Value'])\n  links.new(n_nearest.outputs['Index'],  n_samp_pos.inputs['Index'])\n  # outputs: Value (VECTOR) — nearest boid's world position\n\nSeparation force computation:\n  # Direction FROM nearest boid TOWARD self (push away)\n  n_sep_raw = VectorMath(SUBTRACT, self_pos - nearest_pos)\n  n_sep_dir = VectorMath(NORMALIZE, n_sep_raw)    # unit direction\n  n_sep     = VectorMath(SCALE, n_sep_dir, SEP_WEIGHT)\n\nNote: NORMALIZE returns (0,0,0) when input is zero-length (coincident positions). This is safe: the separation force is 0 in that edge case, which is the correct physical interpretation (no direction to push when positions are identical).",
      },
      {
        title: "Wire Alignment: SampleIndex on 'vel' named attribute",
        body:
          "Read nearest boid's velocity:\n  n_samp_vel = nodes.new('GeometryNodeSampleIndex')\n  n_samp_vel.data_type = 'FLOAT_VECTOR'\n  n_samp_vel.domain    = 'POINT'\n  links.new(sim_in.outputs['Geometry'],        n_samp_vel.inputs['Geometry'])\n  links.new(n_read_vel.outputs['Attribute'],   n_samp_vel.inputs['Value'])\n  links.new(n_nearest.outputs['Index'],        n_samp_vel.inputs['Index'])\n\nAlignment force — steer toward nearest neighbour's velocity:\n  n_aln_raw = VectorMath(SUBTRACT, nearest_vel - self_vel)\n  n_aln     = VectorMath(SCALE, n_aln_raw, ALIGN_WEIGHT)\n\nWHY subtract self_vel rather than just using nearest_vel directly:\n  If you simply scale nearest_vel, every boid copies its neighbour's speed magnitude as well as direction. The difference (nearest_vel - self_vel) is the ERROR between current and desired heading — standard proportional control. A boid already moving in the same direction as its neighbour gets zero alignment force, which is correct: no correction needed.",
      },
      {
        title: "Wire Cohesion: AttributeStatistic Mean of Position",
        body:
          "  n_stat = nodes.new('GeometryNodeAttributeStatistic')\n  n_stat.data_type = 'FLOAT_VECTOR'\n  n_stat.domain    = 'POINT'\n  links.new(sim_in.outputs['Geometry'], n_stat.inputs['Geometry'])\n  links.new(n_pos.outputs['Position'],  n_stat.inputs['Attribute'])\n  # n_stat.outputs['Mean'] = global centroid of all boid positions\n\n  # Direction from self toward centroid, gently weighted\n  n_coh_raw = VectorMath(SUBTRACT, centroid - self_pos)\n  n_coh     = VectorMath(SCALE, n_coh_raw, COH_WEIGHT=0.005)\n\nWHY COH_WEIGHT is so small (0.005 vs SEP 0.06):\n  Cohesion pulls every boid toward ONE point (the centroid). At high weight the entire flock collapses to a singularity in a few frames. Separation and Alignment both operate on LOCAL information (nearest neighbour) and naturally produce spread; Cohesion needs to be weak enough to maintain loose grouping without overwhelming the local forces.\n\nThe centroid includes the querying boid's own position (1/N contribution). At N=64 this is a 1.56 % self-bias — negligible. At N=4 it would be 25 % and noticeably distort the result.",
      },
      {
        title: "Sum forces, clamp speed, integrate position, store velocity",
        body:
          "Sum the three forces onto the previous velocity:\n  n_v1 = VectorMath(ADD, self_vel + sep_force)\n  n_v2 = VectorMath(ADD, n_v1 + align_force)\n  n_v3 = VectorMath(ADD, n_v2 + coh_force)  # raw new velocity\n\nSpeed clamp — NORMALIZE + MIN + SCALE avoids divide-by-zero:\n  n_vdir   = VectorMath(NORMALIZE, n_v3)        # unit direction\n  n_speed  = VectorMath(LENGTH,    n_v3)        # scalar magnitude\n  n_clamp  = Math(MINIMUM, n_speed, MAX_SPEED)\n  n_new_vel = VectorMath(SCALE, n_vdir, n_clamp)\n  # If n_v3 = (0,0,0), NORMALIZE = (0,0,0), SCALE = (0,0,0) — correct.\n\nEuler integration:\n  n_new_pos = VectorMath(ADD, self_pos + new_vel)\n  n_set_pos = SetPosition(Geometry=sim_in.Geometry, Position=new_pos)\n\nStore velocity:\n  n_store = StoreNamedAttribute(Geometry=n_set_pos, Value=new_vel, Name='vel')\n  links.new(n_store.outputs['Geometry'], sim_out.inputs['Geometry'])\n\nOrder matters: SetPosition first, then StoreNamedAttribute. If reversed, the position update would apply to the geometry BEFORE the velocity is written, and the geometry arriving at SimOut would have the old velocity.",
      },
      {
        title: "Orient and instance the cones outside the zone",
        body:
          "The boid mesh is a Point cloud — it renders as nothing by itself. After the zone, read the updated velocity attribute and instance a cone per boid, oriented to face the travel direction.\n\n  n_vel_out = nodes.new('GeometryNodeInputNamedAttribute')\n  n_vel_out.data_type = 'FLOAT_VECTOR'\n  n_vel_out.inputs['Name'].default_value = 'vel'\n  # Must be OUTSIDE the zone — a second read of the attribute post-update.\n\n  n_align = nodes.new('FunctionNodeAlignEulerToVector')\n  n_align.axis       = 'Z'     # cone was added with tip pointing +Z\n  n_align.pivot_axis = 'AUTO'\n  links.new(n_vel_out.outputs['Attribute'], n_align.inputs['Vector'])\n\n  n_inst = nodes.new('GeometryNodeInstanceOnPoints')\n  links.new(sim_out.outputs['Geometry'],  n_inst.inputs['Points'])\n  links.new(n_align.outputs['Rotation'],  n_inst.inputs['Rotation'])\n  n_inst.inputs['Instance'].default_value = cone_obj\n\nWhy the cone is parked at Y = -9999: GN instancing reads the object as a shape template and places copies at each boid position. The seed object remains at its original location in the scene but that location is irrelevant — the instances appear at the Points cloud positions. Hiding it from render (hide_render=False is default; put it on an excluded collection if the seed object appearing in renders is a concern).",
      },
      {
        title: "Advance the cache headlessly and export",
        body:
          "Blender's Simulation Zone builds its frame cache incrementally. Jumping to frame 60 directly skips 59 frames of state history — the zone reads uninitialized data. The correct headless advance:\n\n  for f in range(1, GLB_FRAME + 1):\n      scene.frame_set(f)\n      bpy.context.view_layer.update()\n\nview_layer.update() forces the GN modifier to evaluate and write the computed state to Blender's cache. Without it, frame_set() may not trigger full dependency-graph evaluation in background mode.\n\nGLB export at frame 60 (halfway through a 120-frame animation) produces a static snapshot of the flock mid-flight:\n  bpy.ops.export_scene.gltf(\n      filepath      = GLB_PATH,\n      export_format = 'GLB',\n      export_apply  = True,          # bakes GN modifier at current frame\n      export_draco_mesh_compression_enable = True,\n      export_draco_mesh_compression_level  = 6,\n  )\n\nexport_apply=True evaluates the full GN stack at frame 60 and exports the resulting mesh geometry — the cone instances, correctly positioned and oriented. The live simulation cannot be exported; only a frozen snapshot at one frame.",
      },
    ],
    finalResult:
      "A .blend containing a 64-boid Points cloud with a live Simulation Zone implementing Craig Reynolds' three steering rules via IndexOfNearest, SampleIndex, and AttributeStatistic. The flock coheres from a scattered sphere into a loose travelling group within 30 frames. Each cone instance rotates to face its travel direction via FunctionNodeAlignEulerToVector. A GLB snapshot captures the flock at frame 60, with all 64 cone instances baked into world-space geometry.",
    variations: [
      "Boundary sphere: outside the zone, compute VectorMath(LENGTH, position) for each boid. If length > WORLD_RADIUS, add a force pointing toward the origin — coh-style, scaled by how far outside the boundary the boid is. This keeps the flock in frame without hard wrapping.",
      "Predator-prey: add a second Points cloud object (one vertex) as a 'predator'. Inside the zone, use a second SampleIndex on the predator's position and add a large separation force from it. Boids scatter when the predator approaches.",
      "3-D flocking with altitude bands: add a weak vertical cohesion pulling boids toward a target Z height (AttributeStatistic Mean of Z component only, computed via separate Separate XYZ + Attribute Statistic on the Z float). Produces horizon-hugging flocks.",
      "Speed-based emission: build an EEVEE material that reads the 'vel' attribute via ShaderNodeAttribute and drives Emission Strength from VectorMath LENGTH. Fast-moving boids glow brighter — shows velocity gradients across the flock.",
    ],
    troubleshooting: [
      {
        symptom: "All boids fly off in the same direction from frame 1",
        cause:
          "The velocity attribute seed was not set before running the simulation. All 'vel' vectors are (0,0,0), and the forces add up to a coherent net direction from random numerical noise.",
        fix:
          "Verify me.attributes['vel'] exists before calling build_gn_tree(). Print vel_attr.data[0].vector after the seeding loop — it should be non-zero. Re-run main() from scratch.",
      },
      {
        symptom: "SampleIndex node outputs all-zero vectors for velocity",
        cause:
          "The 'vel' named attribute did not survive the geometry handoff into the GN modifier. Either it was created on the wrong object, or it uses the wrong domain ('FACE' instead of 'POINT').",
        fix:
          "Check bpy.data.objects['boid_flock'].data.attributes['vel'].domain == 'POINT'. If the attribute shows in the mesh but not in the GN Spreadsheet editor (set to Point domain), try toggling the GN modifier off and on to force a dependency-graph refresh.",
      },
      {
        symptom: "FunctionNodeAlignEulerToVector node not found",
        cause:
          "Using Blender < 3.0 or searching for the node by a different name.",
        fix:
          "In Blender 5.1 the type string is 'FunctionNodeAlignEulerToVector'. Confirm with: next((n for n in bpy.context.space_data.node_tree.nodes if 'align' in n.bl_idname.lower()), None). In older versions the node may be 'FunctionNodeAlignEulerToVector' with different property names for axis.",
      },
      {
        symptom: "Export GLB has no geometry — empty file",
        cause:
          "export_apply=True bakes the GN modifier at the current frame, but frame_set(GLB_FRAME) was not called before exporting, so the scene is at frame 1 with boids still at spawn positions.",
        fix:
          "Ensure main() calls frame_set(GLB_FRAME) and view_layer.update() immediately before bpy.ops.export_scene.gltf(). The for-loop that warms the cache resets frame to GLB_FRAME on its last iteration, so typically this is automatic — but verify scene.frame_current == GLB_FRAME before export.",
      },
    ],
  },
  base,
);
