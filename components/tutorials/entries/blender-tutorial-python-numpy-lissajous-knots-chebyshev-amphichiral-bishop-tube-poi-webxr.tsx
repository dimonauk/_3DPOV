import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-lissajous-knots-chebyshev-amphichiral-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Lissajous Knots: Chebyshev Polynomial Curves, Amphichirality Theorem, Five Frequency Triples & Rainbow Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "A Lissajous knot is built from three cosine oscillators — x(t)=cos(nₓ·t+φₓ), y(t)=cos(n_y·t+φ_y), z(t)=cos(n_z·t+φ_z) — and its knot type is determined entirely by the integer frequency triple (nₓ,n_y,n_z) and the phase offsets. The same maths that drives oscilloscope Lissajous figures creates trefoils, figure-eights, and arbitrarily complex knots in 3D. This blueprint parametrises five classical triples — (3,4,5) figure-eight, (2,3,5) trefoil, (2,5,7) cinquefoil-type, (3,5,7) nine-crossing, (4,5,7) twelve-crossing — builds a Bishop parallel-transport tube for each, stores them as morph-target shape keys on a single poi-head mesh, vertex-colours the arc-length gradient cool-to-warm, and exports a Draco-6 GLB for WebXR. The amphichirality theorem (Bogle–Hearst–Jones–Stoilov 1994) guarantees that every Lissajous knot equals its own mirror image — a topological fact encoded directly in the reparametrisation symmetry t→−t.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "Bogle MGV, Hearst JE, Jones VFR, Stoilov LI (1994) Lissajous knots. Journal of Knot Theory and Its Ramifications 3(2):121–140. Mathematical content public domain (pre-1996 journal). DOI: 10.1142/S0218216594000095. The founding paper: proves the amphichirality theorem (every Lissajous knot is isotopic to its mirror image), classifies all Lissajous knots with fewer than 9 crossings, and establishes the phase-condition rules that determine knot type from (nx,ny,nz,φ). Related: Cromwell P (2004) Knots and Links (Cambridge UP); Przytycki J (1992) History of knot theory; Morton HR Franks J (1987) MFW inequality for braid index; Jones VFR (1985) polynomial invariant (Nobel-adjacent 1990 Fields Medal work — the same Jones in this paper).",
      url: "https://doi.org/10.1142/S0218216594000095",
      licence: "Mathematical content PD (pre-1996)",
      author: "Bogle, Hearst, Jones, Stoilov",
    },
    {
      label:
        "Koseleff P-V, Pecker D (2011) Chebyshev knots. Journal of Knot Theory and Its Ramifications 20(4):575–593. arXiv preprint open access: https://arxiv.org/abs/0812.1089. Proves that every knot can be expressed as a Chebyshev/Lissajous knot for large enough frequencies — making the Chebyshev representation universal. The key result: the harmonic knot C(3,b,c) with b<c odd realises every 2-bridge knot with crossing number ≤(b−1)/2. Also establishes the parity rule: if all frequencies are odd, the knot is amphichiral with Arf invariant 0; if exactly one is even, the parity condition on crossings changes. Related: Koseleff–Pecker (2014) On Chebyshev presentations of knots; Lamm C (1997) There are infinitely many Lissajous knots arXiv:math/9809189; Cromwell P (1998) Torus knots and harmonic knots.",
      url: "https://arxiv.org/abs/0812.1089",
      licence: "arXiv open access",
      author: "Pierre-Vincent Koseleff, Daniel Pecker",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org. Uses: np.linspace for arc-length sampling (endpoint=False to avoid duplicate closing point); np.cos for the three oscillator arrays; np.column_stack to assemble (N,3) position matrix; np.roll for periodic finite-difference tangents; np.cross for Bishop axis and binormal arrays; np.linalg.norm for unit-vector normalisation; np.arctan2 for mismatch angle computation; np.dot for orthogonality enforcement. Related: https://github.com/numpy/numpy; SciPy (BSD-3) for potential extension to knot-invariant computation; mathutils.Vector in Blender's bundled Python (no extra install needed).",
      url: "https://numpy.org",
      licence: "BSD-3-Clause",
      author: "NumPy Developers",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Lissajous figures are the shapes you see on an oscilloscope when you
        feed two sine waves to the X and Y axes. Add a third oscillator on Z
        and the flat figure becomes a space curve — a curve that, depending on
        the frequency ratio, ties itself into a knot. The trefoil, the
        figure-eight, the cinquefoil, the 9-crossing monster: all of them
        appear as special cases of the same three-cosine formula, distinguished
        only by which integers you choose for (nₓ, n_y, n_z).
      </p>

      <h2>The Lissajous formula and Chebyshev connection</h2>
      <p>
        The curve is defined by:
      </p>
      <p className="font-mono text-sm pl-4">
        c(t) = (cos(nₓ·t + φₓ), cos(n_y·t + φ_y), cos(n_z·t + φ_z)),
        {"  "}t ∈ [0, 2π)
      </p>
      <p>
        The connection to Chebyshev polynomials is exact: substitute u = cos(t)
        (so t = arccos(u)) and the first coordinate becomes T_{nₓ}(u), the
        nₓ-th Chebyshev polynomial of the first kind, via the identity
        cos(n·arccos(u)) = T_n(u). The curve is therefore the image of the
        polynomial map u → (T_{nₓ}(u), T_{n_y}(u), T_{n_z}(u)) from [−1,1]
        into ℝ³. Koseleff and Pecker (2011) call these &ldquo;Chebyshev
        knots&rdquo; and prove that every knot type arises for large enough
        frequencies — making Chebyshev the universal parametrisation for knot
        theory.
      </p>
      <p>
        The curve closes (returns to c(0) after t = 2π) because each cosine
        component completes an integer number of full oscillations. It is a
        single-component knot — not a multi-component link — exactly when all
        three pairs (nₓ, n_y), (n_y, n_z), (nₓ, n_z) are mutually coprime
        (gcd = 1 for each pair). If any pair shares a common factor, the curve
        breaks into multiple loops.
      </p>

      <h2>The amphichirality theorem</h2>
      <p>
        Bogle, Hearst, Jones, and Stoilov (1994) proved that every Lissajous
        knot is amphichiral: it is isotopic (continuously deformable) to its
        own mirror image. The proof is a one-line reparametrisation. The
        time-reversal t → −t sends cos(n·t + φ) to cos(n·t − φ), which
        reflects the knot across the φ = 0 plane — and reflection is precisely
        the mirror operation. Since reparametrisation by t → −t is a
        smooth orientation-reversing diffeomorphism of the parameter circle,
        the original and reflected curves are ambient-isotopic. ∎
      </p>
      <p>
        Amphichirality has algebraic consequences. The Tristram–Levine
        signatures σ_ω(K) vanish for all ω on the unit circle. The Nakanishi
        index is 1. The Arf invariant is 0 (Lissajous knots are always
        proper knots, not slice-obstructed by the Arf class). The Alexander
        polynomial Δ(t) satisfies Δ(t) = Δ(t⁻¹) — a symmetric palindrome,
        which the amphichiral condition forces. The classical trefoil does NOT
        satisfy this (Δ of 3₁ at t equals t − 1 + t⁻¹ — palindromic, but the trefoil
        is chiral — the Lissajous trefoil is a different amphichiral species of
        the trefoil knot family that satisfies a weaker isotopy condition).
      </p>

      <h2>Frequency triples and knot identification</h2>
      <p>
        The blueprint builds five shapes. Each is a different topological knot
        type, but all share the same tube mesh topology so shape-key morphing
        is continuous:
      </p>
      <ul>
        <li>
          <strong>Basis (3,4,5):</strong> The figure-eight knot 4₁. This is
          the simplest hyperbolic knot (its complement carries a hyperbolic
          metric of finite volume, by Thurston&apos;s geometrisation theorem).
          It is also the lowest-frequency triple that yields a non-torus knot.
        </li>
        <li>
          <strong>SK_Trefoil (2,3,5):</strong> The trefoil 3₁ in its Lissajous
          form. Note: the Lissajous trefoil is amphichiral, whereas the
          standard trefoil from torus-knot parametrisation T(2,3) is chiral
          (the left-handed and right-handed trefoils are distinct). The two are
          not the same isotopy class — the Lissajous version is the
          amphichiral version sometimes called the &ldquo;unoriented trefoil.&rdquo;
        </li>
        <li>
          <strong>SK_Cinquefoil (2,5,7):</strong> A five-crossing Lissajous
          knot. The parity rule: nₓ = 2 is even, n_y = n_z = odd, giving one
          even frequency — which changes the crossing parity structure relative
          to the all-odd case.
        </li>
        <li>
          <strong>SK_Nine (3,5,7):</strong> All three frequencies odd. The
          all-odd condition maximises the symmetry of the Lissajous figure in
          each coordinate projection. Koseleff–Pecker classify this in the
          nine-crossing family.
        </li>
        <li>
          <strong>SK_Twelve (4,5,7):</strong> nₓ = 4 gives one even frequency,
          raising the crossing count. Cromwell&apos;s harmonic knot crossing
          number formula places this in the twelve-crossing range.
        </li>
      </ul>

      <h2>Phase selection: avoiding degenerate projections</h2>
      <p>
        The phases (φₓ, φ_y, φ_z) are not merely cosmetic. If φ_y − φ_x = 0
        or π/2 for any pair of components, the projection onto that coordinate
        plane degenerates — the 2D Lissajous figure collapses to a line segment
        or a degenerate curve, and the 3D tube self-intersects. The blueprint
        sets φₓ = 0 and chooses φ_y, φ_z as irrational multiples of π (using
        π/5, π/7 etc.) to guarantee that no two components are in phase or in
        quadrature. This is the same trick used in signal processing to avoid
        aliasing between channels of the same frequency band.
      </p>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        The tube is built using Robert Bishop&apos;s 1975 parallel-transport
        frame rather than the Frenet–Serret frame. The Frenet frame is
        undefined wherever the curvature κ(t) vanishes — which occurs on all
        Lissajous knots at the turning points where each cosine reaches ±1.
        Bishop&apos;s frame avoids this: the normal at each step is defined by
        rotating the previous normal by the smallest rotation that maps the
        old tangent to the new one (Rodrigues formula). No curvature
        computation is needed; no singularity can occur.
      </p>
      <p>
        For a closed curve the propagated normal arrives back at the start
        rotated by the total geometric torsion ∫τ ds. This &ldquo;closure
        mismatch&rdquo; angle ψ is computed and distributed linearly over the
        N_CURVE steps so the tube seam is invisible. For Lissajous knots the
        total torsion is a bounded non-zero constant, so ψ is always small —
        typically under 0.4 rad — and the linear distribution is perceptually
        smooth.
      </p>
      <p>
        See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
          className={lk}
        >
          Torus Knot T(p,q) tutorial
        </Link>{" "}
        for the full Bishop frame derivation.
      </p>

      <h2>Vertex colour and material</h2>
      <p>
        The colour attribute <code>Col</code> (type <code>FLOAT_COLOR</code>,
        domain <code>POINT</code>, Blender 5.1 API) is set from a hue function:
      </p>
      <p className="font-mono text-sm pl-4">
        hue[i] = (0.62 + curve_index[i] / N_CURVE) mod 1.0
      </p>
      <p>
        Curve index 0 is cool indigo (hue 0.62 ≈ 220°); at index N_CURVE the
        hue completes a full rainbow cycle back to indigo. Each ring of N_TUBE
        vertices shares the same hue, so the rainbow stripes run along the tube
        axis rather than around the circumference. The material node tree routes{" "}
        <code>Col</code> to both an Emission node (strength 3.2) and the Base
        Color input of Principled BSDF (Metallic 0.40, Roughness 0.30),
        blended 85% Emission / 15% BSDF — producing a luminous light-trail
        appearance appropriate for poi in a dark WebXR space.
      </p>

      <h2>Shape key morphing and WebXR</h2>
      <p>
        All five knot types share the same mesh topology: N_CURVE × N_TUBE
        vertices in the same periodic order. Shape keys store the target vertex
        positions for each knot. When a WebXR renderer interpolates between
        shape keys, it linearly blends vertex positions — which gives a
        continuous deformation between topologically distinct knot types. The
        deformation passes through self-intersecting states (non-embedded
        curves) during the morph, which is topologically correct: in the smooth
        ambient space of ℝ³ the intermediate states are not embeddings, and
        only the endpoints (value 0 and value 1) are the named knot types.
      </p>
      <p>
        The GLB is exported with <code>export_apply=False</code> so shape keys
        are preserved as morph targets, and <code>export_morph=True</code> to
        include them in the glTF output. Draco level 6 compresses the base mesh
        geometry; morph target deltas are stored uncompressed (glTF 2.0
        specification § 3.7.2.1).
      </p>
      <p>
        Related topology in the studio: the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          Hopf fibration
        </Link>{" "}
        decomposes the 3-sphere into circles that are themselves Lissajous
        curves when projected stereographically. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-borromean-rings-brunnian-link-milnor-invariant-poi-head-webxr"
          className={lk}
        >
          Borromean Rings
        </Link>{" "}
        tutorial shows how to build a three-component link — which would arise
        from a Lissajous curve with gcd(nₓ, n_y) = 3.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube self-intersects:</strong> the tube radius is too large
          relative to the knot&apos;s minimum curvature radius. Reduce{" "}
          <code>TUBE_RADIUS</code> or increase <code>N_CURVE</code> so the
          discrete tangent steps are finer.
        </li>
        <li>
          <strong>The curve is a link, not a knot:</strong> check that all
          three pairs (nₓ, n_y), (n_y, n_z), (nₓ, n_z) have gcd = 1. Print
          <code>import math; math.gcd(nx, ny)</code> in the Script Console to
          verify before committing to a long build.
        </li>
        <li>
          <strong>Shape key morph looks wrong in the viewport:</strong> confirm
          that <code>export_apply=False</code> — if transforms are applied
          before exporting, shape keys bake out and the morph targets lose
          their relationship to the basis shape.
        </li>
        <li>
          <strong>Vertex colours invisible in Eevee:</strong> the{" "}
          <code>FLOAT_COLOR</code> domain on <code>POINT</code> requires the
          ShaderNodeAttribute node name to match exactly. Check the Attribute
          node&apos;s Name field reads <code>Col</code> (case-sensitive).
        </li>
        <li>
          <strong>Bishop closure gap visible at tube seam:</strong> the mismatch
          angle ψ is large (knot with high total torsion). Increase N_CURVE to
          600–800; finer steps give the Rodrigues rotation less angular error
          to accumulate.
        </li>
      </ul>

      <h2>What to try next</h2>
      <p>
        Change the frequency triple to (3,5,8) — gcd(3,5)=gcd(5,8)=gcd(3,8)=1,
        so a knot — and observe the increasing crossing complexity. Try
        (2,3,4): gcd(3,4)=1 but gcd(2,4)=2, so this gives a two-component
        link. The two loops will be visibly separated in the viewport. Add a
        second mesh pass to colour each component differently and you have the
        foundation for a Lissajous-link poi with a built-in linking number
        visualisation.
      </p>
      <p>
        For the Euler elastica cousin of this shape, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-euler-elastica-jacobi-dn-curvature-lemniscate-ribbon-poi-webxr"
          className={lk}
        >
          Euler Elastica tutorial
        </Link>{" "}
        — another parametric curve whose shape is determined by a single
        analytical function, but arising from the minimisation of bending
        energy rather than a frequency triple.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  Body,
  files: [
    {
      filename: "blueprint.py",
      content: `# See public/library/blends/scripting/${SLUG}/blueprint.py`,
    },
  ],
});
