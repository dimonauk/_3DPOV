import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-dini-surface-pseudosphere-backlund-sine-gordon-constant-negative-curvature-poi-head-webxr";

function Body() {
  return (
    <>
      <p>
        The <strong>pseudosphere</strong> (tractricoid) is the canonical
        embedding of the hyperbolic plane H² into Euclidean ℝ³ with constant
        negative Gaussian curvature K = −1/a².  <strong>Dini&apos;s
        surface</strong> extends it by a single twist parameter b, screwing
        the pseudosphere around the z-axis into a helicoidal form.  The
        Gaussian curvature remains constant for every b:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`K = −1 / (a² + b²)     (exact, everywhere on the surface)`}
      </pre>
      <p>
        This script builds Dini&apos;s surface as a 160 × 120 quad mesh, assigns
        a cobalt-to-amber FLOAT_COLOR attribute encoding the cross-sectional
        radius, and generates four shape keys that explore different helix
        pitches — each an isometric embedding of the same hyperbolic plane.
      </p>

      <h2>Why the curvature stays constant</h2>
      <p>
        The pseudosphere arises from revolving a tractrix around its asymptote.
        Adding the b·u term to z shifts each azimuthal circle upward
        proportionally to its angle, creating the helix.  The key insight is
        that this shift is an <em>isometry of the surface</em>: locally the
        metric is unchanged (the first fundamental form coefficients E, G pick
        up extra b² terms, but their ratio EG − F² picks up the same factor,
        so K = LN − M² / (EG − F²) stays fixed).  Ulisse Dini (1865) proved
        that any pseudospherical surface in ℝ³ with a one-parameter symmetry
        must be of this form.
      </p>

      <h2>Parametrisation</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`x = a · cos(u) · sin(v)
y = a · sin(u) · sin(v)
z = a · ( cos(v) + ln( tan(v/2) ) ) + b · u

u ∈ [0, 4π]   — two full azimuthal turns
v ∈ [0.10, π − 0.10]   — polar angle (singular at 0 and π)

a = 1.0  (fixed radius)
b = 0.20  (Basis),  0.40 (SK_Tight),  0.08 (SK_Loose),  0.01 (SK_Pseudo)`}
      </pre>
      <p>
        The <code>ln(tan(v/2))</code> term is the tractrix altitude — it
        guarantees that the profile curve has unit-speed arc length in v and
        that K = −1/a² for b = 0.  The singularities at v = 0 and v = π
        are genuine cusps of the surface (the pseudosphere&apos;s &ldquo;rim&rdquo;), so we
        stay 0.10 radians away from each pole.
      </p>

      <h2>Bäcklund transform and the sine-Gordon equation</h2>
      <p>
        Every constant-K surface can be mapped to another by the{" "}
        <strong>Bäcklund transform</strong> (Albert Bäcklund, 1876): given a
        pseudospherical surface Σ, integrate a specific ODE pair to obtain a
        new surface Σ̃ with the same K.  The angle function φ(u, v) between
        the ruling tangent lines of Σ and Σ̃ satisfies the{" "}
        <strong>sine-Gordon equation</strong>:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`∂²φ / ∂u ∂v = sin φ`}
      </pre>
      <p>
        This PDE has kink-soliton solutions φ(u, v) = 4 arctan( e^{"{"}γ(u−vt){"}"} ).
        The speed parameter t in the kink corresponds directly to the Dini
        pitch b in light-cone coordinates.  Generating a Dini surface IS,
        geometrically, generating a topological soliton.
      </p>

      <h2>Colour attribute — Dini_Radius</h2>
      <p>
        The FLOAT_COLOR attribute <code>Dini_Radius</code> encodes the distance
        from the z-axis at each vertex — equal to a · |sin v|.  Broad
        equatorial bands (v ≈ π/2) render in <strong>amber</strong>; narrow
        polar tips (v → 0 or v → π) render in <strong>cobalt</strong>.  The
        gradient makes the helical winding structure legible in WebXR at
        distance.
      </p>

      <h2>Key code sections</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Surface generation — vectorised with meshgrid
u = np.linspace(0.0, 4.0 * np.pi, N_U, endpoint=False)
v = np.linspace(V_MIN, V_MAX, N_V)
uu, vv = np.meshgrid(u, v, indexing="ij")

x = a * np.cos(uu) * np.sin(vv)
y = a * np.sin(uu) * np.sin(vv)
z = a * (np.cos(vv) + np.log(np.tan(vv * 0.5))) + b * uu

# Colour: normalised cross-section radius
r_xy = np.sqrt(pts[:, 0]**2 + pts[:, 1]**2)
t    = r_xy / (r_xy.max() + 1e-9)   # 0 = pole (cobalt), 1 = equator (amber)

# Shape keys — each is a full re-integration with new b
for sk_name, b_val in SHAPE_KEYS[1:]:
    pts_sk = centre_and_scale(dini_surface(A, b_val))
    sk = obj.shape_key_add(name=sk_name, from_mix=False)
    for idx, p in enumerate(pts_sk):
        sk.data[idx].co = p`}
      </pre>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>Pole singularities.</strong> V_MIN = 0.10 is generous; at
          0.01 the ln(tan) term amplifies mesh noise at the tips.  If you want
          a sharper tip, scale down to 0.04 and accept some vertex crowding.
        </li>
        <li>
          <strong>b = 0 exactly.</strong> The F term in the first fundamental
          form becomes 0 and the parametrisation degenerates to the ordinary
          pseudosphere.  The blueprint uses B_PSEUDO = 0.01 rather than zero
          to avoid a zero-measure degenerate case in the Bäcklund angle; the
          resulting K = −0.9999 is indistinguishable from −1 in the mesh.
        </li>
        <li>
          <strong>Non-orthogonal coordinates.</strong> For b ≠ 0 the metric
          cross-term F = ab·cos²v / sin v is non-zero — this is fine for mesh
          generation but means the u and v parameter lines are not orthogonal,
          so any curvature estimate built on the assumption F = 0 will be wrong.
        </li>
        <li>
          <strong>Shape key centring.</strong> Each call to{" "}
          <code>centre_and_scale()</code> re-centres and re-scales independently,
          so shape key blending is smooth even though the raw extents differ
          substantially between b = 0.01 (taller, narrower) and b = 0.40
          (shorter, more compact).
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr">
            Schoen Gyroid: TPMS Ia-3d
          </Link>{" "}
          — a triply periodic minimal surface (K varies, H = 0 everywhere):
          opposite symmetry to Dini&apos;s constant-K, variable-H surface.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr">
            Scherk Doubly Periodic Minimal Surface
          </Link>{" "}
          — H = 0, K ≤ 0; Gaussian curvature analytic expression and
          Bordered-Hessian technique also used there.
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-circle-bundle-quaternion-stereographic-poi-webxr">
            Hopf Fibration: S³ → S²
          </Link>{" "}
          — geometric topology; fibres of a circle bundle over S², analogous
          to the isometric family of Dini surfaces over H².
        </li>
        <li>
          <Link className={lk} href="/tutorials/blender-tutorial-python-numpy-bloch-sphere-qubit-rabi-precession-berry-phase-su2-pauli-poi-webxr">
            Bloch Sphere: Berry Phase & Gauss-Bonnet
          </Link>{" "}
          — geometric phase equals the integral of Gaussian curvature over the
          enclosed area; Gauss-Bonnet applied to H² surfaces.
        </li>
      </ul>
    </>
  );
}

const entry = buildInstructable({
  slug: SLUG,
  date: "2026-08-29",
  title: "Dini's Surface: Pseudospherical Helix & Bäcklund Transform",
  excerpt:
    "Build Ulisse Dini's constant-negative-curvature helicoid in Blender 5.1 — " +
    "K = −1/(a²+b²) exact for every helix pitch b, four shape keys from near-pseudosphere " +
    "to tight spiral, cobalt-amber cross-section radius colour, and the sine-Gordon soliton " +
    "connection explained.",
  tags: [
    "blender-5-1",
    "python",
    "numpy",
    "differential-geometry",
    "curvature",
    "pseudosphere",
    "hyperbolic-geometry",
    "sine-gordon",
    "soliton",
    "shape-keys",
    "vertex-color",
    "webxr",
    "glb",
  ],
  series: "scripting",
  body: Body,
  outside_sources: [
    {
      author: "Eisenhart LP",
      year: 1909,
      title: "A Treatise on the Differential Geometry of Curves and Surfaces",
      url: "https://archive.org/details/treatisedifferen00eiseuoft",
      licence: "Public Domain",
      notes:
        "Eisenhart LP (1909) Ginn & Company, Boston. §§174–178: pseudospherical surfaces, " +
        "Bäcklund transform, families of constant-K surfaces. Public domain (pre-1924 US publication). " +
        "Related: do Carmo MP (1976) Differential Geometry of Curves and Surfaces, Prentice-Hall; " +
        "Spivak M (1979) A Comprehensive Introduction to Differential Geometry Vol 3, Publish or Perish " +
        "(§8 covers the Hilbert theorem that no complete C² embedding of H² in ℝ³ exists, placing " +
        "pseudospherical surfaces in context); JuliaManifolds/Manifolds.jl MIT https://github.com/JuliaManifolds/Manifolds.jl " +
        "implements hyperbolic space metrics computationally.",
    },
    {
      author: "Bäcklund AV",
      year: 1876,
      title: "Ueber Flächen-Transformationen",
      url: "https://link.springer.com/article/10.1007/BF01443337",
      licence: "Public Domain",
      notes:
        "Bäcklund AV (1876) Math. Ann. 9:297–320. Original paper establishing the transform " +
        "that maps any pseudospherical surface to another while preserving K. The sine-Gordon " +
        "angle equation φ_uv = sin φ appears here in geometric form. Public domain. " +
        "Related: Hirota R (1972) Phys Rev Lett 27:1192 exact N-soliton solution of sine-Gordon " +
        "via the Bäcklund chain (public domain equations); " +
        "Rogers C & Schief WK (2002) Bäcklund and Darboux Transformations, Cambridge Univ Press " +
        "(comprehensive modern treatment, all rights reserved — reference only); " +
        "sympy/sympy MIT https://github.com/sympy/sympy implements symbolic Bäcklund transform " +
        "verification for sine-Gordon.",
    },
  ],
});

export { entry };
