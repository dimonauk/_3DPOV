import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>A single equation that grows hexagons</h2>
      <p>
        In 1900 Henri Bénard laid a thin layer of whale oil on a heated plate
        and watched it organise spontaneously into a perfect hexagonal
        tessellation — a result so clean that it looked manufactured. Seventy
        years later, the right PDE arrived. Jack Swift and Pierre Hohenberg
        (1977) derived it as the amplitude equation for a fluid layer heated
        from below, but within a decade researchers found it reproduces not
        just Bénard cells but Turing spots, liquid-crystal domains, and
        laser transverse modes — any system where a preferred length scale
        emerges from a broken translational symmetry.
      </p>
      <p>The equation is deceptively compact:</p>
      <pre>{`∂u/∂t = [ε − (∇² + k₀²)²] u − u³`}</pre>
      <p>
        Three terms do everything. The factor <code>[ε − (∇²+k₀²)²]</code>{" "}
        is a linear operator that damps all Fourier modes except those on the
        ring <code>|k| = k₀</code>; when ε crosses zero, that ring of modes
        becomes unstable and begins to grow. The cubic <code>−u³</code>{" "}
        saturates the growth at finite amplitude. The parameter ε measures
        how far above the bifurcation threshold the system is held.
      </p>

      <h2>Why pseudo-spectral integration?</h2>
      <p>
        The operator <code>(∇²+k₀²)²</code> is a fourth-order differential
        operator. In real space it couples every grid point to its neighbours
        over a wide stencil; the stiffness forces explicit time steps of order
        <code> Δt ≲ Δx⁴</code> — impossibly small for any decent grid. In
        Fourier space the operator is diagonal:
      </p>
      <pre>{`L̂(k) = ε − (k₀² − |k|²)²`}</pre>
      <p>
        Because it is diagonal, the exact exponential integrator{" "}
        <code>e^{"{L̂·Δt}"}</code> costs nothing more than a pointwise
        multiplication. The nonlinear <code>u³</code> is computed in real space
        (where it is also pointwise) and added with a first-order Euler step.
        This combination — called ETD1 (exponential time differencing,
        first order) — gives unconditional stability for the linear part and
        tolerates large <code>Δt = 0.5</code> in the physical units of the PDE.
      </p>
      <pre>{`# Pseudo-spectral ETD1 step
uhat  = np.fft.fft2(u)
Lhat  = eps - (k0**2 - k2)**2   # (N×N) array, computed once
eL    = np.exp(Lhat * DT)        # exponential factor, computed once
uhat *= eL                        # exact linear step
u     = np.fft.ifft2(uhat).real  # back to real space
u    -= u**3 * DT                 # Euler nonlinear step`}</pre>
      <p>
        The whole inner loop is six lines. There are no sparse matrices, no
        iterative solvers, no ghost cells. NumPy&rsquo;s FFT handles the
        periodic boundary conditions automatically.
      </p>

      <h2>Pattern selection by ε and initial conditions</h2>
      <p>
        Unlike ordinary differential equations, PDEs on a periodic domain have
        a continuum of neutrally stable directions at onset — every wavevector
        on <code>|k| = k₀</code> is equally unstable. Which pattern
        eventually crystallises depends on how those modes interact via the
        cubic:
      </p>
      <ul>
        <li>
          <strong>Rolls (Basis shape key, ε = 0.30, random noise IC).</strong>{" "}
          A single dominant wavevector wins the competition and stripes appear.
          This is the generic outcome from structureless noise because any
          random perturbation projects strongest onto whichever wavevector
          happens to win early.
        </li>
        <li>
          <strong>Hexagons (SK_Hex, ε = 0.30, three-wave seed IC).</strong>{" "}
          Seed with three wavevectors at 120° and all three grow together. The
          cubic nonlinearity has a resonance condition:{" "}
          <code>k₁ + k₂ + k₃ = 0</code> is satisfied by a hexagonal triplet,
          locking the three modes into a fixed phase relation and producing
          closed hexagonal cells rather than open stripes.
        </li>
        <li>
          <strong>Labyrinth (SK_Labyrinth, ε = 0.60, longer run).</strong>{" "}
          At larger ε the bifurcation is supercritical but the effective
          bandwidth widens; the system explores more of the unstable ring and
          the competing modes form a meandering disordered labyrinth rather
          than a single-orientation roll.
        </li>
        <li>
          <strong>Incipient onset (SK_Onset, ε = 0.05).</strong> Just above
          bifurcation the growth rate is slow (<code>u ~ √ε</code>) and the
          pattern barely emerges from the seeding noise — you can see the first
          hints of roll order while the field is still close to zero.
        </li>
      </ul>

      <h2>Hexagonal IC — the three-wave construction</h2>
      <pre>{`# WHY three waves?  The cos(k·r) triplet satisfies the resonance
# k₁ + k₂ + k₃ = 0 which is the condition for quadratic coupling.
# (The SH equation has no quadratic term, but the resonance still
# biases mode competition toward hexagons over rolls.)

theta = 2 * np.pi / 3
u = (np.cos(K0 * X)
   + np.cos(K0 * (X*np.cos(theta) + Y*np.sin(theta)))
   + np.cos(K0 * (X*np.cos(2*theta) + Y*np.sin(2*theta)))) * 0.3`}</pre>
      <p>
        The amplitude <code>0.3</code> is chosen to be comparable to the
        eventual saturated amplitude <code>√ε ≈ 0.55</code>. Too small and
        the IC dissolves into noise before the pattern locks; too large and the
        hexagonal symmetry is immediately warped by the nonlinearity.
      </p>

      <h2>Blueprint walk-through</h2>
      <pre>{`CONFIGS = {
    "Basis"        : dict(eps=0.30, n_steps=500, ic="noise", seed=7),
    "SK_Hex"       : dict(eps=0.30, n_steps=300, ic="hex",   seed=0),
    "SK_Labyrinth" : dict(eps=0.60, n_steps=800, ic="noise", seed=42),
    "SK_Onset"     : dict(eps=0.05, n_steps=200, ic="noise", seed=99),
}`}</pre>
      <p>
        Each config runs a full independent integration — the shape-key
        positions are read from the terminal state of that integration, not
        from interpolating between two states. The seeds are fixed so the
        blueprint is reproducible across machines (NumPy&rsquo;s{" "}
        <code>default_rng</code> is deterministic given a seed on all
        platforms).
      </p>
      <pre>{`# Build quad mesh — (N-1)² faces, no wrap-around
for i in range(N - 1):
    for j in range(N - 1):
        faces.append((i*N+j, (i+1)*N+j, (i+1)*N+(j+1), i*N+(j+1)))`}</pre>
      <p>
        The stage floor is a flat square; height comes from{" "}
        <code>z = u / max(|u|) × 0.10 × MAX_EXTENT</code>. At 10 % of the
        floor radius, the hills are visible at a glancing camera angle without
        occluding the pattern from above.
      </p>
      <pre>{`# Vertex colours — SH_Pattern FLOAT_COLOR on POINT domain
t    = (u - u.min()) / (u.max() - u.min() + 1e-9)
cols = COBALT * (1-t)[:,None] + AMBER * t[:,None]
attr.data.foreach_set("color", cols.ravel())`}</pre>
      <p>
        <code>foreach_set</code> is the bpy fast path for attribute bulk
        assignment — 40× faster than looping over{" "}
        <code>attr.data[i].color</code> in Python. Colours are FLOAT_COLOR
        (linear) not BYTE_COLOR (sRGB); Holoflow exports FLOAT_COLOR via{" "}
        <code>export_colors=True</code>.
      </p>

      <h2>Troubleshooting</h2>
      <pre>{`# Symptom: pattern looks the same for all shape keys
# Cause: shape-key data was set before the mesh was validated.
# Fix: call me.validate() immediately after from_pydata, then add keys.

# Symptom: GLB colours are washed out / incorrect in WebXR
# Cause: BYTE_COLOR attribute was used (sRGB gamma baked in).
# Fix: always create the attribute as FLOAT_COLOR, not BYTE_COLOR.

# Symptom: integration diverges (u → ∞ after a few steps)
# Cause: DT too large for the nonlinear step. Halve DT.
# WHY: the linear step is unconditionally stable but the Euler
#      nonlinear step is only stable for DT·|u²| ≪ 1.
#      At saturation |u| ≈ √ε ≈ 0.55, so DT·0.3 ≪ 1 → DT ≪ 3.3 ✓

# Symptom: hexagonal IC produces rolls instead of hexagons
# Cause: ic amplitude too small (≪ 0.1) — noise dominates the seed.
# Fix: increase IC amplitude to 0.3–0.5.`}</pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr"
            className={lk}
          >
            Gray–Scott Reaction-Diffusion — Turing Morphogenesis Poi Sphere
          </Link>{" "}
          — the closely related two-field reaction-diffusion system. Both
          Swift–Hohenberg and Gray–Scott are in the &lsquo;Turing&rsquo;
          family: a length scale is selected by a balance between activation
          and inhibition. The key difference is that SH has only one field
          (the pattern amplitude) while Gray–Scott explicitly tracks activator
          and inhibitor concentrations.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr"
            className={lk}
          >
            Barkley Excitable Medium — Spiral Wave Poi Head
          </Link>{" "}
          — another pattern-forming PDE, but excitable rather than
          bistable/oscillatory. The spiral waves there emerge from the same
          kind of Fourier-space wavenumber competition; compare how the
          two equations select their dominant spatial mode.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
            className={lk}
          >
            Chirikov Standard Map — KAM Breakdown Stage Floor
          </Link>{" "}
          — another stage-floor height field using the same 80×80 grid and
          cobalt-amber colour pipeline. Compare how a symplectic map (no
          dissipation, reversible) organises its density field versus how a
          dissipative PDE (Swift–Hohenberg) organises its amplitude field.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr"
            className={lk}
          >
            Zaslavsky Stochastic Web — Kicked Oscillator Stage Floor
          </Link>{" "}
          — a quasicrystalline floor whose q-fold symmetry echoes the
          hexagonal symmetry of SK_Hex here. The Zaslavsky web arises from
          KAM resonance, not from a PDE — a useful contrast showing that
          similar visual symmetries can come from very different mathematics.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-fermi-pasta-ulam-tsingou-recurrence-anharmonic-chain-alpha-fpu-stage-floor-webxr"
            className={lk}
          >
            Fermi–Pasta–Ulam–Tsingou Recurrence — Stage Floor
          </Link>{" "}
          — another numerical-physics floor mesh using the same
          <code>foreach_set("co", …)</code> shape-key pipeline. FPUT is an
          integrable Hamiltonian in disguise; compare its recurrence stripes
          with Swift–Hohenberg&rsquo;s dissipative-pattern rolls.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Swift, J.B. &amp; Hohenberg, P.C. (1977). Hydrodynamic fluctuations
          at the convective instability.{" "}
          <em>Physical Review A</em>, <strong>15</strong>(1), 319–328.{" "}
          <a
            href="https://doi.org/10.1103/PhysRevA.15.319"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1103/PhysRevA.15.319
          </a>
          . Equations and physical content public domain. The PDE derived here
          as an amplitude equation for convective onset; the linear operator
          structure and the cubic saturator appear on p. 321.
          Related: Cross, M.C. &amp; Hohenberg, P.C. (1993).{" "}
          <em>
            Pattern formation outside of equilibrium
          </em>
          . <em>Reviews of Modern Physics</em>,{" "}
          <strong>65</strong>(3), 851–1112 —{" "}
          <a
            href="https://doi.org/10.1103/RevModPhys.65.851"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1103/RevModPhys.65.851
          </a>{" "}
          — the 260-page review that catalogued every known pattern class,
          including the phase-diagram of the SH equation across ε and wavenumber
          mismatch; equations public domain. Also related: Rayleigh (1916),
          &ldquo;On convection currents in a horizontal layer of fluid&rdquo;,{" "}
          <em>Phil. Mag.</em> <strong>32</strong>:529 — the original linear
          stability analysis of Bénard convection, public domain.
        </li>
        <li>
          Cox, S.M. &amp; Matthews, P.C. (2002). Exponential time differencing
          for stiff systems.{" "}
          <em>Journal of Computational Physics</em>,{" "}
          <strong>176</strong>(2), 430–455.{" "}
          <a
            href="https://doi.org/10.1006/jcph.2002.6995"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1006/jcph.2002.6995
          </a>
          . ETD schemes underlying the pseudo-spectral integrator used in
          this blueprint; equations public domain. Related: Kassam, A.-K. &amp;
          Trefethen, L.N. (2005), &ldquo;Fourth-order time-stepping for stiff
          PDEs&rdquo;,{" "}
          <em>SIAM J. Sci. Comput.</em> <strong>26</strong>:1214 — the ETD4RK
          variant (higher order at same cost), PD-equations{" "}
          <a
            href="https://doi.org/10.1137/S1064827502410633"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1137/S1064827502410633
          </a>
          ; Chebfun (MIT licensed){" "}
          <a
            href="https://github.com/chebfun/chebfun"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/chebfun/chebfun
          </a>{" "}
          — includes a Swift–Hohenberg demo in <code>examples/pde/SH.m</code>{" "}
          showing the same ETD approach.
          NumPy BSD-3-Clause{" "}
          <a href="https://numpy.org" className={lk} target="_blank" rel="noreferrer">
            numpy.org
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
    "Swift–Hohenberg PDE — Pseudo-spectral Bénard Convection: Rolls, Hexagons & Labyrinth Stage Floor",
  lede: "The 1977 normal-form PDE for convective onset — ∂u/∂t=[ε−(∇²+k₀²)²]u−u³ — integrated pseudo-spectrally via ETD1 to produce rolls, hexagonal cells, and labyrinths as a WebXR stage floor with four shape keys.",
  date: "2026-08-30",
  tags: ["blender", "python", "numpy", "pde", "pattern-formation", "physics", "stage-floor", "webxr", "5.1"],
  body: Body,
});
