import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr";

function Body() {
  return (
    <>
      <h2>Why the plane can tile without repeating</h2>
      <p>
        Every wallpaper pattern you have ever seen repeats — shift it by some
        vector and it lands exactly on itself. In 1974 Roger Penrose proved that
        two shapes alone — a fat rhombus with angles 72°/108° and a thin rhombus
        with angles 36°/144° — can tile the entire plane{" "}
        <em>without ever repeating</em>. No translation vector brings the pattern
        back to itself. The tiling is aperiodic.
      </p>
      <p>
        What makes this possible is the{" "}
        <strong>golden ratio φ = (1+√5)/2 ≈ 1.618</strong>, which is the one
        real number that cannot be well approximated by rationals. Both rhombuses
        are built from angles that are integer multiples of 36° = π/5, and the
        diagonal lengths involve φ in an unavoidable way. That same algebraic
        irrationality — which governs sunflower phyllotaxis and the Fourier
        spectrum of quasicrystals — here appears as the{" "}
        <em>deflation scale factor</em>: every subdivision step shrinks the tiles
        by exactly 1/φ.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
          className={lk}
        >
          icosahedral quasicrystal tutorial
        </Link>
        , which generates the{" "}
        <em>3D analogue</em> of Penrose tiling by projecting from Z⁶. Both
        approaches exploit the same algebraic fact — the irrationality of φ —
        but arrive at it by entirely different roads.
      </p>

      <h2>Robinson triangles: the atomic pieces</h2>
      <p>
        The cleanest way to generate a Penrose P3 tiling is not to place
        rhombuses directly but to decompose each rhombus along its{" "}
        <em>short diagonal</em>, obtaining two{" "}
        <strong>Robinson triangles</strong>:
      </p>
      <ul>
        <li>
          <strong>Golden triangle</strong> (type 0, acute): 36°-72°-72°
          isoceles. Apex angle 36°, equal long sides of length φ, short base of
          length 1. Two of these glued at their base → thin rhombus (36°/144°).
        </li>
        <li>
          <strong>Golden gnomon</strong> (type 1, obtuse): 36°-36°-108°
          isoceles. Apex angle 108°, equal short sides of length 1, long base
          of length φ. Two of these glued at their base → fat rhombus
          (72°/108°).
        </li>
      </ul>
      <p>
        Every golden triangle contains a smaller golden triangle and a smaller
        golden gnomon. Every golden gnomon contains two smaller gnomons and one
        smaller golden triangle. This self-similarity is exactly Robinson&apos;s
        deflation: the scale factor between generations is 1/φ.
      </p>
      <pre>{`phi = (1.0 + 5.0 ** 0.5) / 2.0   # 1.6180339887…

def _deflate(tris):
    out = []
    for (k, A, B, C) in tris:
        if k == 0:                     # golden triangle
            P = A + (B - A) / phi     # cut AB at golden ratio
            out += [(0, C, P, B),     # smaller golden triangle
                    (1, P, C, A)]     # golden gnomon
        else:                          # golden gnomon
            Q = B + (A - B) / phi
            R = B + (C - B) / phi
            out += [(1, R, C, A),     # gnomon — long limb
                    (1, Q, R, B),     # gnomon — short stub
                    (0, R, Q, A)]     # golden triangle at fold
    return out`}</pre>
      <p>
        The <code>P = A + (B - A) / phi</code> line is doing something precise:
        it finds the unique interior point that divides AB in the{" "}
        <strong>golden ratio</strong>, i.e. AP/PB = φ. Because AB has length φ
        in the parent triangle, P sits at distance 1 from A — the correct edge
        length for the child generation.
      </p>

      <h2>Seeding: the sun</h2>
      <p>
        We seed with 10 type-0 (golden) triangles arranged as a &quot;sun&quot;
        around the origin, each spanning 36° of arc on the unit circle. They
        alternate winding direction so that after deflation the adjacent
        triangles pair up correctly.
      </p>
      <pre>{`tris = []
for i in range(10):
    B = np.exp(1j * (2 * i + 1) * np.pi / 10)   # complex-plane vertices
    C = np.exp(1j * (2 * i - 1) * np.pi / 10)
    if i % 2 == 0:
        B, C = C, B    # alternate winding for 5-fold symmetry
    tris.append((0, 0 + 0j, B, C))`}</pre>
      <p>
        After 5 deflation steps this seed produces 890 triangles; roughly 450
        of those fall inside DISC_RADIUS = 2.6 and will survive the clip.
      </p>
      <p>
        The connection to phyllotaxis here is worth noting: in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr"
          className={lk}
        >
          phyllotaxis poi disc
        </Link>{" "}
        each seed sits at angle n·α where α = 2π/φ² (the golden angle). The
        Penrose tiling is a discretisation of the same idea — φ determines the{" "}
        <em>spacing</em> between deflation scales just as it determines the
        angular spacing between phyllotaxis seeds. Both structures are optimal
        packings in their respective spaces.
      </p>

      <h2>Step 2 — Pairing triangles into rhombuses</h2>
      <p>
        After deflation, same-kind triangles appear in pairs sharing their base
        edge BC. We detect these pairs with a dictionary keyed on the canonical
        form of the edge:
      </p>
      <pre>{`def _edge_key(B, C):
    b = (round(B.real, 7), round(B.imag, 7))
    c = (round(C.real, 7), round(C.imag, 7))
    return frozenset([b, c])

def pair_rhombuses(tris):
    shelf = {}
    rhombuses = []
    for (k, A, B, C) in tris:
        key = (k, _edge_key(B, C))
        if key in shelf:
            oA, oB, oC = shelf.pop(key)
            if abs(B - oC) < 1e-6:
                B, C = C, B   # normalise endpoint order
            rhombuses.append((k, A, B, oA, C))
        else:
            shelf[key] = (A, B, C)
    return rhombuses`}</pre>
      <p>
        Triangles near the disc boundary are unpaired (their counterpart lies
        outside our clipped patch) and are dropped. This is correct — they would
        form half-rhombuses at the edge, which would need special treatment for
        a closed mesh.
      </p>
      <p>
        Why 7 decimal places in the rounding? At deflation step 5 the smallest
        coordinate difference between distinct vertices is roughly φ⁻⁵ ≈ 0.09.
        Rounding to 7dp gives 10× more resolution than that, so distinct
        vertices never collide in the key whilst floating-point copies of the
        same vertex always round identically.
      </p>

      <h2>Step 3 — Building the Blender mesh</h2>
      <p>
        Each rhombus becomes a flat slab: 4 bottom vertices (z = 0), 4 top
        vertices (z = SLAB_HEIGHT), 1 top face, 1 bottom face, 4 side faces.
        Before extruding we{" "}
        <strong>inset each tile toward its centroid</strong> by factor
        INSET = 0.945, which creates a 5.5 % gap all round and makes individual
        tiles legible even at low polygon counts. This is pure Python arithmetic —
        no Blender operator, no UV dependency.
      </p>
      <pre>{`def _inset_quad(pts):
    cx = sum(p.x for p in pts) / 4
    cy = sum(p.y for p in pts) / 4
    return [Vector((cx + INSET * (p.x - cx),
                    cy + INSET * (p.y - cy),
                    p.z)) for p in pts]`}</pre>
      <p>
        Vertex colour is applied via a <code>FLOAT_COLOR</code> attribute on the
        loop domain (Blender 5.1 bmesh API). Fat rhombuses get warm gold (0.85,
        0.64, 0.16); thin rhombuses get deep crimson (0.58, 0.10, 0.16). A
        Principled BSDF reads the colour through a Vertex Colour attribute node,
        giving a metallic stage-floor aesthetic.
      </p>
      <p>
        For a comparison of how vertex colour is applied in a different disc
        context, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr"
          className={lk}
        >
          Apollonian Gasket disc
        </Link>
        , which uses the same <code>FLOAT_COLOR POINT</code> API but assigns
        depth-based HSV rather than type-based colour.
      </p>

      <h2>The aperiodicity argument (why this tiling never repeats)</h2>
      <p>
        Suppose the Penrose P3 tiling <em>did</em> have a translational period
        vector <strong>v</strong>. Then translating by <strong>v</strong> sends
        every rhombus to another rhombus of the same type. But the deflation
        rules are deterministic and local: each rhombus&apos;s parent can be
        recovered by&nbsp;<em>inflation</em> (the reverse of deflation). If the
        tiling had period <strong>v</strong> at scale 1, the inflated tiling
        would have period φ<strong>v</strong> at scale φ — but then the tiling
        at scale 1 is just the inflation of an aperiodic tiling, a
        contradiction. By induction, no period can exist.
      </p>
      <p>
        This argument mirrors the structure of the icosahedral quasicrystal:
        both tilings avoid periodicity because their generating algebraic
        irrationality (φ) is a Pisot-Vijayaraghavan number — a root of a monic
        polynomial over ℤ whose other roots lie strictly inside the unit disc.
        Such numbers cannot satisfy rational linear relations, which is
        precisely the condition that prevents periodicity.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>No rhombuses appear:</strong> Check DISC_RADIUS is not smaller
          than the seed ring (radius 1). At DEFLATION_STEPS = 5 the seed
          positions have been scaled to ≈ 0.09 units; the disc must be larger.
        </li>
        <li>
          <strong>Float mismatch in pairing:</strong> If you increase
          DEFLATION_STEPS beyond 7, reduce the rounding from 7dp to 6dp in
          <code>_edge_key</code>. Very small triangles accumulate more float
          error from repeated division by phi.
        </li>
        <li>
          <strong>Memory error at DEFLATION_STEPS = 7:</strong> 890 × 3^{"{"}
          steps - 5{"}"} ≈ 8 000 triangles. Switch from a list to a generator
          pipeline, or build the mesh incrementally in batches of 500 rhombuses.
        </li>
        <li>
          <strong>GLB export fails on &quot;active object&quot;:</strong>{" "}
          <code>bpy.ops.export_scene.gltf</code> requires an active object.
          The script calls <code>view_layer.objects.active = obj</code> before
          exporting; if you call export manually, select the object first.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Penrose R (1974) &quot;Role of Aesthetics in Pure and Applied
          Mathematical Research.&quot; <em>Bull. Inst. Math. Appl.</em>{" "}
          10:266–271. Public domain (pre-1978 US publication). The original
          paper introducing P1/P2/P3 tilings.{" "}
          <a
            href="https://www.ias.edu/sites/default/files/sns/files/Penrose-Aesthetics-1974.pdf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            IAS reprint (PDF)
          </a>
          . Related: Robinson 1971 (substitution tilings), Conway matching rules,
          Ammann bars.
        </li>
        <li>
          de Bruijn NG (1981) &quot;Algebraic theory of Penrose&apos;s
          non-periodic tilings.&quot; <em>Koninkl. Akad. Wetensch. Proc.</em>{" "}
          Ser. A 84(1):39–66. Public domain. Proves the equivalence of the
          cut-and-project (pentagrid) and substitution descriptions — the bridge
          between the Penrose P3 approach here and the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
            className={lk}
          >
            quasicrystal&apos;s
          </Link>{" "}
          Z⁶ projection.{" "}
          <a
            href="https://www.win.tue.nl/~aeb/combinatorics/penrose/debruijn.pdf"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Eindhoven reprint (PDF)
          </a>
          . Related projects: https://www.win.tue.nl/~aeb/ — de Bruijn&apos;s
          combinatorics archive.
        </li>
        <li>
          Wikipedia &quot;Penrose tiling.&quot; CC-BY-SA-4.0. Wikipedia
          contributors.{" "}
          <a
            href="https://en.wikipedia.org/wiki/Penrose_tiling"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            wikipedia.org/wiki/Penrose_tiling
          </a>
          . Related articles: &quot;Robinson triangle&quot;,
          &quot;Aperiodic tiling&quot;, &quot;Quasicrystal&quot;,
          &quot;Pisot-Vijayaraghavan number&quot;.
        </li>
      </ul>
    </>
  );
}

const base = {
  slug: SLUG,
  title:
    "Penrose P3 Rhombus Tiling — Robinson Triangle Deflation, Aperiodic Stage Floor",
  date: "2026-08-09",
  blurb:
    "Generate a Penrose P3 rhombus tiling from Robinson triangle deflation: " +
    "10 seed triangles, 5 subdivision steps, ~450 gold/crimson slabs clipped to a " +
    "circular stage-floor disc and exported as a Draco-compressed WebXR GLB.",
  body: Body,
  externalLinks: [
    {
      href: "https://www.ias.edu/sites/default/files/sns/files/Penrose-Aesthetics-1974.pdf",
      label:
        "Penrose R 1974 — Role of Aesthetics. Bull. Inst. Math. Appl. 10:266–271. Public domain. Original P3 tiling paper.",
      note: "Public domain. Original description of P1/P2/P3 tilings and the matching rules. Related: Robinson 1971, Conway matching bars, Ammann quasi-lattice.",
    },
    {
      href: "https://www.win.tue.nl/~aeb/combinatorics/penrose/debruijn.pdf",
      label:
        "de Bruijn NG 1981 — Algebraic theory of Penrose tilings. Koninkl. Akad. Wetensch. Proc. Ser. A 84:39–66. Public domain.",
      note: "Public domain. Proves pentagrid ↔ substitution equivalence. Related: de Bruijn archive https://www.win.tue.nl/~aeb/, Kalugin–Kitaev–Levitov 1985, Elser 1985 indexing.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Penrose_tiling",
      label:
        "Wikipedia — Penrose tiling. CC-BY-SA-4.0. Wikipedia contributors.",
      note: "CC-BY-SA-4.0. Comprehensive treatment with substitution rules, matching rules, and cut-and-project equivalence. Related: Robinson triangle, Aperiodic tiling, Pisot-Vijayaraghavan number.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "intermediate",
    libraryPath:
      "blends/scripting/python-numpy-penrose-p3-rhombus-robinson-deflation-aperiodic-stage-floor-webxr",
    time: "one afternoon",
    prerequisites: [
      "Comfortable with complex-number arithmetic (e.g. used np.exp(1j*theta) before).",
      "Familiar with Python dictionaries and frozenset.",
      "Completed at least one blueprint.py bmesh tutorial in this series.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    dependencies: [
      {
        name: "numpy",
        registry: "pip",
        url: "https://numpy.org/",
        purpose:
          "complex-plane vertex arithmetic, np.exp for seed ring positions",
      },
    ],
  },
  base,
);
