import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PhysicsMantaflowLiquidDamBreakBody() {
  return (
    <>
      <p>
        The FLIP (Fluid-Implicit-Particle) algorithm that Blender&rsquo;s Mantaflow
        solver uses is a hybrid Eulerian&ndash;Lagrangian method: particles carry
        velocity across large deformations whilst a staggered MAC (Marker-and-Cell)
        grid solves incompressible pressure.  Each timestep runs four stages &mdash;
        particle-to-grid (P2G) velocity transfer, pressure projection (PCG solver
        enforcing ∇·u&nbsp;=&nbsp;0), grid-to-particle (G2P) velocity correction,
        then Lagrangian particle advection.  Volume is conserved because the pressure
        solve forces incompressibility and effector signed-distance fields prevent
        particle penetration.  The dam break is the canonical FLIP benchmark: Martin
        &amp; Moyce (1952) derived the analytical front position{" "}
        <code>x(t) = √(2g·h₀·t)</code> for the early gravity-dominated phase,
        making it straightforward to verify solver plausibility by eye.  Compare the
        global pressure-projection incompressibility enforcement here with the iterative
        spring-force constraint in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag"
          className={lk}
        >
          cloth simulation tutorial
        </Link>
        : both carry velocity state forward one step at a time, but cloth resolves
        local elastic springs whilst FLIP resolves a single global pressure field.
      </p>

      <p>
        The domain cube defines the MAC grid extent.  Its longest axis is divided
        into <code>RESOLUTION</code> voxels; the other axes scale proportionally.
        At 64 divisions, a 2&nbsp;&times;&nbsp;1&nbsp;&times;&nbsp;1.6 m domain
        yields 64&nbsp;&times;&nbsp;32&nbsp;&times;&nbsp;51 voxels &mdash; voxel
        size ≈&nbsp;3.1 cm.  Doubling the resolution to 128 multiplies RAM and bake
        time roughly by eight (scaling as the cube of linear resolution for a full
        3-D solve), so 64 is the practical starting point for visual development.
        The <strong>flow object</strong> with behavior <code>GEOMETRY</code> seeds
        the rectangular water column at t&nbsp;=&nbsp;0 without any ongoing inflow:
        Mantaflow samples the flow mesh&rsquo;s interior on the initialisation step
        and places FLIP particles at covered grid nodes.  Setting{" "}
        <code>use_initial_velocity = False</code> starts the column at rest so all
        kinetic energy derives from gravity &mdash; a pure gravitational collapse with
        no injected momentum.  Compare the seeding mechanism with how the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-volume-cube-procedural-cloud"
          className={lk}
        >
          procedural cloud tutorial
        </Link>{" "}
        uses a Volume Cube node to define density occupancy: both represent 3-D scalar
        occupancy over a grid, but the Mantaflow field is dynamic (advected by
        velocity each step) whereas the Geometry Nodes field is procedural and
        stateless.
      </p>

      <p>
        The step obstacle uses an <strong>EFFECTOR &rarr; COLLISION</strong> modifier.
        Mantaflow builds a narrow-band signed-distance field (SDF) around each
        effector mesh every substep; FLIP particles within SDF&nbsp;&lt;&nbsp;0 are
        projected outward and their normal-direction velocity is zeroed (the
        no-slip wall condition).  At <code>STEP_X = 0.18 m</code>, the step is
        narrower than the water column (0.75 m), so fluid wraps around both ends
        simultaneously &mdash; generating three-dimensional turbulence that no 2-D
        solver can reproduce.  <code>surface_distance = 0.0</code> means the SDF is
        computed exactly at the mesh surface with no additional clearance.  The
        two-stage collapse &mdash; primary bore against the step face, then overflow
        cascade over the top &mdash; makes this scenario more informative than a
        plain dam break into empty space: you see both the Froude-supercritical
        bore impact and the hydraulic-jump transition in a single five-second clip.
        Note the contrast with the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-soft-body-jelly-squash-stretch"
          className={lk}
        >
          soft body squash-and-stretch tutorial
        </Link>
        : both are Lagrangian systems (particles/nodes carry position and velocity)
        but soft body resolves internal elastic forces whilst FLIP resolves global
        incompressible pressure &mdash; entirely different constitutive models
        applied to the same particle representation.
      </p>

      <p>
        Mesh display (<code>use_mesh = True</code>) converts the raw FLIP particle
        cloud to a smooth isosurface.  <code>mesh_particle_radius = 2.0</code> voxel
        units inflates each particle to a ≈&nbsp;6.2 cm sphere in world space, then
        merges overlapping spheres into a continuous water surface.  Values below 1.5
        expose individual particle lumps &mdash; occasionally desirable for a
        stylised &ldquo;globule&rdquo; look; values above 3.0 oversmooth and erase
        thin splash sheets.  2.0 is the balance for a studio render.  The water
        material uses Principled BSDF with <code>Transmission Weight = 0.92</code>{" "}
        and IOR&nbsp;1.333 (the physical water-air interface), rendered in Cycles
        because Cycles handles thick-medium internal attenuation and refracted
        caustics correctly.  EEVEE Next can approximate transmission via
        Screen-Space Refraction (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          SSR and ray-tracing tutorial
        </Link>
        ) but lacks volumetric absorption.  The GLB snapshot at frame&nbsp;40
        (~1.67&nbsp;s) captures peak splash height &mdash; the moment the primary
        bore has climbed the step face and the crown is at maximum elevation, giving
        the export its most dramatic silhouette for WebXR display.  For the
        physics of refractive materials see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          principled transmission and iridescence tutorial
        </Link>
        .  The Mantaflow cache write &mdash; OpenVDB voxel grids for the velocity
        field plus BPHYS particle files &mdash; is conceptually identical to the
        disk-bake strategy in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-bake-node-simulation-growth"
          className={lk}
        >
          GN Bake Node simulation-growth tutorial
        </Link>
        , except the data format is volumetric rather than geometry-attribute based.
      </p>

      <p>Outside references for this tutorial:</p>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/fluid/type/domain/index.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Fluid Domain Settings
          </a>{" "}
          (CC-BY-SA&nbsp;4.0, Blender Foundation) &mdash; complete parameter
          reference for the FLIP domain: resolution, mesh display, cache type,
          and bake operators.  Sibling pages:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/physics/fluid/type/flow.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Flow settings
          </a>{" "}
          (GEOMETRY vs. INFLOW behavior, initial velocity) and{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/physics/fluid/type/effector.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Effector settings
          </a>{" "}
          (COLLISION surface distance, stickiness, velocity influence).
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
          (MIT, Nicolas Janakiev) &mdash; practical headless bpy examples covering
          mesh construction, modifier workflows, and camera-rig patterns that
          informed the blueprint&rsquo;s helpers and cleanup strategy.  The
          author&rsquo;s{" "}
          <a
            href="https://github.com/njanakiev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            broader Python/Blender portfolio
          </a>{" "}
          contains additional procedural geometry and data-visualisation examples.
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
          (Apache-2.0, Khronos Group) &mdash; the official Blender glTF exporter
          handling <code>export_apply=True</code> (bakes the evaluated fluid mesh
          at <code>EXPORT_FRAME</code>) and Draco level&nbsp;6 compression.
          Related Khronos projects:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Viewer
          </a>{" "}
          (WebGL reference renderer, Apache-2.0).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-physics-mantaflow-liquid-dam-break",
  title:
    "Physics: Mantaflow FLIP Liquid — Dam Break over a Step Obstacle (Blender 5.1)",
  tags: [
    "blender", "physics", "fluid", "mantaflow", "flip",
    "liquid", "simulation", "dam-break", "effector", "mesh-display",
    "cycles", "transmission", "glb", "webxr",
  ],
  category: "tutorial",
  publishedOn: "2026-06-13",
  summary:
    "FLIP liquid simulation in Blender 5.1 via Mantaflow.  A 75 cm × full-depth water " +
    "column collapses under gravity against an 18 cm step obstacle, producing a primary " +
    "bore, upward splash, and overflow cascade.  Expert coverage of MAC grid resolution, " +
    "GEOMETRY flow seeding, COLLISION effector SDF, mesh-display particle radius, and " +
    "headless cache baking.  Cycles water material with IOR 1.333 and Transmission " +
    "Weight 0.92.  GLB snapshot at peak splash for WebXR delivery.",
  body: PhysicsMantaflowLiquidDamBreakBody,
  libraryPath: "blends/physics/physics-mantaflow-liquid-dam-break",
});
