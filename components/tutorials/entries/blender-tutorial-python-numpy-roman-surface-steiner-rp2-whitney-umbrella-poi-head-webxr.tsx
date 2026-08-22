import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-roman-surface-steiner-rp2-whitney-umbrella-poi-head-webxr";

const TITLE =
  "Python numpy — Steiner Roman Surface: Jakob Steiner's 1844 RP² Immersion, Six Whitney Umbrella Singularities, Degree-4 Algebraic Equation x²y²+y²z²+z²x²=xyz & Faceted Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The real projective plane RP² — the sphere with antipodal points glued — cannot be embedded smoothly in three-dimensional space, but it can be immersed: locally injective, globally self-intersecting. Jakob Steiner found the first such immersion in 1844 during a stay in Rome, producing what is now called the Roman surface: an algebraic degree-4 variety whose affine equation is x²y²+y²z²+z²x²=xyz, with three double-line segments running along the coordinate axes and six Whitney umbrella singularities at their endpoints. A Whitney umbrella is not a smooth point — it is a fold catastrophe of the type z²=xy², where a sheet of the surface develops a self-tangency pinch. This makes the Roman surface a different class of RP² immersion from Boy's 1901 surface (which is everywhere smooth, at the cost of a single triple point). This blueprint builds the Roman surface via the Veronese-type sphere map f(p)=(p_x·p_y, p_y·p_z, p_z·p_x), which automatically realises the antipodal identification RP²=S²/(x~-x) because f(p)=f(-p). The 80×80-vertex mesh is coloured by azimuthal angle and proximity to the six Whitney umbrella tips, and carries three shape-key deformations for WebXR morph targets.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Steiner J (1844) 'Questions proposées.' Nouvelles Annales de Mathématiques 3:1–2. Public Domain — Jakob Steiner's original 1844 note posing the problem of constructing a surface of the real projective plane in ℝ³; the resulting construction (made during Steiner's 1844 visit to Rome) became the Roman surface, characterised by 3 double lines and 6 Whitney umbrella singularities. Related: Kummer's quartic (1864) — Steiner was a key interlocutor for Kummer on the 16-node quartic surface; Steiner surface (1864 Steiner surface in RP³); Apéry F (1986) 'Models of the Real Projective Plane' — full modern treatment of Roman vs Boy vs cross-cap immersions; Cayley 1849 — independent algebraic derivation of the degree-4 equation.",
      url: "https://www.numdam.org/item/NAM_1844__3__1_0/",
      licence: "Public Domain",
      author: "Jakob Steiner",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org — meshgrid for the 80×80 (φ,θ) parameter grid over the half-sphere; vectorised sin/cos for the Veronese sphere map (pₓpᵧ, pᵧp_z, p_z pₓ); einsum-style ravel/reshape for from_pydata vertex lists; arctan2 for azimuthal colour hue; linalg.norm for Whitney-tip proximity calculation. Related: https://github.com/numpy/numpy; SciPy for higher-order surface invariants; matplotlib for parameter-space visualisation of the self-intersection locus.",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
    {
      label:
        "3D-XplorMath Consortium — Virtual Mathematics Museum, Roman Surface entry. MIT Licence — https://3d-xplormath.org — open-source interactive mathematics museum (Java / JavaScript) providing parametric definitions, images, and historical notes for classical surfaces including the Roman surface; explicit parametrisation as image of S² under bilinear Veronese-type map. Related: https://github.com/3DXplorMath/3DXplorMath-J (MIT-licensed Java source); Boy Surface entry (complementary RP² immersion); Cross-Cap entry (homeomorphic to Roman surface, different embedding style).",
      url: "https://3d-xplormath.org",
      licence: "MIT",
      author: "3D-XplorMath Consortium",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Steiner found the Roman surface while working on projective geometry in
        Rome in 1844. The construction is simple: take any point
        p = (x, y, z) on the unit sphere S², and map it to
        the triple (xy, yz, zx) — the three pairwise products of its
        coordinates. Because (−x)(−y) = xy and so on for all three products,
        antipodal points on S² land at the same image point. The map therefore
        realises the antipodal quotient RP² = S²/(x~−x) in ℝ³.
      </p>

      <h2>Two RP² immersions compared</h2>
      <p>
        The Roman surface and the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
        >
          Boy surface
        </Link>{" "}
        are both RP² immersions in ℝ³, but they are not isotopic — no smooth
        deformation through immersions transforms one into the other. The
        critical distinction is in their singular loci:
      </p>
      <ul>
        <li>
          <strong>Roman surface:</strong> six Whitney umbrella singularities
          (fold type z²=xy²) at the six endpoints of three coordinate-axis
          double lines. NOT a smooth immersion — the surface has genuine
          topological singularities.
        </li>
        <li>
          <strong>Boy surface:</strong> everywhere smooth; one triple point;
          one closed self-intersection curve. A genuine smooth immersion.
        </li>
      </ul>
      <p>
        The Roman surface is the historically first example, and its
        degree-4 algebraic equation makes it easier to study by classical
        algebraic geometry methods.
      </p>

      <h2>The Veronese map and the degree-4 equation</h2>
      <p>
        The map f: S² → ℝ³, f(p) = (p_x p_y, p_y p_z, p_z p_x), is
        a restriction of the <em>Veronese embedding</em> RP²↪RP⁵, which
        maps [x:y:z] to [x²:y²:z²:xy:yz:zx]. We keep only the three
        cross-term coordinates, projecting the Veronese image from RP⁵
        back to RP² (a linear projection that introduces the singularities).
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`Projective equation (degree 4 in RP³ with coordinates [X:Y:Z:W]):
  X²Y² + Y²Z² + Z²X² − XYZW = 0

Affine equation (W = 1):
  x²y² + y²z² + z²x² = xyz

Verification with the parametrisation:
  x = uv,  y = vw,  z = wu,  where u²+v²+w² = 1

  LHS = u²v²·v²w² + v²w²·w²u² + w²u²·u²v²
       = u²v⁴w² + v²w⁴u² + w²u⁴v²
       = u²v²w²(v² + w² + u²) = (uvw)²

  RHS = uv · vw · wu = u²v²w² = (uvw)²   ✓`}
      </pre>

      <h2>Whitney umbrella singularities</h2>
      <p>
        A Whitney umbrella is the germ of the map (s,t) → (s, st, t²) near
        the origin: a smooth sheet that develops a self-tangency crease.
        On the Roman surface, the six Whitney umbrellas are located where
        exactly two of the three coordinate products vanish. For example,
        at φ = π/2, θ = π/4 on S²: p = (1/√2, 1/√2, 0), giving
        f(p) = (1/2, 0, 0) — the maximum X value. This is a Whitney
        umbrella tip: any neighbourhood of this point on the surface
        contains a fold line (the double-line segment along the X-axis).
      </p>

      <h2>Blueprint: parametrisation and mesh</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`# Domain: φ ∈ (ε, π−ε),  θ ∈ (ε, π−ε)
# WHY half-sphere? (φ,θ) and (π−φ, π+θ) are antipodal → same image.
# The half-domain avoids duplicating vertices at the self-intersection.

SCALE = 2 * POI_RADIUS   # max |X| = SCALE * max|pₓpᵧ| = SCALE/2

SX = sin(PHI) * cos(THETA)
SY = sin(PHI) * sin(THETA)
SZ = cos(PHI)

X = SCALE * SX * SY    # = SCALE · sin²φ · sin(2θ)/2
Y = SCALE * SY * SZ    # = SCALE · sin(2φ)/2 · sin θ
Z = SCALE * SZ * SX    # = SCALE · sin(2φ)/2 · cos θ

# Bounding box: X,Y,Z ∈ [−POI_RADIUS, POI_RADIUS]`}
      </pre>

      <h2>Vertex colour: azimuth + Whitney proximity</h2>
      <p>
        Each vertex is coloured by two factors: its azimuthal angle
        atan2(Y, X) — cycling through the full hue wheel once per π,
        which reveals the 2-fold antipodal identification — and its
        proximity to the nearest Whitney umbrella tip. Points near a
        singularity tip get high saturation and brightness; the interior
        near the origin is darker and less saturated.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <strong>Boy surface</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
          >
            tutorial
          </Link>
          ): The smooth RP² immersion, historically discovered as an answer
          to Hilbert's 1901 challenge. The Roman surface is the precursor;
          Boy's is the refinement that removes the Whitney umbrella singularities.
        </li>
        <li>
          <strong>Klein bottle</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr"
          >
            tutorial
          </Link>
          ): RP² and the Klein bottle are the two fundamental compact
          non-orientable surfaces without boundary. Klein bottle = RP²#RP²
          (connected sum of two projective planes). The Roman surface gives
          an explicit realisation of one summand.
        </li>
        <li>
          <strong>Kummer quartic</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr"
          >
            tutorial
          </Link>
          ): The Roman surface has degree-4 algebraic equation; the Kummer
          quartic is also degree 4 but with 16 double points rather than
          Whitney umbrella singularities. Both live at the intersection of
          classical and modern algebraic geometry.
        </li>
        <li>
          <strong>Barth sextic</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr"
          >
            tutorial
          </Link>
          ): The degree-6 Barth surface sits in the same strand of algebraic
          surface theory — surfaces with the maximum number of nodes allowed
          by the Miyaoka bound. The Roman surface is degree-4 with the
          structurally different Whitney umbrella singularities.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Z-fighting at self-intersection:</strong> Three sheets of
          the surface share a narrow region near the coordinate axes. This is
          correct — the double lines are genuine. Add a tiny polygon offset
          in Blender's{" "}
          <code>Material → Settings → Polygon Offset</code> if needed.
        </li>
        <li>
          <strong>Six "spike" artefacts:</strong> These are the Whitney
          umbrella tips. They are geometrically correct. The spikes become
          more pronounced as EPS decreases toward 0 (the mesh approaches
          the true singularity).
        </li>
        <li>
          <strong>Mesh appears as two disconnected patches:</strong> Correct —
          the open-boundary parametrisation produces an open surface. The
          self-intersection structure is internal, not a missing face.
          Use{" "}
          <code>bmesh.ops.remove_doubles(dist=1e-3)</code> to weld
          coincident vertices at the self-intersection seam if desired.
        </li>
        <li>
          <strong>GLB morph targets absent:</strong> Set{" "}
          <code>export_morph=True</code> in the glTF export operator call.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(data, Body, {
  slug: SLUG,
  libraryPath: `blends/scripting/${SLUG}`,
  requiredFiles: [
    "blueprint.py",
    "record.py",
    "hf_roman_surface.blend",
    "hf_roman_surface.glb",
  ],
});
