import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python numpy — ABC Flow: Arnold-Beltrami-Childress Force-Free Field, RK4 Chaotic Streamlines & Three-Poi Light Brush for WebXR (Blender 5.1)",
  lede: "Build the ABC (Arnold-Beltrami-Childress) flow — a triply-periodic Beltrami field where ∇×u = u and which solves the Euler equations exactly at any Reynolds number — using parameters (√3, √2, 1) that produce Lagrangian chaos; trace 54 RK4 streamlines through its tangled invariant tori and chaotic seas; bevel each trajectory into a glowing tube; export a three-colour poi light-brush GLB for WebXR.",
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Arnold, V.I. (1965) — 'Sur la topologie des écoulements stationnaires des fluides parfaits.' Comptes Rendus 261:17–20",
      url: "https://mathscinet.ams.org/mathscinet/article?mr=0192026",
      licence: "Public Domain",
      author: "Vladimir Arnold",
    },
    {
      label:
        "Dombre, T., Frisch, U., Greene, J.M., Hénon, M., Mehr, A. & Soward, A.M. (1986) — 'Chaotic streamlines in the ABC flows.' J. Fluid Mech. 167:353–391",
      url: "https://doi.org/10.1017/S0022112086002859",
      licence: "Public Domain mathematical content",
      author: "Dombre, Frisch, Greene, Hénon, Mehr, Soward",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>What is a Beltrami field?</h2>
      <p>
        A Beltrami field is a vector field whose curl is parallel to itself at
        every point:{" "}
        <code>∇×u = λu</code> for some scalar λ. When λ is constant and the
        field is also divergence-free (∇·u = 0), you have an{" "}
        <em>eigenstate of the curl operator</em> — a pure helical wave. The
        velocity is everywhere aligned with its own vorticity.
      </p>
      <p>
        What makes this remarkable from a fluid-dynamics perspective is that such
        a field automatically satisfies the nonlinear Euler equations as a
        <em> steady solution</em>, regardless of Reynolds number. The inertial
        term <code>u·∇u</code> vanishes identically when curl(u) is parallel to
        u and the pressure is chosen to absorb the remaining gradient — so
        Beltrami fields are <em>exact</em> inviscid solutions, not
        approximations. Arnold noted this in 1965; the class is sometimes called{" "}
        <em>trkalian flows</em> after Trkal (1919), who found them independently.
      </p>

      <h2>The ABC flow</h2>
      <p>
        The Arnold-Beltrami-Childress flow is the simplest non-trivial Beltrami
        field with three-dimensional periodicity:
      </p>
      <pre>{`ẋ = A sin z + C cos y
ẏ = B sin x + A cos z
ż = C sin y + B cos x`}</pre>
      <p>
        in the domain [0, 2π]³ with periodic boundary conditions. The divergence
        is identically zero. Verifying the Beltrami condition takes three lines
        of curl arithmetic; the result is ∇×u = u for all (A, B, C).
      </p>
      <p>
        The flow was studied by Arnol&apos;d (1965) as a topological curiosity —
        do steady flows exist whose streamlines fill three-dimensional regions
        densely rather than lying on surfaces? For A=B=C=1 the answer is mostly{" "}
        <em>no</em>: the streamlines lie on nested tori, an integrable structure.
        Childress (1970) noted that the same form works as a kinematic magnetic
        dynamo. Dombre et al. (1986) mapped the full phase portrait with a
        Poincaré section and found that for{" "}
        <strong>A=√3, B=√2, C=1</strong> (the &ldquo;standard chaotic&rdquo;
        parameters chosen because these three irrationals prevent resonant
        cancellations between the three frequency modes) there is a large
        chaotic sea interspersed with isolated KAM tori near the coordinate
        axes.
      </p>

      <h2>Lagrangian chaos in a steady smooth flow</h2>
      <p>
        The phrase &ldquo;chaotic streamlines in a steady flow&rdquo; sounds
        paradoxical. Isn&apos;t a streamline of a steady flow a fixed curve in
        space? The subtlety is that the streamlines of a three-dimensional steady
        flow are governed by a three-degree-of-freedom Hamiltonian system — and
        such systems can be non-integrable, producing exponentially-diverging
        trajectories without any time-dependence in the field itself.
      </p>
      <p>
        In the ABC case, the maximal Lyapunov exponent for the standard
        parameters is λ ≈ 0.13 per time unit. Two particle paths starting 10⁻⁶
        apart will differ by order unity after roughly{" "}
        <code>ln(10⁶)/0.13 ≈ 106</code> time units — a finite, computable
        divergence time. This is what makes ABC flows relevant to the{" "}
        <em>fast dynamo problem</em>: a weak seed magnetic field advected by an
        ABC velocity grows as e^(λt), bypassing the slow Ohmic diffusion that
        would otherwise destroy it.
      </p>

      <h2>RK4 and why it matters here</h2>
      <p>
        The ABC velocity field is smooth (C^∞) and bounded. Its streamlines have
        no sharp features, so the numerical question is purely about long-time
        accuracy.
      </p>
      <p>
        <strong>Euler method</strong> is O(h) — after N=3000 steps at h=0.04,
        the global error is O(0.04), enough to place a trajectory on the wrong
        KAM torus. The chaotic and quasi-periodic regions are nearby in phase
        space; Euler blurs the boundary.
      </p>
      <p>
        <strong>RK4</strong> is O(h⁴) — global error O(h⁴) ≈ 2.56×10⁻⁷ at
        h=0.04. The four-stage rule evaluates the velocity four times per step
        but the accuracy gain is three orders of magnitude over Euler. This is
        worth the cost: the resulting curves genuinely separate KAM tori (which
        close back on themselves) from chaotic orbits (which never do).
      </p>
      <p>
        We integrate in <em>unwrapped</em> ℝ³ coordinates — adding the
        increment at each step rather than wrapping mod 2π. This avoids
        discontinuities in the rendered curve geometry (a wrapped orbit would
        teleport across the cell boundary). At render time we wrap the position
        for the velocity evaluation but accumulate the displacement; the visual
        result uses <code>pos % (2π)</code> remapped to Blender metres.
      </p>

      <h2>Three seed circles and colour groups</h2>
      <p>
        A single random cloud of 54 seeds would cluster in the chaotic sea and
        miss the tori entirely. Instead we place three small circles of 18
        seeds each, centred near (π/2, π/2, π/2) — the most symmetric point in
        the domain — but lying in the three coordinate planes:
      </p>
      <ul>
        <li>
          <strong>Group 0 (cyan)</strong> — circle in the y-z plane. Seeds near
          the x-axis axis of symmetry of the A-coefficient terms; these mostly
          land on KAM tori and produce closed or quasi-closed loops.
        </li>
        <li>
          <strong>Group 1 (magenta)</strong> — circle in the x-z plane. Seeds
          near the y-axis; mix of tori and chaotic orbits.
        </li>
        <li>
          <strong>Group 2 (gold)</strong> — circle in the x-y plane. Seeds near
          the z-axis; mostly chaotic, giving the most tangled bundle.
        </li>
      </ul>
      <p>
        The three colours represent the three geometric symmetries of the ABC
        field: the field is invariant under cyclic permutation of (x, y, z) with
        simultaneous cyclic permutation of (A, B, C) — so each seed group
        samples a different &ldquo;flavour&rdquo; of the phase portrait.
      </p>

      <h2>POLY curves and bevel tubes</h2>
      <p>
        Blender&apos;s POLY spline type stores vertices at exact positions with
        no smoothing — the right choice here because the ABC trajectories already
        have sub-millimetre smoothness at h=0.04 after subsampling every third
        point. Using NURBS would impose additional smoothing that would
        misrepresent the KAM structure near the tori.
      </p>
      <p>
        Each spline gets a <code>bevel_depth = 0.0025</code> m (2.5 mm) and
        <code>bevel_resolution = 5</code> circular subdivisions. At 1 000 points
        per curve × 54 curves × 5 bevel verts, the total vertex count is roughly
        270 000 — well within EEVEE Next&apos;s bloom-capable real-time budget.
      </p>

      <h2>Emission shader and bloom</h2>
      <p>
        Each group uses a flat emission node (no diffuse, no specular). The
        emission strength is set to 3.5, which with EEVEE Next&apos;s bloom
        threshold at 0.8 produces a soft corona around each tube. The black
        world background (strength 0.0) means only the emissive tubes contribute
        to the render — the poi light-brush aesthetic where the geometry{" "}
        <em>is</em> the light.
      </p>
      <p>
        For WebXR export the bloom is baked into the vertex colours via the GLB
        emission factor; viewer-side bloom is optional and depends on the XR
        renderer&apos;s post-processing stack.
      </p>

      <h2>Step-by-step</h2>
      <ol>
        <li>
          Open Blender 5.1. Switch to the <strong>Scripting</strong> workspace.
          Open <code>blueprint.py</code>.
        </li>
        <li>
          Press <strong>Run Script</strong> (▶). The Python console will show
          progress lines as each of the 54 streamlines is integrated. Expect
          30–60 s on a modern CPU (the inner loop is pure Python; numpy
          vectorises the velocity evaluation but the RK4 loop itself is
          sequential).
        </li>
        <li>
          Once complete, switch to <strong>Layout</strong>. Press{" "}
          <kbd>Numpad 5</kbd> to toggle orthographic/perspective, then orbit
          with middle-mouse to inspect the tangle from several angles.
        </li>
        <li>
          Switch the viewport shading to <strong>Rendered</strong> (EEVEE Next)
          to see the emission glow. The bloom may take a few frames to stabilise.
        </li>
        <li>
          To export the GLB manually:{" "}
          <strong>File → Export → glTF 2.0</strong>. Ensure &ldquo;Apply
          Transforms&rdquo; and &ldquo;Draco Mesh Compression Level 6&rdquo;
          are enabled. The script does this automatically but manual export lets
          you tune the compression level.
        </li>
        <li>
          Run <code>record.py</code> separately (in a fresh Blender instance) to
          generate <code>viewport.mp4</code>.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>All curves look the same (no tori visible)</strong> — this
          happens when <code>SEED_RADIUS</code> is too large and all seeds land
          in the chaotic sea. Reduce it to 0.15 or seed from (π/2, 0, 0)
          directly for the clearest torus bundle.
        </li>
        <li>
          <strong>Bloom not visible</strong> — enable{" "}
          <code>scene.eevee.use_bloom</code> in the script or in{" "}
          <strong>Properties → Render → Bloom</strong>. Blender 5.1 may need
          the &ldquo;Legacy Bloom&rdquo; toggle depending on the EEVEE Next
          build.
        </li>
        <li>
          <strong>GLB export fails with &ldquo;no mesh data&rdquo;</strong> —
          curve objects are converted to mesh on export by Blender&apos;s GLB
          exporter. If the conversion fails, manually convert with{" "}
          <kbd>Ctrl+Alt+C</kbd> first.
        </li>
        <li>
          <strong>Trajectories look choppy</strong> — increase <code>N_STEPS</code>{" "}
          or decrease <code>DT</code>. At DT=0.02 the curves are imperceptibly
          smooth; at DT=0.08 some kinks appear near the chaotic tangles.
        </li>
      </ul>

      <h2>Variations</h2>
      <ul>
        <li>
          Set A=B=C=1 for the <em>integrable</em> ABC flow — all streamlines lie
          on tori and produce a clean nested-tube sculpture.
        </li>
        <li>
          Set C=0 to get the 2-D Taylor-Green vortex — the ABC field collapses
          to a purely 2-D velocity in the x-y plane.
        </li>
        <li>
          Colour by elapsed arc-length rather than by group to highlight which
          sections of each trajectory are in fast-moving regions (large |u|) vs
          slow-moving saddle points.
        </li>
        <li>
          Use <code>bpy.data.curves</code> taper instead of constant bevel to
          make each tube thinner near the end — a poi trail that fades out.
        </li>
      </ul>

      <h2>Related studio work</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-curl-noise-incompressible-rk4-fluid-poi-light-trail-webxr"
            className={lk}
          >
            Curl Noise: Incompressible Vector Potential & RK4 Poi Trail
          </Link>{" "}
          — also uses RK4 streamline tracing through a divergence-free field;
          curl noise is stochastic while ABC is deterministic and periodic
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr"
            className={lk}
          >
            Halvorsen Attractor: Z₃-Symmetric Strange Attractor
          </Link>{" "}
          — three-fold orbit symmetry mirrors the ABC field&apos;s cyclic
          (A,B,C) permutation symmetry; Halvorsen is dissipative while ABC is
          Hamiltonian / volume-preserving
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
            className={lk}
          >
            Lorenz Attractor: Strange Attractor Poi Light Painting
          </Link>{" "}
          — the Lorenz system is also a steady ODE whose orbits fill a 3-D
          region, but it is dissipative (phase volume shrinks); ABC is
          conservative (phase volume preserved by Liouville&apos;s theorem)
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius Transformation Gallery: PSL(2,ℂ) Conformal Maps
          </Link>{" "}
          — Arnold also contributed to the classification of Möbius
          transformations; both tutorials sit in the Arnold mathematical canon
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  Body,
  slug: "blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr",
  libraryPath:
    "blends/scripting/python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr",
});
