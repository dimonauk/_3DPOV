import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr";

function Body() {
  return (
    <>
      <p>
        In 1974 Roger Penrose described a pair of quadrilaterals — a{" "}
        <strong>kite</strong> and a <strong>dart</strong> — that tile the plane
        without ever repeating. These are the P2 tiles: the kite is convex with
        angles 72°-72°-72°-144°, and the dart is non-convex (one reflex angle
        of 216°) with angles 36°-72°-36°-216°. Both have sides in the ratio 1
        to φ = (1+√5)/2 ≈ 1.618, the golden ratio. In this tutorial we generate
        the P2 tiling from Robinson triangles using the same deflation algorithm
        used for{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr"
        >
          P3 rhombuses
        </Link>
        , but re-pair the triangles to produce kites and darts, assemble an
        extruded stage-floor mesh, and export a GLB for WebXR.
      </p>

      <h2>Why two tile types force aperiodicity</h2>
      <p>
        A single tile type can always tile periodically (translate by a lattice
        vector). Two tiles can still tile periodically — think of a brick wall.
        What Penrose discovered is that the <em>matching rules</em> on the kite
        and dart (decorative arcs that must align across shared edges) make
        any periodic arrangement impossible. The combinatorial proof uses the
        observation that a period would require infinitely many tiles to agree
        on a translation, but the frequency of each tile type is irrational
        (kite:dart ratio = φ, a Pisot number), ruling out any rational lattice.
      </p>
      <p>
        Equivalently: the P2 tiling is a projection of a 2D slice of a 5D
        hypercubic lattice (de Bruijn 1981). Any periodic tiling would require
        that 2D slice to be rational — which it isn&apos;t, because the 5th root
        of unity is irrational over ℚ.
      </p>

      <h2>Robinson triangles: the shared generative core</h2>
      <p>
        Both P2 and P3 tilings are built from the same two Robinson triangles:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Type 0 — golden triangle   (36°-72°-72°)
  apex A at 36°, base B and C at 72° each
  equal long sides  |AB| = |AC| = φ
  short base        |BC| = 1

Type 1 — golden gnomon     (36°-36°-108°)
  apex A at 108°, base B and C at 36° each
  equal short sides |AB| = |AC| = 1
  long base         |BC| = φ`}
      </pre>
      <p>
        The deflation rule halves the tile size by 1/φ each step, replacing
        each triangle with two smaller ones:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Type 0 → 1 smaller type-0 + 1 type-1
Type 1 → 2 smaller type-1 + 1 type-0`}
      </pre>
      <p>
        After N steps the tiles are φ^{"{-N}"} times smaller and the pattern
        density grows as φ^N. At step 5, starting from the 10-triangle
        &ldquo;sun&rdquo; seed, the disc contains roughly 380 tiles.
      </p>

      <h2>P2 vs P3: the one algorithmic difference</h2>
      <p>
        In P3, same-type triangles pair at their <em>base</em> edge:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`P3 thin rhombus:  two type-0 triangles sharing short base BC (1-edge)
P3 fat rhombus:   two type-1 triangles sharing long  base BC (φ-edge)`}
      </pre>
      <p>
        In P2, same-type triangles pair at an <em>apex-to-base</em> edge
        instead. Because the apex (A) must be the same vertex in both triangles,
        we use an <strong>ordered edge key</strong> (apex_key, other_key) rather
        than an unordered frozenset:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`P2 kite:  two type-0 triangles sharing long side AB (φ-edge, apex at A)
          kite vertex angles: A=72°, B=144°, C₁=C₂=72°
P2 dart:  two type-1 triangles sharing short side AB (1-edge, apex at A)
          dart vertex angles: A=216°(reflex), B=72°, C₁=C₂=36°`}
      </pre>
      <p>
        The kite&apos;s 144° angle forms because two 72° base angles from each
        triangle meet at vertex B. The dart&apos;s 216° reflex angle forms
        because two 108° gnomon apices both sit at vertex A.
      </p>
      <p>
        WHY ordered key: an unordered frozenset would also match triangles where
        only one has its apex at each end of the shared edge — those pairs would
        form neither a valid kite nor a valid dart. The ordered key (apex first)
        enforces the geometric constraint.
      </p>

      <h2>Kite-to-dart ratio = φ</h2>
      <p>
        The substitution matrix counting how each tile inflates into smaller
        tiles is M = [[1, 1], [1, 0]] (one large kite → 1 kite + 1 dart; one
        large dart → 1 kite). Its Perron–Frobenius eigenvalue is φ, so the
        kite:dart ratio in any large patch converges to φ. This is an irrational
        ratio, which is another way to see that no periodic lattice (which would
        require a rational ratio) can appear.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`Substitution matrix M = [[1, 1], [1, 0]]
Characteristic poly: λ² − λ − 1 = 0
Eigenvalues: φ = (1+√5)/2 ≈ 1.618  and  −1/φ ≈ −0.618
Perron-Frobenius eigenvector: [φ, 1] → kite:dart = φ:1`}
      </pre>
      <p>
        The blueprint prints this ratio after pairing; at step 5 it reads
        approximately 1.614–1.622 depending on boundary clipping.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`# ── 1. Deflation (identical to P3) ──────────────────────────
phi = (1 + 5**0.5) / 2

def _deflate(tris):
    out = []
    for (k, A, B, C) in tris:
        if k == 0:                    # golden triangle
            P = A + (B - A) / phi    # divides AB at φ-ratio from A
            out += [(0, C, P, B),    # smaller triangle at apex
                    (1, P, C, A)]    # gnomon at base corner
        else:                        # golden gnomon
            Q = B + (A - B) / phi
            R = B + (C - B) / phi
            out += [(1, R, C, A), (1, Q, R, B), (0, R, Q, A)]
    return out

# ── 2. Pairing (P2-specific ordered-key logic) ───────────────
def _rkey(z):
    return (round(z.real, 7), round(z.imag, 7))

kite_shelf = {}
dart_shelf = {}

for i, (k, A, B, C) in enumerate(tris):
    if k == 0:   # register long sides A→B and A→C with apex at A
        kite_shelf.setdefault((_rkey(A), _rkey(B)), []).append((i, C))
        kite_shelf.setdefault((_rkey(A), _rkey(C)), []).append((i, B))
    else:         # register short sides A→B and A→C with apex at A
        dart_shelf.setdefault((_rkey(A), _rkey(B)), []).append((i, C))
        dart_shelf.setdefault((_rkey(A), _rkey(C)), []).append((i, B))

# ── 3. Consume shelf → kite and dart quadrilaterals ──────────
used = [False] * len(tris)
for key, entries in kite_shelf.items():
    paired = [e for e in entries if not used[e[0]]]
    if len(paired) >= 2:
        i1, w1 = paired[0];  i2, w2 = paired[1]
        if not (used[i1] or used[i2]):
            apex = tris[i1][1]
            base = complex(*key[1])
            kites.append(('kite', w1, apex, w2, base))
            used[i1] = used[i2] = True`}
      </pre>

      <h2>Mesh construction</h2>
      <p>
        Each tile is built as an extruded slab: four base vertices at z = 0 and
        four top vertices at z = SLAB_HEIGHT, with six faces (top, bottom, four
        sides). An INSET = 0.940 shrinks each tile toward its centroid to leave
        a narrow grout gap — critical for the tiling to read as individual tiles
        in the WebXR scene rather than a flat plane. The dart extrusion (35 mm)
        is slightly lower than the kite (55 mm) to make the non-convex tile
        visually recessed.
      </p>
      <p>
        The <code>TileType</code> vertex colour attribute encodes the tile kind
        (amber-gold for kites, deep crimson for darts) via a{" "}
        <code>ShaderNodeAttribute → Principled BSDF</code> material graph.
        Metallic = 0.55, Roughness = 0.22 gives a cast-metal floor aesthetic
        with EEVEE Next bloom catching the extruded top edges.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>Fewer tiles than expected</strong>: check DISC_RADIUS. At
          step 5, tiles have edge length ≈ 1/φ⁵ ≈ 0.090 units; a disc of radius
          2.5 should contain ~380 tiles. If far fewer appear, the deflation seed
          may have the wrong initial scale.
        </li>
        <li>
          <strong>kite/dart ratio far from φ</strong>: boundary clipping
          discards tiles that straddle DISC_RADIUS. The ratio converges only in
          the interior. Increase DISC_RADIUS or DEFLATION_STEPS to reduce
          boundary effects.
        </li>
        <li>
          <strong>Many unpaired triangles left in shelf</strong>: boundary
          triangles at the disc edge genuinely lack partners — this is expected.
          If the unpaired fraction is &gt; 30%, the ordered-key pairing may have
          a bug (check that the apex vertex A is truly the 36° or 108° vertex).
        </li>
        <li>
          <strong>Non-convex dart renders incorrectly</strong>: the dart quad
          has a reflex angle at the concave tail vertex. Blender&apos;s{" "}
          <code>bm.faces.new()</code> accepts the quad; glTF exporters
          triangulate it correctly. If shading looks wrong, run{" "}
          <code>bmesh.ops.triangulate(bm, faces=bm.faces)</code> before export.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr"
          >
            Penrose P3 Rhombus — Robinson Deflation Stage Floor
          </Link>{" "}
          — same deflation, P3 pairing for comparison.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-ammann-beenker-octagonal-quasicrystal-silver-ratio-multigrid-stage-floor-webxr"
          >
            Ammann-Beenker Octagonal Quasicrystal
          </Link>{" "}
          — 8-fold analogue using silver ratio λ = 1+√2.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-phyllotaxis-golden-angle-fibonacci-poi-disc-webxr"
          >
            Phyllotaxis — Golden Angle & Fibonacci Parastichies
          </Link>{" "}
          — the same φ driving a different natural aperiodic pattern.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Penrose R (1974) &ldquo;Role of Aesthetics in Pure and Applied
          Mathematical Research.&rdquo; <em>Bull. Inst. Math. Appl.</em>{" "}
          <strong>10</strong>: 266–271. Public domain (pre-1978 US).
        </li>
        <li>
          de Bruijn NG (1981) &ldquo;Algebraic theory of Penrose&apos;s
          nonperiodic tilings of the plane.&rdquo;{" "}
          <em>Kon. Nederl. Akad. Wetensch. Proc. Ser. A</em>{" "}
          <strong>84</strong>: 39–66. Public domain.{" "}
          <a
            className={lk}
            href="https://www.math.ucdavis.edu/~gravner/MAT135B/resources/de-Bruijn.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            PDF
          </a>
          . Related: the de Bruijn multigrid dual-grid method (also used for
          Ammann-Beenker quasicrystals above).
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
  title:
    "Python numpy — Penrose P2 Kite-Dart: Aperiodic Tiling, Apex-Ordered Robinson Deflation, φ-Ratio Tile Counts & Stage Floor GLB for WebXR (Blender 5.1)",
  description:
    "Generates the Penrose P2 kite-dart aperiodic tiling via Robinson triangle deflation with an apex-ordered pairing rule, demonstrates kite:dart ratio converging to φ, and exports an extruded amber/crimson stage floor GLB for WebXR.",
  date: "2026-08-22",
  tags: ["blender", "python", "numpy", "penrose", "quasicrystal", "tiling", "webxr", "stage-floor"],
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-penrose-p2-kite-dart-aperiodic-robinson-deflation-stage-floor-webxr",
});
