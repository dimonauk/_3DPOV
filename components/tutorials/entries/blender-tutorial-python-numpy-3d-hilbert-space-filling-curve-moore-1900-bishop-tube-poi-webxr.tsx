import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-3d-hilbert-space-filling-curve-moore-1900-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — 3D Hilbert Space-Filling Curve: Moore's n-D Extension (1900), Peano Surjectivity, Hausdorff Dimension 3, Skilling Transposed-Bit Algorithm & Bishop-Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "A space-filling curve maps the unit interval [0,1] continuously and surjectively onto [0,1]³: every point of the solid cube is the image of some parameter value. David Hilbert's 1891 curve achieved this in 2D; E. H. Moore's 1900 generalisation extends it to arbitrary dimensions. In 3D, the order-k curve visits every voxel of a 2ᵏ × 2ᵏ × 2ᵏ integer lattice exactly once with each consecutive pair face-adjacent, and the limiting curve has Hausdorff–Besicovitch dimension exactly 3. This tutorial implements the Skilling (2004) transposed-bit decoding algorithm in pure Python/numpy — no extra packages required in Blender's interpreter — then extrudes a Bishop parallel-transport tube along the 512 waypoints of the order-3 curve, assigns a cobalt→amber FLOAT_COLOR gradient, and exports a Draco-6 GLB poi head ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        There is something philosophically unsettling about a space-filling
        curve: a one-dimensional thread, drawn continuously, that fills a
        solid three-dimensional region. No finite-order approximation actually
        fills the cube — each order-k iteration still leaves gaps — but the
        limiting object genuinely does. Measure theory resolves the apparent
        paradox: the image has Lebesgue measure 1 (it&apos;s the whole cube),
        and the preimage of any individual point is a Cantor-like set of
        measure zero. The curve is everywhere continuous, nowhere
        differentiable, and surjective by construction.
      </p>

      <h2>From Peano (1890) to Hilbert (1891) to Moore (1900)</h2>
      <p>
        Giuseppe Peano published the first space-filling curve in 1890 as a
        pure existence proof — his parametrisation was a base-3 digit
        rearrangement, visually obscure. Hilbert&apos;s 1891 response was
        geometric: he described a recursive subdivision of the unit square into
        four quadrants, connected by a Hamiltonian path that reverses
        alternating sub-curves to preserve continuity across quadrant
        boundaries. The construction is self-evident from a picture; each
        iteration quadruples the resolution.
      </p>
      <p>
        Moore&apos;s 1900 generalisation to n dimensions works by the same
        logic: at each step, the unit hypercube is divided into 2ⁿ sub-cubes,
        and the sub-curves are connected by choosing orientations (rotations
        and reflections of the hypercube) that align the exit of sub-cube k
        with the entry of sub-cube k+1. In 3D this requires bookkeeping over
        24 possible orientations — the rotation group of the cube — which is
        the combinatorial complexity that makes 3D Hilbert curve code harder
        to read than the elegant 2D picture.
      </p>

      <h2>Skilling&apos;s transposed-bit algorithm</h2>
      <p>
        John Skilling&apos;s 2004 paper &ldquo;Programming the Hilbert
        curve&rdquo; gave a compact algorithm that avoids explicit orientation
        tables entirely. The key insight is a &ldquo;transposed&rdquo;
        representation: instead of storing the Hilbert index as a single large
        integer, store it as n p-bit integers X[0..p−1] where X[i] packs bit i
        from all n coordinate axes into a single n-bit integer. Two simple
        passes then decode this into Cartesian coordinates:
      </p>
      <ol>
        <li>
          <strong>Inverse undo-excess-work</strong> — reverses the excess
          encoding that ensures face-adjacency. A nested loop XORs high bits
          into low bits to undo the &ldquo;reflected Gray code&rdquo; used at
          each recursion level.
        </li>
        <li>
          <strong>Gray decode</strong> — inverts the standard Gray code applied
          to remove bit-inversion ambiguity. A simple sequential XOR plus a
          parity correction handles this in O(n) operations.
        </li>
      </ol>
      <p>
        The total cost per point is O(n·p) — about 36 bit operations for
        n=3, p=4 — making even a brute-force Python loop over all 4096 points
        run in well under a second inside Blender&apos;s interpreter.
      </p>

      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Core Skilling decode — adapted from galtay/hilbertcurve (MIT)
def _h_to_transpose(h: int, p: int, n: int) -> list[int]:
    """Convert Hilbert integer h to transposed representation X."""
    X = [0] * n
    for bit_idx in range(p * n):
        X[bit_idx % n] |= ((h >> bit_idx) & 1) << (p - 1 - bit_idx // n)
    return X

def _transpose_to_axes(X: list[int], p: int, n: int) -> list[int]:
    """Decode transposed X to n-D Cartesian coordinate vector."""
    X = list(X)
    N = 1 << p   # 2^p

    # Pass 1: inverse undo excess work
    Q = 2
    while Q != N:
        P = Q - 1
        for i in range(n - 1, -1, -1):
            if X[i] & Q:
                X[0] ^= P           # invert
            else:
                t = (X[0] ^ X[i]) & P
                X[0] ^= t
                X[i] ^= t
        Q <<= 1

    # Pass 2: Gray decode
    for i in range(1, n):
        X[i] ^= X[i - 1]
    t = 0
    Q = N
    while Q > 1:
        Q >>= 1
        if X[n - 1] & Q:
            t ^= Q - 1
    for i in range(n):
        X[i] ^= t
    return X`}
      </pre>

      <p>
        The outer loop simply iterates h from 0 to 8ᵒʳᵈᵉʳ−1 and collects
        (x, y, z) tuples into a numpy array, which is then normalised to
        [−SCALE, +SCALE]³.
      </p>

      <h2>Hausdorff dimension: why it is exactly 3</h2>
      <p>
        The Hausdorff dimension of the order-k approximation is always 1 (it
        is a rectifiable curve with finite length). The <em>limit</em> object,
        however, is the Hausdorff dimension of its image C∞ = C([0,1]) ⊂ ℝ³.
        Since C∞ contains the entire unit cube (by surjectivity) and the cube
        has Hausdorff dimension 3, we have dim_H(C∞) = 3. The Hilbert curve
        itself remains measure zero as a subset of [0,1], but its image is
        full-measure in ℝ³.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr"
          className={lk}
        >
          Menger Sponge (dim_H ≈ 2.727)
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-mandelbulb-power8-triplex-algebra-white-nylander-fractal-poi-head-webxr"
          className={lk}
        >
          Mandelbulb (dim_H ≈ 2.97)
        </Link>
        : both are proper subsets of ℝ³ with fractional dimension. The Hilbert
        curve&apos;s image achieves the maximum possible dimension for a
        bounded subset of ℝ³.
      </p>

      <h2>Curve length diverges</h2>
      <p>
        At order k the curve&apos;s total arc length inside the unit cube is
        (8ᵏ − 1) edge-lengths, where each edge has length 1/(2ᵏ − 1). The
        length is thus L(k) = (8ᵏ − 1)/(2ᵏ − 1) ∼ 4ᵏ → ∞. The limiting
        curve has infinite arc length — it is not rectifiable. This is the
        cost of surjectivity: to visit every point of a solid region, the path
        must grow without bound.
      </p>

      <h2>Face-adjacency: why it matters for the tube</h2>
      <p>
        The construction guarantees that consecutive waypoints differ in
        exactly one coordinate by exactly one lattice step. This means the
        tube&apos;s Bishop frame never needs to rotate more than
        approximately 90° between segments — no sharp bends, no near-zero
        cross-products, no numerical instabilities. Compare the Hilbert
        ordering with a na&iuml;ve raster scan of the same lattice: consecutive
        voxels along rows are fine, but row-to-row jumps are long diagonal
        leaps that would crease the tube badly. The Hilbert ordering is the
        natural topology-preserving raster.
      </p>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        The Frenet–Serret frame — tangent, principal normal, binormal — fails
        wherever the curvature vanishes: the normal is undefined and the tube
        flips through π. The Bishop frame (R. L. Bishop, 1975) avoids this by
        propagating the cross-section via the minimal rotation that tracks the
        tangent. The update rule is a Rodrigues rotation applied to the previous
        normal vector:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# Rodrigues minimal rotation from T[i-1] to T[i]
axis  = np.cross(T[i-1], T[i])
sin_a = np.linalg.norm(axis)
cos_a = T[i-1] @ T[i]
if sin_a < 1e-10:
    N[i] = N[i-1]                    # parallel — no rotation needed
else:
    axis /= sin_a
    N[i] = (N[i-1] * cos_a
            + np.cross(axis, N[i-1]) * sin_a
            + axis * (axis @ N[i-1]) * (1.0 - cos_a))
    N[i] /= np.linalg.norm(N[i])`}
      </pre>
      <p>
        The same technique is used in the studio&apos;s{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
          className={lk}
        >
          Torus Knot tutorial
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lissajous-knots-chebyshev-amphichiral-bishop-tube-poi-webxr"
          className={lk}
        >
          Lissajous Knots tutorial
        </Link>
        . The Hilbert curve introduces a new wrinkle: because consecutive
        segments are always axis-aligned, the tangent jumps by exactly 90° at
        every corner. The Rodrigues rotation handles this cleanly since sin(90°)
        = 1 ≠ 0, but the resulting tube has a visible 90° twist at every
        lattice corner — which is part of the geometry&apos;s appeal rather
        than an artefact.
      </p>

      <h2>Vertex colour: cobalt → amber along t</h2>
      <p>
        A{" "}
        <Link
          href="/tutorials/blender-tutorial-vertex-colour-attributes"
          className={lk}
        >
          FLOAT_COLOR POINT domain attribute
        </Link>{" "}
        named <code>Hilbert_T</code> encodes the curve parameter t ∈ [0, 1]
        as a colour ramp: cobalt (0, 0.35, 1) at the curve&apos;s start →
        amber (1, 0.65, 0) at its end. The Blender 5.x mesh-attribute API
        writes directly to <code>me.attributes[&quot;Hilbert_T&quot;].data[i].color</code>;
        the GLTF exporter automatically maps this to{" "}
        <code>COLOR_0</code> in the GLB, giving the gradient in WebXR without
        any additional texture bake.
      </p>

      <h2>Troubleshooting</h2>
      <dl>
        <dt>
          <strong>
            Script runs but no object appears in the viewport
          </strong>
        </dt>
        <dd>
          Check the system console (<em>Window → Toggle System Console</em>
          on Windows, or the terminal on macOS/Linux) for{" "}
          <code>[Hilbert] Tube: … verts…</code>. If the count is 0, the
          bmesh face loop may have hit duplicate-vertex errors. Increase{" "}
          <code>TUBE_R</code> slightly so adjacent rings do not overlap at
          90° corners.
        </dd>
        <dt>
          <strong>GLB export produces a completely black mesh</strong>
        </dt>
        <dd>
          Confirm <code>export_colors=True</code> in the{" "}
          <code>bpy.ops.export_scene.gltf</code> call. Blender 5.1 defaults
          this to False, suppressing <code>COLOR_0</code> from vertex
          attributes.
        </dd>
        <dt>
          <strong>ORDER=4 runs slowly (&gt; 30 s)</strong>
        </dt>
        <dd>
          The decode loop is pure Python. Vectorise by pre-building the bit
          table as a numpy lookup: compute all 8^p transposed-bit patterns
          once, then index into them with np.arange(8**ORDER). This reduces
          ORDER=4 from ~4 096 Python iterations to a single numpy broadcast
          at the cost of ~32 KB of cache.
        </dd>
      </dl>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Hilbert D (1891). &ldquo;Über die stetige Abbildung einer Linie auf
          ein Flächenstück.&rdquo; <em>Math. Ann.</em>{" "}
          <strong>38</strong>:459–460. Public domain (pre-1927).{" "}
          <a
            className={lk}
            href="https://doi.org/10.1007/BF01199431"
            target="_blank"
            rel="noopener noreferrer"
          >
            doi:10.1007/BF01199431
          </a>
          . Related: Peano G (1890) &ldquo;Sur une courbe, qui remplit toute
          une aire plane,&rdquo; <em>Math. Ann.</em> <strong>36</strong>:157–160
          (the original existence proof); Moore E H (1900) &ldquo;On certain
          crinkly curves,&rdquo; <em>Trans. Amer. Math. Soc.</em>{" "}
          <strong>1</strong>:72–90 (n-dimensional extension, public domain).
        </li>
        <li>
          Galtay A (2017–2024). <em>hilbertcurve</em>. MIT licence.{" "}
          <a
            className={lk}
            href="https://github.com/galtay/hilbertcurve"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/galtay/hilbertcurve
          </a>
          . Python implementation of Skilling J (2004) &ldquo;Programming the
          Hilbert curve,&rdquo; <em>AIP Conf. Proc.</em>{" "}
          <strong>707</strong>:381–387, doi:10.1063/1.1751381. Related
          projects:{" "}
          <a
            className={lk}
            href="https://github.com/jakubcerveny/gilbert"
            target="_blank"
            rel="noopener noreferrer"
          >
            gilbert
          </a>{" "}
          (MIT; generalises to non-power-of-2 grids) and{" "}
          <a
            className={lk}
            href="https://arxiv.org/abs/1109.2323"
            target="_blank"
            rel="noopener noreferrer"
          >
            Haverkort (2011) arXiv:1109.2323 [CC BY 3.0]
          </a>{" "}
          — a systematic inventory of all 10 694 931 distinct 3D Hilbert-type
          curves classified by symmetry.
        </li>
        <li>
          NumPy Developers.{" "}
          <a
            className={lk}
            href="https://numpy.org/doc/stable/"
            target="_blank"
            rel="noopener noreferrer"
          >
            NumPy User Guide
          </a>
          . BSD-3-Clause. Related:{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  description:
    "Implements the Skilling (2004) transposed-bit Hilbert-curve decoder in pure numpy, extrudes a Bishop parallel-transport tube along all 512 waypoints of the order-3 3D Hilbert curve, and exports a cobalt-to-amber Draco-6 GLB poi head for WebXR.",
  date: "2026-08-22",
  tags: [
    "blender",
    "python",
    "numpy",
    "hilbert-curve",
    "space-filling",
    "fractal",
    "bishop-frame",
    "webxr",
    "poi-head",
    "hausdorff",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-3d-hilbert-space-filling-curve-moore-1900-bishop-tube-poi-webxr",
});
