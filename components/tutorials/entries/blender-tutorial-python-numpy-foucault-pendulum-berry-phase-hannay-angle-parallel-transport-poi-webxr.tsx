import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-foucault-pendulum-berry-phase-hannay-angle-parallel-transport-poi-webxr";

function Body() {
  return (
    <>
      <h2>The floor rotates; the pendulum does not</h2>
      <p>
        On the 3rd of January 1851 Léon Foucault hung a 5 kg iron ball on an 11 m
        piano wire from the ceiling of his Paris cellar and let it swing. The plane
        of oscillation rotated clockwise relative to the floor. He repeated the
        demonstration at the Paris Observatory on an 11 m wire, then famously at the
        Panthéon on 8 February 1851 using a 28 kg ball on a 67 m wire, where the
        plane rotated through 270° over the day. Every visitor could verify,
        without any calculation, that the Earth turns.
      </p>
      <p>
        The pendulum is not being twisted. It has no memory of the floor beneath it.
        It is mechanically free to swing in any direction, and it swings in a fixed
        direction relative to the distant stars. It is the ground below — and
        everything bolted to it, including the room and the observers — that slowly
        pivots. The rotation they measured was Earth&rsquo;s own rotation, projected onto
        the local vertical.
      </p>
      <p>
        The Blender prop in this tutorial traces that rotation. It is a closed tube
        swept along the exact analytic path of the pendulum bob over one complete
        precession cycle. The result is a flat rosette disc of interlaced loops — the
        kind of pattern a poi head would leave in phosphorescent paint if you
        swung it above a slowly rotating turntable.
      </p>

      <h2>Rotating-frame equations of motion</h2>
      <p>
        Write the pendulum&rsquo;s position as the complex number z&nbsp;=&nbsp;x&nbsp;+&nbsp;iy
        in the horizontal plane (xy being the floor). In the Earth&rsquo;s rotating frame,
        the pendulum feels a Coriolis acceleration{" "}
        −2&thinsp;<strong>Ω</strong>&nbsp;&times;&nbsp;<strong>v</strong>. Only the
        vertical component Ω_z&nbsp;=&nbsp;Ω_Earth&nbsp;·&nbsp;sin&thinsp;λ matters
        (horizontal components average away over an oscillation). The equations of
        motion collapse to a single complex ODE:
      </p>
      <pre>{`z̈ + 2i·Ω_z·ż + ω₀²·z = 0

where  ω₀ = √(g/L)   natural frequency
       Ω_z = Ω⊕·sinλ  effective Coriolis rate at latitude λ`}</pre>
      <p>
        This is the equation of a harmonic oscillator with imaginary damping — not
        true damping (energy is conserved) but a phase-rotation term that couples
        x to ẏ and y to ẋ. Its presence is a signature of any rotating frame.
      </p>

      <h2>Analytic solution — the closed rosette</h2>
      <p>
        With initial conditions z(0)&nbsp;=&nbsp;A, ż(0)&nbsp;=&nbsp;0 the
        exact solution is:
      </p>
      <pre>{`z(t) = A · cos(ω′t) · exp(−i·Ω_z·t)

where ω′ = √(ω₀² + Ω_z²) ≈ ω₀   (Ω_z ≪ ω₀ in practice)`}</pre>
      <p>
        The factor <code>exp(−i·Ω_z·t)</code> is pure rotation: the swing axis turns at
        angular velocity Ω_z. The factor <code>A·cos(ω′t)</code> is the oscillating
        amplitude. Together they trace the following real locus:
      </p>
      <pre>{`x(t) =  A · cos(ω₀t) · cos(Ω_z·t)
y(t) = −A · cos(ω₀t) · sin(Ω_z·t)`}</pre>
      <p>
        The path is a <em>closed</em> curve. After one precession period
        T_prec&nbsp;=&nbsp;2π/Ω_z, the exponential has gone once around the unit
        circle, and z(T_prec)&nbsp;=&nbsp;A·cos(ω₀T_prec)·1. For the path to return
        exactly to its starting point we need cos(ω₀T_prec)&nbsp;=&nbsp;1, meaning
        T_prec is an exact integer multiple of the pendulum period
        T_pend&nbsp;=&nbsp;2π/ω₀. That integer is N_PETALS&nbsp;=&nbsp;T_prec/T_pend&nbsp;=&nbsp;ω₀/Ω_z.
        Choosing N_PETALS to be a positive integer guarantees closure and determines
        the number of petals in the rosette.
      </p>

      <h2>Berry phase and Hannay angle</h2>
      <p>
        Michael Berry (1984) showed that quantum systems undergoing slow (adiabatic)
        cyclic change accumulate a geometric phase that depends only on the geometry
        of the path in parameter space, not on how fast the path is traversed.
        John Hannay (1985) derived the classical analogue. The Foucault pendulum is
        the most accessible example of either.
      </p>
      <p>
        The &ldquo;parameter&rdquo; for the pendulum is the direction of the zenith — where the
        ceiling points in space. As Earth rotates, the zenith traces a latitude circle
        on the sphere of all possible zenith directions (the celestial sphere). That
        circle is a closed loop. The holonomy of parallel transport around this loop —
        the amount the pendulum plane has rotated when the zenith returns to its
        starting direction — is the Berry / Hannay phase:
      </p>
      <pre>{`γ = 2π · sin(λ)   radians per sidereal day`}</pre>
      <p>
        The solid angle of the spherical cap <em>north</em> of latitude λ is
        Ω_cap&nbsp;=&nbsp;2π(1&nbsp;−&nbsp;sin&thinsp;λ). The geometric phase and the
        cap solid angle sum to exactly 2π:
      </p>
      <pre>{`γ + Ω_cap = 2π·sinλ + 2π(1−sinλ) = 2π`}</pre>
      <p>
        At the North Pole (λ&nbsp;=&nbsp;90°): γ&nbsp;=&nbsp;2π, the pendulum makes one
        full rotation per sidereal day. At the equator (λ&nbsp;=&nbsp;0°): γ&nbsp;=&nbsp;0,
        no precession at all. At the Panthéon in Paris (λ&nbsp;=&nbsp;48.87°):
        γ&nbsp;≈&nbsp;4.74 rad → T_prec&nbsp;≈&nbsp;31.8 h.
      </p>
      <p>
        The connection to{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
          the Hopf fibration
        </Link>{" "}
        is not accidental. Both are examples of holonomy: the failure of parallel
        transport to return a vector to its original orientation after circumnavigating
        a closed loop in a curved space. In the Foucault case the curved space is S²
        with the Levi-Civita connection; in the Hopf case it is the total space S³
        fibred over S². The mathematical structure is identical.
      </p>

      <h2>Poi connection — the Hannay angle for performers</h2>
      <p>
        Imagine spinning poi overhead in a horizontal plane, then walking in a
        tight circle while continuing to spin. When you have returned to your starting
        position, the plane of the poi spin has rotated by exactly the same Hannay
        angle γ&nbsp;=&nbsp;2π&thinsp;sin&thinsp;α, where α is the half-angle of the
        cone your walking circle subtends at the centre of the celestial sphere. The
        pendulum and the poi are executing the same parallel transport on S². This
        is why the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-euler-rigid-body-spinning-top-precession-poi-staff" className={lk}>
          spinning-top precession tutorial
        </Link>{" "}
        is required reading alongside this one: precession and holonomy are two
        descriptions of the same geometric fact.
      </p>

      <h2>Blueprint walkthrough — trajectory and Bishop tube</h2>
      <p>
        The trajectory is computed analytically from the solution above — no ODE
        solver is needed, though the derivation matches the standard
        <code>scipy.integrate.solve_ivp</code> formulation documented at
        docs.scipy.org (BSD-3-Clause). The parameters at the top of the file are:
      </p>
      <pre>{`OMEGA_0   = 1.0    # natural frequency (rad/s, scaled)
BASE_PET  = 7      # petals for Basis  →  Ω_z = ω₀/7
AMPLITUDE = 0.070  # poi outer radius (m)
TUBE_R    = 0.0028 # tube cross-section radius (m)
N_TRAJ    = 2800   # samples per precession cycle`}</pre>
      <p>
        Why N_TRAJ&nbsp;=&nbsp;2800? With BASE_PET&nbsp;=&nbsp;7 and a sinusoidal
        amplitude, each petal has 200 samples on its outbound half and 200 on the
        return, giving 400 samples per petal × 7 petals = 2800 total. At TUBE_R
        2.8 mm the tube chord length between adjacent samples is
        ~0.15 mm — far below the rendering resolution.
      </p>
      <p>
        The Bishop parallel-transport algorithm works identically to the version used
        in the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr" className={lk}>
          ABC flow streamlines tutorial
        </Link>:
        propagate the Bishop normal frame from vertex to vertex via the Rodrigues
        rotation formula, then extrude a ring of TUBE_SIDES (=8) vertices at each
        sample point. For a 2D planar path (z&nbsp;=&nbsp;0 throughout) the Bishop
        normal stays close to ẑ (the out-of-plane direction), which means the tube
        is genuinely round in 3D rather than collapsing to a ribbon.
      </p>
      <pre>{`def trajectory(n_petals):
    omega_z = OMEGA_0 / n_petals          # Ω_z = ω₀/N
    T       = 2 * pi / omega_z            # precession period
    t       = linspace(0, T, N_TRAJ, endpoint=False)
    # Analytic solution — no numerical integration needed
    x =  A * cos(OMEGA_0 * t) * cos(omega_z * t)
    y = -A * cos(OMEGA_0 * t) * sin(omega_z * t)
    return stack([x, y, zeros_like(t)], axis=1), t / T`}</pre>

      <h2>Colour encoding — precession as gradient</h2>
      <p>
        The FLOAT_COLOR attribute <code>Foucault_Phase</code> runs cobalt
        (0, 0.20, 0.95) at the start of the precession cycle to amber (1, 0.55, 0)
        at the end. Each ring of 8 tube vertices shares the same colour (the precession
        phase at that trajectory sample). When viewed from above, the 7-petal rosette
        shows a colour gradient spiralling outward: the first arm is deep cobalt, the
        last is warm amber. The direction of the gradient tells you which way the
        pendulum plane rotated — it is a clock encoded in the geometry.
      </p>

      <h2>Shape keys — four latitudes</h2>
      <p>
        Three additional shape keys demonstrate the latitude dependence. Every shape
        key is built by the same bishop_tube() call on a trajectory with a different
        N_PETALS. Because all trajectories have the same N_TRAJ samples and the same
        TUBE_SIDES sides, the mesh topology (face count, vertex count) is identical
        across all shape keys — Blender interpolates them cleanly:
      </p>
      <pre>{`SHAPE_KEYS = [
    ("SK_Arctic",       5),   # λ ≈ 65° — tight 5-petal, fast precession
    ("SK_Subtropical",  9),   # λ ≈ 30° — open 9-petal, slow precession
    ("SK_Tropical",    12),   # λ ≈ 22° — very open 12-petal
]`}</pre>
      <p>
        Morphing from Basis (7 petals) to SK_Arctic (5 petals) in the Blender
        timeline shows the petals retracting as if the pendulum is being
        moved to a higher latitude — fewer swings are needed per precession cycle
        because the Coriolis rate is higher nearer the pole.
      </p>

      <h2>Failure modes and what to check</h2>
      <p>
        The most common mistake is setting <code>endpoint=True</code> in
        <code>linspace</code>. That duplicates the first vertex at the last ring
        position, creating a visible seam in the closed tube where one extra ring
        slightly overlaps its neighbour. Always use <code>endpoint=False</code> for
        closed-curve tubes.
      </p>
      <p>
        If the tube looks twisted — spiral ridges running along the tube length
        rather than smooth quads — the Bishop transport has accumulated a net twist.
        For a planar path this should never happen. Check that the initial normal
        is genuinely perpendicular to the first tangent:
      </p>
      <pre>{`n0 = up - dot(up, T[0]) * T[0]   # project out tangent component
n0 /= norm(n0)                    # normalise — if norm ≈ 0, choose different up`}</pre>
      <p>
        If the path is momentarily tangent to ẑ (the path enters a vertical segment),
        the cross product becomes degenerate. Switch to a fallback up vector:
        <code>up = (0, 1, 0)</code> or any vector not parallel to the first tangent.
        For this tutorial the path is strictly horizontal (z&nbsp;=&nbsp;0 always) so
        ẑ is safe throughout.
      </p>
      <p>
        If the GLB export reports missing shape keys, verify that
        <code>export_morph=True</code> is set in the gltf exporter call. Blender 5.1
        defaults to False for shape key (morph target) export.
      </p>

      <h2>Outside sources</h2>
      <p>
        <strong>Léon Foucault (1851).</strong> &ldquo;Démonstration physique du mouvement
        de rotation de la Terre au moyen du pendule.&rdquo; <em>Comptes Rendus de
        l&rsquo;Académie des Sciences</em>, vol. 32, pp. 135–138. Public Domain.
        Digitised facsimile available at{" "}
        <a href="https://gallica.bnf.fr" className={lk} target="_blank" rel="noopener noreferrer">
          gallica.bnf.fr
        </a>{" "}
        (Bibliothèque nationale de France public-domain digitisation project).
        Related: Foucault&rsquo;s 1852 gyroscope paper (same archive, PD); Wikipedia
        &ldquo;Foucault pendulum&rdquo; (CC BY-SA 4.0) for full derivation with all signs.
      </p>
      <p>
        <strong>SciPy community.</strong>{" "}
        <a
          href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.integrate.solve_ivp.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          scipy.integrate.solve_ivp
        </a>{" "}
        documentation. BSD-3-Clause licence. The analytic solution used in this
        blueprint matches the canonical ODE form described there; no external
        dependency is required because we solve exactly.
        Related upstream projects:{" "}
        <a href="https://github.com/scipy/scipy" className={lk} target="_blank" rel="noopener noreferrer">
          scipy/scipy
        </a>{" "}
        (BSD-3-Clause) and{" "}
        <a href="https://github.com/numpy/numpy" className={lk} target="_blank" rel="noopener noreferrer">
          numpy/numpy
        </a>{" "}
        (BSD-3-Clause).
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-euler-rigid-body-spinning-top-precession-poi-staff" className={lk}>
            Euler Rigid Body — Spinning Top &amp; Precession
          </Link>{" "}
          — companion precession tutorial; Euler angles meet the same
          Ω_Earth · sin λ formula from a Lagrangian perspective.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
            Hopf Fibration S³ → S² Fiber Bundle
          </Link>{" "}
          — same parallel-transport holonomy on S² at higher abstraction;
          the Foucault pendulum is holonomy of the Levi-Civita connection
          on S² while the Hopf fibration is holonomy of the U(1) connection
          on S³ → S².
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr" className={lk}>
            ABC Flow Beltrami &amp; RK4 Streamlines
          </Link>{" "}
          — Bishop parallel-transport tube technique applied to a 3D vector
          field; all tube geometry code is directly reusable here.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Foucault Pendulum: Berry Phase γ=2π·sinλ, Coriolis-Frame Analytic Rosette z(t)=A·cos(ω₀t)·exp(−iΩ_z t), Hannay Angle Holonomy on S² & Cobalt–Amber Parallel-Transport Tube Poi Disc for WebXR (Blender 5.1)",
  tags: ["blender", "scripting", "python", "numpy", "physics", "poi", "webxr"],
  date: "2026-08-23",
  blends: [
    {
      label: "blueprint",
      path: `public/library/blends/scripting/${SLUG.replace("blender-tutorial-", "")}/blueprint.py`,
    },
  ],
  body: Body,
});
