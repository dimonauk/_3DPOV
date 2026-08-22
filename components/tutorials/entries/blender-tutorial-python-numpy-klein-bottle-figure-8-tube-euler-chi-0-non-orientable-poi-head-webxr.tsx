import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr";

const TITLE =
  "Python numpy — Klein Bottle: Felix Klein's 1882 Non-Orientable Surface, Figure-8 Tube Immersion in ℝ³, χ=0 Euler Characteristic, Self-Intersection Circle & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Klein bottle K is the compact non-orientable surface that sits between the two most familiar non-orientable cases: it has Euler characteristic χ=0 (same as the torus, but K is non-orientable) and it decomposes as the connected sum RP²#RP² of two projective planes. In ℝ³ it can only be immersed — never embedded — and the figure-8 tube parametrisation is the most geometrically transparent way to build that immersion: at every longitude u, the cross-section traces a figure-8 shape, passing through a central equatorial circle twice per revolution. Those two crossings (at parameter values v=0 and v=π) map to identical 3D points, producing a self-intersection circle at z=0 where two sheets of the surface coincide. This blueprint builds a 120×60 quad mesh (7 200 faces), colours vertices by longitude hue with brightness peaking at the self-intersection circle, sets use_backface_culling=False (a topological requirement, not a convenience), and adds four shape keys — including SK_Flat, which flattens the bottle to reveal the equatorial ring as a clean silhouette circle. The result is a poi head of uncommon character: non-orientable, self-intersecting, and χ=0 — the only compact surface in that cell of the classification table.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-15",
  externalSources: [
    {
      label:
        "Klein F (1882) Über Riemanns Theorie der algebraischen Funktionen und ihrer Integrale. B. G. Teubner, Leipzig. Public Domain (1882). Digitised by Google Books at archive.org/details/berriemanstheor00kleigoog — Felix Klein's 1882 monograph introduced the closed non-orientable surface now bearing his name as a Riemann surface without boundary, generalising the notion of a closed surface to non-orientable cases. Related: Riemann B (1857) Theorie der Abel'schen Functionen; Weierstrass K (1866) algebraic function theory; Schwarz H A (conformal mapping, same era); Banchoff T F (1994) computer visualisation of non-orientable surfaces in ℝ³.",
      url: "https://archive.org/details/berriemanstheor00kleigoog",
      licence: "Public Domain",
      author: "Felix Klein",
    },
    {
      label:
        "NumPy Developers (2020) Array programming with NumPy. Nature 585:357–362. BSD-3-Clause — https://numpy.org — meshgrid for the 120×60 (u,v) parameter grid; vectorised sin/cos for the figure-8 formula; ravel/tolist for from_pydata vertex and face lists; abs/max for the self-intersection proximity colour map. Related: https://github.com/numpy/numpy; SciPy for surface geodesics and differential geometry; matplotlib for parameter-space plots.",
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
        The compact surfaces — orientable and non-orientable, with and without
        boundary — are completely classified by two numbers: the orientability
        flag and the Euler characteristic. The Klein bottle K occupies the
        χ=0 slot among non-orientable surfaces. Its torus-like χ disguises a
        fundamentally different structure: the torus has H₁=ℤ⊕ℤ; K has
        H₁=ℤ⊕ℤ₂, where the ℤ₂ torsion element is the topological signature
        of its non-orientability.
      </p>

      <h2>Why the Klein bottle cannot be embedded in ℝ³</h2>
      <p>
        Whitney's theorem (1944) states that every compact non-orientable
        surface requires at least four dimensions for a smooth embedding.
        In ℝ³ you can only achieve an <em>immersion</em> — a map that is
        locally injective but globally self-intersecting. The Klein bottle
        is therefore always presented in 3D with a self-intersection locus
        where two sheets of the surface cross. This is not a failure of the
        model; it is a topological necessity.
      </p>

      <h2>The figure-8 tube construction</h2>
      <p>
        The parametrisation used in this blueprint (u, v ∈ [0, 2π)):
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`radial(u,v) = r + cos(u/2)·sin(v) − sin(u/2)·sin(2v)

x(u,v) = radial · cos(u)
y(u,v) = radial · sin(u)
z(u,v) = sin(u/2)·sin(v) + cos(u/2)·sin(2v)

r = 2.5  →  radial ≥ r − 5/4 = 1.25 > 0  (never folds through origin)`}
      </pre>
      <p>
        At each fixed u, the cross-section in the plane perpendicular to
        the main circle is traced by (v → radial·direction, z) as v runs
        from 0 to 2π. The combination <code>cos(u/2)·sin(v) − sin(u/2)·sin(2v)</code>{" "}
        oscillates in a figure-8 pattern: at v=0 and v=π it is identically
        zero, while between those zeros it swings to a positive lobe, passes
        back through zero, then swings to a negative lobe, returning to zero.
        Each zero-crossing is a point where the tube touches the equatorial
        circle.
      </p>

      <h2>Self-intersection circle: exact proof</h2>
      <p>
        At <em>v = 0</em>: sin(0) = 0, sin(0) = 0, so{" "}
        <code>radial = r</code> and <code>z = 0</code>. Point:{" "}
        <code>(r·cos u, r·sin u, 0)</code>.
      </p>
      <p>
        At <em>v = π</em>: sin(π) = 0, sin(2π) = 0, so{" "}
        <code>radial = r</code> and <code>z = 0</code>. Point:{" "}
        <code>(r·cos u, r·sin u, 0)</code>.
      </p>
      <p>
        These are identical for every u. The self-intersection locus is
        therefore the circle{" "}
        <code>&#123;(r·cos u, r·sin u, 0) : u ∈ [0, 2π)&#125;</code> — a
        circle of radius r=2.5 lying in the z=0 plane. Every point on this
        circle is the image of exactly two parameter pairs: (u, 0) and (u, π).
        In the mesh this will produce z-fighting at the equatorial band —
        a geometrically correct render artefact, not a mesh error.
      </p>

      <h2>Euler characteristic via CW-complex</h2>
      <p>
        The Klein bottle's fundamental polygon has identification word{" "}
        <code>a·b·a⁻¹·b</code>. Building the CW-complex:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`V = 1  (all four polygon corners identified to one point)
E = 2  (edges a and b, after identification)
F = 1  (the polygon interior)
χ = V − E + F = 1 − 2 + 1 = 0`}
      </pre>
      <p>
        Compare: torus T² also gives χ=0 by the same formula (word{" "}
        <code>a·b·a⁻¹·b⁻¹</code>), but T² is orientable. The sign flip on b
        is the entire topological difference between a torus and a Klein
        bottle.
      </p>

      <h2>Connected sum and relation to the Möbius band</h2>
      <p>
        K = RP²#RP² — the connected sum of two projective planes. The
        connected-sum formula for Euler characteristic:
        χ(A#B) = χ(A) + χ(B) − 2 = 1 + 1 − 2 = 0. Confirmed.
      </p>
      <p>
        Cutting K along any orientation-reversing closed curve (for instance
        the equatorial self-intersection circle in this parametrisation)
        yields exactly <em>two Möbius bands</em>. This is the physical reason
        for non-orientability: each Möbius band has a normal field that
        reverses after one traverse of its boundary, and no global extension
        exists. The{" "}
        <Link href="/tutorials/blender-tutorial-python-mathutils-mobius-strip-ntwist-parametric-mesh-webxr" className={lk}>
          Möbius strip tutorial
        </Link>{" "}
        builds that boundary geometry explicitly.
      </p>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`NU, NV = 120, 60       # 7 200 quads, both u and v wrap periodically

# Grid: both parameters periodic
u = linspace(0, 2π, NU, endpoint=False)   # 0 ... 2π − Δu
v = linspace(0, 2π, NV, endpoint=False)   # 0 ... 2π − Δv
U, V = meshgrid(u, v, indexing='ij')       # (120, 60)

# Figure-8 formula
rad = r + cos(U/2)·sin(V) − sin(U/2)·sin(2V)
X   = rad · cos(U)
Y   = rad · sin(U)
Z   = sin(U/2)·sin(V) + cos(U/2)·sin(2V)

# Scale to poi radius
scale = 0.050 / sqrt(X²+Y²+Z²).max()
X, Y, Z = X*scale, Y*scale, Z*scale

# Quad faces — periodic in both directions
face (i,j): i·NV+j, i·NV+(j+1)%NV,
            (i+1)%NU·NV+(j+1)%NV, (i+1)%NU·NV+j`}
      </pre>

      <h2>Vertex colours: equatorial self-intersection highlight</h2>
      <p>
        H = u/(2π): longitude rainbow (hue sweeps 0→1 as the main circle
        is traversed). S = 0.88 throughout. V = 1.0 − 0.60·|z/z_max|:
        maximum brightness at z=0 (the self-intersection circle), falling
        to V=0.40 at the extreme tips. This puts the most visually prominent
        region exactly at the double locus, making the topology immediately
        legible in the rendered view.
      </p>

      <h2>Non-orientability in the material</h2>
      <p>
        <code>mat.use_backface_culling = False</code> is not optional on the
        Klein bottle. Because there is no consistent outward normal, any
        patch of the surface may face the camera "from the inside" as you
        orbit. Enabling backface culling silently discards those patches —
        the surface appears to be torn, with holes that open and close as
        you rotate. The correct behaviour is to render both sides of every
        polygon regardless of facing direction.
      </p>
      <p>
        To see this effect deliberately: enable Backface Culling temporarily
        in the Material Properties panel, then orbit slowly around the
        equatorial band. You will see the surface unravel. Switch it off to
        restore the complete immersion.
      </p>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
{`Basis   — r=2.5, standard figure-8 tube  (poi scale, d=100 mm)
SK_Wide — r=4.0, wider tube (equatorial self-intersection circle is larger)
SK_Flat — z×0.25 (flat disc; equatorial ring visible in plan view as a circle)
SK_Tall — z×2.5, xy×0.55 (wand-head aspect for vertical spinning rigs)`}
      </pre>

      <h2>Comparison with related surfaces</h2>
      <p>
        The Klein bottle sits in a family the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-boy-surface-apery-rp2-immersion-3fold-poi-head-webxr" className={lk}>
          Boy surface tutorial
        </Link>{" "}
        addresses from the other side. Boy's surface is an immersion of RP²,
        which has χ=1 and is the other non-orientable closed surface without
        boundary for genus 1. The Klein bottle (χ=0) is the unique
        non-orientable surface with χ=0. Their connected sum K#RP² gives a
        non-orientable surface of χ=−1 — the next genus up.
      </p>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr" className={lk}>
          torus-knot tutorial
        </Link>{" "}
        works on the torus T², which has the same Euler characteristic χ=0
        but is orientable. The torus and the Klein bottle are therefore the
        two distinct compact surfaces with χ=0: one orientable, one not.
      </p>
      <p>
        The{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr" className={lk}>
          Hopf fibration tutorial
        </Link>{" "}
        establishes the fibre-bundle framework that underlies surface
        classification. The Klein bottle can be seen as a non-trivial
        S¹-bundle over S¹ — the structure group is ℤ₂ (orientation-reversing
        fibre automorphism), which is why the bundle is non-orientable.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Surface appears torn:</strong> Backface culling is ON.
          Set <code>mat.use_backface_culling = False</code> or untick it in
          the Material Properties panel.
        </li>
        <li>
          <strong>Z-fighting at the equatorial band:</strong> This is correct
          behaviour — two surface sheets co-occupy z≈0. You can mitigate
          it in Cycles by adding a tiny normal offset to one set of faces,
          but in the WebXR export both sheets should remain for topological
          accuracy.
        </li>
        <li>
          <strong>Shape key SK_Flat looks like two discs:</strong> The two
          sheets of the self-intersection circle are now co-planar across
          the entire disc, not just the equatorial ring. This is correct —
          SK_Flat collapses all z-height, making the double-covering visible
          across the whole disc.
        </li>
        <li>
          <strong>GLB export missing shape keys:</strong> Ensure{" "}
          <code>export_morph=True</code> in the glTF exporter. If shape keys
          are still absent, check that the basis shape key exists (Blender
          requires one named "Basis" before additional keys are exported).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  Body,
  libraryPath:
    "blends/scripting/python-numpy-klein-bottle-figure-8-tube-euler-chi-0-non-orientable-poi-head-webxr",
});
