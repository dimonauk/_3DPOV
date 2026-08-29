import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr";

function Body() {
  return (
    <>
      <p>
        In 1788 Joseph-Louis Lagrange published{" "}
        <em>Mécanique Analytique</em> and introduced the framework we still
        use today: write the kinetic and potential energies in terms of
        generalised coordinates, subtract them, and let the calculus of
        variations do the rest. The double pendulum is the first place that
        framework breaks down — not mathematically, but physically. The
        equations are perfectly deterministic. The trajectories are
        practically unpredictable. This blueprint integrates those equations
        with a classical RK4 scheme, extracts the lower-bob tip path, and
        wraps it in a Bishop parallel-transport tube coloured by kinetic
        energy — a Cobalt-to-Amber poi head that encodes the system&apos;s
        chaos as geometry.
      </p>

      <h2>Lagrangian mechanics in two lines</h2>
      <p>
        Two rods of length L₁&nbsp;=&nbsp;L₂&nbsp;=&nbsp;1 m, each carrying
        a point mass m₁&nbsp;=&nbsp;m₂&nbsp;=&nbsp;1 kg. The system has two
        degrees of freedom: the angle θ₁ of the upper rod from the vertical,
        and the angle θ₂ of the lower rod from the vertical.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`T = ½(m₁+m₂)L₁²ω₁² + ½m₂L₂²ω₂² + m₂L₁L₂ω₁ω₂cos(θ₁−θ₂)
V = −(m₁+m₂)gL₁cosθ₁ − m₂gL₂cosθ₂`}
      </pre>
      <p>
        Applying the Euler–Lagrange equation d/dt[∂L/∂ωᵢ]&nbsp;−&nbsp;∂L/∂θᵢ&nbsp;=&nbsp;0
        to each coordinate yields a 2×2 linear system for the angular
        accelerations α₁,&nbsp;α₂ at every instant:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`M(θ) · [α₁, α₂]ᵀ = F(θ, ω)

M = [[(m₁+m₂)L₁,  m₂L₂cos(Δ)],      Δ = θ₁ − θ₂
     [L₁cos(Δ),    L₂         ]]

F = [ m₂L₂ω₂²sin(Δ) − (m₁+m₂)g sinθ₁,
      L₁ω₁²sin(Δ)   − g sinθ₂          ]`}
      </pre>
      <p>
        Each RK4 step calls{" "}
        <code className="rounded bg-zinc-800 px-1">np.linalg.solve(M, F)</code>{" "}
        rather than <code className="rounded bg-zinc-800 px-1">np.linalg.inv(M)&nbsp;@&nbsp;F</code>.
        WHY: <code>solve</code> uses LU decomposition — accurate and stable
        for a 2×2 system even when cos(Δ)&nbsp;→&nbsp;±1 makes M nearly
        singular (the two rods nearly aligned). <code>inv</code> amplifies
        any numerical error through the matrix inverse, which is less stable
        numerically for near-singular systems.
      </p>

      <h2>From chaos to poi geometry</h2>
      <p>
        The lower-bob Cartesian position is:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`x = L₁ sinθ₁ + L₂ sinθ₂      (horizontal)
y = L₁ cosθ₁ + L₂ cosθ₂      (vertical, downward positive in physics)

In Blender +Y-up world: lay the trajectory flat in the XY plane.
Scale uniformly so the bounding radius equals POI_R − TUBE_R.`}
      </pre>
      <p>
        The three initial conditions span three qualitatively distinct regimes:
      </p>
      <table className="my-4 w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="py-1 pr-4 text-left">Shape key</th>
            <th className="py-1 pr-4 text-left">θ₁, θ₂, ω₁, ω₂</th>
            <th className="py-1 text-left">Regime</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-zinc-800">
            <td className="py-1 pr-4"><code>Basis</code></td>
            <td className="py-1 pr-4">40°, −10°, 0, 0</td>
            <td className="py-1">Mixed — weakly chaotic near KAM tori</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-1 pr-4"><code>SK_Chaotic</code></td>
            <td className="py-1 pr-4">120°, −30°, 2.0, 0</td>
            <td className="py-1">Strongly chaotic — butterfly fills the disc</td>
          </tr>
          <tr className="border-b border-zinc-800">
            <td className="py-1 pr-4"><code>SK_WideSwing</code></td>
            <td className="py-1 pr-4">170°, 10°, 0, 3.0</td>
            <td className="py-1">Near-inverted — large loops, rapid KE spikes</td>
          </tr>
          <tr>
            <td className="py-1 pr-4"><code>SK_Tight</code></td>
            <td className="py-1 pr-4">same as Basis</td>
            <td className="py-1">Thin wires (TUBE_R × 0.5) for layered look</td>
          </tr>
        </tbody>
      </table>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr"
        >
          Three-Body Figure-8 Choreography
        </Link>{" "}
        for a full derivation of Bishop transport. The key reason for using
        it here: the double-pendulum tip path has sharp reversals and
        near-cusp points where the Frenet normal is undefined or flips 180°.
        Bishop transport avoids those singularities entirely by propagating
        the normal frame with the minimal-rotation Rodrigues formula at each
        step.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Rodrigues rotation of N into the next tangent plane:
axis = cross(T[i], T[i+1])
a_len = |axis|
if a_len > 1e-10:
    axis /= a_len
    c = dot(T[i], T[i+1])     # cos of turning angle
    s = sqrt(1 − c²)          # sin
    N = c·N + s·cross(axis, N) + (1−c)·dot(axis, N)·axis`}
      </pre>

      <h2>DoublePend_Energy vertex colour</h2>
      <p>
        Each ring of vertices inherits the kinetic energy of the lower bob at
        the corresponding trajectory index, normalised to [0,&nbsp;1]:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`KE₂(t) = ½m₂(L₂ω₂)²

t_norm = KE₂ / max(KE₂)

colour = COBALT · (1−t_norm) + AMBER · t_norm
         (0.06,0.14,0.66) → (0.88,0.52,0.04)`}
      </pre>
      <p>
        The energy is highest when the lower bob passes through its lowest
        point at high velocity — those regions glow amber. Slow passages near
        the turning points stay cobalt. The gradient immediately communicates
        the system&apos;s energy landscape without any labels.
      </p>

      <h2>KAM theory and why chaos has boundaries</h2>
      <p>
        The Basis initial condition (40°, −10°) sits inside a Kolmogorov–Arnold–Moser
        (KAM) torus — a region of phase space where the quasi-periodicity
        theorems of the 1950s–60s guarantee the motion remains bounded and
        quasi-periodic for all time. Increase the initial angle into the
        chaotic sea and KAM tori break up in a cascade reminiscent of
        Feigenbaum period-doubling — see{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          the Feigenbaum Bifurcation tutorial
        </Link>{" "}
        for that cascade in a simpler map. The Poincaré section of the
        double pendulum shows both the KAM islands (closed curves) and the
        chaotic sea (scattered dots) — exactly the structure visible in{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
        >
          the Duffing Oscillator
        </Link>
        .
      </p>

      <h2>Running the blueprint</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Blender 5.1 — Scripting workspace
# 1. File → New → General
# 2. Open blueprint.py in the text editor
# 3. Click Run Script (▶)
# 4. The cobalt–amber poi tube appears in the 3D Viewport (~20–40 s)
# 5. File → Save As → hf_double_pendulum_poi.blend
# 6. Verify the GLB appeared at hf_double_pendulum_poi.glb`}
      </pre>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          >
            Lorenz Attractor RK4
          </Link>{" "}
          — the canonical 3D strange attractor, same RK4 integration pattern,
          Lyapunov exponent λ₁&nbsp;≈&nbsp;0.9 s⁻¹ (far milder chaos).
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
          >
            Foucault Pendulum
          </Link>{" "}
          — a single pendulum in a rotating frame: analytic solution, Berry
          phase, Hannay angle; useful contrast with the non-integrable double
          pendulum.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr"
          >
            Three-Body Figure-8
          </Link>{" "}
          — Lagrangian N-body at the other extreme: a special periodic orbit
          that avoids chaos altogether by extreme symmetry.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          Lagrange J-L (1788){" "}
          <em>Mécanique Analytique</em> — Public Domain
          <br />
          <a
            className={lk}
            href="https://archive.org/details/mcaniqueanaly00lagr"
            target="_blank"
            rel="noopener noreferrer"
          >
            archive.org/details/mcaniqueanaly00lagr
          </a>{" "}
          · Related: d&apos;Alembert 1743 <em>Traité de Dynamique</em> PD;
          Hamilton 1834 PD
        </li>
        <li>
          NumPy Developers — BSD-3-Clause
          <br />
          <a
            className={lk}
            href="https://numpy.org/doc/stable/"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org/doc/stable
          </a>{" "}
          · Related:{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>{" "}
          · SciPy BSD-3-Clause{" "}
          <a
            className={lk}
            href="https://scipy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            scipy.org
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python NumPy — Double Pendulum: Lagrangian Chaos, RK4, Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)",
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "lagrangian",
    "double-pendulum",
    "rk4",
    "bishop-tube",
    "poi",
    "webxr",
    "glb",
    "scripting",
  ],
  date: "2026-08-29",
  Body,
  libraryPath:
    "blends/scripting/python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr",
});
