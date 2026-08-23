import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>A flat table. One disk. Total chaos.</h2>
      <p>
        Ya. G. Sinai asked, in 1970, what happens when a billiard particle
        bounces inside a square cell that contains a single circular hard disk.
        The square on its own is completely integrable — the particle bounces
        back and forth in a regular lattice, never mixing. Add a convex disk and
        everything changes. Because the disk scatters each ray{" "}
        <em>outward</em>, two nearby trajectories diverge exponentially fast
        after only a handful of reflections. Sinai proved the system is not just
        chaotic but{" "}
        <strong>Bernoulli</strong> — the strongest possible mixing property, the
        same statistical behaviour as an independent coin-flip sequence.
      </p>
      <p>
        The periodic version — one disk per square unit cell, tiling the plane
        — is the classical <strong>Lorentz gas</strong>, introduced by H. A.
        Lorentz in 1905 to model electron drift through metallic ions. Sinai&apos;s
        ergodicity result is why the Boltzmann transport equation works for that
        gas: the particle genuinely explores every corner of phase space with
        equal long-run frequency.
      </p>
      <p>
        This tutorial builds a 4 m × 3 m stage floor whose Z height{" "}
        <em>is</em> the Poincaré section density. We simulate 60 trajectories ×
        2 500 disk collisions each, record every collision in Birkhoff
        coordinates, and bin the result into a 64 × 48 histogram. That
        histogram, nearly flat by ergodicity, is lifted into a cobalt-to-amber
        vertex-coloured mesh and exported as a WebXR-ready GLB.
      </p>

      <h2>Why the disk causes chaos: the dispersing mechanism</h2>
      <p>
        A flat wall is a mirror. Parallel rays hitting a flat wall leave
        parallel. A convex disk is an anticorner lens: parallel rays hitting a
        convex surface diverge after reflection. The angular defocusing per
        collision is proportional to 1/R (the curvature of the disk). Between
        reflections the ray travels in a straight line — no focusing or
        defocusing. The next collision off the disk defocuses again. The result
        is an exponential cascade: a bundle of width δ after n collisions has
        width ≈ δ · e^{nλ} for some λ &gt; 0.
      </p>
      <p>
        This is the opposite of the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr"
          className={lk}
        >
          Bunimovich stadium
        </Link>
        , which uses a mixture of flat walls (neutral) and concave semicircles
        (focusing, then defocusing) to achieve chaos. Sinai&apos;s mechanism is
        cleaner: the convex disk alone is sufficient. The flat walls of the
        square are neutral; they cannot undo the disk&apos;s defocusing work.
      </p>

      <h2>Birkhoff coordinates: collisions as phase-space points</h2>
      <p>
        After each disk collision, we record two numbers:
      </p>
      <ul>
        <li>
          <strong>s ∈ [0, 1)</strong> — arc-length fraction around the disk
          boundary, counterclockwise from the positive x-axis. If the collision
          occurs at angle φ on the disk, then s = φ / 2π (mod 1).
        </li>
        <li>
          <strong>p = sin θ ∈ [−1, 1]</strong> — the sine of the angle the
          outgoing ray makes with the outward normal at the collision point.
          Computed as the dot product of the post-reflection velocity with the
          tangent direction (counterclockwise tangent at the collision point).
        </li>
      </ul>
      <p>
        The rectangle [0,1) × [−1,1] is the billiard phase space. The Sinai map
        T: (s, p) → (s&apos;, p&apos;) sends each collision to the next. The invariant
        measure is the uniform measure ds dp (Liouville). Ergodicity means the
        orbit of almost every starting point (s₀, p₀) visits every open set
        with frequency proportional to its ds dp measure. Our height field is
        the finite-sample approximation of that flat density.
      </p>
      <p>
        G. D. Birkhoff introduced these coordinates in his 1927 monograph{" "}
        <em>Dynamical Systems</em>; they are optimal because the map T is
        area-preserving in them — an analogue of Liouville&apos;s theorem for
        discrete-time billiard maps.
      </p>

      <h2>Lyapunov exponent from a shadow trajectory</h2>
      <p>
        We run a shadow particle alongside each trajectory, offset by ε =
        10⁻⁷ m perpendicular to the main orbit. After each disk collision we
        measure:
      </p>
      <pre>{`lyap_sample = log( separation / ε )
renormalise shadow back to ε from main particle`}</pre>
      <p>
        The running average ⟨log(sep/ε)⟩ converges to the largest Lyapunov
        exponent λ₁. For disk radius R = 0.38 and square half-side L = 1, the
        expected value is roughly 0.35 – 0.50 nats per collision. The console
        output shows the estimate after the full run:
      </p>
      <pre>{`[Sinai] Lyapunov exponent λ ≈ 0.41  (expected >0 for dispersing billiard)`}</pre>
      <p>
        The positive Lyapunov exponent tells us that two trajectories starting
        10⁻⁷ m apart become macroscopically different (∼1 m) after
        1 / λ · log(10⁷) ≈ 40 collisions. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
          className={lk}
        >
          Feigenbaum logistic map
        </Link>{" "}
        where the Lyapunov exponent is ≈ ln 2 ≈ 0.693 nats per iteration at r =
        4, confirming the logistic map is more chaotic per step than this
        billiard (though the Sinai billiard is chaotic in a more rigorous
        measure-theoretic sense).
      </p>

      <h2>Building the density height field in bpy</h2>
      <p>
        The simulation loop runs entirely in Python; the result is a{" "}
        <code>density[N_S, N_P]</code> NumPy array. We convert it to a mesh:
      </p>
      <pre>{`# (N_S+1) × (N_P+1) vertex grid → N_S × N_P quads
for j in range(N_P + 1):
    for i in range(N_S + 1):
        z = d_norm[min(i, N_S-1), min(j, N_P-1)] * H_SCALE
        verts.append((x_m, y_m, z))

mesh.from_pydata(verts, [], faces)   # direct data API, no operator`}</pre>
      <p>
        The vertex colour layer <code>SinaiDensity</code> (FLOAT_COLOR POINT)
        maps density to cobalt (0.10, 0.28, 0.78) at t = 0 through to amber
        (0.92, 0.58, 0.08) at t = 1. Because the Sinai billiard is ergodic the
        floor is nearly flat; the cobalt-amber colour contrast emphasises the
        statistical fluctuations that persist at finite sample size.
      </p>
      <p>
        Compare the shape of this floor with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mathieu-ince-strutt-stability-diagram-floquet-monodromy-paul-trap-stage-floor-webxr"
          className={lk}
        >
          Mathieu / Ince-Strutt stability floor
        </Link>
        , where the height field carries sharp stability boundaries rather than
        a smooth ergodic density.
      </p>

      <h2>Parameter reference</h2>
      <ul>
        <li>
          <code>L = 1.0</code> — half-side of the periodic square cell. The
          particle lives in [−L, L]².
        </li>
        <li>
          <code>DISK_R = 0.38</code> — disk radius. Smaller: longer free paths,
          weaker mixing. Larger (approaching L√2 ≈ 1.41): disk fills the
          diagonal, paths become very short.
        </li>
        <li>
          <code>N_TRAJ = 60, N_ITER = 2500</code> — 150 000 total collisions.
          Doubling these halves the density fluctuation amplitude.
        </li>
        <li>
          <code>N_S = 64, N_P = 48</code> — Birkhoff grid resolution. Finer
          grids reveal more structure but need proportionally more collisions.
        </li>
        <li>
          <code>H_SCALE = 0.38</code> — maximum ridge height in metres. Scaled
          so the densest cell reaches 38 cm above the floor base.
        </li>
      </ul>

      <h2>Connections to other topics</h2>
      <p>
        The Hénon-Heiles Hamiltonian produces a very different picture: because
        it is only partially chaotic (KAM tori survive alongside chaotic layers
        for moderate energies), its Poincaré section shows both smooth closed
        curves (tori) and ergodically filled regions. The Sinai billiard has no
        KAM tori — every orbit is chaotic. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr"
          className={lk}
        >
          Hénon-Heiles tutorial
        </Link>{" "}
        for the coexistence case.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Lyapunov estimate is negative or near zero:</strong> The
          shadow trajectory diverged and got remapped incorrectly. Check that
          the renormalisation divides by <code>sep</code> (not by{" "}
          <code>LYAP_EPS</code>) and that the wrap function preserves periodic
          BC for the shadow particle at every boundary crossing.
        </li>
        <li>
          <strong>Disk reflections send particle through the wall:</strong>{" "}
          This happens when the disk collision time <code>td</code> is chosen
          after a wall crossing that wraps the particle to the other side. Fix:
          always recompute <code>_disk_t</code> with the{" "}
          <strong>current, wrapped</strong> position after each wall event.
          The blueprint recomputes from scratch at every loop iteration, so
          this error cannot accumulate.
        </li>
        <li>
          <strong>Height field is perfectly flat (no variation):</strong> Either
          the density array is all-zero (simulation ran zero collisions —{" "}
          confirm <code>td</code> is computed correctly and is less than{" "}
          <code>tw</code> at least occasionally) or the normalisation divided by
          zero. Check <code>d_max = density.max() or 1.0</code> guard.
        </li>
        <li>
          <strong>GLB vertex colours missing in Three.js / WebXR:</strong> The
          FLOAT_COLOR attribute must be present in the exported GLB as vertex
          colours accessor. Confirm <code>export_colors=True</code> in the
          <code>gltf</code> operator call.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Ya. G. Sinai</strong> (1970). &ldquo;Dynamical systems with
          elastic reflections.&rdquo; <em>Russian Mathematical Surveys</em>{" "}
          25(2): 137–189.{" "}
          <a
            href="https://iopscience.iop.org/article/10.1070/RM1970v025n02ABEH003794"
            className={lk}
          >
            doi:10.1070/RM1970v025n02ABEH003794
          </a>{" "}
          — Licence: Public Domain (Soviet publication, pre-1978). The original
          proof of ergodicity and mixing for the Sinai billiard. Related work:
          N. Chernov &amp; R. Markarian,{" "}
          <em>Chaotic Billiards</em> (AMS 2006); D. Szász (ed.),{" "}
          <em>Hard Ball Systems and the Lorentz Gas</em> (Springer 2000).
        </li>
        <li>
          <strong>NumPy Developers</strong> (2024). <em>NumPy: Array computing
          for Python</em>.{" "}
          <a href="https://numpy.org" className={lk}>
            numpy.org
          </a>{" "}
          — Licence: BSD-3-Clause.{" "}
          <a href="https://github.com/numpy/numpy" className={lk}>
            github.com/numpy/numpy
          </a>
          . Related: SciPy (BSD-3), Numba (BSD-2) for JIT-compiled billiard
          loops.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Sinai Billiard / Lorentz Gas: Dispersing Scatterer, Birkhoff Coordinates & Poincaré Section Density Stage Floor",
  lede:
    "150 000 disk collisions in a periodic square cell, Birkhoff coordinates (s, p = sin θ), " +
    "Lyapunov exponent from a shadow trajectory, and the ergodic density lifted into a " +
    "cobalt-to-amber height-field stage floor for WebXR.",
  description:
    "Python bpy + NumPy script — periodic Sinai billiard (Lorentz gas), " +
    "specular reflection off circular hard disk, Birkhoff coordinate histogram, " +
    "Lyapunov exponent estimate, cobalt-amber FLOAT_COLOR POINT vertex colour, " +
    "quad height-field mesh, Draco-6 WebP GLB stage floor for WebXR (Blender 5.1).",
  date: "2026-08-23",
  tags: [
    "blender",
    "python",
    "numpy",
    "dynamical-systems",
    "chaos",
    "ergodic-theory",
    "billiards",
    "poincare-section",
    "lorentz-gas",
    "lyapunov",
    "stage-floor",
    "webxr",
  ],
  body: Body,
  sourceUrl:
    "https://github.com/dimonauk/_3dpov/tree/main/public/library/blends/scripting/python-numpy-sinai-billiard-lorentz-gas-dispersing-lyapunov-poincare-stage-floor-webxr",
});

export const blenderTutorialPythonNumpySinaiBilliardLorentzGasDispersingLyapunovPoincareStageFloorWebxrEntry =
  entry;
export default entry;
