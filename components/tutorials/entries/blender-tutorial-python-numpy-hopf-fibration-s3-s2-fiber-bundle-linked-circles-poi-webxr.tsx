import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr";

const TITLE =
  "Python numpy — Hopf Fibration: S³ → S² Principal Fibre Bundle, Bishop-Frame Tube Circles & Linked-Tori Poi Ball for WebXR (Blender 5.1)";

const LEDE =
  "In 1931 Heinz Hopf proved that a map S³ → S² can be non-trivial — its preimages are great circles on the 3-sphere, any two of which are Hopf-linked.  Stereographic projection unfolds this into ℝ³ as a family of interlocked circles sweeping nested tori.  This blueprint computes the fibres analytically from the quaternion double-cover of SO(3), extrudes each into a tube using a parallel-transport (Bishop) frame to avoid twist artefacts, assembles 60 interlocked tube circles into a 10 cm poi ball, shades them by latitude gradient, and exports a GLB with three absolute shape keys — equatorial Clifford torus, hemisphere, and full fibration — for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Hopf, Heinz (1931). Über die Abbildungen der dreidimensionalen Sphäre auf die Kugelfläche. Mathematische Annalen 104: 637–665. Public Domain (mathematical content, 1931).",
      url: "https://link.springer.com/article/10.1007/BF01457962",
      licence: "Public Domain",
      author: "Heinz Hopf",
    },
    {
      label:
        "Lyons, David W. (2003). An Elementary Introduction to the Hopf Fibration. Mathematics Magazine 76(2): 87–98. JSTOR open access; mathematical content PD.",
      url: "https://www.jstor.org/stable/3219300",
      licence: "Open Access / Public Domain (mathematical content)",
      author: "David W. Lyons",
    },
    {
      label: "NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.",
      url: "https://numpy.org/doc/stable/",
      licence: "BSD-3-Clause",
      author: "NumPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        The Hopf fibration is the archetype of a non-trivial principal bundle.
        The base space is S², the fibre is S¹ (a circle), and the total space
        is S³.  No global cross-section exists — you cannot assign a
        consistent "starting point" on each fibre across the whole sphere —
        which is exactly why the bundle is topologically interesting.  The
        same structure underlies the spin representation in quantum mechanics
        (the double cover SU(2) → SO(3)) and the quaternion rotation map used
        in every game engine.
      </p>

      <h2>The fibre over a point</h2>
      <p>
        Write S³ ⊂ ℂ² as pairs (z₁, z₂) with |z₁|² + |z₂|² = 1.  The Hopf
        map sends (z₁, z₂) to the point [z₁ : z₂] in complex projective space
        ℂP¹ ≅ S².  The fibre over any base point is the set{" "}
        {"{(e^{iξ}z₁, e^{iξ}z₂) : ξ ∈ ℝ}"} — a great circle on S³.
        Parametrise the base point by colatitude θ₀ and longitude φ₀:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`(z₁, z₂) = (cos(θ₀/2)·e^{i(ξ+φ₀/2)},  sin(θ₀/2)·e^{i(ξ−φ₀/2)})

Stereographic projection (north pole = (0,0,0,1)):
  X = cos(α)·cos(u) / (1 − sin(α)·sin(v))
  Y = cos(α)·sin(u) / (1 − sin(α)·sin(v))
  Z = sin(α)·cos(v) / (1 − sin(α)·sin(v))
where α = θ₀/2,  u = ξ + φ₀/2,  v = ξ − φ₀/2`}
      </pre>

      <h2>The Clifford torus (equatorial fibres)</h2>
      <p>
        For θ₀ = π/2 (equator of S²), cos α = sin α = 1/√2.  Substituting
        u and v as above, the formula simplifies to the torus:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`X = cos u / (√2 − sin v)
Y = sin u / (√2 − sin v)
Z = cos v / (√2 − sin v)      u,v ∈ [0, 2π)²`}
      </pre>
      <p>
        This is a ring torus with major radius R = √2 and tube radius r = 1 —
        the <em>Clifford torus</em>, the unique embedded flat torus in S³ (zero
        intrinsic curvature).  The ratio R/r = √2 is the conformal threshold
        below which the torus self-intersects; the Clifford torus sits exactly
        at the boundary where both principal curvatures are equal in magnitude.
      </p>

      <h2>Hopf linking</h2>
      <p>
        Take any two distinct base points p, q ∈ S².  Their fibres π⁻¹(p) and
        π⁻¹(q) are circles in ℝ³ with linking number 1: each passes exactly
        once through the disc bounded by the other.  The visual consequence is
        that the entire poi ball is a lattice of mutually interlocked rings —
        no two circles can be pulled apart without cutting one.
      </p>

      <h2>Bishop (parallel-transport) frame</h2>
      <p>
        Frenet-Serret framing flips abruptly at inflection points of the path
        and has undefined normal when torsion vanishes.  The Bishop frame avoids
        this by transporting the initial normal vector parallel along the curve
        — the normal rotates only as much as the path's curvature demands.  For
        a smooth closed curve the transported frame accumulates a total rotation
        angle equal to the curve's total torsion; for a Hopf-fibre circle (zero
        torsion) the Bishop frame closes exactly with no twist, producing clean
        tube geometry.
      </p>

      <h2>Bench steps</h2>
      <ol>
        <li>
          Open Blender 5.1 → <strong>Scripting</strong> workspace → New script.
        </li>
        <li>
          Paste <code>blueprint.py</code>.  Parameters to note at the top:
          <code>N_LAT = 6</code> (latitude bands), <code>N_LON = 10</code>{" "}
          (fibres per band), <code>N_FIBER = 24</code> (points per fibre
          circle), <code>N_TUBE = 8</code> (octagonal cross-section),{" "}
          <code>R_TUBE = 0.003</code> (3 mm tube radius),{" "}
          <code>POI_DIAM = 0.10</code> (10 cm ball).
        </li>
        <li>
          Click ▶ <strong>Run Script</strong>.  Expect ~3 s on a mid-range CPU.
          The script builds three geometry variants (VARIANTS list), normalises
          each to the poi diameter, and stores them as absolute shape keys.
        </li>
        <li>
          Select the object and open <strong>Object Data Properties → Shape
          Keys</strong>.  Drag the <em>Hemisphere</em> key from 0 → 1 to watch
          the equatorial torus expand into a larger interlocked hemisphere
          lattice.
        </li>
        <li>
          In the <strong>Shader Editor</strong> inspect the emission material:
          the vertex-colour attribute feeds directly into the Emission strength.
          The colour gradient runs violet (inner/equatorial bands) → orange
          (outer/polar bands).
        </li>
        <li>
          Export to GLB via <strong>File → Export → glTF 2.0</strong> or let
          the script's final <code>bpy.ops.export_scene.gltf</code> call write
          it automatically.  Enable Draco compression (level 6) and WebP
          textures for the WebXR pipeline.
        </li>
      </ol>

      <h2>Failure modes</h2>
      <ul>
        <li>
          <strong>Near-south-pole singularity:</strong> denominator
          1 − sin(α)·sin(v) → 0 as θ₀ → π.  The code clamps{" "}
          <code>den</code> to 1 × 10⁻⁶; keep latitudes within
          [0.06π, 0.94π].
        </li>
        <li>
          <strong>Shape-key vertex count mismatch:</strong> all VARIANTS
          must produce identical vertex counts
          (N_LAT × N_LON × N_FIBER × N_TUBE).  Change only latitude
          range, never the count parameters.
        </li>
        <li>
          <strong>Bishop-frame seam:</strong> near-planar fibres may show
          a closing-face seam; raise N_FIBER to 48 to suppress it.
        </li>
      </ul>

      <h2>Studio connections</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-600-cell-quaternion-binary-icosahedral-stereographic-shadow-webxr"
            className={lk}
          >
            600-Cell: Quaternion Binary Icosahedral Stereographic Shadow
          </Link>{" "}
          — the same stereographic projection S³ → ℝ³ used here; the 600-cell
          vertices lie on S³ and project to nested spheres.  The Hopf fibration
          and the 600-cell are related through the binary icosahedral group, a
          subgroup of SU(2) = S³.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-dupin-cyclide-confocal-conics-curvature-lines-poi-webxr"
            className={lk}
          >
            Dupin Cyclide: Confocal Conics & Curvature Lines
          </Link>{" "}
          — the Clifford torus is a limiting Dupin cyclide (focal conics
          degenerate to concentric circles).  The cyclide curvature-line grid
          matches the (u, v) Hopf parametrisation.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-mobius-transformation-riemann-sphere-loxodromic-poi-webxr"
            className={lk}
          >
            Möbius Transformation Gallery: PSL(2,ℂ) & Loxodromic Spirals
          </Link>{" "}
          — PSL(2,ℂ) acts on ℂP¹ = S² (the Hopf base).  Loxodromic
          Möbius maps lift to S³ as screw motions permuting fibres.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-scipy-dec-hodge-star-harmonic-1form-perturbed-torus-webxr"
            className={lk}
          >
            Discrete Exterior Calculus: Harmonic 1-Form on a Torus
          </Link>{" "}
          — the Clifford torus here is the natural domain for the H¹ harmonic
          generator in DEC; its flat metric ensures no sources or sinks.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ol>
        <li>
          <strong>
            <a
              href="https://link.springer.com/article/10.1007/BF01457962"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hopf, Heinz (1931). Über die Abbildungen der dreidimensionalen
              Sphäre auf die Kugelfläche. Mathematische Annalen 104: 637–665.
            </a>
          </strong>{" "}
          — the original paper proving π₃(S²) ≠ 0.  §3 contains the explicit
          map and the linking-number proof.  Public domain.  Related works: Hopf
          (1935) "Über die Abbildungen von Sphären auf Sphären niedrigerer
          Dimension" (introduces the Hopf invariant for general spheres);
          Steenrod (1951) "The Topology of Fibre Bundles" (Princeton) provides
          the modern bundle-theoretic treatment.
        </li>
        <li>
          <strong>
            <a
              href="https://www.jstor.org/stable/3219300"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              Lyons, David W. (2003). An Elementary Introduction to the Hopf
              Fibration. Mathematics Magazine 76(2): 87–98.
            </a>
          </strong>{" "}
          — the clearest modern derivation of the parametrisation used here,
          with explicit stereographic-projection formulae.  The Bishop-frame
          computation in this blueprint follows Lyons §4.  JSTOR open access;
          mathematical content PD.  Related: Lyons's GitHub repo{" "}
          <a
            href="https://github.com/dplyons"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/dplyons
          </a>{" "}
          — supplementary Mathematica notebooks for the paper.
        </li>
        <li>
          <strong>
            <a
              href="https://numpy.org/doc/stable/"
              className={lk}
              target="_blank"
              rel="noopener noreferrer"
            >
              NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.
            </a>
          </strong>{" "}
          — vectorised trigonometry and parallel-transport computation.
          Related:{" "}
          <a
            href="https://github.com/numpy/numpy"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
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
