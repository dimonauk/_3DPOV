export default function ReactionDiffusionAndTpms() {
  return (
    <>
      <p>
        Two mathematical traditions, both about the same problem: where
        does shape come from? <strong>Reaction-diffusion</strong> is the
        chemistry of pattern &mdash; spots, stripes, spirals, the
        leopard&rsquo;s coat and the zebrafish&rsquo;s flank &mdash;
        emerging from two substances that diffuse and react on a plain
        flat sheet. <strong>Triply periodic minimal surfaces</strong>{" "}
        are the geometry of pattern &mdash; the gyroid, the Schwarz P,
        the Schwarz D &mdash; the shapes a soap film would take if you
        forced it to repeat in three directions forever. The first is a
        partial differential equation that paints. The second is a
        variational problem whose solutions sculpt. The studio uses both,
        often in the same piece.<sup>1</sup>
      </p>

      <hr className="my-12 border-warm-black-800" />

      <h2 className="text-2xl font-serif text-chrome-100">
        Part 1 &mdash; Reaction-diffusion (Turing patterns)
      </h2>

      <p>
        <strong>Turing&rsquo;s 1952 paper.</strong> Alan Turing&rsquo;s{" "}
        <em>The Chemical Basis of Morphogenesis</em>, published in{" "}
        <em>Philosophical Transactions B</em>, asks how a uniform blob
        of cells decides where the spots go. His answer is two
        substances &mdash; he calls them morphogens &mdash; one of
        which catalyses both itself and its inhibitor, while the
        inhibitor diffuses faster. The fast inhibitor sweeps the
        neighbourhood clean; the slow activator builds up locally; the
        result is islands of activator surrounded by moats of
        inhibitor. The leopard gets its spots from the same equation
        that gives the fingerprints their ridges.<sup>2</sup>
      </p>

      <p>
        <strong>The Gray-Scott model.</strong> The cleanest modern
        reaction-diffusion system, and the one the studio&rsquo;s
        visualiser at{" "}
        <a
          href="/visualiser/reaction-diffusion"
          className="text-pink-200 underline underline-offset-4"
        >
          /visualiser/reaction-diffusion
        </a>{" "}
        evolves, is Gray-Scott. Two concentrations, <em>u</em> and{" "}
        <em>v</em>, live on a 2D grid and follow:
      </p>
      <p>
        <code className="font-mono text-chrome-200">
          &part;u/&part;t = D&#7512; &nabla;&sup2; u &minus; u v&sup2; + F (1 &minus; u)
        </code>
      </p>
      <p>
        <code className="font-mono text-chrome-200">
          &part;v/&part;t = D&#7515; &nabla;&sup2; v + u v&sup2; &minus; (F + k) v
        </code>
      </p>
      <p>
        <em>u</em> is the substrate, <em>v</em> is the activator. They
        both diffuse (the <code className="font-mono text-chrome-200">
          &nabla;&sup2;
        </code>{" "}
        terms), <em>v</em> consumes <em>u</em> in the reaction term{" "}
        <code className="font-mono text-chrome-200">u v&sup2;</code>,{" "}
        <em>u</em> is fed back in at rate <code className="font-mono text-chrome-200">F</code>{" "}
        (the feed rate), and <em>v</em> decays at rate{" "}
        <code className="font-mono text-chrome-200">F + k</code> (the
        kill rate). The whole pattern atlas comes down to two
        parameters: <code className="font-mono text-chrome-200">F</code>{" "}
        and <code className="font-mono text-chrome-200">k</code>.<sup>3</sup>
      </p>

      <p>
        <strong>Parameter regimes.</strong> John Pearson&rsquo;s 1993
        paper in <em>Science</em> walked the (F, k) plane and named
        twelve qualitatively distinct steady states. Move a tenth of a
        percent in F and a previously stable spotted pattern starts
        breathing; a tenth in the other direction and it shatters into
        chaos.
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Spots</strong> &mdash; around{" "}
          <code className="font-mono text-chrome-200">F &asymp; 0.035</code>,{" "}
          <code className="font-mono text-chrome-200">k &asymp; 0.065</code>.
          Stable circular islands of <em>v</em>.
        </li>
        <li>
          <strong>Stripes</strong> &mdash; around{" "}
          <code className="font-mono text-chrome-200">F &asymp; 0.029</code>,{" "}
          <code className="font-mono text-chrome-200">k &asymp; 0.057</code>.
          Parallel ridges, often with branching defects.
        </li>
        <li>
          <strong>Spirals</strong> &mdash; lower F and k. Rotating wave
          fronts that organise the field into Belousov-Zhabotinsky-like
          swirls.
        </li>
        <li>
          <strong>Mitosis</strong> &mdash; spots that divide. The pattern
          is never still.
        </li>
        <li>
          <strong>Chaos</strong> &mdash; no steady state. The field
          twitches forever.
        </li>
      </ul>

      <p>
        <strong>Linear stability &mdash; the counter-intuitive bit.</strong>{" "}
        Diffusion, in isolation, smooths everything. Heat a metal bar in
        the middle and the temperature spike spreads and flattens; that
        is what diffusion is for. So <em>why</em> does diffusion
        <em>plus</em> reaction produce structure rather than soup?
      </p>
      <p>
        Linearise the system around its uniform steady state and look at
        the spatial Fourier modes. A small perturbation at wavenumber{" "}
        <code className="font-mono text-chrome-200">q</code> grows or
        decays at a rate determined by the Jacobian of the reaction
        terms plus the diffusion damping{" "}
        <code className="font-mono text-chrome-200">&minus; D q&sup2;</code>.
        Without diffusion the uniform state is stable: the reaction
        Jacobian has eigenvalues with negative real parts. <em>Add</em>{" "}
        unequal diffusion &mdash; the inhibitor diffusing faster than
        the activator &mdash; and a band of intermediate wavenumbers
        finds its eigenvalues flipping positive. The fastest-growing
        wavenumber{" "}
        <code className="font-mono text-chrome-200">q*</code> sets the
        characteristic spacing of the resulting pattern. This is{" "}
        <strong>diffusion-driven instability</strong>: smoothing on
        different length scales destabilises rather than calms. Turing
        spotted it before anyone had a computer to plot it.<sup>4</sup>
      </p>

      <p>
        <strong>Numerical solver.</strong> Discretise the Laplacian by
        finite difference on a square grid of spacing{" "}
        <code className="font-mono text-chrome-200">h</code>:
      </p>
      <p>
        <code className="font-mono text-chrome-200">
          &nabla;&sup2; u (i, j) &asymp; [u(i+1,j) + u(i-1,j) + u(i,j+1) + u(i,j-1) &minus; 4 u(i,j)] / h&sup2;
        </code>
      </p>
      <p>
        Explicit Euler timesteps with step{" "}
        <code className="font-mono text-chrome-200">&Delta;t</code>. The
        scheme is stable as long as the diffusion CFL condition holds:{" "}
        <code className="font-mono text-chrome-200">
          &Delta;t &le; h&sup2; / (4 D&#7512;)
        </code>{" "}
        in 2D. Push past it and the grid will spit{" "}
        <code className="font-mono text-chrome-200">NaN</code> at you
        within a handful of steps. On GPU the whole update is one
        compute pass per timestep; the studio&rsquo;s visualiser
        ping-pongs between two textures, reading the previous state and
        writing the next, dispatching one workgroup per tile of the
        grid.<sup>5</sup>
      </p>

      <p>
        <strong>A worked four-pixel evolution.</strong> Start with a
        2&times;2 patch holding{" "}
        <code className="font-mono text-chrome-200">
          u = [[1.0, 1.0], [1.0, 0.5]]
        </code>
        ,{" "}
        <code className="font-mono text-chrome-200">
          v = [[0.0, 0.0], [0.0, 0.25]]
        </code>{" "}
        (a single seed of activator in the bottom-right). Use{" "}
        <code className="font-mono text-chrome-200">D&#7512; = 0.16</code>,{" "}
        <code className="font-mono text-chrome-200">D&#7515; = 0.08</code>,{" "}
        <code className="font-mono text-chrome-200">F = 0.035</code>,{" "}
        <code className="font-mono text-chrome-200">k = 0.065</code>,{" "}
        <code className="font-mono text-chrome-200">&Delta;t = 1</code>,{" "}
        <code className="font-mono text-chrome-200">h = 1</code>, periodic
        boundaries. After three explicit-Euler steps the seed has
        spread into all four cells of <em>v</em> at decreasing
        concentrations and dented <em>u</em> in the corresponding
        positions. By a few hundred steps a single Gaussian-shaped spot
        will have formed; by a few thousand the spot will have spawned
        neighbours; by tens of thousands the grid will hold the
        characteristic island pattern Pearson catalogued. The point of
        running the four-pixel case by hand is that the entire
        ten-thousand-step simulation is the same five lines of
        arithmetic, applied a billion times.
      </p>

      <p>
        <strong>Where it lives in Holoflow.</strong> The visualiser
        chamber at{" "}
        <a
          href="/visualiser/reaction-diffusion"
          className="text-pink-200 underline underline-offset-4"
        >
          /visualiser/reaction-diffusion
        </a>{" "}
        runs a Gray-Scott field on a GPU texture, parameter sliders
        wired straight to <code className="font-mono text-chrome-200">F</code>{" "}
        and <code className="font-mono text-chrome-200">k</code> so the
        visitor can wander the Pearson atlas in real time. The planned
        <strong> Turing genome</strong> in the 28-gene alphabet (see the
        synthesis note on the gene alphabet) will use the same
        equations as a structural-type template: spotted and striped
        sculpture surfaces parametrised by the same two numbers.
      </p>

      <hr className="my-12 border-warm-black-800" />

      <h2 className="text-2xl font-serif text-chrome-100">
        Part 2 &mdash; Triply Periodic Minimal Surfaces (TPMS)
      </h2>

      <p>
        <strong>What &ldquo;minimal&rdquo; means here.</strong> A surface
        is minimal if its <em>mean curvature</em> is zero at every
        point. Mean curvature is the average of the two principal
        curvatures; setting it to zero means the surface bends the same
        amount one way as the other at every point. The physical
        intuition is the soap film: stretch a wire loop, dip it in soapy
        water, lift it out, and the film that spans the loop is the
        surface of least area for that boundary. Surface tension is
        constant across the film, so equilibrium demands zero net
        curvature pressure, which means zero mean curvature.<sup>6</sup>
      </p>

      <p>
        <strong>The calculus of variations setup.</strong> Among all
        surfaces with a given boundary, the minimal one is a critical
        point of the area functional{" "}
        <code className="font-mono text-chrome-200">A[S] = &int;&int;<sub>S</sub> dA</code>.
        Vary the surface infinitesimally and demand{" "}
        <code className="font-mono text-chrome-200">&delta;A = 0</code>;
        the Euler-Lagrange equation that falls out is{" "}
        <code className="font-mono text-chrome-200">H = 0</code>. For
        surfaces written implicitly as the level set{" "}
        <code className="font-mono text-chrome-200">F(x, y, z) = 0</code>,
        the mean-curvature condition becomes a nonlinear PDE in F. The
        difficulty isn&rsquo;t writing the PDE; it&rsquo;s finding
        solutions that are <em>periodic</em> in three independent
        directions.
      </p>

      <p>
        <strong>The classical families.</strong> Hermann Schwarz, in the
        1880s, found the first triply periodic minimal surfaces by
        solving Plateau&rsquo;s problem on cubic skeletons:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Schwarz P (primitive)</strong> &mdash;{" "}
          <code className="font-mono text-chrome-200">
            cos(x) + cos(y) + cos(z) = 0
          </code>{" "}
          as a good trigonometric approximation. Cubic symmetry, looks
          like a structure of bulbs joined by tubes along the x, y, z
          axes.
        </li>
        <li>
          <strong>Schwarz D (diamond)</strong> &mdash;{" "}
          <code className="font-mono text-chrome-200">
            sin(x) sin(y) sin(z) + sin(x) cos(y) cos(z) + cos(x) sin(y) cos(z) + cos(x) cos(y) sin(z) = 0
          </code>
          . Diamond-cubic symmetry; the tubes meet at tetrahedral angles.
        </li>
        <li>
          <strong>Gyroid (G)</strong> &mdash; Alan Schoen, working at
          NASA&rsquo;s Electronics Research Center, identified in 1970
          as part of a search for new triply-periodic minimal surfaces
          with applications to lightweight aerospace structures. The
          gyroid is the only one of his seventeen new surfaces that
          contains no straight lines and no plane symmetries.
        </li>
      </ul>

      <p>
        <strong>The gyroid implicit equation.</strong> The standard
        trigonometric approximation, used everywhere from photonics
        papers to FDM slicers, is:
      </p>
      <p>
        <code className="font-mono text-chrome-200">
          sin(x) cos(y) + sin(y) cos(z) + sin(z) cos(x) = 0
        </code>
      </p>
      <p>
        Cheap to evaluate, periodic with period{" "}
        <code className="font-mono text-chrome-200">2&pi;</code> in all
        three axes, no straight lines, no reflection symmetries &mdash;
        only screw rotations and inversions. Karcher and Polthier&rsquo;s
        1996 paper{" "}
        <em>Construction of Triply Periodic Minimal Surfaces</em>{" "}
        showed the trigonometric form is not literally minimal (the mean
        curvature is small but nonzero); the genuine gyroid is given by a
        Weierstrass representation involving elliptic integrals. For
        every engineering purpose the studio cares about, the
        trigonometric form is indistinguishable from the real thing.
      </p>

      <p>
        <strong>The implicit evaluated at sample points.</strong> Let{" "}
        <code className="font-mono text-chrome-200">
          G(x, y, z) = sin(x) cos(y) + sin(y) cos(z) + sin(z) cos(x)
        </code>
        . A handful of samples to ground the equation:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <code className="font-mono text-chrome-200">G(0, 0, 0) = 0</code>{" "}
          &mdash; the origin sits exactly on the surface.
        </li>
        <li>
          <code className="font-mono text-chrome-200">
            G(&pi;/2, 0, 0) = 1 &middot; 1 + 0 + 0 = 1
          </code>{" "}
          &mdash; outside the surface, on the solid side at level{" "}
          <code className="font-mono text-chrome-200">G &gt; 0</code>.
        </li>
        <li>
          <code className="font-mono text-chrome-200">
            G(&pi;, 0, 0) = 0 &middot; 1 + 0 + 0 = 0
          </code>{" "}
          &mdash; back on the surface.
        </li>
        <li>
          <code className="font-mono text-chrome-200">
            G(&pi;/2, &pi;/2, &pi;/2) = 1 &middot; 0 + 1 &middot; 0 + 1 &middot; 0 = 0
          </code>{" "}
          &mdash; on the surface.
        </li>
        <li>
          <code className="font-mono text-chrome-200">
            G(&pi;/4, &pi;/4, &pi;/4) &asymp; 3 &middot; (&radic;2/2)(&radic;2/2) = 1.5
          </code>{" "}
          &mdash; well inside the solid phase.
        </li>
      </ul>
      <p>
        A regular sample of <code className="font-mono text-chrome-200">
          G
        </code>{" "}
        on a 256&sup3; grid, followed by{" "}
        <a
          href="/codex/marching-cubes"
          className="text-pink-200 underline underline-offset-4"
        >
          marching cubes
        </a>{" "}
        at <code className="font-mono text-chrome-200">G = 0</code>,
        produces a mesh of the gyroid surface ready to slice. Around
        twenty million triangles for a useful sculpture-sized cube; the
        studio&rsquo;s belt printer happily eats the result.
      </p>

      <p>
        <strong>Volume-fraction tuning.</strong> Shift the level set
        instead of zero: solve{" "}
        <code className="font-mono text-chrome-200">G(x, y, z) = &epsilon;</code>{" "}
        for some offset{" "}
        <code className="font-mono text-chrome-200">&epsilon;</code>. The
        offset surface is no longer strictly minimal &mdash; its mean
        curvature is constant rather than zero &mdash; but it remains
        smooth, periodic, and self-intersection-free for a usable range
        of <code className="font-mono text-chrome-200">&epsilon;</code>{" "}
        between roughly{" "}
        <code className="font-mono text-chrome-200">&minus;1.4</code> and{" "}
        <code className="font-mono text-chrome-200">+1.4</code>. The
        practical effect is to thicken or thin the solid phase: the
        volume fraction enclosed by{" "}
        <code className="font-mono text-chrome-200">G &lt; &epsilon;</code>{" "}
        rises smoothly from near zero at the negative end to near unity
        at the positive end, passing through exactly fifty percent at{" "}
        <code className="font-mono text-chrome-200">&epsilon; = 0</code>.
        For a printable sculpture the studio walks that fraction up to
        thirty or forty percent and gets a wall that is mostly air and
        still strong enough to hang.<sup>7</sup>
      </p>

      <p>
        <strong>Why TPMS for sculpture.</strong> Four practical reasons
        the studio keeps coming back to the family:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Surface-to-volume ratio.</strong> A gyroid wall at
          thirty percent solid fraction packs an enormous amount of
          surface into a small box. For waveguide work that surface is
          where the light bounces; for thermal work it is where heat
          exchanges; for resin work it is where the photons cure.
        </li>
        <li>
          <strong>Mechanical isotropy.</strong> Unlike rectangular
          honeycombs, the gyroid&rsquo;s lack of distinguished axes
          means it behaves the same under load in any direction. A
          gyroid lattice with the same mass as a square truss is
          stiffer in every off-axis direction and only slightly less
          stiff on-axis.
        </li>
        <li>
          <strong>Optical light-channel propagation.</strong> The two
          interpenetrating chambers of a gyroid (the two sides of the
          implicit) form a pair of three-dimensionally connected
          waveguides. The{" "}
          <a
            href="/codex/waveguide-object"
            className="text-pink-200 underline underline-offset-4"
          >
            waveguide sculpture line
          </a>{" "}
          uses one chamber as the optical core and the other as cladding;
          light entering one face emerges from another after threading a
          twisted, refracting path through the structure.
        </li>
        <li>
          <strong>Printability.</strong> No overhangs steeper than
          fifty-five degrees if the cell size is tuned to the printer.
          Self-supporting at any orientation, which means no support
          structure to clean off. A standard FDM head can run a gyroid
          wall in a single pass per layer.
        </li>
      </ul>

      <p>
        <strong>Where it lives in Holoflow.</strong> The gyroid is the
        recurring substrate. Wall-sized gyroid reliefs come off the belt
        printer at centimetre cell size; jewellery cast in metal uses
        the same surface at millimetre cell size; the planned waveguide
        sculptures use it at sub-millimetre cell size with resin and
        embedded LED feeds. The{" "}
        <code className="font-mono text-chrome-200">
          gyroid_waveguide_501.py
        </code>{" "}
        Blender 5.0.1 add-on (see the{" "}
        <code className="font-mono text-chrome-200">
          dollyos-sandbox-prototypes
        </code>{" "}
        skill for the SDF Grid pipeline) is the bench tool: sample{" "}
        <code className="font-mono text-chrome-200">G</code> into a
        voxel grid, run{" "}
        <a
          href="/codex/signed-distance-fields"
          className="text-pink-200 underline underline-offset-4"
        >
          signed-distance-field
        </a>{" "}
        offset operations, marching-cubes the result, hand the mesh to
        the slicer. The same chain runs at every scale; only the cell
        size and the printer change.
      </p>

      <hr className="my-12 border-warm-black-800" />

      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/gyroid-surfaces"
          className="text-pink-200 underline underline-offset-4"
        >
          gyroid surfaces
        </a>
        ,{" "}
        <a
          href="/codex/marching-cubes"
          className="text-pink-200 underline underline-offset-4"
        >
          marching cubes
        </a>
        ,{" "}
        <a
          href="/codex/signed-distance-fields"
          className="text-pink-200 underline underline-offset-4"
        >
          signed distance fields
        </a>
        ,{" "}
        <a
          href="/codex/numerical-optimization-essentials"
          className="text-pink-200 underline underline-offset-4"
        >
          numerical optimisation essentials
        </a>
        , and the forthcoming{" "}
        <a
          href="/codex/lattice-and-printability"
          className="text-pink-200 underline underline-offset-4"
        >
          lattice and printability
        </a>{" "}
        entry. The long-form companion lives at{" "}
        <code className="font-mono text-chrome-200">
          docs/MATH-RD-AND-TPMS.md
        </code>
        .
      </p>

      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          Alan M. Turing,{" "}
          <em>The Chemical Basis of Morphogenesis</em>,
          Philosophical Transactions of the Royal Society B, 237(641),
          pp.&nbsp;37&ndash;72, 1952. The founding paper; readable in
          the original.
        </li>
        <li>
          John E. Pearson,{" "}
          <em>Complex Patterns in a Simple System</em>, Science{" "}
          261(5118), pp.&nbsp;189&ndash;192, 1993. The (F, k)
          parameter atlas that the visualiser&rsquo;s sliders walk.
        </li>
        <li>
          Alan H. Schoen,{" "}
          <em>
            Infinite Periodic Minimal Surfaces Without Self-Intersections
          </em>
          , NASA Technical Note D-5541, 1970. The gyroid&rsquo;s
          discovery paper; lists seventeen new surfaces.
        </li>
        <li>
          Hermann Karcher and Konrad Polthier,{" "}
          <em>Construction of Triply Periodic Minimal Surfaces</em>,
          Philosophical Transactions of the Royal Society A 354(1715),
          pp.&nbsp;2077&ndash;2104, 1996. The modern reference for the
          Weierstrass representation and the explicit construction.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The two are not always separate. A gyroid surface decorated
          with a Turing pattern on its boundary is a perfectly
          well-defined object, and the studio&rsquo;s waveguide line
          treats reaction-diffusion as the surface-texture algorithm
          and TPMS as the bulk-geometry algorithm. The bulk supplies the
          lightpath; the surface supplies the variation. Two layers, one
          object.
        </li>
        <li>
          The 1952 paper sat largely unread for thirty years. Computers
          large enough to run the equations didn&rsquo;t exist; biologists
          who could test the predictions in real embryos didn&rsquo;t
          have the maths. The revival began with James Murray&rsquo;s
          textbook treatment in the 1980s and the slow accumulation of
          experimental systems (Belousov-Zhabotinsky, the
          chlorite-iodide-malonic-acid reaction) where stripes and spots
          actually showed up where Turing said they would.
        </li>
        <li>
          The Gray-Scott model isn&rsquo;t the only reaction-diffusion
          system; FitzHugh-Nagumo, Brusselator, and Schnakenberg are the
          others worth knowing. Gray-Scott wins for studio purposes
          because its parameter space is two-dimensional and its
          patterns are visually distinctive at every point in it.
        </li>
        <li>
          The textbook account often introduces the instability via a
          dispersion relation: a plot of growth rate{" "}
          <code className="font-mono text-chrome-200">&sigma;(q)</code>{" "}
          against wavenumber{" "}
          <code className="font-mono text-chrome-200">q</code>. Without
          unequal diffusion the curve sits entirely below the axis;
          with unequal diffusion a bump rises above the axis, peaking
          at{" "}
          <code className="font-mono text-chrome-200">q*</code>. The
          location of that peak is the spacing of the pattern that
          forms; the height is the rate at which it forms. Linear
          stability won&rsquo;t tell you what pattern wins &mdash; that
          is a nonlinear question &mdash; but it tells you whether any
          pattern forms at all and roughly how big it will be.
        </li>
        <li>
          The CFL constraint becomes the gating factor on resolution.
          Halve the grid spacing and the maximum stable timestep
          quarters; the cost-to-evolve scales as resolution to the
          fourth power in 2D, fifth in 3D. For a 1024&times;1024 field
          this is still real-time on a modern GPU; for a 4096&sup3;
          field it is overnight on a workstation. Implicit-Euler and
          semi-implicit methods relax the constraint at the cost of
          per-step complexity; the studio sticks to explicit because
          the visualiser wants interactive sliders.
        </li>
        <li>
          The terminology trips people up. <em>Mean</em> curvature is
          the average of the two principal curvatures; <em>Gaussian</em>{" "}
          curvature is their product. A minimal surface has zero mean
          curvature and (generally) negative Gaussian curvature &mdash;
          every point is a saddle. A sphere has nonzero mean curvature
          and positive Gaussian curvature; a plane has zero of both. The
          gyroid is locally saddle-shaped everywhere, which is what
          makes the eye read it as &ldquo;organic&rdquo;: nothing in it
          is flat and nothing in it bulges.
        </li>
        <li>
          The volume-fraction map is not linear. Around{" "}
          <code className="font-mono text-chrome-200">&epsilon; = 0</code>{" "}
          the relationship is roughly linear, but near the extremes it
          saturates; pushing{" "}
          <code className="font-mono text-chrome-200">&epsilon;</code>{" "}
          past about{" "}
          <code className="font-mono text-chrome-200">&plusmn;1.4</code>{" "}
          collapses the structure to disconnected blobs or air pockets.
          For each offset the studio tabulates the fraction empirically
          rather than trusting an analytic approximation.
        </li>
      </ol>
    </>
  );
}
