import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python numpy — Delaunay CMC Surfaces of Revolution: Unduloid, Nodoid & Roulette-of-Conic Meridian ODE for Poi Head WebXR (Blender 5.1)",
  lede: "Integrate the constant-mean-curvature meridian ODE by RK4 to generate the full Delaunay family — sphere, unduloid, catenary, nodoid — then revolve each meridian into a surface of revolution, add four blend-shape morph targets, paint vertex colour by azimuthal radius, and export a faceted poi-head GLB for WebXR.",
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Delaunay, C.-E. (1841) — 'Sur la surface de révolution dont la courbure moyenne est constante.' Journal de Mathématiques Pures et Appliquées, Série 1, Tome 6, pp. 309–320. Gallica scan.",
      url: "https://gallica.bnf.fr/ark:/12148/bpt6k16396z/f325.item",
      licence: "Public Domain",
      author: "Charles-Eugène Delaunay",
    },
    {
      label:
        "Eells, J. (1987) — 'The surfaces of Delaunay.' Mathematical Intelligencer 9(1):53–57. Springer.",
      url: "https://doi.org/10.1007/BF03023575",
      licence: "Public Domain mathematical content",
      author: "James Eells",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>Constant mean curvature and the Delaunay classification</h2>
      <p>
        Every smooth surface in ℝ³ has, at each point, two{" "}
        <em>principal curvatures</em> κ₁ and κ₂ — the maximum and minimum
        normal curvature values. Their average <code>H = (κ₁ + κ₂)/2</code>{" "}
        is the <em>mean curvature</em>. A surface where H is the same
        constant everywhere is a <strong>CMC surface</strong>.
      </p>
      <p>
        Why should CMC surfaces matter for poi construction? A soap bubble is
        a CMC surface — it minimises surface area subject to a fixed enclosed
        volume, and the Euler-Lagrange equation for that variational problem is
        exactly H = const. A poi head that shares this structure has equal wall
        thickness in every tangent direction, which distributes impact loads
        uniformly and maximises the luminous aperture for a given volume of
        internal LED module.
      </p>
      <p>
        In 1841 Charles-Eugène Delaunay proved that the only{" "}
        <em>surfaces of revolution</em> with constant mean curvature are the
        following five types — and that their meridian curves (the
        cross-sections through the axis of symmetry) are precisely the{" "}
        <em>roulettes of conic sections</em>:
      </p>
      <table>
        <thead>
          <tr>
            <th>Surface</th>
            <th>Roulette source</th>
            <th>H</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Sphere</td>
            <td>Circle</td>
            <td>1/(2r)</td>
          </tr>
          <tr>
            <td>Cylinder</td>
            <td>Line (degenerate)</td>
            <td>1/(2r)</td>
          </tr>
          <tr>
            <td>Unduloid</td>
            <td>Ellipse</td>
            <td>0 &lt; H &lt; ½</td>
          </tr>
          <tr>
            <td>Nodoid</td>
            <td>Hyperbola</td>
            <td>any, self-intersecting</td>
          </tr>
          <tr>
            <td>Catenoid</td>
            <td>Parabola</td>
            <td>0 (minimal surface)</td>
          </tr>
        </tbody>
      </table>
      <p>
        The roulette of a conic: roll the conic along a straight line without
        slipping. The locus of one focus is the Delaunay meridian. An
        ellipse&apos;s focus traces a wavy curve (unduloid); a hyperbola&apos;s
        focus traces a looping self-intersecting curve (nodoid); a parabola&apos;s
        focus traces a catenary — which is the meridian of the catenoid,
        the only minimal surface of revolution.
      </p>

      <h2>The meridian ODE</h2>
      <p>
        Parametrise the meridian by arc length s. Let r(s) be the radius, z(s)
        the height, and θ(s) the angle the tangent makes with the axis of
        revolution. The two principal curvatures are:
      </p>
      <pre>{`κ₁ = dθ/ds           (curvature of meridian in meridian plane)
κ₂ = sin θ / r        (azimuthal normal curvature)`}</pre>
      <p>
        Setting H = (κ₁ + κ₂)/2 = const and solving for κ₁ gives the
        autonomous system:
      </p>
      <pre>{`dr/ds =  cos θ
dz/ds =  sin θ
dθ/ds =  2H  −  sin θ / r`}</pre>
      <p>
        This ODE has no general closed form — elliptic integrals appear for
        unduloid and nodoid. We integrate by <strong>RK4</strong> with step
        Δs = 0.002. Initial conditions select the surface type:
      </p>
      <pre>{`sphere:   r₀ = 1.0,  θ₀ = 90° → tangent perpendicular to axis
unduloid: r₀ = 0.70, θ₀ = 60° → narrower waist, bubbled profile
catenary: r₀ = 0.95, θ₀ ≈ 90° → approaches minimal surface
nodoid:   r₀ = 1.30, θ₀ = 110° → tangent past perpendicular → loop`}</pre>
      <p>
        The guard <code>r &gt; 0.01</code> stops integration when the nodoid
        self-intersection would collapse the radius below a reasonable threshold.
      </p>

      <h2>Surface of revolution mesh</h2>
      <p>
        Each meridian array (r, z) of shape (N, 2) is revolved by generating N
        rings of <code>N_AZ = 80</code> vertices each, equally spaced in
        azimuth [0, 2π). Adjacent rings are stitched into quads. The result is
        an N × 80 grid of vertices — a structured mesh perfectly suited to the
        WebXR renderer&apos;s preference for uniform topology.
      </p>
      <p>
        All meridians are resampled to the <em>same number of rows</em> as the
        unduloid base using <code>np.interp</code> before storing as shape
        keys, so the morph blend is vertex-to-vertex with no topological
        discontinuity.
      </p>

      <h2>Shape keys and the morph sequence</h2>
      <p>
        Four Blender shape keys are added to the unduloid base mesh:
      </p>
      <ul>
        <li>
          <strong>Basis</strong> — the unduloid, default state.
        </li>
        <li>
          <strong>sphere</strong> — inflates the waist regions into a round
          sphere; κ₁ = κ₂ = H everywhere, the maximally symmetric CMC surface.
        </li>
        <li>
          <strong>catenary</strong> — nearly planar central waist, long flanks;
          approximates the catenoid (H → 0) from the CMC side.
        </li>
        <li>
          <strong>nodoid</strong> — lobing outward past the sphere, with
          self-intersecting bulges; the tangent angle θ exceeds 90° so the
          meridian curves back inward before looping forward.
        </li>
      </ul>
      <p>
        The <code>record.py</code> animation sweeps these in order —
        unduloid → sphere → nodoid → catenary — over 300 frames (10 s at
        30 fps), showing the continuous deformation of the Delaunay family
        as a single parameter (initial conditions) changes.
      </p>

      <h2>Vertex colour: radius gradient</h2>
      <p>
        The <code>colour_by_height</code> function sets a{" "}
        <code>FLOAT_COLOR / POINT</code> attribute on the mesh. Vertex colour
        is interpolated from a dim base tint (r_min) to a bright saturated tint
        (r_max). For the unduloid this produces a gradient that darkens at the
        narrow waists and brightens at the wider belly sections — visually
        picking out the CMC character. The emission strength of 3.0 in the
        material makes the gradient glow in Eevee.
      </p>

      <h2>Common failure modes</h2>
      <ul>
        <li>
          <strong>Nodoid collapses to r → 0.</strong> The guard{" "}
          <code>if r &lt; 0.01: break</code> stops the integrator before
          the singularity. The resulting partial meridian is still valid for
          a shape key — it simply covers fewer lobes.
        </li>
        <li>
          <strong>Shape key vertex count mismatch.</strong> If the resampled
          meridian has fewer rows than the base (because integration stopped
          early), <code>np.interp</code> still produces exactly{" "}
          <code>len(base_pts)</code> rows by extrapolating the last value.
          Check the shape key data length equals{" "}
          <code>len(base_pts) × N_AZ</code>.
        </li>
        <li>
          <strong>Flat shading lost after GLB export.</strong> GLB stores
          normals per vertex; flat shading requires per-face normals. Ensure{" "}
          <code>export_apply=True</code> is set, which bakes the modifier
          stack and flat-shading data into the exported geometry.
        </li>
      </ul>

      <h2>Blueprint code highlights</h2>
      <pre>{`# RK4 integrator for the CMC meridian ODE
def deriv(r_, th_):
    return (
        math.cos(th_),                       # dr/ds
        math.sin(th_),                       # dz/ds
        2.0 * H_val - math.sin(th_) / max(r_, 1e-8)  # dθ/ds
    )

for _ in range(n_steps):
    if r < 0.01: break
    dr1, dz1, dt1 = deriv(r, th)
    dr2, dz2, dt2 = deriv(r + 0.5*ds*dr1, th + 0.5*ds*dt1)
    dr3, dz3, dt3 = deriv(r + 0.5*ds*dr2, th + 0.5*ds*dt2)
    dr4, dz4, dt4 = deriv(r + ds*dr3,      th + ds*dt3)
    r  += ds * (dr1 + 2*dr2 + 2*dr3 + dr4) / 6.0
    z  += ds * (dz1 + 2*dz2 + 2*dz3 + dz4) / 6.0
    th += ds * (dt1 + 2*dt2 + 2*dt3 + dt4) / 6.0`}</pre>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr"
            className={lk}
          >
            Kuen, Dini &amp; Pseudosphere — constant Gaussian curvature K = −1
          </Link>{" "}
          — the sister class of constant-curvature surfaces; compare CMC (mean)
          vs CGC (Gaussian) constraints.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr"
            className={lk}
          >
            Weierstrass-Enneper Minimal Surfaces — catenoid &amp; Enneper
          </Link>{" "}
          — the H = 0 limiting case; the catenoid is the unique minimal surface
          of revolution, bridging the CMC and minimal families.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr"
            className={lk}
          >
            Scherk Doubly-Periodic Minimal Surface — saddle-tower poi
          </Link>{" "}
          — another minimal surface (H = 0) built via level-set projection;
          contrast with the ODE approach used here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr"
            className={lk}
          >
            Gielis Superformula — polar-form organic poi head
          </Link>{" "}
          — complementary shape-key approach using polar coordinates instead
          of ODE integration; compare coding strategies.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Delaunay, C.-E. (1841).{" "}
          <a
            href="https://gallica.bnf.fr/ark:/12148/bpt6k16396z/f325.item"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            "Sur la surface de révolution dont la courbure moyenne est constante."
          </a>{" "}
          <em>Journal de Mathématiques Pures et Appliquées</em>, Série 1,
          Tome 6, pp. 309–320. Public Domain. — Related: Euler (1744)
          catenoid; Plateau (1873) soap-film law; Hopf (1951) compact CMC
          conjecture.
        </li>
        <li>
          Eells, J. (1987).{" "}
          <a
            href="https://doi.org/10.1007/BF03023575"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            "The surfaces of Delaunay."
          </a>{" "}
          <em>Mathematical Intelligencer</em> 9(1):53–57. Public Domain
          mathematical content. — Related: Korevaar-Kusner-Solomon (1989)
          classification of CMC surface ends; Kapouleas (1991) gluing
          constructions for CMC surfaces.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: "blender-tutorial-python-numpy-delaunay-cmc-surfaces-unduloid-nodoid-roulette-revolution-poi-webxr",
  body: <Body />,
});
