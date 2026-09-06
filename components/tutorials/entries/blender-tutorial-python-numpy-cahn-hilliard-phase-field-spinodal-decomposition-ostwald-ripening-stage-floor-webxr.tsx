import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-cahn-hilliard-phase-field-spinodal-decomposition-ostwald-ripening-stage-floor-webxr";

const TITLE =
  "Python numpy — Cahn–Hilliard Phase-Field Spinodal Decomposition: Cahn & Hilliard 1958 Double-Well Free Energy, FFT Semi-Implicit Eyre 1998, Ostwald Ripening Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Pour oil into water and shake it: within seconds the two liquids separate into distinct domains. The Cahn–Hilliard equation describes that process with a single conserved field driven by a double-well free energy. This blueprint integrates it on a 128 × 128 grid using an FFT semi-implicit scheme that is unconditionally stable, maps composition to vertex height, and produces a stage-floor mesh whose labyrinthine ridges are literally the domain walls of a spinodal decomposition.";

function Body() {
  return (
    <>
      <p>
        Reaction-diffusion systems — Gray–Scott, Brusselator, Barkley — need two
        species that interact. The Cahn–Hilliard equation needs exactly one: a
        composition field c(x,y,t) ∈ [0,1] that measures how much of component A
        is present at each point. Given a free energy with two minima (at c = 0
        and c = 1) the system spontaneously separates into domains rich in one
        component or the other. The boundary between them is the domain wall.
      </p>
      <p>
        What makes Cahn–Hilliard hard numerically is not the nonlinearity — it is
        the fourth-order spatial derivative. Finite differences require a stencil
        that spans four cells in each direction and produce a system stiffness
        proportional to (Δx)⁻⁴. Explicit time-stepping is then limited to absurdly
        small steps. The FFT semi-implicit scheme by Eyre (1998) dissolves that
        stiffness: transform both sides, treat the k⁴ term implicitly, and the
        denominator (1 + dt·M·ε²·k⁴) stays ≥ 1 for every wavenumber k. Any dt
        works.
      </p>

      <h2>Equation and free energy</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂c/∂t = M ∇²μ               (mass conservation: ∫c dV = const)
μ      = f'(c) − ε² ∇²c    (chemical potential)
f(c)   = c²(1−c)²/4        (Landau double-well free energy)
f'(c)  = c(1−c)(2c−1)      (zero at c=0, 0.5, 1)

Spinodal condition: d²f/dc² < 0  ⟺  1/3 < c < 2/3
In that band, uniform states are thermodynamically unstable.
Any perturbation grows — no nucleation seed required.`}
      </pre>

      <h2>Why the fourth-order term matters</h2>
      <p>
        The term −ε²∇²c in the chemical potential penalises sharp interfaces. Without it,
        the system would immediately snap to the sharp-interface limit (c ∈ {"{0,1}"}
        everywhere), producing a fractal of measure zero. The ε² gradient penalty
        sets a physical interface thickness ∼ ε. Larger ε → softer, wider domain
        walls. Smaller ε → sharper interfaces and faster coarsening. The shape key
        SK_ThickInterface demonstrates this by doubling ε from 0.03 to 0.05.
      </p>

      <h2>FFT semi-implicit scheme</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`In Fourier space (∇² → −|k|²):

  ∂ĉ/∂t = M(−k²)[f̂'(c) + ε²k²ĉ]

First-order implicit in the linear stiff part, explicit in f':

  ĉ(t+dt) = [ĉ(t) − dt·M·k²·F̂{f'(c)}] / (1 + dt·M·ε²·k⁴)

WHY this works:
  Denominator D(k) = 1 + dt·M·ε²·k⁴  ≥ 1 for all k.
  No eigenvalue of the update operator exceeds 1 in magnitude.
  Unconditionally stable — any dt, any grid resolution.
  Mass conservation: k=0 mode has D(0)=1 → ĉ₀ unchanged.`}
      </pre>

      <h2>Pattern regimes</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Mean composition c̄ = 0.5  →  labyrinthine (symmetric spinodal)
Mean composition c̄ = 0.3  →  isolated droplets (minority phase)
Mean composition c̄ = 0.7  →  holes (majority phase, inverted droplets)

Early time (t ≈ 30)  →  fine-scale spinodal: many thin channels
Late  time (t ≈ 150) →  coarsened: Ostwald ripening removes small domains

Ostwald ripening mechanism: smaller domains have higher curvature → higher
chemical potential → diffuse into nearby larger domains → the mean domain
size grows as ⟨L⟩ ∼ t^(1/3) (Lifshitz–Slyozov–Wagner law).`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1. Wavenumber arrays
f  = np.fft.fftfreq(N, d=1/N)   # integer wavenumbers
kx, ky = np.meshgrid(f, f, indexing='ij')
k2 = kx**2 + ky**2
k4 = k2**2

# 2. Implicit denominator (computed once, reused every step)
denom = 1.0 + dt * M * eps**2 * k4

# 3. Time integration loop
for _ in range(steps):
    fp_hat = np.fft.fft2(c * (1-c) * (2*c - 1))   # f'(c)
    c_hat  = np.fft.fft2(c)
    c_hat  = (c_hat - dt * M * k2 * fp_hat) / denom
    c      = np.real(np.fft.ifft2(c_hat))
    np.clip(c, 0, 1, out=c)    # round-trip safety

# 4. Height field mesh
z = c * HEIGHT_SCALE           # composition → vertex Z
# → 128×128 = 16 384 vertices, 16 129 CCW quads

# 5. FLOAT_COLOR vertex attribute CH_Comp
# cobalt (0.030, 0.200, 0.780) → amber (0.980, 0.620, 0.050)
# Drives Emission in the Eevee shader node tree`}
      </pre>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis           c̄=0.50  t=120  labyrinthine channels
SK_Coarsened    c̄=0.50  t=600  large coarsened domains (Ostwald ripening)
SK_Droplets     c̄=0.30  t=120  isolated droplets of minority phase
SK_ThickInterface c̄=0.50 ε=0.05 broader, softer domain walls`}
      </pre>

      <h2>Troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`All c → 0 or 1 immediately
  Cause: noise_amp too large or c0_mean outside spinodal band
  Fix:   keep c0_mean ∈ (1/3, 2/3); noise_amp ≤ 0.05

Mesh perfectly flat
  Cause: HEIGHT_SCALE=0 or c field constant
  Fix:   confirm integration ran (print(c.min(), c.max()) before build_mesh)

Rippling artefacts at mesh boundary
  Cause: FFT wraps periodically; this is physical, not an error
  Fix:   crop the mesh by 5 % at each edge if you need non-periodic walls

Integration too slow in Blender's Python
  Cause: STEPS_COARSE=600 × 128² FFTs
  Fix:   reduce to STEPS_COARSE=200 for a preview; full run offline`}
      </pre>

      <h2>Related studio work</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr">
            Gray–Scott reaction-diffusion
          </Link>{" "}
          — two-species autocatalytic system; compare activator-inhibitor vs conserved-field phase separation.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr">
            Brusselator oscillator
          </Link>{" "}
          — Hopf bifurcation and Turing instability in a dissipative two-species system.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr">
            Swift–Hohenberg convection rolls
          </Link>{" "}
          — another 4th-order PDE producing hexagonal and stripe patterns.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr">
            Ising model Metropolis
          </Link>{" "}
          — discrete lattice cousin: same phase-separation physics, statistical mechanics framing.
        </li>
        <li>
          <Link className={lk} href="/codex/blender-python-scripting">
            Blender Python scripting codex
          </Link>
        </li>
        <li>
          <Link className={lk} href="/codex/numpy-in-blender">
            numpy in Blender codex
          </Link>
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          Cahn JW &amp; Hilliard JE (1958) "Free Energy of a Nonuniform System. I.
          Interfacial Free Energy" <em>J. Chem. Phys.</em> 28:258.{" "}
          <a className={lk} href="https://doi.org/10.1063/1.1744102" target="_blank" rel="noreferrer">
            doi:10.1063/1.1744102
          </a>{" "}
          — original equation, public domain (&gt;65 yr). Related work: Cahn JW 1961
          spinodal decomposition paper; Allen–Cahn equation (non-conserved analogue).
        </li>
        <li>
          Eyre DJ (1998) "Unconditionally gradient stable time marching the
          Cahn–Hilliard equation" <em>MRS Symp. Proc.</em> 529:39, public domain.{" "}
          <a className={lk} href="https://math.utah.edu/~eyre/research/methods/stable.ps" target="_blank" rel="noreferrer">
            math.utah.edu/~eyre
          </a>{" "}
          — semi-implicit splitting scheme. Related: Wise SM et al. 2009 improved
          energy-stable schemes; Yang X et al. 2017 second-order SAV methods.
        </li>
        <li>
          Harris CR et al. (2020) "Array programming with NumPy" <em>Nature</em>{" "}
          585:357.{" "}
          <a className={lk} href="https://numpy.org" target="_blank" rel="noreferrer">
            numpy.org
          </a>{" "}
          — BSD-3-Clause.{" "}
          <a className={lk} href="https://github.com/numpy/numpy" target="_blank" rel="noreferrer">
            github.com/numpy/numpy
          </a>.
          Related: SciPy (BSD-3), CuPy (MIT) for GPU acceleration.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-06",
  topics: ["scripting", "physics", "terrain", "procedural"],
  body: <Body />,
  libraryPath: `blends/scripting/${SLUG.replace("blender-tutorial-", "")}`,
});
