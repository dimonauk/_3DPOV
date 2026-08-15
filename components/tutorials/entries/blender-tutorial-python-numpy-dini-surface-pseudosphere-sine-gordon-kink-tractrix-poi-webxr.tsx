import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-dini-surface-pseudosphere-sine-gordon-kink-tractrix-poi-webxr";

const TITLE =
  "Python numpy — Dini's Surface: Helical Pseudosphere, Constant-Negative-Curvature K = −1/(a²+b²), Sine-Gordon Kink Soliton & Five-Pitch Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1868 Eugenio Beltrami asked whether the hyperbolic plane could be modelled as a surface in ordinary Euclidean space.  His answer was the pseudosphere — the surface of revolution of a tractrix — which carries constant negative Gaussian curvature K = −1.  A year later Ulisse Dini showed that if you unwind the pseudosphere helically, adding a pitch term b·u to its height function, you get a whole family of surfaces with K = −1/(a²+b²), all locally isometric to the hyperbolic plane.  The pitch parameter b is the velocity of a sine-Gordon kink soliton living on the surface.  This blueprint derives the curvature formula, builds the sine-Gordon kink-angle vertex colour, and sweeps five helix pitches as GLTF morph targets — a poi head that transitions from pointed pseudosphere to tight drill-bit while preserving every geodesic.";

const data = {
  title: TITLE,
  lede:  LEDE,
  date:  "2026-08-15",
  externalSources: [
    {
      label:
        "Beltrami, E. (1868). Saggio di interpretazione della geometria non-euclidea. Giornale di Matematiche 6: 284–312. Public Domain. Biblioteca Digitale Italiana di Matematica, BDIM.",
      url:     "https://www.bdim.eu/item?id=BUMI_1868_1_2_267_0",
      licence: "Public Domain",
      author:  "Eugenio Beltrami",
    },
    {
      label:
        "Hilbert, D. (1901). Über Flächen von konstanter Gaußscher Krümmung. Transactions of the American Mathematical Society 2(1): 87–99. Public Domain via JSTOR.",
      url:     "https://doi.org/10.2307/1986383",
      licence: "Public Domain",
      author:  "David Hilbert",
    },
    {
      label:
        "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url:     "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author:  "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Beltrami wanted a concrete model — something in ordinary ℝ³ whose
        internal geometry obeys Lobachevsky's rules rather than Euclid's.
        The pseudosphere gave him one.  Roll a sheet of paper around a trumpet
        shape whose profile follows the tractrix (the curve a dog traces when
        pulled along a lead), and you get a surface where the angles of every
        triangle sum to <em>less</em> than 180° and parallel lines diverge.
        The Gaussian curvature K = −1/a² is the same at every point.
      </p>
      <p>
        Dini's generalisation adds a helix.  The tractrix height function
        cos(v) + ln(tan(v/2)) acquires a linear term b·u — one full azimuthal
        revolution shifts the surface upward by 2πb.  The curvature becomes
        K = −1/(a² + b²), still constant, still negative, but now set by the
        ratio of curvature scale to helix pitch.  This blueprint implements
        that family in five shape-key steps and colours the mesh by the
        sine-Gordon kink angle that underlies its integrability.
      </p>

      <h2>Deriving K = −1/(a² + b²)</h2>
      <p>
        The parametric surface r(u,v) = (a·cos u·sin v, a·sin u·sin v,
        a·mer(v) + b·u) where mer(v) = cos v + ln(tan(v/2)) has partial
        derivatives:
      </p>
      <pre className="overflow-x-auto text-sm">
{`∂r/∂u = (−a sin u sin v,  a cos u sin v,  b)
∂r/∂v = ( a cos u cos v,  a sin u cos v,  a·cos²v/sin v)

  [because d/dv(mer) = −sin v + 1/sin v = cos²v/sin v]

First fundamental form:
  E = |∂r/∂u|² = a²sin²v + b²
  F = ∂r/∂u·∂r/∂v = ab·cos²v/sinv
  G = |∂r/∂v|² = a²cos²v/sin²v

  EG − F² = a²cos²v(a² + b²)

Unit normal:
  |n| = a|cos v|·√(a² + b²)

Second fundamental form (one calculation):
  LN − M² = −a²cos²v

Gaussian curvature:
  K = (LN − M²)/(EG − F²) = −a²cos²v / [a²cos²v(a²+b²)]
    = −1/(a² + b²)   ✓  (independent of u and v)`}
      </pre>
      <p>
        The curvature is constant everywhere on the surface, for any pitch b.
        Hilbert's 1901 theorem tells us the surface cannot be complete — it must
        have boundary singularities — which is why we exclude v = 0 and v = π
        (the cusp tips) in the parametrisation.
      </p>

      <h2>Sine-Gordon kink connection</h2>
      <p>
        Draw two families of curves on Dini's surface: the u-parameter lines
        (helical spirals) and the v-parameter lines (tractrix meridians).  Let
        ω(u,v) be the angle between them at each point.  Bäcklund's 1880s work
        on pseudospherical surfaces shows that ω must satisfy the sine-Gordon
        equation ω<sub>uu</sub> − ω<sub>vv</sub> = sin ω.
      </p>
      <p>
        The one-soliton (kink) solution is ω = 4·arctan(exp(γ(u − βv))) where
        β = b/√(a²+b²) is the kink velocity and γ = 1/√(1−β²) is the Lorentz
        factor.  At b = 0 the kink is stationary (β = 0) and the surface is the
        pseudosphere.  Increasing b boosts the kink, tightening the helix.
        The blueprint colours each vertex by this angle as a rainbow hue,
        making the soliton ridge visible as a spiral of colour change.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script lives at{" "}
        <code>public/library/blends/scripting/{SLUG}/blueprint.py</code>.
        Run it in the Blender 5.1 Scripting workspace.
      </p>
      <h3>1 · <code>dini_verts(b)</code></h3>
      <p>
        Builds a (N_V × N_U, 3) numpy array.{" "}
        <code>np.meshgrid</code> broadcasts u and v into 2-D grids; the tractrix
        height <code>np.log(np.tan(V * 0.5))</code> diverges at the poles, so
        V_MIN = 0.09 and V_MAX = π − 0.09 keep the mesh away from the cusps.
        The u-axis wraps (cylinder topology), so faces connect u=N_U−1 back to
        u=0 via <code>(ui + 1) % N_U</code>.
      </p>
      <h3>2 · <code>kink_colour(b)</code></h3>
      <p>
        Computes the Lorentz-boosted kink angle ω at each vertex and returns
        it as a hue in [0, 1).  A vectorised HSV→RGB conversion (six piecewise
        linear ramps, selected via <code>np.select</code>) avoids a Python loop
        over all vertices.  The colour is stored as a{" "}
        <code>FLOAT_COLOR</code> attribute — required in Blender 5.1 for correct
        Emission via ShaderNodeAttribute; BYTE_COLOR clips at 1.0 and cannot
        represent emissive headroom.
      </p>
      <h3>3 · Shape keys</h3>
      <p>
        Five keys sweep b from 0 (pseudosphere) to 2.4 (drill-bit).  Each calls
        <code>dini_verts(b_val)</code> and writes the resulting coordinates
        directly into the shape-key data block.  <code>export_apply=False</code>
        on the GLTF exporter preserves these as morph targets, so the WebXR
        viewer can interpolate between them at runtime.
      </p>
      <h3>4 · Material</h3>
      <p>
        A MixShader blends Principled BSDF (base colour from DiniCol attribute,
        metallic 0.45, roughness 0.28) with Emission (same DiniCol, strength
        2.60) at 22%.  <code>use_backface_culling = False</code> is essential:
        the surface curls through itself and the inner face is intentionally
        visible — this is not a bug.
      </p>
      <h3>5 · Export</h3>
      <p>
        Draco level 6 compression, WebP textures, <code>+Y-up</code>,
        morph targets and colours all enabled.  The rotation to +Y-up WebXR
        convention is applied before export via{" "}
        <code>transform_apply(rotation=True)</code>, which correctly propagates
        the rotation into all shape-key vertex positions.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr"
            className={lk}
          >
            Euler's Elastica (Blender 5.1)
          </Link>{" "}
          — both the elastica and the pseudosphere arise from variational
          problems with curvature; both solutions involve Jacobi elliptic
          functions and both surfaces are "too good to be true" in ℝ³
          (the elastica cannot close at arbitrary modulus; the pseudosphere
          cannot be complete).
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
            className={lk}
          >
            KdV Soliton (Blender 5.1)
          </Link>{" "}
          — the KdV and sine-Gordon equations are the two canonical integrable
          1+1 dimensional field theories; both have soliton solutions, both
          have Lax pairs, and both appear as geometric equations on surfaces
          of special curvature.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hyperbolic-poincare-disk-tiling-5-4-triangle-group-stage-floor-webxr"
            className={lk}
          >
            Hyperbolic Poincaré Disk Tiling (Blender 5.1)
          </Link>{" "}
          — Dini's surface <em>models</em> the hyperbolic plane in ℝ³
          (isometrically, locally); the Poincaré disk models it conformally.
          Both surfaces have K = −1 as their ground state.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarzschild-geodesics-gr-effective-potential-isco-mercury-precession-poi-disc-webxr"
            className={lk}
          >
            Schwarzschild Geodesics (Blender 5.1)
          </Link>{" "}
          — both tutorials study geodesics on surfaces of constant curvature;
          negative curvature here versus positive curvature (positive
          effective potential barrier) in Schwarzschild.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
            className={lk}
          >
            Torus Knot Poi Head (Blender 5.1)
          </Link>{" "}
          — both use the helix as a structural device: the torus knot
          winds around a torus, Dini's surface winds the pseudosphere;
          both use <code>u_turns</code> to control the number of revolutions.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://www.bdim.eu/item?id=BUMI_1868_1_2_267_0"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Beltrami, E. (1868). Saggio di interpretazione della geometria
              non-euclidea. Public Domain. BDIM.
            </a>
          </strong>{" "}
          — The paper in which Beltrami first proves the pseudosphere models
          hyperbolic geometry.  The tractrix parametrisation used here descends
          directly from his meridian curve.  Related work: Beltrami's 1869
          Teoria fondamentale degli spazii di curvatura costante; Riemann's
          1854 Habilitation lecture; Klein's 1882 disk model; Poincaré's 1882
          half-plane model.
        </li>
        <li>
          <strong>
            <a
              href="https://doi.org/10.2307/1986383"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hilbert, D. (1901). Über Flächen von konstanter Gaußscher
              Krümmung. Trans. Amer. Math. Soc. 2(1): 87–99. Public Domain.
            </a>
          </strong>{" "}
          — Hilbert proves that no complete smooth surface of constant K = −1
          can exist in ℝ³, which explains why Dini's surface must have cusp
          singularities at v = 0 and v = π.  Related: Efimov's theorem (1964)
          — generalises Hilbert to K ≤ −c² &lt; 0; Rozendorn (1961) on
          complete surfaces of constant negative curvature with self-intersections.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.
            </a>
          </strong>{" "}
          — np.meshgrid, np.log, np.tan, np.arctan, np.select, and np.stack
          are the workhorses of the blueprint.  Related: github.com/numpy/numpy;
          SciPy for numerical ODE integration of the sine-Gordon Chebyshev net
          should you need exact Bäcklund-transformed solutions.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Mesh holes near the tips.</strong> V_MIN too small — the
          log(tan(v/2)) term diverges.  Increase V_MIN to 0.12.
        </li>
        <li>
          <strong>Shape keys look identical.</strong> Check that{" "}
          <code>export_apply=False</code> is set; transform_apply with
          scale=True before the GLTF export is correct, but apply after
          adding shape keys will break morph targets if called twice.
        </li>
        <li>
          <strong>Flat dark faces in Eevee Next.</strong> Eevee Next in
          Blender 5.1 requires <code>use_backface_culling=False</code> on the
          material; the default is True.  The inner surface is always visible
          on a non-convex surface like this.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(SLUG, data, Body);
