import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-cayley-nodal-cubic-4-nodes-9-lines-algebraic-surface-poi-head-webxr";

const TITLE =
  "Python numpy — Cayley Nodal Cubic: Arthur Cayley's 1849 Degree-3 Algebraic Surface, 4 Real Nodes (Maximum for Cubics), S₄ Symmetry Group & 9 Lines via e₃ Elementary Symmetric Polynomial Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Cayley Nodal Cubic is the simplest entry in the node-count record table for algebraic surfaces: the unique degree-3 hypersurface in ℙ³ carrying the maximum possible number of ordinary double points — 4 nodes — arranged at the vertices of a projective tetrahedron. Its equation is startlingly simple: it is the third elementary symmetric polynomial e₃(x₀,x₁,x₂,x₃) = x₀x₁x₂ + x₀x₁x₃ + x₀x₂x₃ + x₁x₂x₃ = 0, invariant under all 24 permutations of the 4 projective coordinates (the full symmetric group S₄). Cayley proved in 1849 that 4 is the maximum by a counting argument on the Hessian determinant; Salmon confirmed the bound is tight the same year. The surface has exactly 9 lines (against the 27 lines of a smooth cubic): 6 edges of the tetrahedron of nodes and 3 remarkable non-edge lines whose existence follows directly from the factorisation f = x₀x₁(x₂+x₃) + x₂x₃(x₀+x₁). This blueprint extracts the affine piece f(x,y,z) = xyz + xy + xz + yz = 0 using marching tetrahedra (N=64 grid), colours vertices by gradient magnitude so the deep-azure node pinch at the origin contrasts with the amber-gold smooth branches, adds three shape keys (SK_Tight / SK_Wide / SK_Flatten) and exports a Draco-compressed WebXR GLB — the degree-3 entry in the studio algebraic-surface series that extends upward through the Kummer quartic (16 nodes) and Barth sextic (65 nodes).";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Cayley A (1849) 'On the triple tangent planes of surfaces of the third order.' Cambridge & Dublin Mathematical Journal 4:118–132. Mathematical content is Public Domain — algebraic formulae and theorems are not copyrightable. Cayley proves the maximum node count for cubic surfaces and identifies the symmetric elementary polynomial construction. Related: Salmon G (1849) independent proof of the 27-line theorem; Segre C (1887) classification of singular cubic surfaces and their 9-line count; Bruce J & Wall C (1979) 'On the classification of cubic surfaces' J London Math Soc 19:245-256 modern treatment; Beauville A (1980) proof of Togliatti quintic bound.",
      url: "https://www.cambridge.org/core/journals/mathematical-proceedings-of-the-cambridge-philosophical-society",
      licence: "Public Domain",
      author: "Arthur Cayley",
    },
    {
      label:
        "NumPy Developers (2020) 'Array programming with NumPy.' Nature 585:357–362. BSD-3-Clause — https://numpy.org — meshgrid for the 64³ scalar field; argwhere active-cell filter; vectorised gradient computation for the node-proximity colour map. Related: https://github.com/numpy/numpy; SciPy for algebraic root-finding; marching-cubes comparison benchmarks.",
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
        Algebraic geometers have long asked: how many ordinary double points —
        nodes — can a degree-<em>d</em> surface in ℙ³ carry before it must be
        smooth? The record table for small degrees forms a tight competition
        between upper bounds and explicit constructions:
      </p>

      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`d=3:  4 nodes  — Cayley cubic (1849)   ← this tutorial   proven sharp: Salmon
d=4: 16 nodes  — Kummer quartic (1864)  ← studio entry    proven sharp: Kummer
d=5: 31 nodes  — Togliatti quintic      ← not yet         proven sharp: Beauville
d=6: 65 nodes  — Barth sextic (1996)   ← studio entry    Miyaoka bound tight`}
      </pre>

      <p>
        For degree 3, the bound of 4 was established in 1849, the same year
        Cayley and Salmon simultaneously proved the 27-line theorem for smooth
        cubics. This tutorial builds the degree-3 entry of the series, following
        on from the studio&rsquo;s{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr"
          className={lk}
        >
          Kummer quartic
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr"
          className={lk}
        >
          Barth sextic
        </Link>{" "}
        entries.
      </p>

      <h2>The Elementary Symmetric Polynomial Trick</h2>
      <p>
        Why does such a complicated-sounding object have such a simple equation?
        Because the Cayley cubic is the zero-locus of the{" "}
        <em>third elementary symmetric polynomial</em> in four variables:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`e₃(x₀,x₁,x₂,x₃) = x₀x₁x₂ + x₀x₁x₃ + x₀x₂x₃ + x₁x₂x₃ = 0

In affine coordinates (x₃ = 1):
  f(x,y,z) = xyz + xy + xz + yz = 0

Alternatively: (1+x)(1+y)(1+z) = 1 + x + y + z`}
      </pre>
      <p>
        The symmetric group S₄ acts on ℙ³ by permuting the four projective
        coordinates. Since e₃ is invariant under <em>all</em> 24 permutations,
        the surface inherits the full S₄ symmetry. The four coordinate vertices
        N₀=[1:0:0:0], N₁=[0:1:0:0], N₂=[0:0:1:0], N₃=[0:0:0:1] are the four
        fixed points of this action — and they are precisely the 4 nodes.
      </p>

      <h2>Why These Are Nodes (A₁ Singularities)</h2>
      <p>
        At the affine node N₃=(0,0,0), the gradient vanishes:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`∂f/∂x = yz + y + z → 0 at origin
∂f/∂y = xz + x + z → 0 at origin
∂f/∂z = xy + x + y → 0 at origin`}
      </pre>
      <p>
        The lowest-order part of f near the origin is the degree-2 piece{" "}
        <code>Q(x,y,z) = xy + xz + yz</code>. Its associated Hessian matrix
        is ½·[[0,1,1],[1,0,1],[1,1,0]], with eigenvalues +½ (once) and −¼
        (twice). The signature (1,2) means Q=0 is a{" "}
        <em>real quadric cone</em> — two sheets meeting at the origin. This
        is the defining property of an{" "}
        <strong>A₁ ordinary double point</strong>, the mildest possible
        singularity. After a linear change of coordinates, the local geometry
        is x² + y² − z² = 0 (standard cone).
      </p>

      <h2>The 9 Lines — Found by Factorisation</h2>
      <p>
        The equation factorises beautifully:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`f = x₀x₁(x₂ + x₃) + x₂x₃(x₀ + x₁)

If x₀ + x₁ = 0  AND  x₂ + x₃ = 0:  both terms vanish → f ≡ 0 on this line. ✓`}
      </pre>
      <p>
        There are 3 ways to partition {"{"}0,1,2,3{"}"} into two pairs, giving 3
        non-edge lines:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`L_A: x₀+x₁=0, x₂+x₃=0  →  affine: y = −x,  z = −1
L_B: x₀+x₂=0, x₁+x₃=0  →  affine: z = −x,  y = −1
L_C: x₀+x₃=0, x₁+x₂=0  →  affine: x = −1,  y = −z`}
      </pre>
      <p>
        These 3 lines pass through no node. Together with the 6 edge lines
        (the 6 edges of the tetrahedron of nodes — 3 visible as coordinate
        axes in the affine patch, 3 at projective infinity), they account for
        all 9 lines: the full count proved by Segre (1887).
      </p>
      <p>
        Each non-edge line is stabilised by a Sylow 2-subgroup of S₄ (a copy
        of D₄, order 8). The 3 such subgroups correspond precisely to the 3
        ways to pair the 4 nodes into two pairs — a beautiful correspondence
        between the topology of the lines and the group theory of S₄.
      </p>

      <h2>Marching Tetrahedra Implementation</h2>
      <p>
        The affine surface f(x,y,z) = xyz + xy + xz + yz = 0 is extracted
        from a 64³ grid over [−2.5, 2.5]³. The marching-tetrahedra algorithm
        decomposes each axis-aligned cube into 6 tetrahedra sharing the body
        diagonal, then finds triangle(s) where the scalar field changes sign.
        An active-cell filter skips the ≈95 % of cubes where no sign change
        occurs.
      </p>
      <p>
        Near the origin node, the gradient vanishes — both sheets of the
        quadric cone are present in adjacent cubes, so the triangulation is
        dense there. Away from the node, the surface thins out into the
        coordinate-plane branches.
      </p>

      <h2>Vertex Colour — Node Proximity Map</h2>
      <p>
        Each vertex is coloured by <code>|∇f|</code>, the gradient magnitude:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`g = |∇f| / max(|∇f|)       # 0 at node, 1 on smooth patches
R = g^0.3                   # warm amber-gold away from node
G = g^0.5 × 0.6
B = (1−g)^0.4               # deep azure at the node pinch point`}
      </pre>
      <p>
        The colour gradient makes the single visible node at the origin
        immediately apparent as a deep-blue pinch point against the warm
        amber-gold surface.
      </p>

      <h2>Workshop Steps</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`# 1. Open Blender 5.1 → Scripting workspace
# 2. Open blueprint.py → Run Script (Alt+P)
# 3. Console prints:
#    "Cayley cubic: extracting isosurface (N=64)…"
#    "  ~30 000 vertices, ~60 000 triangles"
# 4. Switch to Layout — amber poi head with dark-blue node at origin
# 5. Object Data → Color Attributes → Col → toggle Solid mode: Color=Attribute
# 6. Shape Keys: scrub SK_Tight (sheets pinch), SK_Wide (branches spread),
#    SK_Flatten (2D cross-section showing 3-axis star pattern)
# 7. Open record.py → Run Script → wait for viewport.mp4
# 8. Follow SCREEN-RECORDING-NOTES.md for OBS screen.mp4`}
      </pre>

      <h2>Troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`Symptom: "0 vertices, 0 triangles"
Fix: Check Blender version — color_attributes requires Blender 4.0+.
     Confirm you opened blueprint.py (not record.py) first.

Symptom: Mesh appears inside-out (dark backfaces)
Fix: In Material settings, disable "Backface Culling". The cubic surface
     is non-orientable in the affine patch — both sides should be visible.

Symptom: GLB export fails with "GLTF export error: Draco"
Fix: Ensure the Draco compression extension is enabled in Blender's
     add-on preferences: Edit → Preferences → Add-ons → "glTF 2.0" → expand.

Symptom: Node pinch not visible — mesh looks uniform amber
Fix: In Solid mode, set Color = Attribute. In Material Preview mode,
     the node-tree may override vertex colours — switch to Solid for the demo.`}
      </pre>

      <h2>Connections and Cross-References</h2>
      <p>
        The Cayley cubic sits at the base of the studio&rsquo;s algebraic-surface
        series. Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-clebsch-diagonal-cubic-27-lines-algebraic-surface-stage-floor-webxr"
          className={lk}
        >
          Clebsch Diagonal Cubic
        </Link>{" "}
        — also degree 3 but <em>smooth</em>, carrying the full 27 lines and E₆
        root-system symmetry. The two degree-3 entries illustrate the contrast
        between smooth and singular cubics. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr"
          className={lk}
        >
          Kummer quartic (16 nodes)
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-barth-sextic-65-nodes-miyaoka-bound-icosahedral-symmetry-poi-head-webxr"
          className={lk}
        >
          Barth sextic (65 nodes)
        </Link>{" "}
        extend the series to higher degrees.
      </p>
      <p>
        The marching-tetrahedra code is shared with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
          className={lk}
        >
          Schwarz P/D/Gyroid TPMS tutorial
        </Link>{" "}
        — same body-diagonal 6-tet decomposition, same active-cell argwhere
        filter. The S₄ symmetry relates to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-icosahedral-quasicrystal-cut-project-z6-shechtman-poi-head-webxr"
          className={lk}
        >
          icosahedral quasicrystal
        </Link>{" "}
        tutorial&rsquo;s discussion of discrete symmetry groups acting on
        algebraic objects.
      </p>
      <p>
        For the poi-head context, see the{" "}
        <Link href="/atelier" className={lk}>
          Aura Test Chamber
        </Link>{" "}
        — where faceted algebraic-surface heads are tested as WebXR props — and
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr"
          className={lk}
        >
          Boy Surface tutorial
        </Link>{" "}
        for a smooth RP² immersion that contrasts with the Cayley cubic&rsquo;s
        singular structure.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
});
