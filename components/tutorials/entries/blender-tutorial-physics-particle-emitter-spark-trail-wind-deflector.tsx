import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function ParticleEmitterBody() {
  return (
    <>
      <p>
        Blender&rsquo;s legacy particle system is a spring-mass Newtonian
        integrator: each particle carries mass, position, and velocity, and at
        every sub-step the solver applies F&nbsp;=&nbsp;ma from gravity, drag,
        and any force field objects in the scene. The result is physically
        plausible projectile motion — arcing trajectories, velocity-dependent
        drag, elastic or plastic collisions — at a fraction of the cost of a
        full fluid simulation. Five hundred particles with two quality sub-steps
        runs in real time on any modern GPU.
      </p>

      <p className="mt-3">
        The key design lever is <code>effector_weights</code> on the particle
        settings block. Where scene gravity affects every physics system at
        full strength, <code>effector_weights.gravity</code> attenuates or
        amplifies it per-system — so a smoke system can float at 0.05 while a
        spark system falls at full 1.0, in the same scene, from the same source
        object. Wind and vortex effectors are weighted the same way, giving each
        particle system its own private relationship with every force field in
        the scene.
      </p>

      <p className="mt-3">
        Cloth simulation, covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag"
          className={lk}
        >
          waving flag tutorial
        </Link>
        , uses the same Wind force field and the same Collision modifier — the
        bpy API for <code>ob.field.strength</code> and{" "}
        <code>coll.settings.thickness_outer</code> is identical. Particle
        systems and cloth are two different consumers of a shared effector and
        collision infrastructure. Mantaflow, covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-mantaflow-smoke-fire-torch"
          className={lk}
        >
          smoke and fire tutorial
        </Link>
        , is different: it runs its own built-in flow solver and reads force
        fields through a separate Mantaflow effector interface, not through
        <code>effector_weights</code>. For static scatter — grass, pebbles,
        leaves that do not move — the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-distribute-points-ground-cover-scatter"
          className={lk}
        >
          Geometry Nodes distribute tutorial
        </Link>{" "}
        is the right tool: zero simulation overhead, fully deterministic, GLB-
        exportable. Particles are for motion.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Legacy particles versus Geometry Nodes simulation zones
      </h2>
      <p>
        Blender 4.2 introduced Simulation Zones in Geometry Nodes, covered in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          simulation zone tutorial
        </Link>
        . GN simulation zones win at per-vertex attribute evolution — heat
        diffusion, growth fronts, wave propagation. Legacy particles win at
        high-count point dynamics with collision: 500 Newtonian particles with
        two deflectors simulate in seconds; replicating the same in a GN
        Simulation Zone would require writing a custom Verlet integrator and
        collision detection in GN nodes, which is feasible but considerably
        more complex. For production spark or debris effects, legacy particles
        remain the faster path in Blender 5.1.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Wind effector direction convention
      </h2>
      <p>
        The Wind force field pushes particles along the empty&rsquo;s{" "}
        <em>negative Z axis</em>. This surprises most beginners who expect it to
        push along +Z (up). The blueprint compensates with{" "}
        <code>ob.rotation_euler.y = 1.5708</code> (90°), which rotates the empty
        so its &minus;Z points in the +X world direction — wind blows from left
        to right across the scene. If you want a headwind pointing down the
        +Y axis, use <code>rotation_euler.x = −1.5708</code>. Always verify
        direction by selecting the wind empty in the viewport: the dashed-line
        force visualisation shows the actual push direction.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Collision thickness and the &ldquo;ghost particle&rdquo; artefact
      </h2>
      <p>
        The Collision modifier wraps the deflector mesh in a shell of radius{" "}
        <code>thickness_outer</code>. Particles that enter this shell are
        deflected before touching the actual surface — which prevents the
        sub-step aliasing artefact where a fast particle tunnels through a thin
        mesh in a single frame. The failure mode is setting{" "}
        <code>thickness_outer</code> too high: particles appear to bounce
        invisibly above the surface (&ldquo;ghost particles&rdquo;). For a 10 cm
        sphere, 0.01 m outer thickness is correct; for a large ground plane, 0.02
        m gives clean results at the cost of a perceptibly floating scatter layer.
        <code>damping_factor</code> controls how much normal-direction velocity
        is absorbed at impact (0 = perfectly elastic, 1 = completely inelastic);{" "}
        <code>friction_factor</code> bleeds tangential velocity to simulate ground
        roughness.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/particles/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Particle System Introduction
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. Emission, physics
          type comparison, effector weights, render type options. Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.ParticleSettings.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ParticleSettings Python API
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.EffectorWeights.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            EffectorWeights API
          </a>
          .
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/force_fields/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Force Fields
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. Wind &minus;Z
          direction convention, noise turbulence layer, falloff distance
          settings, Vortex flow drag parameter. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/physics/collision.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Collision modifier page
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
            njanakiev / blender-scripting (MIT)
          </a>{" "}
          &mdash; Nikolai Janakiev. Python bpy scripting examples including
          procedural scene setup, modifier stacking, and material node trees.
          Particle system construction patterns in this blueprint follow the
          direct data API approach demonstrated throughout that repository.
          Related:{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting/tree/master/scripts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            scripts directory
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/physics/physics-particle-emitter-spark-trail-wind-deflector",
    time: "30 to 45 minutes",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor to run blueprint.py and record.py",
        "Properties ▸ Physics tab for particle settings and collision modifiers",
        "Timeline and Cache panel for triggering Bake All Dynamics",
        "3D Viewport in Rendered mode (EEVEE Next) to preview Bloom on sparks",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. Scene populates with: spark_emitter (plane at Z=3), ground_deflector (tilted plane), sphere_deflector, wind_force (empty), vortex_force (empty), spark_instance (hidden), camera and area light. The Info bar logs the HoloFlow confirmation messages.",
      },
      {
        title: "Inspect the particle system",
        body: "Select spark_emitter. Properties ▸ Physics ▸ Particle Systems. Open the Emission rollout — Count=500, Lifetime=80, Start=1, End=40. Open Physics — Newton, Mass=0.001. Open Render — Object, spark_instance selected. Open Force Weights — gravity/wind/vortex all 1.0.",
      },
      {
        title: "Inspect the force fields",
        body: "Select wind_force. Properties ▸ Physics. The Force Field panel shows Type=Wind, Strength=8.0, Noise=0.8. Note the dashed-line visualisation in the viewport — the arrows point in +X, confirming the −Z rotation is working correctly. Select vortex_force and confirm Strength=2.5, Flow=0.6.",
      },
      {
        title: "Inspect the collision modifiers",
        body: "Select ground_deflector. Properties ▸ Physics ▸ Collision. Outer=0.02 m, Damping=0.65, Friction=0.80. Select sphere_deflector — Outer=0.01 m (tighter), Damping=0.30, Friction=0.20. The sphere is more elastic than the ground.",
      },
      {
        title: "Bake All Dynamics",
        body: "Top menu: Physics ▸ Bake All Dynamics. Alternatively, in the particle modifier's Cache rollout click Bake. A progress bar counts to frame 120. This writes the point cache to the blend-file's adjacent cache folder. Bake time: 5–30 seconds depending on hardware.",
      },
      {
        title: "Scrub and review",
        body: "Press Space to play. Sparks emit from frame 1, the wind deflects their arcs rightward, the sphere scatters some upward and sideways, the tilted ground catches the rest. Pause at frame 55 — this is the hero frame with maximum density and most visible deflection patterns.",
      },
      {
        title: "Record screen and render viewport",
        body: "Start OBS recording (see SCREEN-RECORDING-NOTES.md). Play the timeline. Then Scripting workspace → open record.py → Run Script. Render ▸ Render Animation writes viewport.mp4 to the videos folder.",
      },
    ],
    troubleshooting: [
      {
        symptom: "Particles pass through the sphere or ground plane",
        cause:
          "thickness_outer is too small relative to the particle's velocity and the simulation sub-step size. Fast particles can cross the collision shell within a single sub-step.",
        fix: "Increase thickness_outer on the offending Collision modifier (try 0.05 m). Also increase the particle system's quality sub-steps (Physics rollout, Quality field) from the default 10 to 20 — more sub-steps means the integrator samples collision more frequently.",
      },
      {
        symptom: "Particles ignore the Wind or Vortex effector entirely",
        cause:
          "effector_weights.wind (or .vortex) on the particle settings is 0.0, or the effector's Effect Collection field is set to a collection that does not include the emitter.",
        fix: "In the particle modifier's Force Weights rollout, confirm Wind and Vortex are both 1.0. In the wind/vortex force field settings, ensure Effect Collection is empty (affects all objects) or contains the emitter's collection.",
      },
      {
        symptom:
          "After changing particle count or lifetime, bake seems to use old values",
        cause:
          "The existing bake cache on disk overrides current settings. Blender loads the cached positions rather than re-simulating.",
        fix: "Physics ▸ Free All Bakes, then change the settings, then bake again. The cache is stored in a folder named blend-file-name_cache adjacent to the .blend file.",
      },
      {
        symptom: "Viewport very slow to scrub after baking",
        cause:
          "display_count (the viewport particle limit) is too high, or Rendered mode is active with Bloom costing GPU cycles per frame.",
        fix: "In the particle modifier, Viewport Display rollout, reduce Display from 200 to 50. Switch viewport shading to Material Preview for faster scrubbing; switch to Rendered only when checking Bloom quality.",
      },
    ],
    finalResult:
      "500 Newtonian spark particles emitting from a small plane, blown laterally by a Wind force field with noise turbulence, deflecting off a sphere obstacle and a tilted ground plane via Collision modifiers, rendered with EEVEE Next Bloom as a 120-frame viewport.mp4 and a manual screen.mp4 recording of the full workflow.",
  },
  {
    slug: "blender-tutorial-physics-particle-emitter-spark-trail-wind-deflector",
    title:
      "Physics: Particle Emitter — Spark Trail with Wind Force + Deflector Collision (Blender 5.1)",
    date: "2026-06-15",
    kind: "tutorial",
    excerpt:
      "Build a Newtonian particle emitter that fires 500 spark shards under Wind and Vortex force fields, deflecting off a sphere obstacle and a ground plane via Collision modifiers — exploring effector_weights, OBJECT render type instancing, and the −Z wind direction convention.",
    tags: [
      "blender",
      "physics",
      "particles",
      "force-fields",
      "collision",
      "newtonian",
      "vfx",
    ],
    Body: ParticleEmitterBody,
  }
);
