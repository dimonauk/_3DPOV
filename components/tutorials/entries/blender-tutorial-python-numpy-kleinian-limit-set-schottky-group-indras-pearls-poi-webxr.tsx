import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kleinian-limit-set-schottky-group-indras-pearls-poi-webxr";

const TITLE =
  "Python numpy — Kleinian Limit Set: Schottky Group, PSL(2,ℂ) Word Enumeration & Fractal Dust Cloud for WebXR (Blender 5.1)";

const LEDE =
  "A Kleinian group is a discrete subgroup of PSL(2,ℂ) — the full group of Möbius transformations of the Riemann sphere. A Schottky group is built by pairing four disjoint circles and defining generators that swap their interiors and exteriors; repeated application of every generator and its inverse in all possible sequences produces a fractal self-similar cloud called the limit set, which when lifted to S² via inverse stereographic projection forms a three-dimensional sculpture that looks uncannily like the light-trail geometry a pair of poi traces during a symmetrical butterfly figure. This blueprint enumerates all words of length 8 in the four generators (8,748 terminal points) using a depth-first search with cancellation pruning, projects the limit set to the unit sphere, and exports it as an emissive EEVEE GLB for WebXR.";

function Body() {
  return (
    <>
      <p>
        The Möbius group PSL(2,ℂ) acts on the Riemann sphere ℂ∪&#123;∞&#125; by
        fractional linear transformations f(z)&nbsp;=&nbsp;(az+b)/(cz+d). A
        subgroup is <em>Kleinian</em> when it is discrete — orbits do not
        accumulate inside any ball. The{" "}
        <strong>limit set</strong> Λ(G) is the set of all accumulation points of
        a single orbit Gz₀; it is independent of the starting point z₀ and is
        the fractal at the heart of the group&apos;s dynamics.
      </p>

      <h2>Schottky groups: circles as generators</h2>
      <p>
        A <em>Schottky group</em> uses pairs of disjoint circles to build
        generators. Choose four circles C_a, C_A, C_b, C_B pairwise disjoint in
        ℂ. Define:
      </p>
      <ul>
        <li>
          generator <code>a</code>: the unique Möbius map sending ext(C_a) →
          int(C_A), i.e. the exterior of C_a maps homeomorphically onto the
          interior of C_A;
        </li>
        <li>
          generator <code>b</code>: similarly ext(C_b) → int(C_B).
        </li>
      </ul>
      <p>
        By a theorem of Schottky (1877) the group ⟨a,&nbsp;a⁻¹,&nbsp;b,&nbsp;b⁻¹⟩ is
        automatically discrete and free on these generators — no non-trivial word
        equals the identity. The fundamental domain is the region exterior to
        all four circles.
      </p>

      <h2>Symmetric four-circle construction</h2>
      <p>
        Place the four circles symmetrically: C_a at centre −D, C_A at centre
        +D (both on the real axis), C_b at centre −iD, C_B at centre +iD
        (imaginary axis), all of radius R. Disjointness requires:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Real-axis pair:    |2D| > 2R  →  D > R
Diagonal pair:    D√2 > 2R   →  D > R√2 ≈ 1.414·R   ← binding constraint`}
      </pre>
      <p>
        Blueprint uses D&nbsp;=&nbsp;1.55, R&nbsp;=&nbsp;1.00 — well above the
        diagonal threshold (D√2&nbsp;≈&nbsp;2.19 &gt; 2.0), close enough to the
        critical ratio that the limit set is dense and fractal rather than sparse
        and Cantor-dust-like.
      </p>

      <h2>PSL(2,ℂ) matrix form</h2>
      <p>
        The map a(z)&nbsp;=&nbsp;(D·z + D²−R²)&nbsp;/&nbsp;(z + D) has
        det&nbsp;=&nbsp;R². Normalising by R gives the SL(2,ℂ) matrix:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`K  = (D²−R²)/R      # off-diagonal scale
a  = [[D/R,  K  ], [1/R,  D/R]]   det = (D/R)² − K·(1/R) = 1  ✓
a⁻¹= [[D/R, −K  ], [−1/R, D/R]]
b  = [[D/R,  iK ], [−i/R, D/R]]   (90° rotation conjugate of a)
b⁻¹= [[D/R, −iK ], [ i/R, D/R]]`}
      </pre>
      <p>
        The b generator is derived by conjugating a with the 90° rotation
        R(z)&nbsp;=&nbsp;iz — rotation by π/2 on ℂ. This automatically places the b
        circles on the imaginary axis.
      </p>

      <h2>Limit set via DFS word enumeration</h2>
      <p>
        Because the group is free, every group element corresponds to exactly
        one reduced word — a sequence of generators a,&nbsp;a⁻¹,&nbsp;b,&nbsp;b⁻¹
        with no adjacent cancellation (no&nbsp;a immediately followed by&nbsp;a⁻¹,
        etc.). The limit set is approximated by applying all reduced words of
        length&nbsp;N to a seed point; as N→∞ the cloud converges to Λ(G).
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DEPTH  = 8
# Branching factor = 3 (4 generators − 1 that cancels the previous step)
# Terminal count: 4 · 3^(DEPTH−1) = 4 · 2187 = 8 748 points

stack = [(SEED, -1, 0)]        # (z, last_gen_id, depth)
while stack:
    z, last, d = stack.pop()
    for M, gid in GENS:
        if gid == INVERSE[last]: continue  # cancellation guard
        zn = mobius(M, z)
        if d + 1 == DEPTH:
            result.append(zn)   # terminal limit-set approximant
        else:
            stack.append((zn, gid, d + 1))`}
      </pre>
      <p>
        The stack grows at branching factor 3, making the total work
        proportional to 4&nbsp;·&nbsp;(3^N − 1)/2. Depth 8 runs in under one
        second in CPython; depth 10 (78,732 points) takes roughly 10 seconds.
      </p>

      <h2>Inverse stereographic projection to S²</h2>
      <p>
        The limit set lives in ℂ∪&#123;∞&#125; (the Riemann sphere). To visualise it in
        three dimensions, we project via the inverse of the stereographic map
        from the south pole S&nbsp;=&nbsp;(0,0,−1):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`w = u + iv  →  x = 2u/(|w|²+1),  y = 2v/(|w|²+1),  z = (|w|²−1)/(|w|²+1)`}
      </pre>
      <p>
        This maps the unit circle |w|=1 to the equator, w=0 to the south pole,
        and |w|→∞ to the north pole. The map is conformal (angle-preserving),
        so the self-similarity of the limit set in ℂ is preserved on S². The
        fractal cloud appears as a band of self-similar clusters wrapping around
        the equatorial region.
      </p>

      <h2>Mesh construction</h2>
      <p>
        GLB does not support vertex-only point clouds, so each limit point is
        represented as a tiny equilateral triangle (side 14 mm) lying in the
        tangent plane at that point on S². Tangent frames are computed in
        numpy — no Python loop over 8,748 points:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Outward normal at each S² point
n   = pts3 / norm(pts3).clip(1e-12)
# First tangent axis: cross(n, x̂) or cross(n, ŷ) to avoid degeneracy
ref = where(|n.x| < 0.85, x̂, ŷ)
t1  = cross(n, ref);  t1 /= norm(t1)
t2  = cross(n, t1);   t2 /= norm(t2)
# Equilateral triangle offset vectors
v0 = pts3 + S·t1
v1 = pts3 + S·(−t1/2 + t2·√3/2)
v2 = pts3 + S·(−t1/2 − t2·√3/2)
# Interleave into (3N, 3) vertex array via np.stack + reshape
verts = stack([v0, v1, v2], axis=1).reshape(−1, 3)
# Assign to mesh via foreach_set — O(N) not O(N·iter)
mesh.vertices.foreach_set("co", verts.ravel())`}
      </pre>

      <h2>Studio connection: poi butterfly figures</h2>
      <p>
        A poi butterfly is a figure-eight plane trajectory that, when the poi
        plane is tilted during a transition, sweeps a two-lobed arc on the sphere
        of reachable positions. The four-circle Schottky group has the same
        symmetry: two real-axis generators and two imaginary-axis generators
        producing a fractal with four-fold rotational symmetry about the
        north-south axis of S². Set the sculpture slowly rotating in WebXR and
        it reads as a frozen record of a repeated butterfly.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Empty result / all points at ∞:</strong> The seed point may
          be inside one of the four Schottky circles. Use{" "}
          <code>SEED = 0.25 + 0.35j</code> (outside all four circles when
          D&nbsp;=&nbsp;1.55, R&nbsp;=&nbsp;1.0).
        </li>
        <li>
          <strong>GLB too large:</strong> Reduce DEPTH from 8 to 7 (2,916
          triangles, ~0.4 MB) or keep DEPTH&nbsp;=&nbsp;8 with
          Draco&nbsp;level&nbsp;6 (~0.6 MB).
        </li>
        <li>
          <strong>Circles overlap (assertion error):</strong> Ensure D&nbsp;&gt;&nbsp;R√2;
          for R&nbsp;=&nbsp;1.0 the minimum D is ≈&nbsp;1.415. Use D&nbsp;=&nbsp;1.55
          for safety.
        </li>
        <li>
          <strong>Bloom not visible:</strong> Enable EEVEE Next (Render
          Properties → Render Engine) and confirm Bloom is on. In viewport use
          Rendered shading (Z&nbsp;→ Rendered).
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius Transformation Gallery: PSL(2,ℂ) Conformal Maps & Loxodromic Spirals
          </Link>{" "}
          — the parent group theory; Kleinian limit sets are the discrete-group
          orbit accumulation to the single-transformation loxodromic orbits shown there
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-apollonian-circle-packing-soddy-descartes-stage-floor-webxr"
            className={lk}
          >
            Apollonian Circle Packing: Descartes&apos; Theorem & Soddy Integer Gasket
          </Link>{" "}
          — the Apollonian gasket is the limit set of a specific parabolic Kleinian group;
          the Schottky group here is its loxodromic relative
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
            className={lk}
          >
            Hopf Fibration: S³→S² Bundle, Clifford Parallels & Light Sculpture
          </Link>{" "}
          — another Riemann sphere geometry; U(1) fibres there vs. PSL(2,ℂ) orbits here
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mandelbrot-julia-fractal-poi-webxr"
            className={lk}
          >
            Mandelbrot &amp; Julia Sets: Complex Iteration, Escape-Time Fractals
          </Link>{" "}
          — related fractal orbit theory; Julia sets are limit sets of the semigroup
          generated by a single complex polynomial iteration
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr"
            className={lk}
          >
            600-Cell: Stereographic Shadow from S³
          </Link>{" "}
          — the same inverse stereographic map used in a different setting: projecting
          4-polytope vertices to R³
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Mumford, Series &amp; Wright (2002){" "}
          <a
            href="https://archive.org/details/indraspearlsthev0000mumf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Indra&apos;s Pearls: The Vision of Felix Klein
          </a>{" "}
          — the canonical illustrated guide to Kleinian limit sets, Schottky
          groups, Grandma&apos;s recipe, and the loxodromic/parabolic spectrum.
          CC0 preview via Internet Archive. Related:{" "}
          <a
            href="https://github.com/erleben/indras-pearls"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            erleben/indras-pearls (MIT)
          </a>
        </li>
        <li>
          Finistrex (2022){" "}
          <a
            href="https://github.com/Finistrex/kleinian-groups"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            kleinian-groups: Python Kleinian Group Visualisation
          </a>{" "}
          — MIT-licensed Python reference implementation using the same
          Schottky circle construction and DFS word enumeration. Related:{" "}
          <a
            href="https://github.com/Finistrex/kleinian-groups/blob/main/LICENSE"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            MIT licence
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-01",
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
