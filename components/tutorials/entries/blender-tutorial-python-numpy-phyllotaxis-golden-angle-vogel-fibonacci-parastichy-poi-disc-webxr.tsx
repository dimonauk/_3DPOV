import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr";

function Body() {
  return (
    <>
      <h2>Why flowers count in Fibonacci numbers</h2>
      <p>
        Sunflowers, pinecones, and daisy florets all display spiral arms whose
        counts are consecutive Fibonacci numbers — 34 clockwise and 55
        counter-clockwise is the classic pairing. This is not a biological
        accident. It is a direct consequence of the{" "}
        <strong>golden angle</strong> α = 2π/φ² ≈ 137.508°, where
        φ = (1+√5)/2. When a meristem places each new primordium at angle α
        from the last, the resulting packing is the densest possible on a
        circular disc, and the parastichy counts (the numbers of visible spiral
        arms) are always consecutive Fibonacci numbers.
      </p>
      <p>
        In Blender we replicate this with{" "}
        <strong>Vogel&apos;s 1979 model</strong>: seed n lives at polar
        coordinates (C·√n, n·α). Five shape keys let you vary α continuously
        and watch the seed pattern collapse or reorganise, making the mathematics
        visible as geometry.
      </p>

      <h2>The continued-fraction argument</h2>
      <p>
        Why α and not some other angle? The key property is{" "}
        <em>worst rational approximability</em>. Any divergence angle that is a
        rational multiple of 2π — say 2π·(p/q) — would place every q-th seed
        on the same radial spoke, leaving q-1 spokes empty. The fewer rationals
        that approximate α/2π well, the more even the distribution.
      </p>
      <p>
        The number 1/φ = φ − 1 has continued fraction [0;1,1,1,…] — all
        partial quotients are 1, the minimum possible. By the theory of
        continued fractions this makes φ the <em>hardest</em> real number to
        approximate by rationals (Hurwitz&apos;s theorem gives the tightest
        inequality). Its best rational approximants are exactly the Fibonacci
        ratios F_k/F_{k+1} → 1/φ as k→∞, so the parastichy arm counts that
        emerge are always consecutive Fibonacci numbers. No other angle produces
        a denser packing.
      </p>
      <pre>{`PHI          = (1 + sqrt(5)) / 2          # ≈ 1.6180339887
ALPHA_GOLD   = 2 * pi / PHI**2            # ≈ 2.3999632 rad = 137.5077°
#
# Equivalently:
#   ALPHA_GOLD = 2*pi * (2 - PHI)         # 2π(2−φ)
#   ALPHA_GOLD = 2*pi * (1 - 1/PHI)       # 2π(1−1/φ)
# All three expressions are identical; the blueprint uses PHI**2 form.`}</pre>

      <h2>Step 1 — Vogel positions as a NumPy one-liner</h2>
      <p>
        Seed n lands at (x,y) = (C·√n·cos(n·α), C·√n·sin(n·α)). With NumPy
        the full position array for 280 seeds evaluates in microseconds:
      </p>
      <pre>{`n  = np.arange(N_SEEDS, dtype=np.float32)   # [0, 1, 2, …, 279]
r  = C_SCALE * np.sqrt(n)                   # radii: 0, C, C√2, …
th = n * ALPHA_GOLD                          # angles accumulate
pos = np.column_stack((r * np.cos(th),      # (280, 2) array
                        r * np.sin(th)))`}</pre>
      <p>
        C_SCALE = DISC_RADIUS / √(N_SEEDS − 1) ensures seed 279 lands exactly
        at the disc edge. Seed 0 sits at the origin — √0 = 0 means the first
        primordium always appears at the disc centre, matching botanical reality.
      </p>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-apollonian-gasket-descartes-circle-theorem-inversive-geometry-poi-disc-webxr"
          className={lk}
        >
          Apollonian gasket
        </Link>{" "}
        tutorial, where circle placement requires iterating the Descartes
        reflection formula to arbitrary depth. Phyllotaxis placement is
        explicit — every seed position is a closed-form evaluation.
      </p>

      <h2>Step 2 — Octagon platelet geometry via from_pydata</h2>
      <p>
        Each of the 280 seeds is an 8-sided prism (SEED_SIDES = 8). The full
        mesh uses a single <code>from_pydata</code> call rather than bmesh
        operators, which is substantially faster for large repeated-element
        assemblies.
      </p>
      <pre>{`S     = 8
step  = 2 * pi / S
ang   = arange(S) * step          # corner angles
ux    = cos(ang) * SEED_R         # ring x-offsets
uy    = sin(ang) * SEED_R         # ring y-offsets

for idx, (cx, cy) in enumerate(positions):
    base = idx * 2 * S            # vertex offset

    # Bottom ring  z=0
    for j in range(S):
        verts.append((cx + ux[j], cy + uy[j], 0.0))
    # Top ring  z=DISC_THICK
    for j in range(S):
        verts.append((cx + ux[j], cy + uy[j], DISC_THICK))

    # Side quads
    for j in range(S):
        j1 = (j + 1) % S
        faces.append((base+j, base+j1, base+S+j1, base+S+j))

    # Bottom cap (reversed winding → outward normal faces down)
    faces.append(tuple(base + S - 1 - j for j in range(S)))
    # Top cap (standard winding → outward normal faces up)
    faces.append(tuple(base + S + j for j in range(S)))`}</pre>
      <p>
        No shared vertices between seeds is intentional: shape keys must move
        individual seeds without affecting neighbours, so vertex ownership must
        be per-seed. The mesh has 280 × 16 = 4 480 vertices and
        280 × (8 + 2) = 2 800 faces — well within viewport real-time territory.
      </p>
      <p>
        This per-element assembly technique is also used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
          className={lk}
        >
          icosahedral quasicrystal
        </Link>{" "}
        tutorial for its bead and edge-tube components.
      </p>

      <h2>Step 3 — Shape keys for divergence-angle morphing</h2>
      <p>
        Five shape keys correspond to five divergence angles. The Basis key
        uses the golden angle; the others reveal the packing penalty in
        different directions:
      </p>
      <pre>{`ALPHA_KEYS = {
    "Basis":       2*pi/PHI**2,     # 137.508° — optimal packing
    "Alpha_137_3": radians(137.3),  # sub-golden → faint 89-arm ghost
    "Alpha_137_7": radians(137.7),  # super-golden → mirror ghost
    "Alpha_180":   radians(180.0),  # dyadic → collinear rows, worst case
    "Alpha_120":   radians(120.0),  # three-fold → 3-arm star
}`}</pre>
      <p>
        When you scrub Alpha_180 from 0 to 1 in the viewport, every seed slides
        from its golden-angle position to a position exactly opposite the
        previous seed. With 280 seeds this creates 140 collinear pairs — you
        will see straight spokes appear as if drawn with a ruler. This visual
        collapse makes the abstract optimality argument concrete.
      </p>
      <p>
        The 137.3° / 137.7° keys are only 0.2° off-golden but already produce
        faint 89-fold ghost arms. 89 is the next Fibonacci number after 55; the
        ghost corresponds to the next convergent of the continued fraction being
        89/144, not yet as close as 55/89 is to 1/φ. The packing is still good
        but no longer perfect — an important lesson in how sensitive optimal
        arrangements are to small perturbations.
      </p>

      <h2>Step 4 — Parastichy arm colouring</h2>
      <p>
        The vertex colour attribute <code>PhylloArm</code> maps each seed to
        one of 34 HSV hues cycling over the Fibonacci number F₉ = 34. Seed n
        receives the hue for arm n mod 34, making the 34 clockwise parastichies
        visible as bands of colour sweeping from centre to edge.
      </p>
      <pre>{`FIB_CW = 34    # clockwise parastichy count for 280-seed disc

for idx in range(N_SEEDS):
    arm = idx % FIB_CW
    hue = arm / FIB_CW                   # [0, 1) cycling 34 colours
    r, g, b = hsv_to_rgb(hue, 0.75, 0.92)
    # assign to all 16 verts of this seed's top and bottom rings`}</pre>
      <p>
        Why 34 and not 55? The counter-clockwise arms (55-fold) would require
        a different colouring scheme based on n mod 55. The 34-fold colouring
        was chosen because it is coarser and therefore more readable in the
        viewport at this seed count.
      </p>
      <p>
        Vertex colour in Blender 5.1 uses the <code>color_attributes.new</code>{" "}
        API with <code>type="FLOAT_COLOR"</code> and{" "}
        <code>domain="POINT"</code>. The older{" "}
        <code>vertex_colors.new</code> API (loop-domain, BYTE_COLOR) still
        works but is deprecated. The new API avoids the ×4 vertex-loop
        expansion. See also the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          className={lk}
        >
          Lorenz attractor
        </Link>{" "}
        tutorial where the same FLOAT_COLOR POINT pattern was first used in
        this series.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Seeds overlap at the centre:</strong> The formula places seed
          0 at the origin (r = C·√0 = 0) and seed 1 at r = C. If SEED_R (platelet
          radius) is set larger than C/2 the innermost seeds will intersect.
          Reduce SEED_R to at most C_SCALE × 0.44.
        </li>
        <li>
          <strong>Shape keys not animating smoothly:</strong> Each shape key
          must have the same vertex count as the Basis. If you changed N_SEEDS
          between builds, delete all shape keys and re-run the blueprint.
        </li>
        <li>
          <strong>GLB file is very large:</strong> Draco level 6 should reduce
          the mesh to ~80 kB. If the export is unexpectedly large, confirm that{" "}
          <code>export_draco_mesh_compression_enable = True</code> was set. The
          <code>export_morph = True</code> flag doubles morph-target size — set
          to False for a non-animated display asset.
        </li>
        <li>
          <strong>Flat shading looks faceted on the tops:</strong> That is
          intentional for the holoflow facet convention. If you prefer smooth
          shading on the octagon caps, add a Subdivision Surface modifier with
          Levels = 1 before the export; this rounds the octagon to a near-circle
          without increasing the parameterised vertex count.
        </li>
      </ul>

      <h2>Further reading</h2>
      <p>
        Vogel&apos;s original paper (Mathematical Biosciences, 1979) is the
        primary source. The Wikipedia article on{" "}
        <a
          href="https://en.wikipedia.org/wiki/Phyllotaxis"
          className={lk}
          target="_blank"
          rel="noreferrer"
        >
          Phyllotaxis
        </a>{" "}
        (CC-BY-SA-4.0) gives an excellent derivation of the golden angle and
        the Bravais-Bravais theorem on parastichy numbers, cross-linking to
        related work by Adler, Jean, and Douady &amp; Couder.
      </p>
      <p>
        For the continued-fraction argument in full rigour, see Hardy &amp;
        Wright&apos;s <em>An Introduction to the Theory of Numbers</em>
        (Oxford, 6th ed.), Chapter X on continued fractions and rational
        approximation — public domain in most jurisdictions.
      </p>
    </>
  );
}

const base = {
  slug: SLUG,
  title:
    "Phyllotaxis — Golden Angle, Vogel Model, Fibonacci Parastichies & Sunflower Poi Disc for WebXR",
  description:
    "Build 280 seed platelets placed by Vogel's √n–radial phyllotaxis model (α = 2π/φ² ≈ 137.508°), then add five shape keys that morph the divergence angle to make the Fibonacci parastichy argument tactile.",
  date: "2026-08-09",
  tags: [
    "blender",
    "python",
    "numpy",
    "phyllotaxis",
    "golden-angle",
    "fibonacci",
    "vogel-model",
    "parastichy",
    "poi-head",
    "shape-keys",
    "vertex-colour",
    "webxr",
    "glb",
  ],
  Body,
  furtherReading: [
    {
      href: "https://doi.org/10.1016/0025-5564(79)90072-X",
      label:
        "Vogel H (1979) — A better way to construct the sunflower head. Mathematical Biosciences 44(3–4):179–189",
      note: "Public Domain (mathematical content). Original derivation of the r=√n, θ=n·α placement rule and proof of the optimality of α = 137.508°.",
    },
    {
      href: "https://en.wikipedia.org/wiki/Phyllotaxis",
      label:
        "Phyllotaxis — Wikipedia. CC-BY-SA-4.0. Wikipedia contributors.",
      note: "CC-BY-SA-4.0. Comprehensive treatment of the Bravais-Bravais theorem, golden angle derivation, and biological examples. Related: Golden angle article and Fibonacci number article.",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    difficulty: "intermediate",
    libraryPath:
      "blends/scripting/python-numpy-phyllotaxis-golden-angle-vogel-fibonacci-parastichy-poi-disc-webxr",
    time: "one afternoon",
    prerequisites: [
      "Comfortable reading parametric equations in polar coordinates.",
      "Familiar with Python loops and NumPy array operations.",
      "Completed at least one previous blueprint.py tutorial in this series.",
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
        purpose: "vectorised Vogel-model position array and shape-key coordinates",
      },
    ],
  },
  base,
);
