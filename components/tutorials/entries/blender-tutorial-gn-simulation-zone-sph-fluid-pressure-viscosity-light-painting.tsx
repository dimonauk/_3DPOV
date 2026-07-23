import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Smoothed Particle Hydrodynamics (SPH) models a fluid as a cloud of
        point masses, each carrying density, pressure, and velocity. Every
        particle samples the positions and velocities of its neighbours through a
        kernel function W(r, h) — a smooth bump that decays to zero at radius h —
        and accumulates forces proportional to the kernel gradient. In Blender
        5.1 Geometry Nodes the neighbour lookup is handled by{" "}
        <strong>Index of Nearest</strong>, the only node that queries actual
        spatial proximity rather than mesh-edge adjacency. This tutorial
        implements Müller et al.&apos;s 2003 pressure + viscosity formulation
        inside a Simulation Zone and sends 320 glowing particles through a
        bowl-shaped boundary, producing fluid light-painting trails as they pool.
      </p>
      <p>
        The studio interest is direct: poi throws spray droplets whose ballistic
        arcs look exactly like SPH pressure-repulsion trajectories. The emission
        material maps particle speed to colour (violet slow, white fast), so the
        final render reads as a long-exposure light-painting photograph of water
        falling into a bowl.
      </p>

      <h2>Why IndexOfNearest and not BlurAttribute?</h2>
      <p>
        Every grid-based Simulation Zone tutorial in this library — cloth, wave
        equation, coupled pendulums — uses{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr"
          className={lk}
        >
          BlurAttribute
        </Link>{" "}
        to average over edge-adjacent neighbours. That is correct for continua
        laid out on a mesh, because mesh edges define fixed spatial bonds. SPH
        particles are <em>free</em>: they move through space and their
        neighbourhoods change every frame. The relevant bond is spatial distance,
        not graph distance, and BlurAttribute cannot express that. Index of
        Nearest solves the single-nearest-point query in 3-D; SampleIndex then
        reads any named attribute at that index. The result is a proper kernel
        support region query, just limited to one neighbour rather than K.
      </p>
      <p>
        The 1-nearest-neighbour limitation is a real trade-off. Classic SPH sums
        over all j with |rᵢ − rⱼ| &lt; h, typically 8–30 neighbours. With one
        neighbour the pressure and viscosity forces are under-resolved, so the
        fluid behaves more like an elastic gas than water. The remedy is
        increasing K_PRESS and tightening h so that the one sampled neighbour
        dominates when particles are close, which gives plausible pooling
        behaviour at interactive frame rates without nested loops.
      </p>

      <h2>The Müller kernels (simplified to 1 neighbour)</h2>
      <pre>{`Full poly6 pressure kernel:
  W(r, h) = 315 / (64π h⁹) · (h² − r²)³   for r ≤ h

GN approximation (1-neighbour, unnormalised):
  w ≈ max(0, h − dist)                      ← linear falloff

Pressure force on particle i from nearest j:
  f_p = K_PRESS · w · normalize(pos_i − pos_j)

Viscosity (Laplacian kernel collapses to velocity difference):
  f_v = K_VISC · (vel_j − vel_i)

Symplectic Euler (velocity first, then position):
  vel_new = vel_i + (f_p + f_v + f_gravity + f_bowl) · DT
  pos_new = pos_i + vel_new · DT`}</pre>
      <p>
        The symplectic order matters. Using vel_i for both updates (explicit
        Euler) injects energy every step and causes exponential blowup — the same
        instability discussed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Poi
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Verlet Rope
        </Link>{" "}
        tutorials. Using vel_new for the position update (symplectic) conserves a
        modified energy and remains bounded.
      </p>

      <h2>Bowl boundary without a mesh</h2>
      <p>
        The bowl is implicit — no geometry, just two analytical repulsion terms.
        The XZ (horizontal) repulsion uses a trick: separate the position into X,
        Y, Z components, zero the Y, recombine as a vector, and take its length.
        That length is the horizontal distance from the bowl axis. When it exceeds
        BOWL_R the particle is outside and receives an inward push scaled by
        K_WALL · excess. The floor repulsion is simpler: if pos.y is below
        BOWL_FLOOR, push up by K_WALL · (BOWL_FLOOR − pos.y). Both forces are
        independent of any scene geometry — no raycast, no SDF object — which
        keeps the Simulation Zone free of external references and safe to bake in
        background mode.
      </p>

      <h2>Emitter design — spiral column</h2>
      <p>
        Particles are distributed in a descending spiral in blueprint.py, not
        randomly. A random emitter produces clusters where several particles
        start at nearly the same position; the very first frame has dist ≈ 0
        between some pairs, making the pressure force explode before the
        simulation has a chance to separate them. The spiral guarantees a minimum
        inter-particle spacing of roughly EMIT_R · 2π / √N_PART ≈ 0.07 m, safely
        below the kernel radius h = 0.35 m (so pressure is active immediately)
        but above the zero-distance singularity. Initial tangential velocity
        rotates with the spiral angle so particles fly outward like water from a
        spinning poi head.
      </p>

      <h2>Node wiring: key connections</h2>
      <pre>{`Inside Simulation Zone:
  Position ──────────────────────────┐
                                     ├── SUBTRACT → sep_ij ──┬── LENGTH → dist
  IndexOfNearest                     │                       ├── NORMALIZE → sep̂
    └─ Index → SampleIndex(Position) ┘                       │
                                                             ├─ SUBTRACT(H, dist)
  IndexOfNearest                                             │   └─ MAXIMUM(0)
    └─ Index → SampleIndex(vel)                              │       └─ MULTIPLY(K_P)
                                                             │           └─ SCALE(sep̂) → f_p
  vel_attr ──────────────────────────┐
  SampleIndex(vel) ──────────────────┴── SUBTRACT → v_diff → SCALE(K_V) → f_v

  StoreNamedAttribute("vel", vel_new)  ← must come before SetPosition
  SetPosition(pos_new)                 ← uses vel_new, not vel_i`}</pre>

      <h2>Velocity-speed emission material</h2>
      <p>
        The material reads the <code>vel</code> named attribute as a vector,
        takes its length, and feeds it through a B-Spline colour ramp:{" "}
        <code>0.0 → violet</code>, <code>1.2 → cyan</code>,{" "}
        <code>2.5 → lime</code>, <code>4.0+ → white</code>. Emission strength 8
        with EEVEE Bloom produces the light-painting glow against the
        near-black world. The ramp breakpoints correspond to physical speeds:
        violet is pooled particles at near rest, cyan is the mid-fall range, lime
        is active pressure repulsion, white is the initial tangential throw
        velocity. This connects directly to the strand-colour system used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Poi Trail Ribbon
        </Link>{" "}
        tutorial, which uses spline parameter rather than speed — two different
        strategies for the same light-painting palette grammar.
      </p>

      <h2>Failure modes and fixes</h2>
      <p>
        <strong>Particles escape the bowl.</strong> K_WALL is too low relative to
        K_PRESS. The pressure force launches particles before the wall repulsion
        catches them. Fix: raise K_WALL (14 → 20) or lower K_PRESS (18 → 12).
      </p>
      <p>
        <strong>Simulation explodes on frame 2.</strong> DT too large or K_PRESS
        too high. The stability criterion for pressure-driven SPH is roughly
        DT &lt; h / (K_PRESS · max_speed). At K_PRESS = 18, h = 0.35,
        max_speed ≈ 2: DT &lt; 0.35/36 ≈ 0.0097 — the default 1/24 ≈ 0.042
        is borderline. Reduce K_PRESS or halve DT to 1/48.
      </p>
      <p>
        <strong>Particles stack on top of each other (no repulsion).</strong> The
        simulation state is not initialised. Run blueprint.py, then scrub the
        timeline; the Simulation Zone only evaluates when the timeline is playing
        or baking. Use <em>Bake All Dynamics</em> in the Scene properties before
        rendering to lock the state.
      </p>
      <p>
        <strong>No glow visible.</strong> EEVEE Bloom requires the Render
        Properties → Bloom toggle in EEVEE Next. Alternatively check{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-bloom-emission-glow-cel-shade"
          className={lk}
        >
          the EEVEE Next Bloom tutorial
        </Link>{" "}
        for the correct property path in Blender 5.1 (it moved from Post
        Processing to the main EEVEE panel in 4.3).
      </p>

      <h2>Outside sources</h2>
      <p>
        The pressure and viscosity kernel formulation follows{" "}
        <strong>Müller, Charypar &amp; Gross (2003)</strong>{" "}
        &ldquo;Particle-Based Fluid Simulation for Interactive Applications&rdquo;
        — Proc. ACM SIGGRAPH/Eurographics SCA 2003. The paper is freely available
        on Matthias Müller&rsquo;s personal academic page (no formal licence; PD
        academic).{" "}
        <a
          href="https://matthias-research.github.io/pages/publications/sca03.pdf"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          https://matthias-research.github.io/pages/publications/sca03.pdf
        </a>
        . Related projects by the same group:{" "}
        <a
          href="https://matthias-research.github.io/pages/projects/index.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Position Based Dynamics / XPBD
        </a>
        .
      </p>
      <p>
        The Blender Foundation&rsquo;s Simulation Zone documentation (CC-BY-SA
        4.0) documents the pair_with_output() binding and state_items API used
        throughout blueprint.py:{" "}
        <a
          href="https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/simulation/simulation_zone.html"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          docs.blender.org/manual/en/5.1/…/simulation_zone
        </a>
        . Related: Blender source at{" "}
        <a
          href="https://projects.blender.org/blender/blender"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          projects.blender.org/blender/blender
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
  title:
    "GN Simulation Zone — SPH Fluid: Müller Kernels, Pressure & Viscosity for Light-Painting Particle Trails (Blender 5.1)",
  subtitle:
    "IndexOfNearest as the SPH kernel support query; symplectic Euler with bowl boundary; velocity-speed emission colouring.",
  description:
    "Implement Smoothed Particle Hydrodynamics in a Geometry Nodes Simulation Zone: IndexOfNearest for spatial neighbour lookup, pressure repulsion, viscosity damping, bowl boundary, and a speed-mapped emission material that turns particle trails into light-painting photographs.",
  date: "2026-07-23",
  tags: [
    "blender",
    "geometry-nodes",
    "simulation-zone",
    "sph",
    "fluid",
    "physics",
    "light-painting",
    "poi",
    "particles",
    "eevee",
    "webxr",
  ],
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
});
