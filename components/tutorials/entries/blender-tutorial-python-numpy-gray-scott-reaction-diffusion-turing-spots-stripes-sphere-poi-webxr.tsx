import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr";

function Body() {
  return (
    <>
      <h2>Diffusion makes spots; asymmetric diffusion makes patterns</h2>
      <p>
        In 1952 Alan Turing published a paper that has almost nothing to do with
        computing. &ldquo;The Chemical Basis of Morphogenesis&rdquo; asks a deceptively
        simple question: given a developing embryo that starts as a sphere of
        identical cells, what causes some cells to become skin and others to
        become fin? His answer — diffusion-driven instability — is counterintuitive.
        Everyone&rsquo;s first guess is that diffusion <em>smooths</em> things out.
        Turing showed that when two chemical species diffuse at different rates,
        a uniform state can be linearly unstable. Small random fluctuations grow
        into spots, stripes, or mazes, depending on a handful of rate constants.
      </p>
      <p>
        This tutorial builds that instability into a Blender poi disc. The height
        field and vertex colour are computed by integrating the Gray-Scott model —
        the standard two-variable distillation of Turing&rsquo;s idea — on an 80&times;80
        periodic grid. Four shape keys walk through Pearson&rsquo;s 1993 parameter-space
        atlas: leopard spots, zebra stripes, a labyrinthine maze, and isolated
        soliton blobs. All of it runs in Blender&rsquo;s scripting workspace, zero
        add-ons, zero SciPy.
      </p>

      <h2>The Gray-Scott equations</h2>
      <p>
        Gray and Scott (1984) built a clean autocatalytic model for a continuous
        stirred-tank reactor. In the spatial (Turing) reading, U is a substrate
        fed into the system at a &ldquo;feed rate&rdquo; F, and V is an activator/inhibitor
        that autocatalyses via the reaction U + 2V → 3V:
      </p>
      <pre>{`∂U/∂t = D_u · ∇²U  −  U·V²  +  F·(1 − U)
∂V/∂t = D_v · ∇²V  +  U·V²  −  (F+k)·V`}</pre>
      <p>
        Each term has a clear physical meaning. In the U equation:
        D_u·∇²U is ordinary Fickian diffusion moving U down its concentration
        gradient; −U·V² is consumption by the autocatalytic reaction; F·(1−U) is
        the feed drip that holds U toward 1 in the absence of V. In the V
        equation: D_v·∇²V is V diffusing (more slowly); +U·V² is V being created
        autocatalytically; −(F+k)·V is V being removed — both by dilution at
        rate F and by a kill reaction at rate k.
      </p>
      <p>
        The Turing mechanism requires D_u &gt; D_v. In the studio blueprint we use
        D_u&nbsp;=&nbsp;0.16 and D_v&nbsp;=&nbsp;0.08, so the substrate diffuses twice
        as fast as the activator. The intuition: where V is high, it eats U;
        U rushes in laterally from neighbouring cells faster than V can follow;
        V is left stranded in a peak — the spot. At different (F,&thinsp;k)
        values the same mechanism produces stripes instead, because the
        wavelength Λ&nbsp;≈&nbsp;2π√(D_u/F) changes.
      </p>

      <h2>Pearson&rsquo;s parameter atlas</h2>
      <p>
        John Pearson (1993) scanned the (F,&thinsp;k) plane with the same equations
        and found at least twelve qualitatively distinct pattern classes.
        The four shape keys in this blueprint sample four corners of that atlas:
      </p>
      <pre>{`Basis        F=0.055  k=0.062  → leopard spots     (Pearson α)
SK_Stripes   F=0.060  k=0.045  → zebra stripes     (Pearson γ)
SK_Labyrinth F=0.062  k=0.061  → labyrinthine maze (Pearson ε)
SK_Solitons  F=0.025  k=0.060  → isolated solitons (Pearson μ-ish)`}</pre>
      <p>
        The &ldquo;spot&rdquo; and &ldquo;stripe&rdquo; boundary sits roughly along k&nbsp;≈&nbsp;0.055 for
        F&nbsp;∈&nbsp;[0.050,&thinsp;0.065]. Below that line V-peaks organise into
        closed rings (spots); above it they elongate into stripes. The labyrinthine
        class sits on the spot/stripe boundary — the wavelength is just right for
        connected channels but not quite long enough for clean stripes.
      </p>

      <h2>Five-point Laplacian, periodic boundary</h2>
      <p>
        The spatial Laplacian ∇²U at grid point (i,&thinsp;j) is approximated by
        the standard five-point stencil:
      </p>
      <pre>{`∇²U[i,j] ≈ U[i+1,j] + U[i-1,j] + U[i,j+1] + U[i,j-1] − 4·U[i,j]`}</pre>
      <p>
        Periodic boundary conditions wrap the grid into a torus, so indices are
        taken modulo N. In NumPy this is three lines:
      </p>
      <pre>{`lU = (np.roll(U, 1, 0) + np.roll(U, -1, 0)
    + np.roll(U, 1, 1) + np.roll(U, -1, 1) - 4.0 * U)`}</pre>
      <p>
        <code>np.roll</code> is O(N²) in time and allocation — it copies the array.
        For an 80&times;80 grid this is negligible. At N&nbsp;=&nbsp;512 you would
        switch to a view-based or Numba approach; for a poi disc 80 is plenty.
        Explicit Euler time-stepping with DT&nbsp;=&nbsp;1.0 is stable for these
        D values at this resolution; the CFL-like condition for the GS model is
        approximately DT &lt; 1/(2·D_u·N²/PHYS_SIZE²), which is satisfied here
        with substantial margin.
      </p>

      <h2>Building the mesh in Blender 5.1</h2>
      <p>
        The poi disc is a regular N&times;N quad grid on the XY plane. Coordinates
        run from −PHYS_SIZE to +PHYS_SIZE in both axes (±0.20 m, so 40 cm
        diameter — a real performance poi head is 30–50 mm but we scale
        for WebXR readability). The z coordinate is V_field&nbsp;×&nbsp;HEIGHT_SCALE
        (V-concentration lifts the disc where the inhibitor has accumulated).
      </p>
      <pre>{`xs = np.linspace(-PHYS_SIZE, PHYS_SIZE, N)
ys = np.linspace(-PHYS_SIZE, PHYS_SIZE, N)
GX, GY = np.meshgrid(xs, ys, indexing='ij')

def _verts(V_field):
    z = V_field.ravel() * HEIGHT_SCALE
    return list(zip(GX.ravel(), GY.ravel(), z))`}</pre>
      <p>
        Quad faces are wound counter-clockwise (a,&thinsp;a+1,&thinsp;a+N+1,&thinsp;a+N).
        The mesh is built with <code>me.from_pydata</code>, then each polygon
        is set <code>use_smooth&nbsp;=&nbsp;False</code> to honour the studio
        <code>holoflow:facet=True</code> convention — the faceted look reads
        as deliberate computational aesthetics, not a topology error.
      </p>

      <h2>Shape keys via foreach_set</h2>
      <p>
        For each parameter set beyond Basis, we run a fresh Gray-Scott simulation
        (same RNG seed, different F and k) and write its V-field into a new shape
        key. The key line is:
      </p>
      <pre>{`sk.data.foreach_set("co", coords)   # coords is float32 flat array length 3N²`}</pre>
      <p>
        <code>foreach_set</code> bulk-writes the coordinate array in a single C-side
        call rather than one Python assignment per vertex. On an 80&times;80 grid
        the gain is modest (6 400 vertices), but the pattern should be used
        consistently because at N&nbsp;=&nbsp;256 (65 536 vertices) the Python loop
        takes tens of seconds while <code>foreach_set</code> is instantaneous.
        Blender 5.1 stores shape-key data in float32 internally; passing float64
        silently truncates it, so we cast with <code>.astype(np.float32)</code>.
      </p>

      <h2>Vertex colour and emission</h2>
      <p>
        The <code>FLOAT_COLOR&nbsp;POINT</code> attribute <code>RD_Concentration</code>
        maps V linearly from cobalt (0.02,&thinsp;0.12,&thinsp;0.70) at V&nbsp;=&nbsp;0
        to amber (0.92,&thinsp;0.58,&thinsp;0.06) at V&nbsp;=&nbsp;1. In the
        Principled BSDF material the ShaderNodeAttribute feeds both Base&nbsp;Color
        and Emission&nbsp;Color, so spot cores glow cobalt against an amber ground
        under any lighting condition. Emission&nbsp;Strength is set to 0.28 —
        enough to read in WebXR ambient light without overpowering shadows.
      </p>
      <p>
        The <code>FLOAT_COLOR</code> type (as opposed to <code>BYTE_COLOR</code>)
        stores HDR-range values and passes through the holoflow exporter&rsquo;s
        <code>export_colors=True</code> path intact. Byte colour would clamp at 1.0
        and lose the emission headroom.
      </p>

      <h2>Failure modes to watch for</h2>
      <p>
        <strong>All-zero V field:</strong> if the V array collapses to zero during
        integration, the autocatalytic term UV² cannot restart it — the pattern
        dies. This happens when k is too large relative to F (V is removed faster
        than it is fed). The Pearson α-class parameters (Basis) are safely inside
        the stable spotted region; if you experiment outside the atlas, add a
        check that <code>V.max() &gt; 0.01</code> before writing the shape key.
      </p>
      <p>
        <strong>Checkerboard instability:</strong> at DT&nbsp;&gt;&nbsp;1.5 with
        D_u&nbsp;=&nbsp;0.16 the explicit Euler scheme becomes unstable and the
        grid develops a 1-pixel checkerboard. Reduce DT or add a second sub-step
        (half DT, two passes per frame).
      </p>
      <p>
        <strong>Identical shape keys:</strong> if two parameter sets land in the
        same Pearson class, their V-fields look the same after 3 000 steps.
        Increase N_STEPS to 6 000 or pick parameters further apart in (F,&thinsp;k).
      </p>

      <h2>Cross-references</h2>
      <h3>Within the studio</h3>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr" className={lk}>
            Mean Curvature Flow — Cotangent Laplacian
          </Link>{" "}
          — the cotangent-Laplacian on an irregular mesh is the curved-surface
          generalisation of the five-point stencil used here. Reading both
          together shows the flat-to-curved progression of the diffusion operator.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr" className={lk}>
            Differential Growth — Laplacian Smoothing
          </Link>{" "}
          — another growth-driven morphogenesis tutorial; complementary
          in that differential growth uses the graph Laplacian for smoothing
          while GS uses the grid Laplacian for diffusion. Together they
          bracket the space of &ldquo;biology encoded in ∇²&rdquo;.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr" className={lk}>
            Sinai Billiard — Poincaré Section Density
          </Link>{" "}
          — the height-field-from-scalar-field technique is identical:
          a 2-D density array is written directly into mesh vertex Z
          coordinates and coloured with a cobalt→amber FLOAT_COLOR attribute.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-miura-ori-rigid-origami-kawasaki-flat-fold-auxetic-poi-disc-webxr" className={lk}>
            Miura-Ori Rigid Origami
          </Link>{" "}
          — demonstrates the <code>foreach_set("co")</code> shape-key
          bulk-write technique that this tutorial also uses for its
          four parameter-class keys.
        </li>
      </ul>

      <h3>Outside sources</h3>
      <ul>
        <li>
          <strong>Alan M. Turing (1952).</strong>{" "}
          &ldquo;The Chemical Basis of Morphogenesis.&rdquo;{" "}
          <em>Proc. R. Soc. Lond. B</em> <strong>237</strong>(641), 37–72.{" "}
          Public Domain.{" "}
          <a
            href="https://doi.org/10.1098/rstb.1952.0012"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            doi:10.1098/rstb.1952.0012
          </a>
          . The seminal paper. Turing derives the instability condition from
          linear stability analysis of a reaction-diffusion system with
          arbitrary kinetics; the two-morphogen case is Theorem&nbsp;1.
          Related: J.&nbsp;E.&nbsp;Pearson (1993). &ldquo;Complex Patterns in
          a Simple System.&rdquo; <em>Science</em>{" "}
          <strong>261</strong>(5118), 189–192.{" "}
          <a
            href="https://doi.org/10.1126/science.261.5118.189"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            doi:10.1126/science.261.5118.189
          </a>
          . Pearson&rsquo;s (F,&thinsp;k) atlas is the direct source for
          the parameter values in the four shape keys.
        </li>
        <li>
          <strong>NumPy Developers (2024).</strong>{" "}
          <em>NumPy 2.x Documentation.</em> BSD-3-Clause.{" "}
          <a
            href="https://numpy.org/doc/stable/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            numpy.org/doc/stable
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            github.com/numpy/numpy
          </a>
          . Related: SciPy Community.{" "}
          <a
            href="https://scipy.org/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            scipy.org
          </a>{" "}
          — <code>scipy.ndimage.laplace</code> is the scipy path for the same
          Laplacian; also BSD-3-Clause; also the parent project of the
          Gray–Muir–Aston-Jones reaction-diffusion simulation library at
          <a
            href="https://github.com/scipy/scipy"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            {" "}github.com/scipy/scipy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Gray-Scott Reaction-Diffusion: Turing 1952 Morphogenesis, " +
    "∂U/∂t=D_u∇²U−UV²+F(1−U), Pearson (F,k) Atlas (Spots/Stripes/Labyrinth/Solitons), " +
    "5-Point Periodic Laplacian, Four-Class Shape Keys & Cobalt-Amber Poi Disc for WebXR (Blender 5.1)",
  tags: ["blender", "scripting", "python", "numpy", "physics", "reaction-diffusion", "poi", "webxr"],
  date: "2026-08-23",
  blends: [
    {
      label: "blueprint",
      path: `public/library/blends/scripting/${SLUG.replace("blender-tutorial-", "")}/blueprint.py`,
    },
  ],
  body: Body,
});
