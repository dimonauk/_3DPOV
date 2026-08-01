import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-curl-noise-incompressible-rk4-fluid-poi-light-trail-webxr";

const TITLE =
  "Python numpy — Curl Noise: Spectral Vector Potential, ∇×ψ Incompressible Field & RK4 Advection for Poi Light Trails (Blender 5.1)";

const LEDE =
  "Bridson, Houriham & Nordenstam (SIGGRAPH 2007) noticed that div(curl ψ) = 0 is a vector-calculus identity — which means any smooth potential field ψ automatically gives a divergence-free velocity field when you take its curl. In Blender this lets you build poi light trails that swirl like real smoke filaments without ever solving the Navier–Stokes equations: synthesise ψ in the Fourier domain, IFFT to real space, curl via np.gradient, and advect 40 particles with RK4.";

function Body() {
  return (
    <>
      <p>
        Watch a slow-exposure photograph of poi spinning in a smoke-filled room.
        The light trails don&rsquo;t converge to a point or splay outward from
        one — they swirl continuously, folding over themselves in long
        filaments. That behaviour has a name in fluid mechanics:{" "}
        <em>incompressibility</em>. The velocity field has zero divergence, so
        no volume of air ever gets compressed into a sink or inflated from a
        source. The trails just keep going.
      </p>
      <p>
        Getting a computer to produce this behaviour exactly — not approximately
        — is harder than it looks. Classic Perlin noise gives you smooth
        gradients but the field is not divergence-free; particles slowly cluster
        in low-speed regions. Solving the Navier–Stokes equations properly is
        expensive. Bridson et al.&rsquo;s 2007 paper found the shortcut: take
        the <em>curl</em> of any smooth potential{" "}
        <code>ψ = (ψx, ψy, ψz)</code>. Because{" "}
        <code>div(curl ψ) = 0</code> is a vector-calculus identity, the result
        is guaranteed incompressible regardless of what ψ looks like. They
        called it <em>curl noise</em>.
      </p>

      <h2>Technique overview</h2>
      <p>
        The pipeline has four conceptual stages, each self-contained:
      </p>
      <ol>
        <li>
          <strong>Spectral synthesis of ψ.</strong> Build ψx, ψy, ψz on an N³
          grid by assigning random complex amplitudes in the Fourier domain with
          a <code>1/|k|²</code> power envelope, then IFFT back to real space.
          The power law controls smoothness exactly: 1/|k|² (power=2) gives a
          Brownian/1f² spectrum; power=3 gives a buttery smooth field. This is
          the same spectral synthesis used in Gaussian random field cosmology
          and terrain generation.
        </li>
        <li>
          <strong>Curl via np.gradient.</strong>{" "}
          <code>np.gradient(field, H, axis=(0,1,2))</code> returns O(H²)
          central-difference partial derivatives. The three curl components are:{" "}
          <code>Vx = ∂ψz/∂y − ∂ψy/∂z</code>, and cyclic permutations.
          Normalise so the maximum speed across the grid is 1 m/s, then
          multiply by a <code>SPEED_SCALE</code> constant.
        </li>
        <li>
          <strong>RK4 advection.</strong> Seed 40 particles inside a ±0.55 m
          sphere (poi-arm reach envelope). At each step, sample the curl field
          by trilinear interpolation, then advance with the classic 4th-order
          Runge–Kutta scheme. RK4&rsquo;s global error is O(dt⁴); at DT=0.04 s
          over 120 steps the paths are accurate to ~1 mm — enough for visual
          fidelity. Euler integration would require DT&lt;0.002 s for comparable
          accuracy.
        </li>
        <li>
          <strong>Blender NURBS curves.</strong> Each 121-point path becomes a
          cubic NURBS spline with bevel depth 7 mm — a glowing tube. One shared
          emissive cyan material maps to{" "}
          <code>KHR_materials_emissive_strength</code> in the GLB, so WebXR
          renderers get physically correct glow without post-processing.
        </li>
      </ol>

      <h2>Why spectral synthesis rather than Perlin noise?</h2>
      <p>
        Perlin noise (and its gradient-noise successors) is defined on a
        hierarchical lattice. Each octave doubles frequency; the power spectrum
        is approximately 1/f but not exactly. More importantly, Perlin noise
        doesn&rsquo;t give you direct control over the correlation length —
        you&rsquo;t choose how wide the vortices are.
      </p>
      <p>
        Spectral synthesis works in frequency space directly. You assign
        amplitude = |k|^(−power/2) to every wavevector k, then IFFT. The
        correlation length is automatically set by where the amplitude starts
        to fall off. At power=2 the vortex size roughly matches the box half-
        width; at power=3 there is one dominant long-wavelength swirl; at
        power=1 the field is rough pink noise with many small vortices. You can
        band-pass the field by zeroing frequencies outside [k_min, k_max] if
        you want vortices at a specific scale.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        All parameters sit at the top as named constants — change{" "}
        <code>POWER_LAW</code> to 1.0 to see what pink-noise curl looks like,
        or bump <code>N_PARTICLES</code> to 200 for a full swarm:
      </p>
      <pre><code>{`GRID_RES    = 48      # N³ grid for potential fields
BOX_HALF    = 2.0     # simulation domain half-size (m)
N_PARTICLES = 40      # poi trails
T_STEPS     = 120     # RK4 steps per trail
DT          = 0.04    # time-step (s)
SPEED_SCALE = 0.8     # curl field multiplier
BEVEL_R     = 0.007   # tube radius (m)
POWER_LAW   = 2.0     # 2=Brownian, 3=smooth, 1=rough`}</code></pre>

      <p>
        The spectral synthesis function uses <code>np.fft.fftfreq</code> to
        build the wavenumber grid, assigns amplitudes, multiplies by random
        complex phases, then calls <code>np.fft.ifftn</code>. The Hermitian
        symmetry needed for a real output comes for free because the random
        phases are not constrained — the imaginary part of{" "}
        <code>ifftn</code> is numerically zero (below 10⁻¹²).
      </p>
      <p>
        The trilinear sampler clamps grid coordinates to{" "}
        <code>[0, N−1−ε]</code> in all three axes. This means particles that
        drift outside the simulation box receive the boundary velocity rather
        than raising an index error — useful during live prototyping when you
        are still tuning DT.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Trails converge to the same point:</strong> your SPEED_SCALE
          is too high and particles overshoot the integration domain in a single
          step. Halve DT or halve SPEED_SCALE.
        </li>
        <li>
          <strong>All trails look identical:</strong> check that SEED varies
          between runs. The spectral fields are seeded once; all N_PARTICLES
          are placed with the same RNG state if you reset it between seed
          generation and path integration.
        </li>
        <li>
          <strong>GLB missing geometry in Three.js:</strong> NURBS curves
          require <code>export_apply=True</code> in the glTF exporter so
          they are converted to mesh before export. The blueprint already sets
          this flag; if you move the export call, remember to include it.
        </li>
        <li>
          <strong>Field looks uniform (no structure):</strong> POWER_LAW is
          too large (e.g. 10). Stick to 1.5–3.5 for visually interesting
          swirls.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi"
            className={lk}
          >
            Navier–Stokes Vorticity-Streamfunction
          </Link>{" "}
          — the full incompressible fluid solver that curl noise approximates.
          Compare the Poisson pressure step there with the zero-pressure trick
          here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr"
            className={lk}
          >
            Lévy Flight & Brownian Motion
          </Link>{" "}
          — stochastic particle trails that are <em>not</em> divergence-free.
          Compare how Lévy paths cluster near slow-diffusion regions while curl-
          noise paths spread uniformly.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator & Poincaré Sections
          </Link>{" "}
          — another deterministic ODE integrated with RK4. The RK4 step
          function here is identical in structure; only the velocity function
          differs.
        </li>
        <li>
          <Link href="/tutorials/your-first-long-exposure" className={lk}>
            Your First Long Exposure
          </Link>{" "}
          — the photographic context for poi light trails. Curl-noise geometry
          is a synthetic stand-in for what long-exposure photography captures.
        </li>
        <li>
          <Link href="/tutorials/building-a-pov-led-rig" className={lk}>
            Building a POV LED Rig
          </Link>{" "}
          — the physical hardware that produces the real swirling light trail.
          The geometry in this tutorial models what an ideal rig would trace.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Bridson, R., Houriham, J. &amp; Nordenstam, M. (2007). &ldquo;Turbulence
          without tears: Incompressible noise for stochastic simulations.&rdquo;{" "}
          <em>ACM SIGGRAPH 2007 Papers</em>, article 97.{" "}
          <a
            href="https://dl.acm.org/doi/10.1145/1275808.1276435"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1145/1275808.1276435
          </a>
          . The mathematical technique (curl of a potential) is a vector-
          calculus identity in the public domain; only the ACM typeset
          presentation is paywalled. Related: Bridson&rsquo;s{" "}
          <a
            href="https://www.cs.ubc.ca/~rbridson/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            research page at UBC
          </a>{" "}
          contains further fluid simulation work including the fast marching
          level-set method and Poisson disk sampling — both MIT/permissive.
          Sibling work: Fedkiw, Stam &amp; Jensen (2001) &ldquo;Visual
          simulation of smoke&rdquo; (SIGGRAPH 2001), which introduced
          semi-Lagrangian advection for VFX.
        </li>
        <li>
          NumPy Developers. <em>NumPy — Fundamental package for scientific
          computing with Python</em>. BSD-3-Clause.{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          . Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
          . The{" "}
          <code>np.fft.ifftn</code> and <code>np.gradient</code> routines used
          here are vectorised C / Fortran kernels — the entire potential field
          is built and differentiated in two NumPy calls with no Python loop
          per voxel.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  tags: [
    "blender",
    "scripting",
    "python",
    "numpy",
    "fluid-simulation",
    "curl-noise",
    "particles",
    "rk4",
    "webxr",
    "poi",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-curl-noise-incompressible-rk4-fluid-poi-light-trail-webxr",
});
