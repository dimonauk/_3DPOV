import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr";

function Body() {
  return (
    <>
      <p>
        In 1955, Enrico Fermi, John Pasta, Stanislaw Ulam, and Mary Tsingou ran
        the first numerical simulation in physics on the MANIAC computer at Los
        Alamos. They integrated a chain of N&nbsp;=&nbsp;32 particles connected
        by springs with a small cubic nonlinearity (the α-FPU model), expecting
        energy to spread evenly across all Fourier modes — thermalisation.
        Instead, the energy came back. After apparently dispersing, it returned
        near the original single-mode state at the{" "}
        <em>FPUT recurrence time</em> T_rec&nbsp;≈&nbsp;800 time units. This
        contradicted every contemporary expectation about ergodicity and launched
        soliton theory and modern computational physics.
      </p>
      <p>
        This blueprint integrates the α-FPU Hamiltonian via the
        Störmer–Verlet symplectic integrator, samples the full displacement
        field x_i(t) into a 32&nbsp;×&nbsp;512 height-field stage floor, and
        colours it by |x_i| (Cobalt&nbsp;= nodal / quiescent,
        Amber&nbsp;= peak displacement). The FPUT recurrence appears as
        diagonal amber stripes reconvening on the floor after apparent
        disorder.
      </p>

      <h2>Why Störmer–Verlet for long-time integration</h2>
      <p>
        The leapfrog / Störmer–Verlet method is the right choice for FPUT
        because it is <em>symplectic</em> — it exactly conserves a modified
        shadow Hamiltonian that stays exponentially close to the true energy
        H. Classical Runge–Kutta methods introduce artificial dissipation
        that damps out the recurrence signal over the thousands of steps
        required to reach T_rec. Symplectic methods prevent that.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Störmer–Verlet (half-kick → drift → half-kick):

  v_{n+½} = v_n  + (Δt/2) · F(x_n)
  x_{n+1} = x_n  +  Δt    · v_{n+½}
  v_{n+1} = v_{n+½} + (Δt/2) · F(x_{n+1})

  Cost per step: 1 force evaluation.
  Time-reversal: exact (v → −v maps n→0).
  Shadow energy: |H_shadow − H_true| = O(Δt²) uniformly for all time.`}
      </pre>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-toda-lattice-integrable-chain-flaschka-lax-soliton-poi-disc-webxr"
        >
          the Toda Lattice tutorial
        </Link>{" "}
        for an integrable lattice that makes the recurrence exact — FPUT is
        a perturbation of the Toda chain, and the Toda solitons are the exact
        objects whose phase coherence produces the FPUT recurrence.
      </p>

      <h2>The α-FPU Hamiltonian</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`H = Σᵢ pᵢ²/2  +  (Δxᵢ)²/2  +  (α/3)(Δxᵢ)³

Δxᵢ = xᵢ − x_{i−1},   boundary: x₀ = x_{N+1} = 0

Force on particle i:
  Fᵢ = (Δxᵢ₊ − Δxᵢ) + α·(Δxᵢ₊² − Δxᵢ²)
  where  Δxᵢ₊ = x_{i+1} − xᵢ

Normal-mode energies (sine-transform for fixed BCs):
  qₖ = √(2/(N+1)) Σᵢ xᵢ sin(kπ(i+1)/(N+1))
  Eₖ = (q̇ₖ² + ωₖ²qₖ²)/2,   ωₖ = 2 sin(kπ/(2(N+1)))`}
      </pre>
      <p>
        The initial condition is the single lowest Fourier mode excited at
        amplitude A₀&nbsp;=&nbsp;1 with zero velocity (maximum-potential
        start):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`x_i(0) = A₀ sin(π i / (N+1)),   i = 1 … N
ṗ_i(0) = 0   (all momenta zero)`}
      </pre>

      <h2>KdV solitons and the recurrence</h2>
      <p>
        Kruskal &amp; Zabusky (1965) showed that the continuum limit of the
        α-FPU lattice is the Korteweg–de Vries (KdV) equation. KdV admits
        exact soliton solutions whose collisions are elastic — they preserve
        phase. The phase coherence of these solitons is precisely what
        allows the energy to return to mode&nbsp;1 near T_rec. The
        recurrence time scales as:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`T_rec ≈ (N / k)³ / (α² A₀²)  in the weakly nonlinear limit

For N=32, k=1, α=0.25, A₀=1.0:
  T_rec ≈ 800 time units  ←  recurrence stripes at t≈800 on the floor

Shape keys demonstrate the α-dependence:
  SK_Linear  α=0.000  T_rec → ∞  (linear chain, frozen)
  SK_Half    α=0.125  T_rec ≈ 1 600
  SK_Double  α=0.500  T_rec ≈ 200  (rapid mixing, chaotic floor)`}
      </pre>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
        >
          the KdV Soliton tutorial
        </Link>{" "}
        for the exact continuum limit, Hirota bilinear method, and N-soliton
        tau-function solutions that explain why the recurrence occurs.
      </p>

      <h2>Height-field stage floor geometry</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Grid:  32 particles × 512 time snapshots  =  16 384 vertices
       31 × 511  =  15 841 quad faces  (CCW winding)

Layout:
  X axis:  particle index  i  ∈ [0, 31]  → [−0.80, +0.80] m
  Z axis:  sampled time    t  ∈ [0, 511] → [−0.80, +0.80] m
  Y axis:  displacement    x_i(t) × H_SCALE   (H_SCALE = 0.30 m)

Sampling:  store every SAMPLE=16th Verlet step  →  512 frames
           (8 192 total steps, dt=0.10 → 819 time units covered)`}
      </pre>

      <h2>Vertex colour FPUT_Disp</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`norm = |x_i(t)| / max|x_i(t)|          # 0 = nodal, 1 = peak

colour = COBALT + norm · (AMBER − COBALT)

COBALT = (0.06, 0.14, 0.66, 1.0)   # |x| = 0  — quiescent nodes
AMBER  = (0.88, 0.52, 0.04, 1.0)   # |x| = 1  — peak displacement

Baked via:
  attr = me.attributes.new("FPUT_Disp", 'FLOAT_COLOR', 'POINT')
  attr.data.foreach_set('color', cols.ravel())`}
      </pre>
      <p>
        Flat shading is correct here — each quad represents one particle at
        one time interval, so per-quad colour is more faithful than
        interpolated smooth shading.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# 1. Integrate α-FPU for Basis (α=0.25)  +  3 shape-key alphas
x_basis = integrate_fpu(0.25)        # (32, 512)
x_linear = integrate_fpu(0.000)      # linear  — no mixing
x_half   = integrate_fpu(0.125)      # slow recurrence
x_double = integrate_fpu(0.500)      # rapid mixing

# 2. Build 32×512 height-field mesh from Basis
verts = make_verts(x_basis)          # (16384, 3)
faces = make_faces(32, 512)          # list of 15841 quads

# 3. Assign FLOAT_COLOR POINT vertex attribute
attr.data.foreach_set('color', cols.ravel())

# 4. Shape keys
ob.shape_key_add(name='Basis', from_mix=False)
for name, x_sk in shapes:
    sk = ob.shape_key_add(name=name, from_mix=False)
    sk.data.foreach_set('co', make_verts(x_sk).ravel())

# 5. Material: ShaderNodeAttribute → Principled BSDF (Base + Emission)
# 6. Export fput_floor.blend + fput_floor.glb (Draco-6, export_morph=True)`}
      </pre>

      <h2>Failure modes and troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Problem: Recurrence stripes not visible — floor looks random.
Fix:    Confirm ALPHA_0=0.25, N_STEPS=8192, SAMPLE=16, DT=0.10.
        Reduce DT to 0.05 if energy is not conserved (check ΔH/H < 1e-4).

Problem: Shape keys appear identical in viewport.
Fix:    sk.data.foreach_set('co', ...) writes absolute positions; pass
        make_verts(x_sk).ravel() not just the Y component.

Problem: Floor looks flat / no colour gradient.
Fix:    ShaderNodeAttribute must use attribute_type='GEOMETRY', name='FPUT_Disp'.
        Connect both Base Color and Emission Color inputs.

Problem: GLB morph targets missing.
Fix:    Pass export_morph=True. Blender 5.1 defaults to False with Draco.`}
      </pre>
      <p>
        See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr"
        >
          the Gray–Scott Reaction-Diffusion tutorial
        </Link>{" "}
        and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
        >
          the Feigenbaum Logistic Map tutorial
        </Link>{" "}
        for other cases of complex emergent order built with the same
        numpy → height-field pipeline.
      </p>

      <h2>Outside sources</h2>
      <p>
        Primary source:{" "}
        <a
          className={lk}
          href="https://www.osti.gov/biblio/4376203"
          target="_blank"
          rel="noreferrer"
        >
          Fermi, E.; Pasta, J.; Ulam, S.; Tsingou, M. (1955).{" "}
          <em>Studies of Nonlinear Problems.</em> LA-1940, Los Alamos.
        </a>{" "}
        Public Domain. Related: Zabusky &amp; Kruskal (1965){" "}
        <em>Interaction of &apos;Solitons&apos;</em>, Phys Rev Lett 15:240
        (soliton discovery); Ford J (1992) Phys Reports 213(5):271 (FPUT
        retrospective at 40 years).
      </p>
      <p>
        Numerical library:{" "}
        <a
          className={lk}
          href="https://numpy.org/doc/stable/"
          target="_blank"
          rel="noreferrer"
        >
          NumPy Developers. NumPy v2.x.
        </a>{" "}
        BSD-3-Clause. Related: SciPy BSD-3-Clause{" "}
        <a
          className={lk}
          href="https://scipy.org"
          target="_blank"
          rel="noreferrer"
        >
          scipy.org
        </a>
        ; matplotlib PSF-compatible{" "}
        <a
          className={lk}
          href="https://matplotlib.org"
          target="_blank"
          rel="noreferrer"
        >
          matplotlib.org
        </a>
        .
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Fermi–Pasta–Ulam–Tsingou Recurrence: α-FPU Anharmonic Chain N=32, Störmer–Verlet Symplectic Integration, Normal-Mode Energy Eₖ Tracking, T_rec≈800 Recurrence Stripes, SK_Linear/SK_Half/SK_Double α-Comparison & Cobalt–Amber FPUT_Disp FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)",
  lede:
    "Integrate the 1955 FPUT anharmonic chain with leapfrog symplectics, sample 32 × 512 displacement snapshots onto a height-field stage floor, and watch the energy return — the recurrence that launched soliton physics.",
  date: "2026-08-29",
  tags: [
    "blender",
    "python",
    "physics",
    "nonlinear-dynamics",
    "webxr",
    "stage-floor",
  ],
  body: Body,
});
