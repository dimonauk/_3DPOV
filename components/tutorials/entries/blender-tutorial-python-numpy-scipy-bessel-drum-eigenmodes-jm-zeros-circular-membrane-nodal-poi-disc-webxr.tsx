import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scipy-bessel-drum-eigenmodes-jm-zeros-circular-membrane-nodal-poi-disc-webxr";

function Body() {
  return (
    <>
      <p>
        Strike a circular drum and it vibrates in exact mathematical patterns
        called <strong>Bessel eigenmodes</strong>. Unlike the numerical
        approximations in a Geometry Nodes simulation, these solutions are
        analytically exact: the displacement at every point of the drumhead at
        every moment is given by a closed formula involving Bessel functions of
        the first kind. This blueprint computes six of those modes with{" "}
        <code>scipy.special.jn</code> and <code>jn_zeros</code>, bakes each as
        a shape key on a polar-grid poi disc, and colour-maps the nodal
        lines — the white stripes of zero displacement — directly into the
        vertex colour attribute so they need no extra geometry.
      </p>

      <h2>The wave equation on a disc</h2>
      <p>
        The 2D wave equation{" "}
        <code>
          ∂²u/∂t² = c²∇²u
        </code>{" "}
        on a disc of radius R with fixed rim (Dirichlet boundary condition{" "}
        <code>u(R, θ, t) = 0</code>) separates into temporal and spatial parts.
        The spatial part satisfies the Helmholtz equation:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`∇²Φ + k²Φ = 0      with   Φ(R, θ) = 0`}
      </pre>
      <p>
        Separating in polar coordinates <code>Φ(r, θ) = R(r)·Θ(θ)</code>:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Θ(θ) = cos(mθ)  or  sin(mθ)        m = 0, 1, 2, …
R(r)  = J_m(kr)                     (Bessel function, first kind)`}
      </pre>
      <p>
        The rim condition{" "}
        <code>J_m(kR) = 0</code> forces{" "}
        <code>
          kR = k<sub>mn</sub>
        </code>
        , the n-th positive zero of J<sub>m</sub>. Each pair (m, n) is an
        eigenmode with eigenfrequency{" "}
        <code>
          ω<sub>mn</sub> = c · k<sub>mn</sub> / R
        </code>
        :
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`u_{m,n}(r, θ) = J_m(k_{mn} r / R) × cos(mθ)`}
      </pre>

      <h2>Nodal structure — reading the mode from its pattern</h2>
      <p>
        Every (m, n) mode has two types of nodal line (where displacement is
        exactly zero):
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>n − 1 interior nodal circles</strong> at{" "}
          <code>
            r = R × j<sub>m,k</sub> / j<sub>m,n</sub>
          </code>{" "}
          for k = 1 … n−1. (Plus the rim at r = R itself.)
        </li>
        <li>
          <strong>2m nodal diameters</strong> at{" "}
          <code>θ = π(2l + 1)/(2m)</code> for l = 0 … m−1.
        </li>
      </ul>
      <p>
        You can read the mode label (m, n) directly from the visual: count the
        white diameters crossing the disc, that is m; count the white circles
        inside the rim, that is n−1. The six modes in the blueprint are:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`SK_Mode_0_1   m=0, n=1  —  0 diameters, 0 circles  (fundamental dome)
SK_Mode_1_1   m=1, n=1  —  1 diameter,  0 circles  (sloshing mode)
SK_Mode_2_1   m=2, n=1  —  2 diameters, 0 circles  (four quadrants)
SK_Mode_0_2   m=0, n=2  —  0 diameters, 1 circle   (breathing 2nd mode)
SK_Mode_3_1   m=3, n=1  —  3 diameters, 0 circles  (six sectors)
SK_Mode_1_2   m=1, n=2  —  1 diameter,  1 circle   (combined)`}
      </pre>

      <h2>Why J_m(0) = δ_{m0} matters at the pole</h2>
      <p>
        Near the origin,{" "}
        <code>
          J<sub>m</sub>(x) ≈ (x/2)<sup>m</sup> / Γ(m+1)
        </code>
        . For m = 0, <code>J_0(0) = 1</code> — maximum displacement at the
        centre. For m ≥ 1, <code>J_m(0) = 0</code> — the centre is always on a
        nodal line regardless of angle. The blueprint uses a tiny inner hole
        (RAD_INNER = 0.006 m, invisible in the final glb) rather than a
        degenerate pole vertex; the innermost ring samples r ≈ 0 and therefore
        respects this property automatically.
      </p>

      <h2>Computing the zeros with scipy</h2>
      <p>
        <code>scipy.special.jn_zeros(m, n)</code> returns the first n positive
        zeros of J<sub>m</sub> in ascending order, using{" "}
        <a
          className={lk}
          href="https://dlmf.nist.gov/10.21"
          target="_blank"
          rel="noopener noreferrer"
        >
          McMahon&apos;s asymptotic expansion
        </a>{" "}
        polished with Newton refinement. The n-th zero (index −1) is{" "}
        <code>k_mn</code>. The eigenmode displacement at every vertex is then:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`from scipy.special import jn, jn_zeros

k_mn = jn_zeros(m, n)[-1]             # n-th zero of J_m

RR, TT = np.meshgrid(r_vals, theta_vals, indexing='ij')
u = jn(m, k_mn * RR / RAD_OUTER) * np.cos(m * TT)

u /= np.max(np.abs(u))                # normalise to [-1, 1]`}
      </pre>
      <p>
        Normalising to unit amplitude gives all six modes equal visual weight
        so the shape-key cupping is comparable. Without normalisation the
        fundamental (0,1) would be twice as tall as the (3,1) mode at identical
        shape-key value.
      </p>

      <h2>Polar grid topology — why an annular disc</h2>
      <p>
        A flat polar grid (N_R = 60 rings, N_THETA = 120 sectors) produces 7 200
        vertices and 7 080 quads. The mesh is a thin annulus rather than a full
        disc: RAD_INNER = 6 mm leaves a 12 mm hole at the centre (invisible in
        the exported glb) and avoids the degenerate pole topology where{" "}
        <em>all</em> N_THETA vertices would share the origin. The topology is
        equivalent to a cylinder squashed flat — every vertex has exactly four
        quad neighbours. This makes the normal interpolation and the Draco
        compression both cleaner.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`for i in range(N_R - 1):
    for j in range(N_THETA):
        j1 = (j + 1) % N_THETA        # circular closure — no seam
        a, b = i*N_T+j,   (i+1)*N_T+j
        c, d = (i+1)*N_T+j1, i*N_T+j1
        faces.append((a, b, c, d))    # CCW from +Z → outward normals`}
      </pre>

      <h2>Vertex colour — nodal lines as geometry</h2>
      <p>
        Rather than drawing white lines as separate geometry, the FLOAT_COLOR
        POINT attribute{" "}
        <code>Drum_Mode</code> encodes the normalised displacement:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`u ≈  0 → white  (nodal line)
u > 0 → cobalt (positive displacement)
u < 0 → amber  (negative displacement)

colour = white + t_pos × (cobalt − white) + t_neg × (amber − white)
where t_pos = clamp(u, 0, 1),  t_neg = clamp(-u, 0, 1)`}
      </pre>
      <p>
        In the WebXR viewer the attribute is read by an Attribute shader node.
        As the shape-key value is driven from 0 → 1, the cobalt and amber
        regions cup up and down while the white nodal lines stay flat —
        a live demonstration of the eigenmode&apos;s zero-displacement locus.
      </p>

      <h2>Acoustic and optical connections</h2>
      <p>
        The same Bessel eigenmode structure appears in a surprising range of
        physical systems:
      </p>
      <ul className="list-disc list-inside space-y-1">
        <li>
          <strong>Drum acoustics</strong> — the (0,1) mode produces the
          fundamental pitch; (0,2), (0,3), … are higher harmonics. Circular
          drums (tabla, timpani) are not harmonic because the zero ratios
          j<sub>0,n</sub>/j<sub>0,1</sub> are not integers.
        </li>
        <li>
          <strong>Airy disc</strong> — the far-field diffraction pattern of a
          circular aperture is J<sub>1</sub>(kaρ/f)² / (kaρ/f)², a(0,1)
          Bessel amplitude profile. See the{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr"
          >
            Fraunhofer diffraction blueprint
          </Link>
          .
        </li>
        <li>
          <strong>Optical fibres</strong> — guided modes in a step-index fibre
          are LP<sub>mn</sub> modes with the same J<sub>m</sub> transverse
          profile.
        </li>
        <li>
          <strong>2D quantum dot</strong> — the eigenstates of a circular
          infinite-well potential are identical to the drum modes with ℏ²k²/2m
          as the energy eigenvalue.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr"
          >
            Chladni figures — standing wave eigenmodes (height field)
          </Link>{" "}
          — the same nodal-line concept computed numerically via GN; compare
          the analytic Bessel zeros here against the discretised grid modes
          there to see where the two approaches agree and diverge
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
          >
            Laplace–Beltrami eigenmodes — spectral mesh (scipy sparse)
          </Link>{" "}
          — the same Helmholtz operator generalised to arbitrary curved
          surfaces; on a flat disc with Dirichlet conditions it reduces
          exactly to the Bessel eigenmodes here
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-spherical-harmonics-real-sh-shape-keys-atomic-orbital-webxr"
          >
            Spherical harmonics — real SH shape keys, atomic orbital
          </Link>{" "}
          — the 3D analogue: Y<sub>l</sub><sup>m</sup>(θ,φ) are to the sphere
          what J<sub>m</sub>(k<sub>mn</sub>r/R)cos(mθ) are to the disc
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-zernike-polynomials-noll-wavefront-aberration-disc-poi-webxr"
          >
            Zernike polynomials — Noll wavefront aberration disc poi
          </Link>{" "}
          — orthogonal polynomials on the disc constructed to resemble the
          Bessel modes but ordered by radial + azimuthal degree (Noll index)
          for wavefront-sensing applications
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-fraunhofer-diffraction-fft-aperture-psf-airy-disk-stage-floor-webxr"
          >
            Fraunhofer diffraction — FFT aperture PSF, Airy disc
          </Link>{" "}
          — demonstrates how the (0,1) Bessel mode profile governs far-field
          diffraction from a circular lens aperture
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr"
          >
            Euler elastica — Jacobi dn curvature, lemniscate ribbon poi
          </Link>{" "}
          — Jacobi elliptic functions are the 1D analogue (on a line segment)
          of what Bessel functions are to the disc; both solve second-order
          linear ODEs arising from separation of the Laplacian
        </li>
      </ul>

      <h2>External references</h2>
      <ul className="list-disc list-inside space-y-2">
        <li>
          NIST Digital Library of Mathematical Functions (DLMF) §10 —{" "}
          <em>Bessel Functions</em>.{" "}
          <a
            className={lk}
            href="https://dlmf.nist.gov/10"
            target="_blank"
            rel="noopener noreferrer"
          >
            https://dlmf.nist.gov/10
          </a>
          . US Government publication, public domain. Comprehensive reference
          for J<sub>m</sub>, zeros, integral representations, and asymptotics.
          Related: Olver FWJ, Lozier DW, Boisvert RF, Clark CW (eds.),{" "}
          <em>NIST Handbook of Mathematical Functions</em>, Cambridge University
          Press 2010 (the print companion to DLMF); Abramowitz M &amp; Stegun
          IA (eds.), <em>Handbook of Mathematical Functions</em>, Dover 1964
          (Chapter 9 — now public domain); Rayleigh, Lord (1894),{" "}
          <em>The Theory of Sound</em>, Vol. 1, §200–§210 — first systematic
          treatment of the circular membrane eigenfrequencies.
        </li>
        <li>
          SciPy community (2001–present) — <code>scipy.special.jn_zeros</code>{" "}
          documentation.{" "}
          <a
            className={lk}
            href="https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.jn_zeros.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.scipy.org/doc/scipy/reference/generated/scipy.special.jn_zeros.html
          </a>
          . Licence: BSD-3-Clause (permissive). Implements McMahon&apos;s
          asymptotic formula polished by Newton–Raphson refinement. Related
          projects: NumPy (BSD-3-Clause, numpy.org); LAPACK (BSD-3-Clause,
          netlib.org/lapack) — linear algebra backend; Cython (Apache-2.0) —
          used to compile the special functions module.
        </li>
      </ul>
    </>
  );
}

const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy scipy — Bessel Drum Eigenmodes: 2D Wave Equation ∇²Φ+k²Φ=0 Circular Membrane, J_m(k_{mn}r/R)cos(mθ) Exact Solutions, jn_zeros McMahon Asymptotics, Six Shape Keys (m=0-3 n=1-2), Nodal Circle+Diameter Vertex Colour & Polar-Grid Poi Disc for WebXR (Blender 5.1)",
  date: "2026-08-23",
  tags: [
    "blender",
    "python",
    "numpy",
    "scipy",
    "bessel-functions",
    "drum-eigenmodes",
    "circular-membrane",
    "wave-equation",
    "helmholtz",
    "nodal-lines",
    "shape-keys",
    "vertex-color",
    "special-functions",
    "acoustics",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "NIST / Olver et al.",
      year: 2010,
      title: "NIST Digital Library of Mathematical Functions §10 Bessel Functions",
      url: "https://dlmf.nist.gov/10",
      licence: "Public Domain (US Government)",
      notes:
        "NIST DLMF §10 (Olver FWJ, Maximon LC), https://dlmf.nist.gov/10. US Government publication, public domain. The definitive reference for Bessel functions J_m, zeros k_{mn}, integral representations, recurrence relations, and uniform asymptotic expansions. §10.21 covers zeros specifically. Related: Abramowitz M & Stegun IA (eds.) Handbook of Mathematical Functions Dover 1964 Ch. 9 (public domain); Rayleigh Lord (1894) The Theory of Sound Vol. 1 §200–210 (first circular membrane eigenfrequency analysis); Watson GN (1922) A Treatise on the Theory of Bessel Functions Cambridge 2nd ed. 1944 (comprehensive, now public domain).",
    },
    {
      author: "SciPy community",
      year: 2001,
      title: "scipy.special.jn_zeros — SciPy API Reference",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.jn_zeros.html",
      licence: "BSD-3-Clause",
      notes:
        "scipy.special.jn_zeros(v, nt) BSD-3-Clause. Returns the first nt positive zeros of J_v via McMahon's asymptotic expansion refined by Newton–Raphson. Source: scipy/special/Zeros/jn.c. Related projects: NumPy (BSD-3-Clause, numpy.org) — array operations; LAPACK (BSD-3-Clause, netlib.org/lapack) — linear algebra backend; Cython (Apache-2.0) — C extension compilation; SciPy itself cites Temme NM (1996) Special Functions: An Introduction Wiley for theoretical background.",
    },
  ],
});

export { entry };
