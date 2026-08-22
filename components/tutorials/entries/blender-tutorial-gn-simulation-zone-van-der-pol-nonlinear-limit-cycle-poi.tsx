import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Balthasar van der Pol built triode vacuum-tube oscillators in 1926 and
        noticed that, regardless of how hard he drove them or how gently he
        started them, they always settled into the same periodic waveform. He
        wrote down the equation that explained why:
      </p>
      <pre>{`ẍ − μ(1 − x²)ẋ + x = 0`}</pre>
      <p>
        The term μ(1 − x²)ẋ is the key. When the displacement |x| is small —
        inside the unit circle in phase space — the factor (1 − x²) is positive,
        so the coefficient of ẋ is negative: the system behaves as a{" "}
        <em>negative-damping</em> oscillator that pumps energy in, amplifying
        small oscillations. When |x| exceeds 1, the factor reverses sign and the
        term dissipates energy, clipping large amplitudes. The exact{" "}
        <em>balance</em> of these two regimes creates a{" "}
        <strong>stable limit cycle</strong> of amplitude ≈ 2 in the phase plane,
        approached asymptotically from any non-zero initial condition — from
        inside (growing) or outside (decaying). The limit cycle is born at μ = 0
        via a <em>Hopf bifurcation</em>: for μ = 0 the system is a pure harmonic
        oscillator with a neutrally-stable circular orbit; as μ increases above
        zero the orbit becomes attracting and the amplitude of the stable cycle
        locks in at ≈ 2.
      </p>
      <p>
        This blueprint implements the Van der Pol equation on a 40 × 40 vertex
        grid inside a Blender 5.1 Geometry Nodes Simulation Zone. Each vertex
        carries displacement <code>vdp_x</code> and velocity <code>vdp_v</code>{" "}
        as FLOAT attributes. Each frame, the Sim Zone advances them by one
        explicit Euler step using the Van der Pol RHS, then{" "}
        <code>BlurAttribute</code> couples neighbouring oscillators (Huygens
        entrainment), and <code>SetPosition</code> lifts Z by{" "}
        <code>vdp_x × Z_SCALE</code> so the oscillation is visible as a rolling
        3-D surface — red hills (positive), white nodes (zero-crossing), blue
        valleys (negative). The coupling mechanism is exactly the Huygens
        observation from 1665: two pendulum clocks on a shared wall synchronise
        because mechanical vibration travels through the beam. Here, BlurAttribute
        diffuses <code>vdp_x</code> toward its 4-neighbour mean each frame —
        that diffusion flux <em>is</em> the shared wall.
      </p>

      <h2>Hopf bifurcation and the phase portrait</h2>
      <p>
        Set μ = 0 in the blueprint and run the simulation: every oscillator
        traces a perfect circle in the (x, v) phase plane. The amplitude of the
        circle equals whatever the random initial conditions happened to place it
        at — the orbits are neutrally stable (all amplitudes equally valid). Now
        increase μ to 0.1: each orbit slowly spirals outward or inward depending
        on whether its radius is below or above 2, converging toward the limit
        cycle. At μ = 1.5 (the default) the convergence is fast and the limit
        cycle is visibly egg-shaped rather than circular — the positive-x side
        (slow phase) is wider, the negative-x return (fast phase) is sharper.
        At μ ≥ 5 the oscillator becomes a <em>relaxation oscillator</em>: it
        spends most of its time creeping along the slow manifold near |x| ≈ 2
        then snapping through a fast transition — a sawtooth waveform.
      </p>
      <p>
        The limit cycle is the poi spinner&apos;s steady rhythm. A wrist inputs
        energy at a preferred frequency; dissipation (air resistance, chain
        stretch) removes it. The balance is not at a fixed amplitude set by
        initial conditions but at an attractor defined by the oscillator&apos;s
        own physics. That is why a skilled poi performer can interrupt their
        spin, adjust their grip, and return to the same arc size without
        re-calibrating — the limit cycle pulls the motion back. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          Kuramoto tutorial
        </Link>{" "}
        explores phase synchronisation of many such oscillators; this blueprint
        shows the individual limit cycle itself, spatially coupled across 1 600
        oscillators on a lattice.
      </p>

      <h2>Explicit Euler and the stability criterion</h2>
      <p>
        The time-stepping scheme is explicit (forward) Euler, chosen for
        simplicity in the GN node tree — no implicit solve, no RungeKutta stages.
        The update is:
      </p>
      <pre>{`a  = μ(1 − x²)v − x        # Van der Pol acceleration
v' = v + DT × a              # velocity using OLD a
x' = x + DT × v              # position using OLD v (not v')`}</pre>
      <p>
        Using the OLD velocity <code>v</code> for the position update (rather
        than the just-computed <code>v&apos;</code>) avoids a half-step phase
        shift and keeps the scheme consistent to first order. The stability
        criterion for the linearised equation near the limit cycle is roughly
        DT &lt; 2 / (1 + μ). At μ = 1.5 this gives DT &lt; 0.8; the default
        DT = 0.06 is well inside the stable region. Raising DT to 0.15 gives
        faster visual convergence with still-stable dynamics. At DT = 0.5 the
        limit cycle still attracts but the trajectory noticeably deviates from
        the smooth egg shape; at DT = 1.0 the integration is unstable and the
        grid explodes.
      </p>

      <h2>Huygens coupling via BlurAttribute</h2>
      <p>
        After the local Van der Pol step computes <code>new_x</code>, a single{" "}
        <code>BlurAttribute</code> node averages <code>new_x</code> over
        edge-connected neighbours. For an interior vertex (degree 4), the output
        is the arithmetic mean of the four neighbours&apos; <code>new_x</code>{" "}
        values. The coupling update is:
      </p>
      <pre>{`coupled_x = new_x + COUPLING × (blur_x − new_x)`}</pre>
      <p>
        This is discrete diffusion: <code>blur_x − new_x</code> is the diffusion
        flux from the neighbourhood mean toward the local value. At COUPLING = 0
        every oscillator is independent. At COUPLING = 1 every oscillator
        instantly snaps to the neighbourhood mean — effectively one merged
        oscillator. At the default COUPLING = 0.12 the coupling is weak enough
        that individual oscillators maintain their local dynamics while slowly
        drifting into phase alignment. Compare this to the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-vicsek-active-matter-polar-flock"
          className={lk}
        >
          Vicsek tutorial
        </Link>
        , where BlurAttribute averages heading-angle sin/cos components — here
        it averages displacement directly, a simpler but physically distinct
        coupling mechanism.
      </p>
      <p>
        The result is three visual phases over 300 frames. Frames 1–60: each
        oscillator spirals toward its limit cycle independently — chaotic ripple,
        no spatial structure. Frames 60–160: coupling begins to matter;
        neighbouring oscillators align phase; local patches of same-phase colour
        emerge. Frames 160–300: large phase-coherent waves travel across the
        surface — rolling red hills advancing into blue troughs, the spatial
        analogue of a metronome chorus locking in.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "GN Simulation Zone — Van der Pol Oscillator: Nonlinear Limit Cycle, Hopf Bifurcation & Huygens Coupling for Poi Dynamics (Blender 5.1)",
  lede: "A 40×40 vertex grid carries displacement vdp_x and velocity vdp_v as FLOAT attributes; a Geometry Nodes Simulation Zone advances each vertex by one explicit Euler step of the Van der Pol equation ẍ = μ(1−x²)ẋ − x each frame, then BlurAttribute couples neighbouring oscillators (Huygens entrainment) and SetPosition lifts Z by vdp_x × Z_SCALE — producing propagating phase waves as 1 600 coupled nonlinear oscillators settle to their limit cycles, rendered in a blue-white-red emission colour ramp for poi-dynamics and light-painting visualisation.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi/",
  steps: [
    {
      title: "Run blueprint.py — grid, attributes, GN tree",
      body: "Open Blender 5.1 → **Scripting** workspace. Open `blueprint.py` and press **Run Script**.\n\n`purge()` clears the scene. `make_grid()` builds a 40×40 vertex mesh with explicit horizontal and vertical edges (no face — edge connectivity is what BlurAttribute uses for its neighbour graph). It creates `vdp_x` and `vdp_v` FLOAT attributes on the POINT domain via `mesh.attributes.new()` and seeds them with uniform random values in [−0.5, 0.5] using `foreach_set` on a pre-built `array.array('f', ...)`.\n\n`build_vdp_tree(obj)` creates the GN modifier and Simulation Zone (`GeometryNodeSimulationInput` / `Output`, `pair_with_output()`). Inside the zone: `_na(ng,'vdp_x')` and `_na(ng,'vdp_v')` read the stored attributes as live fields; the Van der Pol RHS is assembled from four `Math` nodes (`MULTIPLY`, `SUBTRACT`); `_blur(ng, new_x, 1)` provides the 4-neighbour mean; the Huygens coupling formula computes `coupled_x`; `_store` writes updated attributes; `_setpos` lifts Z.\n\nOutside the Sim Zone, `_maprange(ng, x_post, -AMP_MAX, AMP_MAX)` maps `vdp_x` to [0,1] and stores it as `x_01`, which the emission material reads via a `Shader Attribute` node.\n\nSwitch to **Rendered** shading (EEVEE Next). The grid appears flat and blue — all displacements near zero.",
    },
    {
      title: "Press Space and watch the three phases",
      body: "Press **Space** in the Timeline. The Simulation Zone runs one frame at a time.\n\n**Frames 1–60 (independent transients)**: Each oscillator spirals outward from its random start toward the limit cycle amplitude ≈ 2. Because each starts at a different (x, v), they reach the limit cycle at different phases. The surface shows rapid uncorrelated ripple — every vertex doing its own thing.\n\n**Frames 60–160 (coupling onset)**: The BlurAttribute diffusion term starts to pull neighbours toward each other's displacement values. Small patches of same-phase vertices coalesce. The ripple acquires spatial structure — local domains of red/blue alternation emerge and persist for several frames before dissolving. This is the analogue of Huygens&apos; 1665 observation: clocks on a shared wall begin to nudge each other.\n\n**Frames 160–300 (coherent wave propagation)**: Large phase-coherent domains lock in. A rolling wave of positive displacement (deep red) advances diagonally across the grid, trailed by a valley of negative displacement (deep blue). The wave speed and wavelength are set by the coupling strength and grid spacing — adjustable via `COUPLING` and `CELL`.",
    },
    {
      title: "Inspect the Sim Zone node tree",
      body: "Open the Geometry Nodes editor with `hf_vdp` selected. Locate the Simulation Zone (blue input / output pair).\n\nInside the zone, trace the Van der Pol RHS:\n1. `Named Attribute(vdp_x)` and `Named Attribute(vdp_v)` read the previous-frame state.\n2. `MULTIPLY(vdp_x, vdp_x)` → `x²`.\n3. `SUBTRACT(1.0, x²)` → `(1 − x²)`.\n4. `MULTIPLY(MU, (1−x²))` → `μ(1−x²)`, then `MULTIPLY(..., vdp_v)` → `μ(1−x²)v`.\n5. `SUBTRACT(..., vdp_x)` → acceleration `a = μ(1−x²)v − x`.\n6. `ADD(vdp_v, MULTIPLY(DT, a))` → `new_v`.\n7. `ADD(vdp_x, MULTIPLY(DT, vdp_v))` — note: OLD `vdp_v`, not `new_v` — → `new_x`. This is correct explicit Euler; using `new_v` here would give a modified Euler (symplectic) scheme with different energy properties.\n8. `Blur Attribute(new_x, Iterations=1)` → `blur_x` (4-neighbour mean).\n9. `ADD(new_x, MULTIPLY(COUPLING, SUBTRACT(blur_x, new_x)))` → `coupled_x`.\n10. Two `Store Named Attribute` nodes write `vdp_x ← coupled_x` and `vdp_v ← new_v`.\n11. `Separate XYZ → Combine XYZ(cx, cy, coupled_x × Z_SCALE)` → `Set Position`.\n\nOutside the zone: `Named Attribute(vdp_x)` reads the current-frame stored value; `Map Range(−AMP_MAX, AMP_MAX → 0, 1)` → `Store Named Attribute(x_01)`.",
    },
    {
      title: "Tune MU, COUPLING, and DT",
      body: "Edit `blueprint.py` parameters and re-run to explore the parameter space.\n\n**μ (MU)**: Increases nonlinearity. At MU = 0.2 the limit cycle is nearly circular and the approach is slow — run 500 frames to see full entrainment. At MU = 3.0 the limit cycle is strongly relaxation-oscillator-shaped — the Z displacement shows a slow-rise / fast-snap sawtooth. At MU = 6.0 the dynamics are stiff and explicit Euler requires DT ≤ 0.02 for stability.\n\n**COUPLING**: At COUPLING = 0 every oscillator is independent — no travelling waves form. At COUPLING = 0.05 weak coupling produces slowly-drifting local domains. At COUPLING = 0.25 strong coupling drives rapid phase locking — the surface develops one or two large-wavelength modes within 40 frames.\n\n**DT**: At DT = 0.10 the simulation converges faster visually (oscillators reach the limit cycle by frame 80 instead of 150) while remaining stable for MU ≤ 1.5. At DT = 0.15 the limit cycle amplitude is slightly over-predicted but the qualitative behaviour is unchanged. The relationship between DT and visual convergence speed is roughly linear.\n\n**BLUR_ITER**: Increase to 2 for a 2-hop interaction radius (up to 12 neighbours for interior vertices). Wider coupling raises the effective diffusion coefficient and produces longer-wavelength coherent structures — phase waves spanning half the grid rather than quarter-grid patches.",
    },
  ],
  finalResult:
    "A 40×40 vertex grid (1 600 points) with vdp_x and vdp_v FLOAT attributes evolving each frame via explicit Euler integration of the Van der Pol equation plus BlurAttribute Huygens coupling, inside a GN Simulation Zone. SetPosition lifts Z by vdp_x × 0.22 to visualise the oscillation as a 3-D surface. A five-stop blue→cyan→white→orange→red emission colour ramp (driven by x_01 ∈ [0,1]) maps positive displacement to red, zero to white, negative to blue. Over 300 frames at MU=1.5, the 1 600 coupled oscillators transition from independent limit-cycle approach to coherent spatial phase waves — the 3-D equivalent of Huygens entrainment. Saved as hf_vdp.blend.",
  variations: [
    "Replace the flat 40×40 grid with a cylinder mesh (40 rings × 40 radial vertices) to get closed toroidal boundary conditions. Phase waves then wrap around the surface continuously — no edge reflections — which more faithfully models a continuous medium. The topological change requires wrapping the last column of edges back to the first column in `make_grid()`.",
    "Add a second named attribute `vdp_v2` tracking a second coupled oscillator at each vertex with slightly different MU (1.6 vs 1.5). The two populations slowly drift in and out of inter-population phase lock — a spatial analogue of amplitude death, where coupling between slightly mismatched oscillators can paradoxically suppress both.",
    "Use `SetPosition` to also modulate the X position by a second attribute `vdp_x2` (from a second Sim Zone or a time-delayed read) — producing a writhing surface where each vertex traces a Lissajous figure in XZ. This is the 3-D extension of poi hyperloop patterns where both hands drive coupled planes.",
    "Replace BlurAttribute coupling with an explicit `Repeat Zone` that accumulates a weighted sum over a larger spatial kernel (e.g., Gaussian weights falling off with vertex index distance). See the Kelvin-Helmholtz tutorial for the Repeat Zone + SampleIndex pattern. This allows anisotropic coupling — stronger along rows than columns, producing directional wave propagation.",
    "Drive COUPLING with a `SceneTime.Frame / FRAME_END` ramp: start at COUPLING=0 (independent oscillators) and linearly increase to COUPLING=0.20 over 300 frames. Watch coupling spontaneously nucleate order — the wavefront of entrainment propagating inward from the boundaries as the coupling constant crosses the synchronisation threshold.",
  ],
  troubleshooting: [
    {
      symptom: "The grid stays flat — all vdp_x values remain near 0",
      cause:
        "The Simulation Zone has baked data from a prior run loaded, preventing live computation.",
      fix: "Select `hf_vdp`, open the Geometry Nodes modifier properties, expand 'Simulation' and click 'Delete Baked Data'. Then set the Timeline frame back to 1 and press Space. The Sim Zone bakes fresh data only when it runs forward from frame 1.",
    },
    {
      symptom: "vdp_x values explode to ±inf within a few frames",
      cause:
        "DT is too large for the chosen MU, violating the explicit Euler stability bound DT < 2/(1+MU).",
      fix: "Reduce DT. At MU=1.5 use DT ≤ 0.5 for safety; the default DT=0.06 is conservative. If you raised MU above 4, lower DT to 0.03 or switch to a smaller step.",
    },
    {
      symptom: "No spatial wave structure — all oscillators seem synchronised instantly",
      cause:
        "COUPLING is set too high (≥ 0.4), causing all vertices to collapse to the same displacement within 5–10 frames, eliminating spatial variation.",
      fix: "Lower COUPLING to 0.05–0.15 to allow each oscillator's individual phase to persist long enough for gradual entrainment to become visible. The travelling-wave phase requires per-vertex phase diversity in the transient.",
    },
    {
      symptom: "Colour ramp shows only a narrow band of white (zero-crossing)",
      cause:
        "AMP_MAX is set too large relative to the actual limit cycle amplitude. At MU=1.5 the limit cycle amplitude is ≈2.0; if AMP_MAX=5.0 the colour ramp maps ±5 to [0,1] so displacements of ±2 only span the middle 40% of the ramp.",
      fix: "Set AMP_MAX to 2.5 (default) or as low as 2.1 for maximum colour saturation on the settled limit cycle. The `x_01` MapRange node clamps values outside [−AMP_MAX, AMP_MAX] to 0 and 1, so peaks always show full red/blue.",
    },
  ],
  externalLinks: [
    {
      label:
        "Van der Pol Oscillator — Wikipedia (CC-BY-SA, cites original 1926 paper)",
      href: "https://en.wikipedia.org/wiki/Van_der_Pol_oscillator",
    },
    {
      label:
        "Blur Attribute — Blender Manual (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/geometry_nodes/attribute/blur_attribute.html",
    },
  ],
  relatedTutorials: [
    {
      label: "Kuramoto Oscillators — Phase Synchronisation & Emergent Coherence",
      href: "/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
    },
    {
      label:
        "Vicsek Active Matter — Self-Propelled Particles & Polar Phase Transition",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-vicsek-active-matter-polar-flock",
    },
    {
      label:
        "Reaction-Diffusion Turing — Grey-Scott Chemical Pattern Formation",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing",
    },
    {
      label: "Boid Flock — Craig Reynolds Three-Force Steering & Emergent Flocking",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-boid-flock",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-van-der-pol-nonlinear-limit-cycle-poi",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "physics",
      "oscillators",
      "light-painting",
      "nonlinear-dynamics",
    ],
    body: Body,
  },
  data,
);
