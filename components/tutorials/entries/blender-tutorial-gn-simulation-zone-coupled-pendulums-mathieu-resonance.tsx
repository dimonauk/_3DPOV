import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The <strong>Mathieu equation</strong> is the equation of motion for a
        pendulum whose pivot oscillates vertically. When the driving frequency
        equals the pendulums natural frequency, infinitesimally small
        perturbations grow exponentially — a phenomenon called{" "}
        <em>parametric resonance</em>. This tutorial chains 20 such pendulums
        together with torsional springs and simulates the whole system in a
        Blender 5.1{" "}
        <strong>Geometry Nodes Simulation Zone</strong> using the{" "}
        <strong>symplectic Euler (kick-drift)</strong> integrator. Watching a
        half-sine initial mode progressively excite higher harmonics and
        exchange energy with them is one of the clearest demonstrations of
        coupled wave physics you can build inside a 3-D tool.
      </p>

      <h2>Why symplectic Euler, not plain Euler</h2>
      <p>
        Plain (explicit) Euler — <code>ω_new = ω + α·dt</code>, then{" "}
        <code>θ_new = θ + ω·dt</code> — uses the <em>old</em> velocity to
        advance position. Over many steps it pumps energy into the oscillator,
        causing slow drift toward infinity even without a driving term. The{" "}
        <em>symplectic</em> variant swaps the order: kick first, then drift
        with the <em>new</em> velocity:
      </p>
      <pre>{`ω_{t+1} = ω_t + α_t · dt           ← kick  (uses old θ)
θ_{t+1} = θ_t + ω_{t+1} · dt       ← drift (uses NEW ω)`}</pre>
      <p>
        This one-line change makes the integrator{" "}
        <em>symplectic</em> — it preserves a discrete version of the
        Hamiltonian (total energy) over long runs. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics"
          className={lk}
        >
          Verlet rope tutorial
        </Link>{" "}
        uses the same integrator family expressed as position differences
        instead of an explicit velocity variable; both are equivalent
        first-order symplectic methods. The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr"
          className={lk}
        >
          cloth tutorial
        </Link>{" "}
        extends it to 2-D via BlurAttribute.
      </p>

      <h2>Coupling via SampleIndex and the discrete wave equation</h2>
      <p>
        The spring force between adjacent pendulums is{" "}
        <code>K·(θ_prev + θ_next − 2θ)</code>. In a Simulation Zone you
        cannot loop over neighbours directly, but you can read any
        point&apos;s attribute by index:
      </p>
      <pre>{`SampleIndex(value=theta, index=i−1)  →  θ_prev
SampleIndex(value=theta, index=i+1)  →  θ_next`}</pre>
      <p>
        When <code>i = 0</code>, <code>index = −1</code> is out of range.
        With <strong>Clamp = false</strong> (the default),{" "}
        <code>SampleIndex</code> returns the attribute&apos;s default value —
        0.0 for a FLOAT — giving <strong>Dirichlet (fixed-end) boundary
        conditions</strong> at both ends without any extra masking logic. The
        same pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-sample-index-echo-grid"
          className={lk}
        >
          Sample Index echo-grid tutorial
        </Link>
        . The expression{" "}
        <code>θ_prev + θ_next − 2θ</code> is exactly the{" "}
        <em>discrete Laplacian</em> of θ along the chain — the 1-D wave
        operator — just as BlurAttribute is the graph Laplacian on a mesh.
      </p>

      <h2>Mathieu parametric driving</h2>
      <p>
        The vertical oscillation of the pivot modulates the effective
        gravitational field:
      </p>
      <pre>{`f(t) = 1 + 2ε · sin(2π·f_d·t)
Ω₀²(t) = (g/L) · f(t)`}</pre>
      <p>
        At <code>f_d = Ω₀ / 2π</code> (the natural frequency in Hz), the
        system sits on the boundary of the{" "}
        <strong>principal Mathieu instability tongue</strong> — any small
        perturbation grows at a rate proportional to ε. With{" "}
        <code>ε = 0.15</code> and per-step damping{" "}
        <code>γ = 0.012</code>, the first mode grows for about 60 frames
        before saturation; the coupling then redistributes energy into
        neighbouring modes, producing the standing-wave beat pattern visible
        in the baked animation. See{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-scene-time-rotation-mechanical-clockwork"
          className={lk}
        >
          the Scene Time tutorial
        </Link>{" "}
        for how to read seconds (not frames) cleanly from a GN tree — the
        driving term here uses <code>SceneTime.Seconds</code> so that
        changing the FPS does not alter the physics.
      </p>
      <p>
        The <strong>nonlinear</strong> term <code>sin(θ)</code> (rather than
        the small-angle approximation θ) is computed with a{" "}
        <code>ShaderNodeMath(SINE)</code> node, which is available in GN
        trees. For <code>|θ| &lt; 0.1 rad</code> the difference is under 0.2 %,
        but as resonance drives bobs past 0.5 rad the nonlinearity becomes the
        primary saturation mechanism — without it the simulation would diverge
        to infinity despite damping.
      </p>

      <h2>Wave reveal without a wave-reveal node</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal"
          className={lk}
        >
          Wave Reveal tutorial
        </Link>{" "}
        animates geometry sequentially using Scene Time comparison. The
        coupled-pendulum wave is fundamentally different: it emerges from
        physics, not from a trigger schedule. The half-sine initial condition
        excites the first normal mode; coupling gradually transfers energy to
        modes 2, 3, … producing a{" "}
        <em>Fermi–Pasta–Ulam–Tsingou</em> (FPUT) recurrence: after many
        cycles, energy returns almost entirely to the first mode — a
        surprising and beautiful result when you see it baked and scrubbed in
        the timeline.
      </p>
    </>
  );
}

const data = {
  slug: "blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance",
  title:
    "GN Simulation Zone — Coupled Pendulums: Mathieu Parametric Resonance & Transverse Wave Propagation (Blender 5.1)",
  description:
    "Simulate 20 spring-coupled pendulums in a Blender 5.1 GN Simulation Zone using symplectic Euler integration — covers Mathieu parametric resonance, SampleIndex neighbour coupling, fixed-end boundary conditions, and FPUT energy recurrence. Bakes to per-frame bob trajectories.",
  date: "2026-07-23",
  Body,
  seeAlso: [
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics",
      label: "GN Simulation Zone — Verlet Rope / Cable Physics",
      note: "1-D Verlet chain with explicit distance-constraint projection — symplectic integrator sister tutorial",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr",
      label: "GN Simulation Zone — 2-D Spring-Mass Cloth (Verlet + BlurAttribute)",
      note: "2-D extension using BlurAttribute as a discrete graph Laplacian instead of SampleIndex",
    },
    {
      href: "/tutorials/blender-tutorial-gn-simulation-zone-wave-reveal",
      label: "GN Simulation Zone — Wave Reveal",
      note: "Scripted wave propagation via Scene Time — contrast with physics-driven wave emergence here",
    },
    {
      href: "/tutorials/blender-tutorial-gn-sample-index-echo-grid",
      label: "GN Sample Index — Echo Grid",
      note: "In-depth treatment of SampleIndex, boundary behaviour, and index arithmetic in GN",
    },
    {
      href: "/tutorials/blender-tutorial-gn-scene-time-rotation-mechanical-clockwork",
      label: "GN Scene Time — Mechanical Clockwork",
      note: "Scene Time seconds vs frames — prerequisite for the parametric driving term",
    },
  ],
  furtherReading: [
    {
      href: "https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation/simulation_zone.html",
      label: "Simulation Zone — Blender Manual",
      note: "CC-BY-SA 4.0 · Blender Foundation · state items, bake panel, Python binding",
    },
    {
      href: "https://dlmf.nist.gov/28",
      label: "NIST DLMF Ch. 28 — Mathieu Functions & Hill's Equation",
      note: "Public Domain · US Government · stability tongues, Floquet theory, instability bands",
    },
    {
      href: "https://openstax.org/books/university-physics-volume-1/pages/15-introduction",
      label: "OpenStax University Physics Vol.1, Ch. 15 — Oscillations",
      note: "CC BY 4.0 · OpenStax · simple pendulum derivation, energy in oscillators",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/geometry-nodes/gn-simulation-zone-coupled-pendulums-mathieu-resonance",
    time: "one session",
    difficulty: "advanced",
    goal: "Build a chain of 20 spring-coupled pendulums in a Blender 5.1 GN Simulation Zone using symplectic Euler integration, Mathieu parametric driving, and SampleIndex-based neighbour coupling with automatic fixed-end boundary conditions — observe the half-sine normal mode grow under resonance, then couple into higher harmonics and show FPUT energy recurrence.",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note: "Simulation Zone requires Blender 4.0+; SceneTime.Seconds output requires 4.1+. Target is 5.1.",
      },
    ],
    prerequisites: [
      "Comfortable with GN: Named Attribute, Store Named Attribute, Sample Index, SceneTime, Math nodes",
      "Understand the Simulation Zone read/write frame loop — see blender-tutorial-gn-simulation-zone-wave-reveal",
      "Familiar with symplectic integration — compare blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics",
      "Know what SampleIndex returns for out-of-range indices — see blender-tutorial-gn-sample-index-echo-grid",
    ],
    steps: [
      {
        title: "Create the pendulum mesh and initialise state attributes",
        body: "Run `blueprint.main()`. A bmesh loop creates N=20 vertices in a line at Z=0, X = i·D (D=0.3 m spacing). These are the pivot points.\n\nTwo FLOAT named attributes initialised on the POINT domain:\n  `theta`  — initial half-sine: θ_i = 0.25 · sin(π·i / 19) rad\n  `omega`  — angular velocity, all 0.0 rad/s initially\n\nThe half-sine shape is the first normal mode of the chain: all bobs oscillate in phase with an amplitude envelope that peaks at the centre. Without coupling they would stay in this mode forever; coupling (K > 0) gradually routes energy into modes 2, 3, … .",
      },
      {
        title: "Build the GN tree and wire the Simulation Zone pair",
        body: "A GN node tree `CoupledPendulumsGN` is created and attached via `obj.modifiers.new('CoupledPendulumsGN', 'NODES')`.\n\nSimulation Zone boilerplate:\n  `sim_i = nodes.new('GeometryNodeSimulationInput')`\n  `sim_o = nodes.new('GeometryNodeSimulationOutput')`\n  `sim_i.pair_with_output(sim_o)` — links the pair without UUID collisions\n  Geometry wires: `GroupInput → sim_i`, `sim_o → GroupOutput`\n\nAll physics computation lives between `sim_i.outputs['Geometry']` and `sim_o.inputs['Geometry']`.",
      },
      {
        title: "Read neighbour thetas for coupling force",
        body: "Three read-nodes inside the simulation zone:\n  `na_th = NamedAttribute('theta', FLOAT)` — current pendulum angle per point\n  `na_om = NamedAttribute('omega', FLOAT)` — current angular velocity per point\n  `idx_nd = Index()` — integer index i per point\n\nNeighbour sampling:\n  `sub1 = Math(SUBTRACT, idx, 1.0)` → i−1\n  `add1 = Math(ADD,      idx, 1.0)` → i+1\n  `samp_prev = SampleIndex(geo, theta, index=sub1, data_type=FLOAT, clamp=False)`\n  `samp_next = SampleIndex(geo, theta, index=add1, data_type=FLOAT, clamp=False)`\n\nAt i=0, sub1=−1 is out of range; SampleIndex(clamp=False) returns 0.0 → θ_prev = 0 (left wall fixed). Same at i=19 for the right wall. Dirichlet boundary conditions for free.\n\nCoupling force:\n  `laplacian = (prev + next) − 2·theta`\n  `couple    = K_COUPLE × laplacian` — discrete 1-D wave operator",
      },
      {
        title: "Compute Mathieu driving and gravitational restoring force",
        body: "Scene time node: `GeometryNodeInputSceneTime` → `Seconds` output (float, frame-rate independent).\n\nParametric modulation (principal resonance, driving at the natural frequency):\n  `phase_node = Math(MULTIPLY, Seconds, 2π·f_d)` where f_d ≈ 0.996 Hz\n  `sin_2phase = Math(SINE, phase_node)`\n  `drive_mod  = Math(MULTIPLY, sin_2phase, 2·ε)` where ε = 0.15\n  `om0_sq_mod = Math(MULTIPLY, drive_mod, Ω₀²)` where Ω₀² = 39.24\n  `om0_sq_t   = Math(ADD, om0_sq_mod, Ω₀²)` = Ω₀²·f(t)\n\nRestoring force:\n  `sin_th    = Math(SINE, theta)`\n  `grav_raw  = Math(MULTIPLY, om0_sq_t, sin_th)`\n  `grav_f    = Math(SUBTRACT, 0.0, grav_raw)` = −Ω₀²(t)·sin(θ)\n\nThe SINE node captures the nonlinearity; for |θ| > 0.3 rad this saturates the resonance instead of allowing unbounded growth.",
      },
      {
        title: "Symplectic Euler integration and position update",
        body: "Damping force: `damp_f = Math(MULTIPLY, omega, −γ)`\n\nTotal angular acceleration:\n  `alpha = grav_f + couple_force + damp_f`\n\nSymplectic Euler (kick-drift in that order):\n  `alp_dt   = Math(MULTIPLY, alpha, DT)`   where DT = 1/24 s\n  `om_new   = Math(ADD, omega, alp_dt)`     ← kick\n  `om_dt    = Math(MULTIPLY, om_new, DT)`\n  `th_new   = Math(ADD, theta, om_dt)`     ← drift with NEW ω (symplectic!)\n\nStore state:\n  `geo1 = StoreNamedAttr(geo, 'theta', th_new)`\n  `geo2 = StoreNamedAttr(geo1, 'omega', om_new)`\n\nBob 3-D position (pivot at x = i·D, z = 0):\n  `bob_x = i·D + L·sin(theta_new)`\n  `bob_z =      −L·cos(theta_new)`\n  `SetPosition(geo2, CombineXYZ(bob_x, 0, bob_z))`\n\nThen instance an IcoSphere (radius=0.04, subdivisions=2) on each point.",
      },
      {
        title: "Bake and observe mode coupling",
        body: "Bake: **Properties > Object Data Properties > Geometry Nodes Cache > Bake All** (~5–15 s for 300 frames).\n\nWhat to look for:\n  Frame 1–40:   half-sine mode (all bobs roughly in phase, amplitude growing)\n  Frame 40–80:  saturation — nonlinear sin(θ) and inter-mode coupling begin\n  Frame 80–150: energy visible in modes 2 and 3 — 'wobble' propagates as a wave packet\n  Frame 150–300: FPUT-like recurrence — energy drifts back toward the first mode\n\nTo explore the Ince-Strutt stability diagram, change DRIVE_AMP to 0.0 (no driving → free decay) or 0.35 (deeper inside first tongue → faster growth, earlier saturation).",
      },
    ],
    finalResult:
      "A chain of 20 coupled pendulum bobs (ICO sphere instances, radius 4 cm) evolving under Mathieu parametric driving inside a GN Simulation Zone. The half-sine first normal mode grows exponentially for ~40 frames, then saturates and couples energy into higher harmonics. Baked to 300 per-frame vertex positions, exportable as GLB for WebXR timeline animation or Alembic for compositing.",
    variations: [
      "Change DRIVE_FREQ to 0.5 × natural frequency → sub-harmonic resonance tongue (period-doubling). Instability is weaker, takes ~200 frames to develop.",
      "Set DRIVE_AMP = 0 (remove driving) and INIT_AMP = 0.5 → large-angle free oscillations. The period elongates compared to small-angle prediction — visible because we use sin(θ), not θ.",
      "Increase N to 40 and K_COUPLE to 10 → faster wave propagation speed (c = sqrt(K·D²)), standing-wave antinodes sharpen.",
      "Add a Realize Instances node after InstanceOnPoints + a Curve from the SetPosition geometry to draw the pendant rods. Use Mesh to Curve on a thin cylinder path per bob.",
      "Bind a material that colours bobs by |omega| (fast = hot orange, slow = cool blue) using Attribute-to-Colour via a Color Ramp on the omega NamedAttribute read back after the Simulation Zone.",
    ],
    troubleshooting: [
      {
        symptom: "All bobs remain stationary after baking",
        cause:
          "INIT_AMP is too close to 0, or the theta attribute was not initialised correctly before baking.",
        fix: "Open the Spreadsheet (Vertex domain) and verify `theta` shows non-zero values after running blueprint.py. If all zero, re-run blueprint.py. Note: the GN tree reads theta AFTER the Simulation Zone reads the attribute — if you edit theta after baking, delete the bake cache and re-bake.",
      },
      {
        symptom: "Simulation explodes (bobs fly to ∞) within first 10 frames",
        cause:
          "Stability criterion violated: DT × Ω₀ = (1/24) × 6.26 ≈ 0.26, well within the stability margin (< 2) for symplectic Euler. However DRIVE_AMP = 0.15 on the resonance boundary is sensitive: if DT is accidentally set to 1.0 (frames, not seconds), the step is 40× too large.",
        fix: "Confirm `DT = 1.0/24.0` in blueprint.py (seconds, not frames). Also confirm `GeometryNodeInputSceneTime` feeds `Seconds`, not `Frame`. If using Frame, divide by 24 before the frequency multiplication.",
      },
      {
        symptom: "SampleIndex returns wrong values at boundaries",
        cause:
          "The SampleIndex node's Clamp property is set to True, wrapping the index to valid range — so index −1 reads i=0 and index N reads i=N-1. This creates periodic boundary conditions instead of fixed.",
        fix: "In the SampleIndex node, set `node.clamp = False` in Python (or uncheck Clamp in the node editor). The default in Blender 5.1 is False; only set it explicitly to avoid ambiguity.",
      },
      {
        symptom: "Mathieu driving has no visible effect",
        cause:
          "DRIVE_FREQ is slightly off the resonance frequency. For a 0.3 Hz error, it takes 500+ frames to see growth. Another cause: DRIVE_AMP too small (< 0.02).",
        fix: "Verify DRIVE_FREQ = sqrt(G_ACC / L) / (2π). With G_ACC=9.81, L=0.25: DRIVE_FREQ ≈ 0.9965 Hz. A mismatch of 5 % pushes the system outside the first instability tongue.",
      },
    ],
  },
  data,
);
