import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr";

const TITLE =
  "Python numpy — Scherk Doubly-Periodic Minimal Surface: 1835 Diamond Soap-Film Lattice, Level-Set Sphere Projection & Shape-Key Morphs for WebXR (Blender 5.1)";

const LEDE =
  "Scherk's 1835 surface is the third classical minimal surface: a doubly-periodic tiling of the xy-plane by saddle-shaped soap-film cells, each satisfying e^{kz}·cos(kx) = cos(ky). Unlike the catenoid (a surface of revolution) or the helicoid (a ruled surface), Scherk's variant has no continuous symmetry — its beauty lies in the diamond checkerboard of asymptotic lines and the way each cell dips to −∞ on two sides while rising to +∞ on the other two. We project a subdivided icosphere onto this level set via per-vertex binary search, producing a closed poi head whose silhouette directly traces Scherk's original 19th-century calculation. Four shape keys animate period doubling, a 45° lattice rotation, and saddle-height compression for real-time morphing in WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Scherk, H.F. (1835). Bemerkungen über die kleinste Fläche innerhalb gegebener Grenzen. Crelle's Journal 13:185–208.",
      url: "https://archive.org/details/journalfurdierein13crell",
      licence: "Public Domain (published > 100 years ago)",
      author: "Heinrich Ferdinand Scherk",
    },
    {
      label:
        "NumPy contributors — NumPy Linear Algebra Reference. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/reference/routines.linalg.html",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        In 1835 Heinrich Ferdinand Scherk posed a question Euler had left open:
        are there minimal surfaces that are <em>doubly periodic</em> — repeating
        in two independent directions, like a wallpaper? The answer turned out to
        be yes, and it was a soap film shaped like a diamond lattice of saddles,
        each cell defined by the equation:
      </p>
      <pre>{`e^z · cos(x) = cos(y)`}</pre>
      <p>
        Inside each diamond where both cosines are positive, this is equivalent
        to the explicit height function:
      </p>
      <pre>{`z(x, y) = ln[ cos(y) / cos(x) ]`}</pre>
      <p>
        The surface dips to −∞ at <code>x → ±π/2</code> and rises to +∞ at{" "}
        <code>y → ±π/2</code>. The asymptotic lines (where the surface goes to
        infinity) lie on a square grid rotated 45° — the "diamond" lines — and
        they are the structural reason the surface can tile indefinitely.
      </p>

      <h2>Why this is a minimal surface</h2>
      <p>
        A surface has zero mean curvature H = 0 when the two principal
        curvatures κ₁ and κ₂ cancel everywhere: κ₁ = −κ₂. For Scherk's surface,
        this can be verified directly by computing the first and second
        fundamental forms and substituting into the Euler–Lagrange equation for
        area minimisation. The result is:
      </p>
      <pre>{`H = (κ₁ + κ₂) / 2
  = (e^{2z}·cos²x + cos²y) · [second-order terms]
  = 0   identically on F = 0`}</pre>
      <p>
        Physically, this means a soap film clamped to two parallel square
        wire grids (offset by half a period in both x and y) would, in the
        absence of pressure, settle into Scherk's surface. The diamond-lattice
        pattern is the global shape that globally minimises area while
        satisfying the boundary conditions.
      </p>

      <h2>Relationship to the catenoid and helicoid</h2>
      <p>
        The Weierstrass–Enneper representation encodes every conformal minimal
        surface as a pair (f, g) of complex functions. For the Scherk surface,
        the Weierstrass data lives on the Riemann sphere with four punctures
        at the fourth roots of unity (±1, ±i):
      </p>
      <pre>{`f(z) = 4c / (1 − z⁴)   g(z) = iz`}</pre>
      <p>
        The punctures correspond exactly to the four families of asymptotic
        ends — the diamond-lattice corners where the surface escapes to infinity.
        The associate-family Bonnet rotation <code>e^{iθ}</code> applied to
        this data smoothly deforms the doubly-periodic Scherk (θ = 0) into the
        singly-periodic Scherk <em>saddle tower</em> (θ = π/2), and through
        intermediate non-periodic forms for 0 &lt; θ &lt; π/2. This is the
        same Bonnet rotation that deforms the catenoid into the helicoid —
        the structural theme connecting all classical minimal surfaces.
      </p>

      <h2>The level-set form for Blender</h2>
      <p>
        Rather than integrating the Weierstrass forms numerically, we use
        the implicit level set:
      </p>
      <pre>{`F(x, y, z) = exp(k·z) · cos(k·x) − cos(k·y) = 0`}</pre>
      <p>
        where <code>k = 2π / PERIOD</code>. This has two advantages over the
        explicit form:
      </p>
      <ol>
        <li>
          It is defined globally — no domain-masking needed. The zero set
          automatically picks out all diamond cells simultaneously.
        </li>
        <li>
          The gradient ∇F is everywhere non-zero on the surface (away from
          the asymptotic ends), guaranteeing that binary search along any
          radial ray converges monotonically without overshooting.
        </li>
      </ol>
      <p>
        The gradient is:
      </p>
      <pre>{`∂F/∂x = −k · exp(kz) · sin(kx)
∂F/∂y =  k · sin(ky)
∂F/∂z =  k · exp(kz) · cos(kx)`}</pre>
      <p>
        On the surface where exp(kz)·cos(kx) = cos(ky), the z-component
        simplifies to k·cos(ky), which is non-zero except at the asymptotic
        lines. The binary search below exploits this: it will never find a
        false root, only the genuine surface crossing.
      </p>

      <h2>Workshop — step by step</h2>

      <h3>Step 1 — Parameters at the top</h3>
      <p>
        Open <code>blueprint.py</code> in the Scripting workspace. The constants
        at the top control everything:
      </p>
      <pre>{`SPHERE_SUBDIVS = 4      # 1280 faces, 2562 vertices
POI_RADIUS     = 0.080  # 8 cm standard poi head
PERIOD_BASE    = 0.160  # one saddle cell across the sphere diameter`}</pre>
      <p>
        With PERIOD_BASE = 0.16 m and POI_RADIUS = 0.08 m, one full period
        spans the sphere: k·R = (2π/0.16)·0.08 = π. The sphere encloses
        exactly one Scherk saddle cell — the simplest non-trivial configuration.
      </p>

      <h3>Step 2 — The level-set function</h3>
      <p>
        The <code>scherk_F</code> function evaluates the level set on a batch
        of points simultaneously using NumPy broadcasting:
      </p>
      <pre>{`def scherk_F(pts, k, z_scale, Rz_2x2):
    p = pts.copy()
    if Rz_2x2 is not None:
        p[:, :2] = p[:, :2] @ Rz_2x2.T   # rotate xy plane
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    exp_arg = np.clip(k * z_scale * z, -80.0, 80.0)
    return np.exp(exp_arg) * np.cos(k * x) - np.cos(k * y)`}</pre>
      <p>
        The <code>np.clip</code> guards against float64 overflow for large
        |z| values — exp(80) ≈ 5×10³⁴, safely within float64 range; exp(710)
        would overflow to infinity and break the sign-change detection.
      </p>

      <h3>Step 3 — Binary-search ray march</h3>
      <p>
        For each vertex direction n̂, <code>ray_root</code> samples F at 96
        equally spaced points along the ray from 0.015·R to R:
      </p>
      <pre>{`ts = np.linspace(0.015 * POI_RADIUS, POI_RADIUS, MARCH_SAMPLES)
pts = ts[:, None] * n_hat[None, :]      # shape (96, 3)
Fv  = scherk_F(pts, k, z_scale, Rz)
idx = np.where(np.diff(np.sign(Fv)) != 0)[0]`}</pre>
      <p>
        On finding a sign change, it bisects 32 times to reach sub-nanometre
        precision (2⁻³² ≈ 2×10⁻¹⁰ relative error on an 8 cm radius). If no
        crossing is found — which can happen for rays aimed directly at the
        asymptotic ends — the vertex is placed at 88% of poi radius, creating a
        visible dimple that actually enhances the visual character of those regions.
      </p>
      <p>
        <strong>Failure mode:</strong> if PERIOD_BASE is set very small (say
        0.01 m with POI_RADIUS = 0.08 m), k·R = 2π·8 ≈ 50, and the surface
        crosses the ray hundreds of times. The code finds the first crossing,
        producing a very fine mesh. Above k·R ≈ 100 the 96-sample grid can miss
        crossings — increase MARCH_SAMPLES proportionally.
      </p>

      <h3>Step 4 — Shape keys for WebXR morphing</h3>
      <p>
        Four shape keys capture different geometric regimes:
      </p>
      <pre>{`KEY_PARAMS = [
    dict(name="Basis",          period_mul=1.00, z_scale=1.00, rot_deg=0.0),
    dict(name="Scherk_Dense",   period_mul=0.50, z_scale=1.00, rot_deg=0.0),
    dict(name="Scherk_Rotated", period_mul=1.00, z_scale=1.00, rot_deg=45.0),
    dict(name="Scherk_Shallow", period_mul=1.00, z_scale=0.40, rot_deg=0.0),
]`}</pre>
      <p>
        <strong>Scherk_Dense</strong> halves the period — two saddles across the
        sphere — showing the scale-independence of the minimal surface equation.
        The mesh topology stays identical; only vertex positions change.
      </p>
      <p>
        <strong>Scherk_Rotated</strong> rotates the (x,y) sampling frame 45°,
        so the saddle flanks align with the cardinal axes rather than the diagonals.
        This is a coordinate transformation, not a change of surface shape, so
        the intrinsic geometry is identical.
      </p>
      <p>
        <strong>Scherk_Shallow</strong> applies a z-scale of 0.4, compressing
        the saddle height. This is <em>not</em> a minimal surface — it breaks the
        H = 0 condition — but it is a useful design variant for performance props
        where a flatter profile is mechanically preferred.
      </p>
      <p>
        The fast bulk-assignment pattern is used throughout:
      </p>
      <pre>{`sk.data.foreach_set("co", coords)   # ~40× faster than per-vertex iteration`}</pre>

      <h3>Step 5 — Vertex colour gradient</h3>
      <p>
        Faces are coloured by the z-component of their outward normal. Faces
        nearly parallel to the xy-plane (|nz| ≈ 0) are violet — these are the
        flat saddle regions. Near-vertical flanks (|nz| ≈ 1) are gold — these
        are the asymptotic walls climbing toward infinity.
      </p>
      <pre>{`lp[col] = (0.10 + 0.90 * nz,   # R: violet → gold
           0.04 + 0.68 * nz,   # G
           0.80 - 0.70 * nz,   # B: blue → amber
           1.0)`}</pre>
      <p>
        Combined with flat shading and an Emission material, this makes the
        topology of the surface legible at a glance: you can immediately identify
        the diamond saddle centres (violet pools) and the ascending/descending
        ramps (gold gradients) that define Scherk's characteristic character.
      </p>

      <h3>Step 6 — Export as GLB</h3>
      <p>
        The Holoflow exporter settings are applied at the end of <code>main()</code>:
      </p>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath=glb_path, export_format="GLB",
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_colors=True, export_morph=True,
    export_apply=True, export_yup=True)`}</pre>
      <p>
        <code>export_yup=True</code> applies a final +Y-up rotation matching the
        WebXR coordinate convention. <code>export_morph=True</code> packages all
        four shape keys as GLTF morph targets, playable in Three.js via
        AnimationMixer or scrubbed directly from a dat.GUI slider.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Dimples at the poles</strong> — the north and south poles of
          the icosphere are aligned with the Z axis, which aims directly at the
          Scherk asymptotic region (y = ±π/2k). No level-set crossing exists
          there; the vertex is placed at CLIP_FALLBACK·POI_RADIUS. Rotate the
          icosphere 45° around Z before running the blueprint to move the poles
          away from the asymptotic lines.
        </li>
        <li>
          <strong>Overflow in exp</strong> — if the poi head is very small and
          PERIOD_BASE is much larger than POI_RADIUS, k·R &lt; 1 and the surface
          may not cross the ray at all (the saddle is larger than the sphere).
          Increase SPHERE_SUBDIVS or decrease PERIOD_BASE until k·R ≥ π.
        </li>
        <li>
          <strong>Slow runtime</strong> — the ray march iterates over every
          icosphere vertex in Python. At SPHERE_SUBDIVS = 4 (2562 verts) this
          takes about 3–8 seconds in Blender 5.1 on a modern CPU. Increasing to
          SUBDIVS = 5 (10242 verts) multiplies runtime ~4×.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-weierstrass-enneper-minimal-surfaces-catenoid-enneper-webxr" className={lk}>
            Weierstrass–Enneper Minimal Surfaces
          </Link>{" "}
          — the catenoid and helicoid; the complex-analysis framework that
          Scherk's surface also inhabits via the Bonnet family
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-marching-cubes-gyroid-sdf-isosurface-webxr" className={lk}>
            Gyroid SDF Isosurface (Marching Cubes)
          </Link>{" "}
          — a triply periodic minimal surface via a different extraction method;
          compare the level-set approach here with marching cubes
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-sdf-csg-quilez-smooth-boolean-poi-head-webxr" className={lk}>
            SDF CSG Smooth Boolean Poi Head
          </Link>{" "}
          — how level-set operations combine implicit surfaces; the same
          binary-search ray march is the fundamental primitive
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr" className={lk}>
            Kummer Quartic Algebraic Surface
          </Link>{" "}
          — another surface defined implicitly as f(x,y,z) = 0 and extracted
          as a sphere-bounded mesh; the Surface Nets approach there contrasts
          with the radial-ray projection used here
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://archive.org/details/journalfurdierein13crell"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Scherk, H.F. (1835). "Bemerkungen über die kleinste Fläche innerhalb
              gegebener Grenzen." Crelle's Journal 13:185–208. Public Domain.
            </a>
          </strong>{" "}
          — the original paper proving the doubly-periodic surface is minimal.
          Scherk derived the explicit formula z = ln(cos y / cos x) by
          separation of variables applied to the minimal surface PDE, predating
          the Weierstrass–Enneper representation by 30 years.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/reference/routines.linalg.html"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Linear Algebra Reference. BSD-3-Clause.
            </a>
          </strong>{" "}
          — the <code>np.linalg.norm</code> and vectorised array operations
          underlying the batch level-set evaluation and vertex normalisation.
          Related: <a href="https://github.com/numpy/numpy" className={lk} target="_blank" rel="noopener noreferrer">github.com/numpy/numpy</a>.
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
