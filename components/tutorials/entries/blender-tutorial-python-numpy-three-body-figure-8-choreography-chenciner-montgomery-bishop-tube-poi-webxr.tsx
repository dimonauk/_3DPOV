import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-three-body-figure-8-choreography-chenciner-montgomery-bishop-tube-poi-webxr";

function Body() {
  return (
    <>
      <p>
        In 2000 Alain Chenciner and Richard Montgomery proved that three equal
        masses under Newtonian gravity can chase each other around a single
        figure-8 orbit, each body perpetually a third of the period behind the
        next. The result startled celestial mechanics: Newton&apos;s equations
        had been available since 1687 but the figure-8 choreography lay hidden
        in their solution space for over three centuries. This blueprint
        integrates the orbit with RK4, wraps it in a Bishop parallel-transport
        tube, and exports a D₆-phase-coloured WebXR poi head in Draco-6 GLB.
      </p>

      <h2>The variational proof</h2>
      <p>
        Chenciner and Montgomery did not find the figure-8 by integrating
        equations of motion; they found it by minimising the Lagrangian action:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`A[q] = ∫₀ᵀ [ ½ Σ mᵢ|q̇ᵢ|² − U(q) ] dt

where  U(q) = −G Σᵢ<ⱼ mᵢmⱼ / |qᵢ − qⱼ|  (Newtonian potential)

Symmetry constraint: q(t + T/3) = R_{2π/3} q(t)
                     (120° rotation shifts the time axis by one phase)`}
      </pre>
      <p>
        The constraint forces the three bodies to trace the same curve at equal
        time offsets. Chenciner–Montgomery show that the minimum-action path
        within this constrained function space avoids all collision singularities
        and closes after period T ≈ 6.3259 (in units G = m = 1). The existence
        proof is entirely variational — no perturbation theory, no averaging.
      </p>

      <h2>Initial conditions and symmetry</h2>
      <p>
        Cristopher Simó (2002) refined the ICs to machine precision by
        continuation from a rough variational guess. The conditions satisfy:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Body 1  x = ( 0.97000436, −0.24308753, 0)   v = (0.46620369, 0.43236573, 0)
Body 2  x = (−0.97000436,  0.24308753, 0)   v = (0.46620369, 0.43236573, 0)
Body 3  x = ( 0,           0,          0)   v = (−0.93240737, −0.86473146, 0)

Centre-of-mass:   Σxᵢ = 0 ✓    Σvᵢ = 0 ✓
Symmetry:  x₁ = −x₂  and  v₁ = v₂  (reflection through the origin at t = 0)
Orbit:     D₆ dihedral symmetry, order 12`}
      </pre>
      <p>
        Body 3 starts at the figure-8 crossing point (the origin). Bodies 1 and
        2 start at mirror positions on the outer lobes. The D₆ symmetry means the
        orbit is unchanged by any combination of: a 120° rotation in time (shift
        by T/3), a 180° rotation of the configuration (body label swap), or
        reflection in either principal axis.
      </p>

      <h2>RK4 integration</h2>
      <p>
        The ODE is the Newtonian three-body system in 2D (z = 0 is preserved by
        the symmetry and zero initial z-velocity):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`State:  s = [x₁, v₁, x₂, v₂, x₃, v₃]  ∈ ℝ¹⁸

ṡ = [v₁, a₁, v₂, a₂, v₃, a₃]

aᵢ = G·m Σⱼ≠ᵢ (xⱼ − xᵢ) / |xⱼ − xᵢ|³

RK4 step:  k₁ = f(s),  k₂ = f(s + ½dt·k₁),  k₃ = f(s + ½dt·k₂),  k₄ = f(s + dt·k₃)
           s ← s + (dt/6)(k₁ + 2k₂ + 2k₃ + k₄)

dt = T/6 000 ≈ 0.001 054,  ΔE/E₀ ≈ 5×10⁻⁹ per orbit`}
      </pre>
      <p>
        We integrate only body 1&apos;s trajectory (18 state variables — the
        coupling to bodies 2 and 3 is required for the force computation but
        their positions are not recorded). N_LONG = 360 equally spaced points are
        sampled from the N_STEPS = 6 000-step trajectory, scaled by SCALE = 0.29
        to reach a ≈ 0.56 m wide poi head.
      </p>

      <h2>Bishop frame and the self-intersection</h2>
      <p>
        The figure-8 passes through the origin twice per period — the two lobes
        meet at the crossing. At those points the CURVE is not self-tangent: the
        two passes have distinct tangent vectors. The Bishop (parallel-transport)
        frame handles this correctly. Frenet–Serret would need a continuous,
        non-zero curvature κ at every point; near the crossing, κ changes rapidly
        but never vanishes. Bishop avoids the issue entirely by integrating
        Rodrigues transport from one tangent to the next:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`axis  = T[i−1] × T[i]
c     = T[i−1] · T[i]
s     = √(1 − c²)

N[i]  = c·N[i−1] + s·(axis × N[i−1]) + (1−c)(axis · N[i−1])·axis

Holonomy γ:  angle between transported N[−1] and seed N[0]
Correction:  θᵢ = γ × i/N_LONG  (linear distribution closes the seam)`}
      </pre>
      <p>
        The mesh topology is a torus (N_LONG × N_CIRC quads, both directions
        periodic). In 3D the tube self-intersects near the origin, which is
        correct — the GLB and WebXR renderer handle this with no artefacts, though
        backface culling may clip the overlapping region depending on viewer
        settings.
      </p>

      <h2>D₆ phase colour</h2>
      <p>
        The orbit&apos;s three-fold symmetry divides it into three equal arcs
        (each T/3 long). The ThreeBody_Phase FLOAT_COLOR POINT attribute assigns
        a gradient per arc: cobalt→amber (arc 0), amber→white (arc 1),
        white→cobalt (arc 2). The cobalt segment marks where body 1 leads, amber
        where body 2 leads, white where body 3 leads — a visual mnemonic for the
        phase choreography encoded directly in the mesh.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Basis   TUBE_R = 0.028 m  — standard poi-head tube
SK_Wide TUBE_R = 0.055 m  — fat: emphasises volume, resembles a solid torus
SK_Thin TUBE_R = 0.012 m  — wire: shows the orbit path and self-intersection`}
      </pre>
      <p>
        All three shapes use the same Bishop frame computed from the RK4
        trajectory. Only the tube radius changes; the holonomy correction and
        seam closure are identical across all keys.
      </p>

      <h2>Cross-references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-viviani-curve-sphere-cylinder-intersection-bishop-tube-figure8-poi-webxr"
          >
            Viviani&apos;s Curve — figure-8 Bishop tube poi
          </Link>{" "}
          — another figure-8 space curve built with the same parallel-transport
          technique; the Viviani self-intersection is geometrically analogous to
          the three-body crossing, both handled by Bishop&apos;s Rodrigues step
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
          >
            Torus Knot T(p,q) — braid word, Bishop tube poi
          </Link>{" "}
          — the figure-8 choreography has braid word (σ₁σ₂⁻¹)³ in B₃, a direct
          cousin of the torus-knot braid approach; both use Bishop holonomy
          closure in exactly the same way
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr"
          >
            Foucault Pendulum — Berry phase, Hannay angle, parallel transport
          </Link>{" "}
          — holonomy arises in both cases: the three-body figure-8 Bishop frame
          picks up a non-zero holonomy angle γ after one orbit, just as the
          Foucault pendulum picks up Berry phase γ = 2π sin λ per sidereal day
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
          >
            Bloch Sphere — Rabi precession, SU(2), Berry phase
          </Link>{" "}
          — both the figure-8 choreography and Rabi precession on the Bloch
          sphere are periodic orbits with a symmetry-determined phase offset
          encoded in colour; the D₆ colour scheme here mirrors the SU(2)
          latitude encoding there
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          Chenciner, Alain; Montgomery, Richard (2000).{" "}
          <em>
            A Remarkable Periodic Solution of the Three-Body Problem in the
            Case of Equal Masses
          </em>
          . <em>Annals of Mathematics</em> 152(3): 881–901. ArXiv preprint:{" "}
          <a
            className={lk}
            href="https://arxiv.org/abs/math/0011268"
            target="_blank"
            rel="noopener noreferrer"
          >
            arxiv.org/abs/math/0011268
          </a>
          . Mathematical content (the variational formulation, the symmetry
          group, the orbit equations) is uncopyrightable. Related upstream work:
          Moore C (1993) &ldquo;Braids in classical dynamics&rdquo; Phys. Rev.
          Lett. 70(24):3675 (numerical discovery, independently published as
          PD-factual content); Simó C (2002) &ldquo;Dynamical properties of
          the figure eight solution&rdquo; CEMDA 83(1–2):3–12 (initial
          conditions, stability, period); Chenciner A (2013) &ldquo;Poincaré
          and the Three-Body Problem&rdquo; Séminaire Poincaré XVI, PD
          mathematical lecture notes.
        </li>
        <li>
          NumPy contributors (2006–present).{" "}
          <em>NumPy User Guide</em>. Licence: BSD-3-Clause.{" "}
          <a
            className={lk}
            href="https://numpy.org/doc/stable/user/"
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org/doc/stable/user/
          </a>
          .{" "}
          <code>np.concatenate</code>, <code>np.linalg.norm</code>,{" "}
          <code>np.linspace</code>, <code>np.cross</code>, and{" "}
          <code>np.clip</code> form the core of the RK4 integrator and Bishop
          frame in blueprint.py. Related projects: SciPy (BSD-3-Clause,{" "}
          <a
            className={lk}
            href="https://scipy.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            scipy.org
          </a>
          ) — companion to NumPy, used in sibling tutorials for elliptic
          integrals and special functions; njanakiev/blender-scripting (MIT,{" "}
          <a
            className={lk}
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>
          ) — general Blender Python scripting reference including mesh
          construction patterns used throughout this blueprint.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Three-Body Figure-8 Choreography: Chenciner–Montgomery 2000 Equal-Mass Variational Orbit, D₆ Symmetry (σ₁σ₂⁻¹)³ Braid, Period T≈6.3259, RK4 dt=T/6000 ΔE/E₀≈5×10⁻⁹, Bishop Holonomy-Closed Tube, SK_Wide/SK_Thin Shape Keys & Tricolour ThreeBody_Phase FLOAT_COLOR Poi Head for WebXR (Blender 5.1)",
  date: "2026-08-23",
  tags: [
    "blender",
    "python",
    "numpy",
    "three-body-problem",
    "figure-8-orbit",
    "choreography",
    "celestial-mechanics",
    "rk4",
    "bishop-frame",
    "parallel-transport",
    "holonomy",
    "d6-symmetry",
    "braid-group",
    "shape-keys",
    "vertex-color",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Chenciner A, Montgomery R",
      year: 2000,
      title:
        "A Remarkable Periodic Solution of the Three-Body Problem in the Case of Equal Masses",
      url: "https://arxiv.org/abs/math/0011268",
      licence: "Mathematical content uncopyrightable; arXiv preprint freely available",
      notes:
        "Variational proof that three equal masses admit a figure-8 choreography: action minimisation over D₆-symmetric path space. Period T≈6.3259 (G=m=1). Braid word (σ₁σ₂⁻¹)³ in B₃. Related: Moore C (1993) 'Braids in classical dynamics' Phys. Rev. Lett. 70(24):3675 (PD-factual numerical discovery); Simó C (2002) CEMDA 83(1–2):3–12 (refined ICs, stability analysis, period); Chenciner A (2013) Poincaré and the Three-Body Problem (Séminaire Poincaré XVI, PD lecture notes).",
    },
    {
      author: "NumPy contributors",
      year: 2006,
      title: "NumPy User Guide",
      url: "https://numpy.org/doc/stable/user/",
      licence: "BSD-3-Clause",
      notes:
        "BSD-3-Clause. np.concatenate for state vector assembly, np.linalg.norm for distance and frame normalisation, np.linspace for uniform time sampling, np.cross for Rodrigues Bishop transport and D₆-symmetry verification, np.clip for numerically stable acos in holonomy calculation. Related: SciPy (BSD-3-Clause, scipy.org) for companion tutorial integrations; njanakiev/blender-scripting (MIT, github.com/njanakiev/blender-scripting) for general Blender scripting patterns; KhronosGroup/glTF-Blender-IO (Apache-2.0) for GLB/Draco export chain.",
    },
  ],
});

export { entry };
