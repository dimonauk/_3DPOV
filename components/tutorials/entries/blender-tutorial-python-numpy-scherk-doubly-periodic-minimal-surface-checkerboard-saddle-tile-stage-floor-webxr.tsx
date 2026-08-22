import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>The closed-form minimal surface nobody expected</h2>
      <p>
        In 1834 the Berlin Academy of Sciences offered a prize for a new
        complete minimal surface with a closed-form equation. The catenoid and
        helicoid had been known for a century; a flat plane is trivial; the
        Academy wanted something genuinely new.
      </p>
      <p>
        Heinrich Ferdinand Scherk delivered it. His 1835 paper
        &ldquo;Bemerkungen über die kleinste Fläche innerhalb gegebener
        Grenzen&rdquo; (Remarks on the smallest surface within given
        boundaries) gave, among other things, the{" "}
        <strong>doubly periodic minimal surface</strong>:
      </p>
      <pre>{`z = ln(cos y / cos x)      (cos x · cos y > 0)`}</pre>
      <p>
        Or equivalently: <code>e^z cos y = cos x</code>. The surface is
        defined on a checkerboard of open squares in the xy-plane — those
        where cos x and cos y share the same sign — and it tiles the plane
        with period 2π in both directions. At the boundary of each square
        (where cos x or cos y vanishes) the surface goes to ±∞,
        creating &ldquo;flat ends&rdquo; analogous to the catenoid&rsquo;s
        two annular ends but infinitely many of them.
      </p>
      <p>
        It took another 150 years before a second embedded doubly periodic
        minimal surface was found (the Schwarz P and D surfaces, rediscovered
        and classified in the 1960s–70s). Scherk&rsquo;s surface was not an
        accident — it was the first of a whole hidden zoo.
      </p>

      <h2>Why it is minimal: direct verification</h2>
      <p>
        A surface z = f(x, y) is minimal when its mean curvature vanishes:{" "}
        <code>H = 0</code>. For the Scherk surface, f(x, y) = ln(cos y /
        cos x):
      </p>
      <ul>
        <li>
          <code>f_x = tan x</code>, <code>f_y = −tan y</code>
        </li>
        <li>
          <code>f_xx = sec²x</code>, <code>f_yy = −sec²y</code>,{" "}
          <code>f_xy = 0</code>
        </li>
      </ul>
      <p>
        The mean curvature formula for a graph z = f(x, y) is:
      </p>
      <pre>{`H = ((1 + f_y²) f_xx − 2 f_x f_y f_xy + (1 + f_x²) f_yy) / (2W³)
  = ((1 + tan²y) sec²x − (1 + tan²x) sec²y) / (2W³)
  = (sec²y · sec²x − sec²x · sec²y) / (2W³)
  = 0  ✓`}</pre>
      <p>
        No Euler–Lagrange variational argument needed: the cancellation is
        elementary. This is why the equation is so striking — minimality is
        visible by inspection once you know the derivatives.
      </p>

      <h2>Gaussian curvature — an analytic formula</h2>
      <p>
        The Gaussian curvature of z = f(x, y) is:
      </p>
      <pre>{`K = (f_xx f_yy − f_xy²) / (1 + f_x² + f_y²)²
  = (sec²x · (−sec²y) − 0) / W⁴
  = − sec²x sec²y / W⁴       W² = 1 + tan²x + tan²y`}</pre>
      <p>
        This is always negative (a saddle at every point, as required for any
        minimal surface that is not flat). At the tile centre (x = y = 0):
        K = −1. As (x, y) → (±π/2, ·) or (·, ±π/2), K → 0: the surface
        becomes asymptotically flat near its infinite walls.
      </p>
      <p>
        The blueprint computes K analytically from the numpy arrays and maps
        it to a cobalt–amber vertex colour: cobalt at K = −1 (most curved),
        amber where K ≈ 0 (flattest). Compare with the numerically computed
        curvature in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
          className={lk}
        >
          Discrete Gaussian Curvature (Gauss–Bonnet angle-defect)
        </Link>{" "}
        tutorial, which approximates the same quantity from mesh geometry alone.
      </p>

      <h2>Tiling strategy: alternating-sign checkerboard</h2>
      <p>
        The nine fundamental domains (3 × 3 grid) are laid out with offset
        centres at
        <code>(cx, cy) = (i − 1, j − 1) · π · TILE_SCALE</code> for i, j ∈
        &#123;0, 1, 2&#125;. Adjacent tiles get a sign flip on z:
      </p>
      <pre>{`sign(i, j) = (−1)^(i + j)`}</pre>
      <p>
        This is the correct topological move: the true Scherk surface has both
        the tile at (i, j) and the tile at (i±1, j) approaching
        |z| → +∞ at their shared wall, meaning they are
        &ldquo;glued&rdquo; along a flat end that opens upward. Flipping the
        sign makes a neighbouring downward-opening tile, which is the other
        half of the period cell — exactly as the surface continues past each
        wall in the mathematical sense.
      </p>
      <p>
        For a stage floor this means: you see a 3 × 3 arrangement of
        interlocking saddles, alternately cupping up and down, with amplitude
        controlled by the SK_Full shape key.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        Key design decisions in{" "}
        <code>blueprint.py</code>:
      </p>
      <ul>
        <li>
          <strong>MARGIN = 0.13 rad</strong> — trims the domain 0.13 rad
          inside each ±π/2 boundary. At u = π/2 − 0.13, cos u = sin 0.13 ≈
          0.130, so ln(1/0.130) ≈ 2.04 and max z ≈ 0.61 m. Larger MARGIN =
          shallower saddles; smaller = taller spikes.
        </li>
        <li>
          <strong>foreach_set for vertex colour</strong> — the FLOAT_COLOR
          domain=POINT attribute avoids the 8-bit quantisation of
          BYTE_COLOR and exports to GLB without artefacts in the amber
          gradient.
        </li>
        <li>
          <strong>Shape key at 0 = flat plane</strong> — the mesh rest pose
          is z = 0 everywhere; shape keys carry the Scherk displacement. This
          keeps the GLTF morph-target weight semantics clean: weight 0 = flat,
          weight 1 = full Scherk.
        </li>
        <li>
          <strong>from_pydata not bmesh</strong> — for ~24 k vertices and
          ~23 k quads the Python list overhead of from_pydata is acceptable
          and far simpler than constructing a bmesh face-by-face.
        </li>
      </ul>

      <h2>Related studio work</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-enneper-surface-weierstrass-representation-minimal-gauss-curvature-saddle-poi-webxr"
            className={lk}
          >
            Enneper Surface
          </Link>{" "}
          — the &ldquo;simplest non-trivial minimal surface&rdquo;: Weierstrass
          data g(z) = z, dh = dz. Scherk&rsquo;s doubly periodic surface
          requires modular-function Weierstrass data — far harder. The Enneper
          tutorial is the prerequisite.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
            className={lk}
          >
            Schwarz P, D &amp; Gyroid (TPMS)
          </Link>{" "}
          — the other doubly-then-triply periodic minimal surfaces, discovered
          and rediscovered in the 1960s–80s. Those require marching tetrahedra;
          Scherk&rsquo;s surface is the rare case with an explicit graph formula.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr"
            className={lk}
          >
            Penrose P2 Stage Floor
          </Link>{" "}
          — another mathematical stage floor in the same library format;
          see that tutorial for the export and holoflow:category metadata
          conventions shared here.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mean-curvature-flow-huisken-cotangent-laplacian-sphere-smoothing-poi-webxr"
            className={lk}
          >
            Mean Curvature Flow
          </Link>{" "}
          — Scherk&rsquo;s surface is a fixed point of mean curvature flow
          (H = 0 means nothing moves); the MCF tutorial shows the opposite
          behaviour — surfaces converging to spheres.
        </li>
      </ul>

      <h2>Outside sources &amp; attribution</h2>
      <ul>
        <li>
          <strong>Scherk H F (1835)</strong>{" "}
          &ldquo;Bemerkungen über die kleinste Fläche innerhalb gegebener
          Grenzen,&rdquo; <em>J. reine angew. Math.</em> 13:185–208. Public
          domain (1835).{" "}
          <a
            href="https://gdz.sub.uni-goettingen.de/id/PPN243919689_0013"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            GDZ Göttingen digital copy
          </a>
          . Related: Riemann (1866) minimal surface classification;
          Weierstrass (1866) &ldquo;Untersuchungen über die Flächen&rdquo; —
          both PD, both building on Scherk&rsquo;s explicit example.
        </li>
        <li>
          <strong>NumPy Developers.</strong>{" "}
          <em>NumPy 1.26 User Guide.</em> BSD-3-Clause.{" "}
          <a
            href="https://numpy.org/doc/1.26/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org/doc/1.26
          </a>
          . Related sibling: SciPy (BSD-3-Clause){" "}
          <a
            href="https://scipy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            scipy.org
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
    "Python numpy — Scherk's Doubly Periodic Minimal Surface: H. F. Scherk 1835, z=ln(cos y / cos x), Analytic K=−sec²x sec²y / W⁴, 3×3 Checkerboard Saddle-Tile Stage Floor for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "minimal surface",
    "Scherk",
    "doubly periodic",
    "Gaussian curvature",
    "stage floor",
    "WebXR",
    "GLB",
  ],
  date: "2026-08-22",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-scherk-doubly-periodic-minimal-surface-checkerboard-saddle-tile-stage-floor-webxr/scherk_doubly_periodic_floor.glb",
  },
});
