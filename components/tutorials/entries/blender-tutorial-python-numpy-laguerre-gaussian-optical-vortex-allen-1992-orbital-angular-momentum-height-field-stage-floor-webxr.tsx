import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-laguerre-gaussian-optical-vortex-allen-1992-orbital-angular-momentum-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Laguerre–Gaussian Optical Vortex Beams: " +
  "Allen Beijersbergen Spreeuw Woerdman 1992 " +
  "LG_p^l(r,φ,0)=C_pl·(√2r/w₀)^|l|·L_p^|l|(2r²/w₀²)·exp(−r²/w₀²)·exp(i·l·φ) " +
  "Topological Charge l Orbital Angular Momentum ℏl/Photon " +
  "Phase Singularity r=0 Dark Vortex Core " +
  "Associated Laguerre Polynomial Three-Term Recurrence " +
  "Basis(l=1 p=0 single-ring)/SK_l2(l=2 wider-ring)/SK_l3(l=3 star)/SK_p1(l=1 p=1 two-rings) " +
  "LG_Phase |sin(l·φ/2)| Cobalt–Amber Petal Colour " +
  "128×128=16384V 16129Q Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Allen, Beijersbergen, Spreeuw and Woerdman showed in 1992 that " +
  "Laguerre–Gaussian laser beams carry a quantised orbital angular momentum " +
  "of ℏl per photon — a mechanical torque resource entirely independent of " +
  "polarisation spin. " +
  "The azimuthal phase factor exp(i·l·φ) forces the optical field to zero " +
  "on axis, creating a phase singularity — an optical vortex — surrounded by " +
  "one or more bright intensity rings whose radius grows with |l|. " +
  "This blueprint evaluates the closed-form LG mode analytically on a 128×128 " +
  "grid using a numerically stable three-term Laguerre recurrence, " +
  "maps the helical phase to a cobalt–amber petal colour attribute, " +
  "and morphs four shape keys across topological-charge and radial-index space " +
  "to reveal the full LG family in a single WebXR stage-floor scene.";

function Body() {
  return (
    <>
      <p>
        In the early 1990s, researchers studying the angular momentum of light
        realised that photons carry not only spin angular momentum (linked to
        circular polarisation) but also an entirely separate <em>orbital</em>{" "}
        contribution linked to the spatial structure of the beam itself.  Allen,
        Beijersbergen, Spreeuw and Woerdman quantified this in 1992, showing
        that a Laguerre–Gaussian beam LG<sub>p</sub><sup>l</sup> carries exactly
        ℏl of orbital angular momentum per photon — where l can be any integer,
        positive or negative.  A beam with l=10 can spin a trapped particle ten
        times harder than an l=1 beam of equal power.
      </p>
      <p>
        The key feature is the azimuthal phase factor exp(i·l·φ), where φ is
        the polar angle around the beam axis.  As φ runs from 0 to 2π, the
        phase completes l full cycles — the wavefront is a helix rather than a
        plane.  At r=0 the field is the superposition of all phases at once,
        which is undefined: the amplitude must be exactly zero.  This phase
        singularity — the dark hollow at the beam centre — is topologically
        protected; you cannot remove it by smooth deformation of the beam
        without changing l.  It is the optical analogue of a quantised vortex
        in a superfluid.
      </p>
      <p>
        This entry is philosophically related to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          className={lk}
        >
          spherical harmonics / atomic orbital tutorial
        </Link>{" "}
        — both visualise solutions of a linear wave equation parameterised by
        integer quantum numbers (l,p here; l,m there), and both use shape keys
        to sweep parameter space.  The difference is dimensionality: spherical
        harmonics live on the surface of a sphere (2D angular problem), whereas
        LG modes live in the transverse plane of a propagating beam (2D Cartesian
        with circular symmetry).
      </p>

      <h2>The LG field at the beam waist</h2>
      <p>
        At z=0 (the beam waist, where the beam is narrowest and the wavefront is
        flat), the LG field simplifies to:
      </p>
      <pre className="overflow-x-auto text-sm">{`LG_p^l(r,φ,0) = C_pl · (√2 r/w₀)^|l| · L_p^|l|(2r²/w₀²)
              · exp(−r²/w₀²) · exp(i·l·φ)

C_pl = √[ 2 p! / (π (p+|l|)!) ] / w₀   (normalisation — ‖LG‖²=1)`}</pre>
      <p>
        The radial part, (√2 r/w₀)<sup>|l|</sup> · L<sub>p</sub><sup>|l|</sup>,
        is an associated Laguerre polynomial multiplied by a power law that
        enforces the central zero for l≠0.  For p=0 there is one bright ring;
        for p=1 there are two; and so on.  The peak intensity radius for the
        p=0 mode satisfies r<sub>max</sub> = w₀√(|l|/2), growing with charge.
      </p>
      <p>
        The blueprint computes this analytically using a three-term recurrence
        for L<sub>p</sub><sup>α</sup>(x):
      </p>
      <pre className="overflow-x-auto text-sm">{`L_0^α(x) = 1
L_1^α(x) = 1 + α − x
L_{k+1}^α(x) = ((2k+1+α−x)·L_k^α − (k+α)·L_{k-1}^α) / (k+1)

WHY recurrence: avoids factorial cancellation instabilities
that plague the explicit-sum form at large p.`}</pre>

      <h2>Colour: making the topological charge visible</h2>
      <p>
        The colour attribute <code>LG_Phase</code> encodes the helical phase
        l·φ as <code>|sin(l·φ/2)|</code>, mapped from cobalt (node between
        petals) to amber (petal peak).  For l=1 you see one cobalt→amber sweep
        per revolution; for l=2 two alternating pairs; for l=3 three.  This
        makes the topological charge legible from a top-down view without
        needing to animate the phase.
      </p>
      <p>
        A related phase-encoding approach appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-tight-binding-2d-square-lattice-dispersion-fermi-surface-van-hove-singularity-stage-floor-webxr"
          className={lk}
        >
          tight-binding band-structure floor
        </Link>
        , where the Bloch phase across the Brillouin zone is similarly encoded
        as a colour attribute on a square grid.
      </p>

      <h2>Shape keys</h2>
      <p>
        Four shape keys explore the LG family:
      </p>
      <ul>
        <li>
          <strong>Basis</strong> — l=1, p=0.  The canonical doughnut: a single
          bright ring with one dark-core singularity.  The peak radius is
          w₀/√2 ≈ 0.71 w₀.
        </li>
        <li>
          <strong>SK_l2</strong> — l=2, p=0.  The ring shifts outward to
          r_max = w₀.  The topological charge doubles; two-petal colour pattern.
        </li>
        <li>
          <strong>SK_l3</strong> — l=3, p=0.  Three-petal star; r_max = w₀√(3/2)
          ≈ 1.22 w₀.  Note that the peak intensity drops as the ring spreads.
        </li>
        <li>
          <strong>SK_p1</strong> — l=1, p=1.  The radial quantum number adds a
          second bright ring outside the first.  The inner ring carries most
          power; the outer is the p=1 radial excitation.
        </li>
      </ul>

      <h2>Blueprint walkthrough</h2>
      <p>
        <strong>Grid construction.</strong>  A 128×128 Cartesian grid is built
        via bmesh rather than <code>bpy.ops.mesh.primitive_grid_add</code> —
        operators are context-dependent and can silently fail in a scripted
        session without a 3D VIEW area.  The grid spans ±3.5 beam waists in
        both x and y, which captures &gt;99.9% of the mode energy even for p=1.
      </p>
      <p>
        <strong>Height normalisation.</strong>  All shape keys normalise to the
        Basis (l=1, p=0) peak intensity so the floor never extends below z=0
        and no key dominates the scene scale.  This is crucial for morph-target
        animation: Blender interpolates vertex positions linearly, so
        mismatched scales create physically meaningless intermediate states.
      </p>
      <p>
        <strong>GLB export.</strong>  Draco compression level 6 reduces file
        size by ~75% with no perceptible quality loss on a regular quad grid.
        The <code>LG_Phase</code> FLOAT_COLOR attribute is carried as a{" "}
        <code>_LG_Phase</code> custom accessor; Three.js and Babylon.js both
        expose it via a Named Attribute node in their node material systems.
      </p>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Flat grid</strong> — if z stays at zero, check that
          <code>math.factorial(p + abs(l))</code> does not overflow for large
          p,l.  The recurrence avoids this, but the normalisation constant
          uses <code>math.factorial</code> directly.  For p&gt;10 use
          <code>scipy.special.gammaln</code> for log-space arithmetic.
        </li>
        <li>
          <strong>Wrong colour domain</strong> — if the colour appears uniform,
          confirm <code>FLOAT_COLOR</code> is created on the <code>POINT</code>{" "}
          domain (not CORNER).  Blender 5.1 defaults to CORNER for new
          attributes; POINT is required for per-vertex morph-target compatibility.
        </li>
        <li>
          <strong>Black material in EEVEE</strong> — add a world shader or
          at least one area light; EEVEE Next requires geometry to receive
          at least ambient illumination for the mix shader to show emission.
        </li>
      </ul>

      <h2>Applications</h2>
      <p>
        LG beams drive optical tweezers that grip and spin micron-scale objects
        (Padgett &amp; Bowman 2011), free-space optical communications systems
        that multiplex data streams by OAM channel, and quantum information
        protocols that encode a qudit in a single photon's orbital state.  The
        topological charge l is remarkably robust against atmospheric turbulence
        in short propagation paths, making it attractive for city-scale quantum
        key distribution.
      </p>
      <p>
        The topology of the phase singularity is also directly analogous to
        vortex strings in condensed matter — the same integer winding number
        appears in superfluid helium vortices, superconductor flux tubes, and
        defect lines in liquid crystals.  Compare the Hopf fibration tutorial{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr"
          className={lk}
        >
          (Hopf fibration — linked tori)
        </Link>{" "}
        for a related topological structure in higher dimensions.
      </p>
      <p>
        For another perspective on wave-equation solutions as WebXR height fields,
        see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr"
          className={lk}
        >
          Kelvin–Helmholtz spectral vorticity floor
        </Link>
        , where the height encodes vorticity rather than beam intensity.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Allen L, Beijersbergen MW, Spreeuw RJC, Woerdman JP (1992)
          "Orbital angular momentum of light and the transformation of
          Laguerre–Gaussian laser modes"
          <em>Physical Review A</em> <strong>45</strong>(11):8185–8189.{" "}
          <a
            href="https://doi.org/10.1103/PhysRevA.45.8185"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1103/PhysRevA.45.8185
          </a>{" "}
          — founding paper; equations are in the public domain.
          Related sibling work: Padgett MJ &amp; Allen L (1995)
          Opt. Commun. 121(1-3):36–40 (OAM in Bessel beams).
        </li>
        <li>
          NIST Digital Library of Mathematical Functions §18.3 — Laguerre
          polynomials. US Government public domain.{" "}
          <a
            href="https://dlmf.nist.gov/18.3"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dlmf.nist.gov/18.3
          </a>
          .  Related: DLMF §13 (Kummer functions, same recurrence family).
        </li>
        <li>
          NumPy BSD-3-Clause.{" "}
          <a
            href="https://numpy.org"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            numpy.org
          </a>{" "}
          github.com/numpy/numpy.
          Related: SciPy (BSD-3-Clause) —{" "}
          <code>scipy.special.eval_genlaguerre</code> for validated polynomial
          evaluation at large orders.
        </li>
      </ul>

      <h2>Related Holoflow tutorials</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
            className={lk}
          >
            Spherical harmonics — real SH atomic orbitals
          </Link>{" "}
          — integer quantum numbers l,m; same shape-key sweep technique.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr"
            className={lk}
          >
            Bloch sphere qubit — Rabi precession and Berry phase
          </Link>{" "}
          — phase-space geometry of a two-level quantum system.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr"
            className={lk}
          >
            Hopf fibration — S³→S² quaternion Villarceau circles
          </Link>{" "}
          — topological winding in higher dimensions.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-tight-binding-2d-square-lattice-dispersion-fermi-surface-van-hove-singularity-stage-floor-webxr"
            className={lk}
          >
            Tight-binding 2-D band dispersion — Fermi surface, Van Hove singularity
          </Link>{" "}
          — another quantum-physics height-field floor.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr"
            className={lk}
          >
            Kelvin–Helmholtz shear instability — spectral vorticity floor
          </Link>{" "}
          — stage-floor format with cobalt–amber colour encoding.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  publishedAt: "2026-09-06",
  tags: ["blender", "scripting", "python", "numpy", "optics", "quantum", "height-field", "webxr"],
  body: <Body />,
});
