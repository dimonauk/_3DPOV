import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-zernike-polynomials-noll-wavefront-aberration-disc-poi-webxr";

const TITLE =
  "Python numpy — Zernike Polynomials: Noll-Ordered Wavefront Aberrations, " +
  "Radial Polynomial Summation & Aberration-Mode Shape Keys for WebXR (Blender 5.1)";

const LEDE =
  "Frits Zernike (Nobel Prize 1953) defined an orthonormal polynomial basis on " +
  "the unit disc whose low-order terms map one-for-one onto classical optical " +
  "aberrations: defocus, astigmatism, coma, trefoil, primary spherical. Every " +
  "Hubble Space Telescope wavefront correction, every adaptive-optics actuator " +
  "command, every corneal topography map uses this basis. This blueprint " +
  "evaluates the primary spherical aberration mode (Noll j=11) on a 48-ring × " +
  "96-sector polar disc mesh, encodes the signed Zernike value as teal/amber " +
  "vertex height, then adds four shape keys — defocus (j=4), astigmatism 0° " +
  "(j=5), coma X (j=7), trefoil X (j=9) — so the viewer can morph between " +
  "aberration topologies in the browser.";

function Body() {
  return (
    <>
      <p>
        In 1934 Frits Zernike published the polynomial set that now bears his
        name, initially to describe phase errors in optical systems. The key
        insight was orthonormality over the unit disc: the inner product of any
        two distinct Zernike polynomials integrates to zero over{" "}
        <code>ρ ∈ [0,1]</code>, so the RMS wavefront error of a composite
        aberration equals the quadrature sum of individual mode coefficients —
        no cross-coupling. Noll (1976) introduced the single-index ordering{" "}
        <code>j = 1, 2, 3, …</code> that maps each polynomial to a physically
        named aberration, and this ordering became the ANSI Z80.28 standard.
      </p>

      <h2>Radial polynomial — closed-form Rodrigues summation</h2>
      <p>
        The radial part <code>R_n^|m|(ρ)</code> is the only non-trivial piece:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`R_n^|m|(ρ) = Σ_{s=0}^{(n-|m|)/2}  (-1)^s (n-s)!
                  ──────────────────────────────────────────  ρ^(n-2s)
                  s! · ((n+|m|)/2 - s)! · ((n-|m|)/2 - s)!`}
      </pre>
      <p>
        The exponent steps down by 2 from <code>n</code> to <code>|m|</code>,
        so the polynomial has the same parity as <code>n</code> (odd or even).
        All factorials are small integers for the orders used here (n ≤ 4), so
        Python&apos;s arbitrary-precision integer arithmetic gives exact coefficients
        without any floating-point instability from Gamma functions.
      </p>
      <p>
        The angular factor and normalisation complete the mode:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Z_j(ρ,θ) = √(2(n+1)) · R_n^|m|(ρ) · cos(mθ)    for m > 0
           √(2(n+1)) · R_n^|m|(ρ) · sin(|m|θ)   for m < 0
           √(n+1)    · R_n^0(ρ)                   for m = 0`}
      </pre>
      <p>
        Normalisation ensures <code>∫∫_disc Z_j Z_k dA = π δ_jk</code> (ANSI /
        Noll convention). The <code>√(n+1)</code> factor for <code>m=0</code>{" "}
        is smaller because the rotationally symmetric modes carry no angular
        multiplicity.
      </p>

      <h2>Why each aberration looks the way it does</h2>
      <p>
        The five modes used here have distinct symmetry groups:
      </p>
      <ul>
        <li>
          <strong>Defocus (j=4, m=0):</strong> <code>R_2^0 = 2ρ²−1</code>.
          Paraboloid — positive at the rim, negative at the centre (or vice
          versa). C∞ rotational symmetry. The classic dome/bowl profile.
        </li>
        <li>
          <strong>Astigmatism 0° (j=5, m=2):</strong>{" "}
          <code>R_2^2 = ρ² · cos(2θ)</code>. Saddle shape — two positive lobes
          at 0°/180°, two negative at 90°/270°. D₂ symmetry. A cylindrical
          lens error.
        </li>
        <li>
          <strong>Coma X (j=7, m=1):</strong>{" "}
          <code>(3ρ²−2ρ) · cos(θ)</code>. One large positive lobe tapering to a
          negative wake — the comet silhouette that gives coma its name. C₁
          (no symmetry). Caused by a decentred lens element.
        </li>
        <li>
          <strong>Trefoil X (j=9, m=3):</strong>{" "}
          <code>ρ³ · cos(3θ)</code>. Three equal lobes at 120°. D₃ symmetry.
          Induced by three-point mirror support in large telescope primaries.
        </li>
        <li>
          <strong>Primary spherical (j=11, m=0):</strong>{" "}
          <code>6ρ⁴−6ρ²+1</code>. The volcano — a positive ring at
          <code>ρ≈0.71</code>, depressed centre, negative rim. The Hubble
          primary mirror had{" "}
          <em>precisely</em> this error at the micrometre scale.
        </li>
      </ul>

      <h2>Polar disc mesh — why not a square grid</h2>
      <p>
        Zernike polynomials are defined on the unit disc. A square UV grid
        wastes vertices in the disc corners and produces irregular radial
        density. The polar mesh used here places{" "}
        <code>N_RINGS × N_SECTORS</code> vertices at uniform{" "}
        <code>(ρ, θ)</code> spacing, with a triangle fan connecting the
        innermost ring to the centre. This gives uniform angular resolution
        everywhere — important for displaying the odd-m angular patterns
        (coma, trefoil) without radial aliasing. It is the same spatial
        structure used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-sparse-heat-method-geodesic-crane-2013-isoline-poi-webxr"
          className={lk}
        >
          Heat Method Geodesic Distance
        </Link>{" "}
        tutorial&apos;s isoline rings, where radial density also matters for visual
        fidelity.
      </p>

      <h2>Vertex colour — signed Zernike as hue</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`a_n = |Z_j(ρ,θ)| / max|Z_j|          # normalised amplitude 0..1
t   = smoothstep(a_n, W_THRESH)        # C¹ blend to white near zero
col = lerp(WHITE, TEAL,  t)  if Z ≥ 0
col = lerp(WHITE, AMBER, t)  if Z < 0`}
      </pre>
      <p>
        White at the nodal lines is not purely aesthetic: the zero set of a
        Zernike polynomial is a geometric invariant — it is the set where
        wavefront error switches sign — and white makes it legible as a
        contour. The same encoding appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr"
          className={lk}
        >
          Chladni Figures tutorial
        </Link>
        , where the nodal lines of a vibrating plate are the physical location
        where sand accumulates.
      </p>

      <h2>Shape keys and orthogonality</h2>
      <p>
        Each shape key stores the full vertex position for its mode, not an
        offset from the basis. The practical consequence: in WebXR, linearly
        blending two morph targets produces a mixed wavefront that is not the
        algebraic sum of the two Zernike modes (because the blending operates
        on the height field, not on the polynomial coefficients). This is a
        deliberate artistic choice — the intermediate shapes are visually
        smooth but physically approximate. For exact wavefront composition you
        would set multiple mode heights directly on the vertex Z attribute from
        code, as done in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
          className={lk}
        >
          Laplace-Beltrami Eigenmodes
        </Link>{" "}
        tutorial, where modes are summed analytically before the mesh is built.
      </p>
      <p>
        For cel-shaded rendering of the disc surface, apply the hard-step
        emission technique from the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
          className={lk}
        >
          Shader-to-RGB Halftone Cel-Shade
        </Link>{" "}
        tutorial: pipe the vertex colour through a Colour Ramp with four hard
        stops. The Zernike lobes become flat teal/amber polygons with a crisp
        white border at the nodal zero, ideal for the studio&apos;s faceted
        aesthetic.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Flat disc, no height:</strong> confirm{" "}
          <code>HEIGHT_SCALE</code> is not 0. If the Zernike mode evaluates to
          zero everywhere (e.g., passing <code>j=1</code> piston), all heights
          collapse to zero — piston is the only mode with no z-variation over
          the disc.
        </li>
        <li>
          <strong>Shape key morph flattens disc:</strong>{" "}
          <code>shape_key_add(from_mix=False)</code> must be called for every
          key. Without it, Blender interpolates from the current active key
          position as the implicit basis, corrupting all subsequent morphs.
        </li>
        <li>
          <strong>Centre vertex has wrong Z:</strong> the centre is not
          evaluated at <code>ρ=0</code> but interpolated from the innermost
          ring mean. For modes with <code>m≠0</code>, R_n^m(0)=0 anyway (all
          angular modes vanish at the pole). Only <code>m=0</code> modes
          (defocus, spherical) have non-zero centre values.
        </li>
        <li>
          <strong>Angular lobes appear doubled:</strong> check that{" "}
          <code>N_SECTORS</code> is at least 6× the azimuthal order m.
          Trefoil (m=3) needs ≥ 18 sectors to be resolved; coma (m=1) needs ≥ 6.
          96 sectors is sufficient for modes up to m=8.
        </li>
        <li>
          <strong>GLB has no shape keys:</strong> ensure{" "}
          <code>export_morph=True</code> in the glTF export call and that the
          object is selected before export. Blender 5.1 defaults to True but
          earlier builds differ.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          <strong>Noll, R.J. (1976)</strong> — &ldquo;Zernike polynomials and
          atmospheric turbulence&rdquo;, <em>Journal of the Optical Society of
          America</em> 66(3):207–211. Public domain algorithm.{" "}
          <a
            href="https://opg.optica.org/josa/abstract.cfm?uri=josa-66-3-207"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            opg.optica.org
          </a>
          . The canonical single-index ordering table used directly in this
          blueprint.
        </li>
        <li>
          <strong>AOtools</strong> — MIT — AOtools contributors.{" "}
          <a
            href="https://github.com/AOtools/aotools"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/AOtools/aotools
          </a>
          . Python adaptive-optics toolkit; Zernike module for reference
          implementation. Related:{" "}
          <a
            href="https://github.com/ehpor/hcipy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ehpor/hcipy
          </a>{" "}
          (MIT, high-contrast imaging Python library with Zernike basis
          and Fourier optics propagators).
        </li>
      </ul>

      <h2>Related tutorials</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr"
            className={lk}
          >
            Chladni Figures
          </Link>{" "}
          — standing-wave nodal lines on a square plate: same teal/white/amber
          encoding of signed mode amplitude, different mathematical basis
          (cosine products vs. Zernike radial polynomials).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-sparse-laplace-beltrami-eigenmodes-spectral-mesh-poi-head-webxr"
            className={lk}
          >
            Laplace-Beltrami Eigenmodes
          </Link>{" "}
          — eigenfunctions of the cotangent Laplacian on a curved poi-head
          surface: the curved-surface generalisation of the flat-disc Zernike
          basis.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-sparse-heat-method-geodesic-crane-2013-isoline-poi-webxr"
            className={lk}
          >
            Heat Method Geodesic Distance
          </Link>{" "}
          — isoline encoding on a polar-adjacent mesh structure; colour-ramp
          pattern useful to compare against Zernike zero-set contours.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-shader-to-rgb-halftone-cel-shade-webxr"
            className={lk}
          >
            Shader-to-RGB Halftone Cel-Shade
          </Link>{" "}
          — hard-step emission material to convert the Zernike vertex colours
          into the studio&apos;s flat-lobe faceted aesthetic.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "nil — Python + Blender only",
    supplies: {
      materials: [],
      tools: ["Blender 5.1", "numpy (bundled with Blender)"],
    },
    steps: [
      {
        title: "Open Scripting workspace",
        body: "Launch Blender 5.1. Switch to the Scripting workspace. Create a new text datablock.",
      },
      {
        title: "Paste and run blueprint.py",
        body: "Copy blueprint.py into the text editor. Press Alt+P. The script builds the polar disc mesh and shape keys in ~4 s. Confirm the console prints '[zernike] ✓ exported //hf_zernike_poi.glb'.",
      },
      {
        title: "Inspect the basis mode — spherical aberration",
        body: "Switch to 3D Viewport → Material Preview. You should see a volcano shape: teal rim ring, white centre, teal and amber by signed wavefront phase. Press Numpad 7 for top-down; the disc should look like a bullseye with C∞ symmetry.",
      },
      {
        title: "Morph through each aberration mode",
        body: "Object Properties → Shape Keys. Drag 'defocus' to 1: dome/bowl, C∞. Drag 'astigmatism_0' to 1: saddle with two teal and two amber lobes. Drag 'coma_x' to 1: asymmetric comet. Drag 'trefoil_x' to 1: three equal lobes at 120°.",
      },
      {
        title: "Run record.py",
        body: "Load record.py into the text editor and press Alt+P. This animates all four shape-key morphs in sequence at 30 fps and renders viewport.mp4 via Workbench.",
      },
      {
        title: "Screen-record",
        body: "Follow SCREEN-RECORDING-NOTES.md to capture a 5-minute OBS recording: theory narration, blueprint run, basis mode inspection, shape-key tour, Three.js in-browser morph demo.",
      },
      {
        title: "Save the .blend",
        body: "File → Save As → hf_zernike_poi.blend in the same directory as blueprint.py.",
      },
    ],
  },
  {
    slug: SLUG,
    title: TITLE,
    date: "2026-08-02",
    kind: "tutorial",
    excerpt: LEDE,
    Body,
  },
);
