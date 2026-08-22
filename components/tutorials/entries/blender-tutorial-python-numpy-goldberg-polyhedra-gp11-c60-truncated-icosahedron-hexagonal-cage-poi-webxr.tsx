import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr";

function Body() {
  return (
    <>
      <h2>Why a football is a mathematical theorem</h2>
      <p>
        In 1937 Michael Goldberg asked: how many distinct ways can you tile the
        sphere with pentagons and hexagons whilst preserving full icosahedral
        symmetry? The answer turns out to be a family parameterised by two
        non-negative integers <code>(m, n)</code>, now called the{" "}
        <strong>Goldberg polyhedra</strong> GP(m, n). The number of hexagonal
        faces is always <code>10(T − 1)</code> where{" "}
        <code>T = m² + mn + n²</code> is the triangulation number — and the
        number of pentagonal faces is forever fixed at{" "}
        <strong>exactly 12</strong> by Euler's polyhedral formula{" "}
        <code>V − E + F = 2</code>.
      </p>
      <p>
        GP(1, 1) gives <code>T = 3</code>: twelve pentagons and twenty
        hexagons — the classic football panel layout, and the carbon-atom
        arrangement of <strong>C₆₀ Buckminsterfullerene</strong>, whose
        discoverers Curl, Kroto, and Smalley shared the 1996 Nobel Prize in
        Chemistry. The same geometry also governs many viral capsid
        architectures studied by Caspar and Klug in 1962. One polyhedron;
        three entirely different scientific contexts.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kepler-poinsot-star-polyhedra-schlafli-symbol-four-regular-star-poi-webxr"
          className={lk}
        >
          Kepler–Poinsot star polyhedra
        </Link>{" "}
        series, which pushed the boundary of what counts as a regular polyhedron
        by allowing self-intersecting faces. Goldberg pushes a different
        boundary: allowing non-triangular, non-regular faces whilst preserving
        symmetry.
      </p>

      <h2>The Goldberg–Coxeter construction</h2>
      <p>
        The fastest route to GP(1, 1) uses a classical truncation argument:
      </p>
      <ol>
        <li>
          Start with the regular icosahedron — 12 vertices, 30 edges, 20
          triangular faces, icosahedral symmetry I<sub>h</sub> (order 120).
        </li>
        <li>
          At each of the 30 edges, place two new vertices at parameter{" "}
          <code>t = 1/3</code> and <code>t = 2/3</code> from one endpoint.
          That gives <code>2 × 30 = 60</code> new vertices, one per original
          icosahedron half-edge. No original vertex survives — they are all{" "}
          <em>truncated away</em>.
        </li>
        <li>
          Project every new vertex onto the unit sphere.
        </li>
        <li>
          Build faces: each original icosahedron vertex (valence 5) becomes a{" "}
          <strong>pentagon</strong>; each original triangular face becomes a{" "}
          <strong>hexagon</strong>.
        </li>
      </ol>
      <p>
        Euler verification: <code>V − E + F = 60 − 90 + 32 = 2</code> ✓.
        Edge count: each pentagon contributes 5 edges and each hexagon 6; each
        edge is shared by two faces, so{" "}
        <code>E = (12 × 5 + 20 × 6) / 2 = 90</code>.
      </p>

      <h2>Icosahedron from golden rectangles</h2>
      <p>
        The icosahedron vertices live on three mutually-orthogonal golden
        rectangles — each with aspect ratio 1 : φ where{" "}
        <code>φ = (1 + √5) / 2 ≈ 1.618</code>. For vertices of the form{" "}
        <code>(0, ±1, ±φ)</code> and all cyclic permutations, every adjacent
        pair sits at the same Euclidean distance, confirming regularity. The
        same golden ratio is at work in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
          className={lk}
        >
          icosahedral quasicrystal
        </Link>{" "}
        tutorial, where φ controls the irrationality that prevents periodic
        tiling.
      </p>

      <h2>Blueprint walkthrough</h2>

      <h3>1 — Build the icosahedron</h3>
      <pre><code>{`import numpy as np
from scipy.spatial import ConvexHull

phi = (1.0 + np.sqrt(5.0)) / 2.0
raw = []
for s1, s2 in [(+1,+1),(+1,-1),(-1,+1),(-1,-1)]:
    raw += [(0, s1, s2*phi), (s1, s2*phi, 0), (s2*phi, 0, s1)]
icos_v = np.array(raw, dtype=float)
icos_v /= np.linalg.norm(icos_v[0])   # normalise to unit sphere`}</code></pre>
      <p>
        Twelve vertices, normalised to the unit sphere. ConvexHull gives the 20
        triangular faces; we flip any with inward-pointing normals so every
        face winds counter-clockwise when viewed from outside.
      </p>

      <h3>2 — Trisect edges → 60 GP(1,1) vertices</h3>
      <pre><code>{`TRUNC_T = 1 / 3
for k, (a, b) in enumerate(edges):
    va, vb = icos_v[a], icos_v[b]
    p_near_a = (1 - TRUNC_T) * va + TRUNC_T * vb   # (2a + b) / 3
    p_near_b =      TRUNC_T  * va + (1-TRUNC_T)*vb  # (a + 2b) / 3
    gp_verts_raw[2*k]   = p_near_a
    gp_verts_raw[2*k+1] = p_near_b`}</code></pre>
      <p>
        For each of the 30 icosahedron edges we record which end each
        trisection point is nearer, so we can look up the correct vertex index
        when building pentagons and hexagons.
      </p>

      <h3>3 — Cyclic ordering for pentagon faces</h3>
      <p>
        The five neighbours of an icosahedron vertex span the plane perpendicular
        to the outward normal. Sorting by polar angle in that plane gives a
        consistent counter-clockwise winding for each pentagon:
      </p>
      <pre><code>{`def cyclic_sort(v_idx, nbrs):
    v  = icos_v[v_idx]
    up = np.array([0,0,1.]) if abs(v[2]) < 0.9 else np.array([1.,0,0])
    e1 = np.cross(up, v);  e1 /= np.linalg.norm(e1)
    e2 = np.cross(v,  e1); e2 /= np.linalg.norm(e2)
    angs = [np.arctan2((gp_verts_raw[edge_verts[(v_idx,u)][0]] - icos_v[v_idx]).dot(e2),
                       (gp_verts_raw[edge_verts[(v_idx,u)][0]] - icos_v[v_idx]).dot(e1))
            for u in nbrs]
    return [nbrs[i] for i in np.argsort(angs)]`}</code></pre>

      <h3>4 — Hexagon faces</h3>
      <p>
        For each triangular face <code>(a, b, c)</code> oriented CCW, the six
        hexagon vertices appear in order: near-a on edge a–b, near-b on edge
        a–b, near-b on edge b–c, near-c on edge b–c, near-c on edge c–a,
        near-a on edge c–a. No sorting needed — the triangle's winding
        directly determines the hexagon's winding:
      </p>
      <pre><code>{`hexagons.append([
    edge_verts[(a,b)][0], edge_verts[(a,b)][1],
    edge_verts[(b,c)][0], edge_verts[(b,c)][1],
    edge_verts[(c,a)][0], edge_verts[(c,a)][1],
])`}</code></pre>

      <h3>5 — Two-material face colouring</h3>
      <p>
        Rather than vertex colour (which cannot assign different colours to the
        same vertex in different faces without duplication), we use{" "}
        <strong>material indices</strong>. The first 12 polygons — pentagons —
        get material 0 (amber); the next 20 — hexagons — get material 1
        (cobalt). This survives Draco compression and WebXR rendering intact:
      </p>
      <pre><code>{`for i, poly in enumerate(mesh.polygons):
    poly.material_index = 0 if i < 12 else 1`}</code></pre>

      <h3>6 — Shape keys</h3>
      <ul>
        <li>
          <strong>Basis</strong> — sphere at POI_RADIUS = 0.082 m
        </li>
        <li>
          <strong>SK_Prolate</strong> — Z × 1.5 egg shape
        </li>
        <li>
          <strong>SK_Flat</strong> — Z × 0.35 discus
        </li>
        <li>
          <strong>SK_Raw</strong> — un-projected Platonic truncated icosahedron
          (flat faces, non-spherical) scaled to the same bounding radius. Morphing
          from Basis to SK_Raw reveals how much the sphere projection distorts
          the true Platonic form.
        </li>
      </ul>

      <h2>Failure modes and fixes</h2>
      <ul>
        <li>
          <strong>Pentagon winding reversed</strong> — if the cyclic sort picks
          a clockwise winding, normals point inward and the face appears black in
          Eevee. Fix: negate the tangent basis vector <code>e2</code>, or wrap the
          result in <code>face_verts[::-1]</code>.
        </li>
        <li>
          <strong>Hexagon has a wrong vertex</strong> — this happens when
          <code>edge_verts[(a, b)]</code> is looked up with swapped indices and
          gives the far trisection point instead of the near one. The directional
          store <code>edge_verts[(b, a)]</code> handles the reversal.
        </li>
        <li>
          <strong>GLB missing materials</strong> — the Draco exporter needs
          <code>export_materials="EXPORT"</code>; omitting it exports geometry
          only.
        </li>
        <li>
          <strong>scipy not found</strong> — Blender's bundled Python lacks scipy
          by default. Install via Extensions Platform or{" "}
          <code>blender --python-use-system-env</code> with a venv.
        </li>
      </ul>

      <h2>Related studio work</h2>
      <p>
        The topology of the sphere with icosahedral symmetry runs through
        several other studio entries. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          Hopf fibration
        </Link>{" "}
        uses the same S² base space but decomposes it via the S³ principal
        fibre bundle structure rather than polyhedral tiling. The icosahedral
        quasicrystal tutorial projects a 6D lattice onto 3D using the same
        I<sub>h</sub> symmetry generators that fix the 12 pentagons here.
      </p>
      <p>
        For further reading on the Goldberg–Coxeter construction in a graph
        theory context, see Dutour Sikirić and Itoh (2011){" "}
        <em>Zigzag structures of simple two-faced polyhedra</em> which
        classifies the edge zigzags of all GP(m, n) and their duals.
      </p>

      <h2>External references</h2>
      <ul>
        <li>
          Goldberg M (1937) &ldquo;A class of multi-symmetric polyhedra.&rdquo;{" "}
          <em>Tôhoku Mathematical Journal</em> <strong>43</strong>: 104–108.
          Public Domain.{" "}
          <a
            href="https://doi.org/10.2748/tmj/1178540075"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.2748/tmj/1178540075
          </a>
          . Related: Caspar &amp; Klug (1962) viral capsid classification;
          Kroto et al. (1985) C₆₀ discovery; Conway polyhedron notation.
        </li>
        <li>
          Antiprism (Rossiter A) — polyhedron manipulation toolkit. MIT Licence.{" "}
          <a
            href="https://github.com/antiprism/antiprism"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            github.com/antiprism/antiprism
          </a>
          . Related:{" "}
          <a
            href="https://github.com/antiprism/antiprism_python"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            antiprism_python
          </a>{" "}
          (Python port); Hedron (LGPL, polyhedra explorer);
          CGAL (GPL, computational geometry algorithms library).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Goldberg Polyhedra GP(1,1): C₆₀ Buckminsterfullerene Cage, Euler's 12-Pentagon Theorem & Hexagonal Poi Head for WebXR",
  description:
    "Build the GP(1,1) Goldberg polyhedron — the football/C₆₀ cage — in Blender 5.1 by trisecting icosahedron edges, projecting to a sphere, then colouring 12 amber pentagons and 20 cobalt hexagons for WebXR export.",
  tags: [
    "python",
    "numpy",
    "goldberg-polyhedra",
    "buckminsterfullerene",
    "c60",
    "truncated-icosahedron",
    "icosahedral-symmetry",
    "euler-formula",
    "poi-head",
    "webxr",
    "glb",
    "scipy",
  ],
  date: "2026-08-21",
  blenderVersion: "5.1",
  libraryPath:
    "public/library/blends/scripting/python-numpy-goldberg-polyhedra-gp11-c60-truncated-icosahedron-hexagonal-cage-poi-webxr",
  Body,
});
