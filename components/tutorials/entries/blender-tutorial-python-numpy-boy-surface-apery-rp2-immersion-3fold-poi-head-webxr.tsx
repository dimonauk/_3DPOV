import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr";

const TITLE =
  "Python numpy — Boy Surface: Werner Boy's 1901 RP² Immersion, Apéry–Nordstrand Parametrisation, Triple Point & 3-Fold Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "David Hilbert posed the question in 1901: can the real projective plane RP² — the sphere with antipodal points glued together — be smoothly immersed in three-dimensional Euclidean space? His student Werner Boy answered yes that same year in his Göttingen thesis, constructing a surface that is everywhere smooth yet self-intersecting, with exactly one triple point (where three sheets of the surface cross at a single location) and a single closed self-intersection curve threading through that point. Boy's immersion has 3-fold rotational symmetry, which makes it immediately legible and beautiful. This blueprint uses the Nordstrand/Apéry parametrisation — D(u,v) = 2 − √2·sin(3u)·sin(2v), denominator always ≥ 0.586 — to build a 72×144-quad mesh with azimuthal HSV vertex colours that reveal the three-fold structure in a rainbow sweep. Three shape keys morph the standard form toward an oblate disc (z×0.35), a prolate wand (z×2.6), and a compact tight form (0.72×). The result is a poi head of exceptional topological character — the only compact 2-manifold without boundary that is simultaneously smooth and non-orientable, rendered faithfully in WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "Boy W (1903) Über die Curvatura integra und die Topologie geschlossener Flächen. Mathematische Annalen 57:151–184. doi:10.1007/BF01444342. Public Domain — Werner Boy's 1901 Göttingen doctoral thesis result, published 1903: proof that RP² admits a smooth immersion in ℝ³ with exactly one triple point and one self-intersection curve; construction of the 3-fold-symmetric surface; computation of integral curvature via the Euler characteristic. Related: Hilbert 1901 Grundlagen der Geometrie (problem 4); Steiner 1844 Roman surface (pinch-point immersion, not smooth); Smale 1958 sphere eversion (related immersion theory); Francis-Apéry 1992 physical model construction.",
      url: "https://link.springer.com/article/10.1007/BF01444342",
      licence: "Public Domain",
      author: "Werner Boy",
    },
    {
      label:
        "Apéry F (1986) Models of the Real Projective Plane. Vieweg, Braunschweig. Mathematical content Public Domain — introduces the degree-4 algebraic formula for Boy's surface via the Veronese embedding; relates it to the Bryant-Kusner (1987) rational complex-analytic parametrisation z(1−z⁴)/(z⁶−√10·z³+1) over the unit disk; gives the Nordstrand formula (Apéry 1986 §3) used in this blueprint; proves the self-intersection locus is a single closed curve. Related: Bryant R 1987 (rational parametrisation via unit-disk map, Proc. Amer. Math. Soc. 101); Kusner R (genus-0 Willmore surface connection); Morin B (sphere eversion via Boy surface); Banchoff T 1994 (computer visualisation of RP² immersions).",
      url: "https://link.springer.com/book/9783528089832",
      licence: "Mathematical content Public Domain",
      author: "François Apéry",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org — meshgrid for the 72×144 (u,v) parameter grid; vectorised sin/cos for the Nordstrand formula; ravel/tolist for from_pydata vertex list; arctan2 for the azimuthal colour hue; select for vectorised HSV→RGB conversion. Related: https://github.com/numpy/numpy; SciPy for higher-order surface differential geometry; matplotlib for parameter-space visualisation.",
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
        The question Hilbert posed — whether RP² can live smoothly in ℝ³ —
        sounds abstract until you hold the answer in your hand: a surface that
        is compact (no boundary), smooth (no creases), yet not a sphere and
        not an orientable surface. Werner Boy found it in one year, aged
        twenty-two. Every attempt since then to improve on his construction
        has produced a different immersion of the same topological type —
        there are infinitely many — but his 3-fold-symmetric version remains
        the most studied because the symmetry makes the self-intersection
        structure completely legible.
      </p>

      <h2>Why RP² cannot be embedded</h2>
      <p>
        A smooth embedding is an immersion with no self-intersections.
        RP² cannot be embedded in ℝ³ because it is compact and non-orientable:
        Whitney's theorem (1944) shows that every compact non-orientable
        surface requires a 4-dimensional ambient space for a smooth embedding.
        In ℝ³ you can only get an <em>immersion</em> — locally injective but
        globally self-intersecting. The question is how badly the surface
        must cross itself.
      </p>
      <p>
        The Roman surface (Steiner 1844) achieves an immersion of RP² with
        only six singular points — Whitney umbrellas, where the surface
        develops a pinch-point singularity of the type z² = xy². These are
        not smooth. Boy found a surface with no singularities at all, at the
        cost of a single triple point (three smooth sheets crossing one
        another at a single location) and a closed self-intersection curve.
        The algebraic degree of the resulting surface is 6, fitting Boy's
        theorem into Hilbert's contemporary work on algebraic surfaces.
      </p>

      <h2>The Nordstrand/Apéry formula</h2>
      <p>
        The parametrisation we use was described by Apéry (1986) and
        popularised by Tim Nordstrand's surface gallery. Over the domain
        u ∈ [0,π/2], v ∈ [0, 2π]:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`D(u,v)  =  2 − √2 · sin(3u) · sin(2v)

x(u,v)  =  (√2·cos²u·cos(2v) + cos(u)·sin(u)·cos(v)) / D
y(u,v)  =  (√2·cos²u·sin(2v) − cos(u)·sin(u)·sin(v)) / D
z(u,v)  =   3·cos²u / D

Denominator bounds:  |sin(3u)·sin(2v)| ≤ 1
→ D ≥ 2 − √2 ≈ 0.586 > 0   (no singularity in domain)`}
      </pre>
      <p>
        The denominator is everywhere positive. This is what makes this
        formula numerically safe: unlike the Bryant-Kusner rational complex
        map z(1−z⁴)/(z⁶−√10·z³+1), which has three singularities at
        |z|≈0.709 inside the unit disk, the Nordstrand form needs no
        masking or domain surgery.
      </p>

      <h2>Key loci</h2>
      <p>
        Two degenerate loci in the parameter domain are important:
      </p>
      <ul>
        <li>
          <strong>u = 0 (equatorial boundary):</strong> The denominator
          becomes D = 2 (since sin(3·0) = 0). The coordinates reduce to
          x = (√2/2)cos(2v), y = (√2/2)sin(2v), z = 3/2 — a circle at
          constant height. As v runs over [0, 2π], cos(2v) and sin(2v)
          complete two cycles, so the whole boundary maps to the same circle.
          Points (0, v) and (0, v+π) map to identical 3D positions.
          This is the RP² antipodal identification made geometrically
          explicit: the equatorial boundary circle is the self-intersection
          locus of the immersion.
        </li>
        <li>
          <strong>u = π/2 (surface centre):</strong> Here cos(u) = 0, so
          x = y = z = 0 for every v. All 144 parameter-space columns
          converge to a single 3D point: the <em>triple point</em>.
          Three distinct sheets of the surface meet here without any
          tangential coincidence — each sheet passes through with a
          different tangent plane.
        </li>
      </ul>

      <h2>3-fold symmetry</h2>
      <p>
        The substitution v → v + 2π/3 does not fix the formula term-by-term,
        but the surface as a set is invariant under rotation by 2π/3 about
        the z-axis. The reason is that sin(2(v+2π/3))·sin(3u) modulates
        identically to sin(2v)·sin(3u) up to a phase, and the (cos(2v),
        sin(2v)) parts of the x and y coordinates transform exactly as a
        rotation of the xy-plane by 2π/3. The 3-fold structure is visible
        in three coloured lobes under the azimuthal HSV colouring.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`NU, NV = 72, 144           # 72 rows × 144 columns = 10,368 quads

# Parameter grid
u_eps = (π/2) / (NU+1)    # one step inset — avoid exact boundary
u = linspace(u_eps, π/2 - u_eps, NU)
v = linspace(0, 2π, NV, endpoint=False)   # periodic

U, V = meshgrid(u, v, indexing='ij')   # shape (72, 144)

D = 2.0 - √2 · sin(3U) · sin(2V)      # WHY not zero: see above

X = (√2·cos²U·cos(2V) + cos(U)·sin(U)·cos(V)) / D
Y = (√2·cos²U·sin(2V) − cos(U)·sin(U)·sin(V)) / D
Z = 3·cos²U / D

# Scale: furthest vertex at poi radius 50mm
s = 0.050 / max(√(X²+Y²+Z²))
X, Y, Z = X*s, Y*s, Z*s

# Mesh: quads with v-periodicity
face (i,j):  i·NV+j, i·NV+(j+1)%NV,
             (i+1)·NV+(j+1)%NV, (i+1)·NV+j`}
      </pre>

      <h2>Vertex colours: azimuthal HSV</h2>
      <p>
        Each vertex is coloured by its azimuthal angle φ = atan2(y, x),
        mapped through a 3× repetition: hue = (3φ/2π) mod 1. This makes
        the three 120° sectors of the Boy surface each show as a
        distinct hue (red/green/blue spectrum in thirds), and the 3-fold
        symmetry becomes immediately visible. Saturation is fixed at 0.85;
        value varies with z-height (0.40 at the triple point → 0.95 at the
        equatorial circle), giving the triple point a dark focal accent.
      </p>

      <h2>Shape keys</h2>
      <p>
        Three shape keys allow the poi head to change aspect ratio for
        different rigs without re-importing:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`SK_Oblate:  x×1.40, y×1.40, z×0.35  — flat disc for horizontal spinning
SK_Prolate: x×0.65, y×0.65, z×2.60  — elongated wand head for vertical work
SK_Tight:   uniform×0.72             — compact form for multi-head stacking`}
      </pre>

      <h2>Non-orientability in practice</h2>
      <p>
        The blueprint sets <code>mat.use_backface_culling = False</code> —
        this is not a convenience option but a topological requirement. A
        non-orientable surface has no globally consistent "inside" and
        "outside". If you enable backface culling, Blender will show patches
        of the surface that face the camera normally, and silently discard
        patches that face away — but since the surface wraps through itself,
        some regions that should be visible will be culled, and the immersion
        will appear torn.
      </p>
      <p>
        The Face Orientation overlay (blue = front normal, red = back) will
        show alternating red and blue as you orbit the surface — concrete
        visual evidence of non-orientability. A Möbius strip shows the same
        effect but has a boundary; the Boy surface has none.
      </p>

      <h2>Relationship to other surfaces in the library</h2>
      <p>
        The Boy surface connects to several areas of the studio library:
      </p>
      <ul>
        <li>
          <strong>Hopf fibration</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          >
            tutorial
          </Link>
          ): The Hopf bundle S³ → S² has fibres that are great circles;
          the quotient S³/S¹ = S² is related to the fact that RP³/S⁰ = RP².
          Both surfaces arise from the same family of fibrations on spheres.
        </li>
        <li>
          <strong>Möbius strip</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr"
          >
            tutorial
          </Link>
          ): The Möbius strip is RP² with an open disk removed — a compact,
          non-orientable surface with boundary. Boy's surface completes the
          Möbius strip by capping the boundary with a projective disk,
          yielding the full RP².
        </li>
        <li>
          <strong>TPMS / minimal surfaces</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-schwarz-p-d-gyroid-tpms-marching-tets-poi-webxr"
          >
            Gyroid tutorial
          </Link>
          ): Like Boy's surface, minimal surfaces (mean curvature H=0)
          are constructed via complex-analytic maps (Weierstrass-Enneper).
          The Bryant-Kusner parametrisation of Boy's surface uses the same
          complex-rational framework as Weierstrass-Enneper.
        </li>
        <li>
          <strong>Kummer quartic</strong> (
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-kummer-quartic-16-nodes-tetrahedral-k3-poi-head-webxr"
          >
            tutorial
          </Link>
          ): Boy's surface has algebraic degree 6 (it is a sextic variety).
          The Kummer quartic is degree 4 with 16 nodes. Both live in the
          space of degree-n algebraic varieties studied by Hilbert and
          his contemporaries around 1900.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Mesh appears torn at equatorial rim:</strong> This is the
          open boundary from the inset domain (u_eps). It is correct.
          To close it, decrease u_eps toward 0 — but near u=0 the mesh
          vertices will pile up on the self-intersection circle (two
          antipodal v-values map to the same point). Use
          <code> bmesh.ops.remove_doubles(dist=1e-4) </code> after building.
        </li>
        <li>
          <strong>Z-fighting at self-intersection:</strong> Two sheets of the
          surface pass through the same region of 3D space. Blender's
          Solid viewport will show flickering. This is geometrically correct —
          a smooth immersion in ℝ³ necessarily self-intersects. In WebXR,
          depth fighting can be reduced by adding a slight offset
          (<code>bpy.context.scene.eevee.use_ssr</code> or polygon offset).
        </li>
        <li>
          <strong>GLB morph targets missing:</strong> Ensure
          <code> export_morph=True </code> in the glTF export operator.
          Shape keys are only included in GLB when this flag is set.
        </li>
        <li>
          <strong>Denominator D too small:</strong> The minimum value of D
          is 2−√2 ≈ 0.586. If you modify the formula, ensure the denominator
          stays positive across the full domain — a sign error in sin(3u)
          or sin(2v) can make D approach zero and produce exploding vertices.
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
    "hf_boy_surface.blend",
    "hf_boy_surface.glb",
  ],
});
