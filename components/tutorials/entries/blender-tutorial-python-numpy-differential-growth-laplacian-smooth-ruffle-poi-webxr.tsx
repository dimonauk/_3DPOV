import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-differential-growth-laplacian-smooth-ruffle-poi-webxr";

const TITLE =
  "Python numpy — Differential Growth: Föppl-von Kármán Thin-Plate Buckling, Laplacian Smoothing (λ=0.40), Edge Refinement & Coral-Fan Ruffle Poi Disc for WebXR (Blender 5.1)";

const LEDE =
  "Differential growth is the mechanism that makes lettuce leaves ruffle, coral fans wave, and ruffle skirts pleat: a flat disc whose boundary expands faster than its interior accumulates an incompatible reference metric, and because an inextensible sheet cannot remain flat under that strain — a consequence of Gauss's Theorema Egregium — it buckles out-of-plane into saddle-shaped ruffles.  This blueprint runs 160 iterative growth steps inside Blender 5.1's bmesh API: each step pushes boundary vertices outward at 1.6 % per step and interior vertices at 0.4 % per step, applies three passes of uniform-graph Laplacian smoothing (λ = 0.40) to prevent self-intersection, then subdivides any edge exceeding 20 cm at its midpoint so mesh resolution tracks the accumulating curvature field — yielding a ~5 200-vertex ruffled disc exported as a 9.5 cm Draco-compressed WebXR poi disc.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-16",
  externalSources: [
    {
      label:
        "Jason Webb — Morphogenesis Resources: a MIT-licenced compendium of computational growth algorithms, including differential growth reference implementations, reaction-diffusion systems, space colonisation, and slime-mould transport. Related projects: n-e-r-v-o-u-s.com differential growth, inconvergent.net generative techniques.",
      url: "https://github.com/jasonwebb/morphogenesis-resources",
      licence: "MIT",
      author: "Jason Webb",
    },
    {
      label:
        "Nervous System (Jesse Louis-Rosenberg & Jessica Rosenkrantz) — Differential Growth explorations: CC0 art practice blog documenting the boundary-faster-than-interior growth technique, with discussion of the coral, leaf, and ruffle morphological analogues that motivate the algorithm.",
      url: "https://n-e-r-v-o-u-s.com/blog/?p=1830",
      licence: "CC0",
      author: "Jesse Louis-Rosenberg, Jessica Rosenkrantz (Nervous System)",
    },
    {
      label:
        "Gauss, C.F. (1827). Disquisitiones generales circa superficies curvas. Commentationes Societatis Regiae Scientiarum Gottingensis Recentiores, 6. Original statement of the Theorema Egregium — Gaussian curvature is intrinsic and preserved by isometric bending. Mathematical content public domain.",
      url: "https://gdz.sub.uni-goettingen.de/id/PPN35283028X_0006",
      licence: "Public Domain",
      author: "Carl Friedrich Gauss",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Pick up a ruffle skirt, a coral fan, or a fresh lettuce leaf and
        look at the edge.  It is longer — sometimes dramatically longer — than
        a straight line between the same two boundary points would be.  No
        fabric was gathered or pleated; no skeleton forced the shape.  The
        ruffle is the only geometrically consistent way for the boundary to
        <em> be</em> that long while the interior remains the size it is.
        That mismatch between desired boundary length and achievable flat
        geometry is <em>differential growth</em>, and Blender&apos;s bmesh
        API can simulate it in a few hundred lines of Python.
      </p>

      <h2>The Theorema Egregium — why ruffles are inevitable</h2>
      <p>
        Gauss proved in 1827 that Gaussian curvature K = κ₁·κ₂ is an
        intrinsic property of a surface — it depends only on distances measured
        within the surface, not on how the surface sits in space.  The
        Theorema Egregium (remarkable theorem) says: you cannot change K by
        bending without stretching.  A flat piece of paper has K = 0
        everywhere; roll it into a cylinder and K stays 0 because rolling is
        an isometric bending.  But try to wrap it around a sphere (K = 1/R²
        &gt; 0) without cutting or stretching — it is impossible.
      </p>
      <p>
        Differential growth creates an incompatible metric: after boundary
        vertices have expanded faster than interior vertices for many steps,
        the surface&apos;s intrinsic distances encode negative Gaussian curvature
        at the rim (saddle geometry).  By Gauss-Bonnet, ∫_M K dA = 2π·χ; the
        total curvature integral is topologically fixed.  To accommodate the
        negative-K rim, the interior must bulge with compensating positive K —
        and the only way to embed this curved metric in ℝ³ consistently is to
        buckle out-of-plane.
      </p>
      <pre>{`Gauss-Bonnet (open disc, χ = 1):
  ∫∫_M  K dA  +  ∮_∂M  κ_g ds  =  2π

Fast boundary growth → κ_g (geodesic curvature of rim) decreases
→ K interior must rise (positive) to compensate
→ surface buckles to embed the positive K: ruffle!`}</pre>

      <h2>The discrete algorithm</h2>
      <p>
        The simulation runs entirely inside Blender&apos;s{" "}
        <code>bmesh</code> module — no physics engine, no external solver.
        Each of the 160 steps has three phases:
      </p>

      <h3>Phase 1 — Growth</h3>
      <p>
        For every edge (v₀, v₁), compute a growth delta proportional to the
        edge length L and the average growth rate of its two vertices:
      </p>
      <pre>{`g_edge = (g(v0) + g(v1)) / 2        # boundary = 0.016, interior = 0.004
delta  = unit_vector(v1→v0) × L × g_edge × 0.5
v0.co -= delta    # v0 moves away from v1
v1.co += delta    # v1 moves away from v0`}</pre>
      <p>
        Equal-and-opposite displacements conserve the mesh centroid — without
        this, 160 iterations of unbalanced forces would drift the poi head
        metres away from the origin.  Using the <em>edge-average</em> growth
        rate (rather than per-vertex) ensures smooth transitions between
        boundary and interior regions.
      </p>

      <h3>Phase 2 — Laplacian smoothing (×3)</h3>
      <p>
        Three passes of uniform-graph Laplacian smoothing prevent
        self-intersection and keep vertex distribution even as the mesh
        expands:
      </p>
      <pre>{`centroid_i = (1/|N(i)|) Σ_{j∈N(i)} v_j
v_i ← lerp(v_i, centroid_i, λ)   λ = 0.40`}</pre>
      <p>
        <strong>Uniform vs cotangent weights:</strong> cotangent Laplacians
        (used in Crane&apos;s conformal curvature flow — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
          className={lk}
        >
          cotangent Laplacian fairing tutorial
        </Link>
        ) give more geometrically accurate curvature flow but require
        recomputing triangle angles every step (O(V + F)).  For differential
        growth the goal is vertex distribution quality, not curvature
        accuracy, so uniform weights at O(V + E) are sufficient.
      </p>
      <p>
        λ = 0.40 is chosen deliberately below 0.50: values above 0.50 over-damp
        the ruffle amplitude (the mesh converges to a dome); values above 0.80
        on a non-manifold mesh can produce oscillatory instability.
      </p>

      <h3>Phase 3 — Edge refinement</h3>
      <p>
        Growth lengthens edges; after many steps, large triangles alias the
        curvature field.  Any edge exceeding <code>MAX_EDGE_LEN = 0.20 m</code>{" "}
        is subdivided at its midpoint:
      </p>
      <pre>{`long_edges = [e for e in bm.edges if e.calc_length() > MAX_EDGE_LEN]
bmesh.ops.subdivide_edges(bm, edges=long_edges,
                           cuts=1, use_grid_fill=True)
# re-triangulate any quads produced by grid fill`}</pre>
      <p>
        <code>bmesh.ops.subdivide_edges</code> is the correct operator here
        — not <code>bm.edges[i].split()</code> which is a lower-level call
        that does not update adjacent faces.  The <code>use_grid_fill=True</code>{" "}
        flag re-triangulates incident quads, keeping the mesh homogeneously
        triangulated and preventing long thin slivers.
      </p>

      <h2>Growth ratio and ruffle count</h2>
      <p>
        The key parameter is{" "}
        <strong>GROWTH_BOUNDARY / GROWTH_INTERIOR = 4</strong>.  This ratio
        determines the ruffle count (number of lobes) and amplitude:
      </p>
      <pre>{`ratio 2:   gentle convex dome, 3–4 shallow lobes
ratio 4:   6–8 distinct ruffles, coral-fan profile   ← this blueprint
ratio 6:   10+ tight ruffles, high amplitude
ratio >8:  instability — mesh folds through itself`}</pre>
      <p>
        The instability at high ratios arises because growth outruns the
        Laplacian&apos;s ability to regularise vertex positions — the
        Courant-Friedrichs-Lewy condition for this explicit scheme requires
        growth_rate × SMOOTH_ITERS × λ &lt; 1 approximately.
      </p>

      <h2>Morphogenesis connections</h2>
      <p>
        Differential growth is how biological tissues create complex 3-D shapes
        from flat precursors.  The brain cortex folds because the outer cortical
        layer (grey matter) grows faster than the underlying white matter — the
        resulting buckling instability creates gyri and sulci.  Leaf margins
        ruffle because epidermal cells at the edge divide more rapidly than
        mesophyll cells in the interior.  The Föppl-von Kármán equations
        (1904–1907) describe this quantitatively for thin elastic sheets:
      </p>
      <pre>{`Föppl-von Kármán plate equations (dimensionless form):
  Δ²w  =  [φ, w]                 (vertical equilibrium)
  Δ²φ  = −½ [w, w] − m(x,y)     (compatibility + growth metric m)
where [f, g] = f_xx g_yy − 2 f_xy g_xy + f_yy g_xx (Monge-Ampère bracket)
      w = out-of-plane deflection, φ = Airy stress function`}</pre>
      <p>
        Our simulation is the discrete, quasi-static analogue of this PDE
        system: the growth step accumulates strain (changing the reference
        metric), and the Laplacian smoothing + edge refinement enforce the
        compatibility constraint (keeping the embedding in ℝ³).
      </p>
      <p>
        This tutorial is the morphogenesis companion to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-morphogenesis-poi-sphere-webxr"
          className={lk}
        >
          Gray-Scott reaction-diffusion tutorial
        </Link>{" "}
        — that entry handles the chemical patterning that triggers
        differential growth in real tissue; this entry handles the mechanical
        consequence.  Together they span the full Turing morphogenesis story.
      </p>

      <h2>Material — coral gradient</h2>
      <p>
        The material maps world Z-height through a three-stop colour ramp
        (magenta → cream → cyan) to highlight the wave amplitude visually.
        The ramp uses <code>CARDINAL</code> interpolation (C-spline) for
        smooth gradients — <code>EASE</code> or <code>LINEAR</code> produce
        harsher banding.  Roughness = 0.65 gives a matte surface that reads
        well in both WebXR and Eevee viewport.
      </p>

      <h2>Why boundary detection matters</h2>
      <p>
        The growth weight <code>g_i</code> is determined by whether a vertex is
        on the boundary of the open disc.  After each edge-refinement pass, new
        midpoint vertices on boundary edges inherit boundary status — correctly,
        because the disc remains open throughout the simulation.  The detection
        uses <code>edge.is_boundary</code> (True when{" "}
        <code>len(edge.link_faces) == 1</code>) rather than checking the initial
        vertex ring: as the mesh refines, which vertices are on the rim
        changes, and recomputing from edge topology each step is essential.
      </p>
      <p>
        If you forget to recompute the boundary set after refinement,
        new rim vertices are treated as interior vertices and growth stalls —
        the ruffle amplitude plateaus after ~40 steps.  Always call{" "}
        <code>get_boundary_verts(bm)</code> inside the loop, after{" "}
        <code>bm.from_mesh(me)</code>.
      </p>

      <h2>Related studio work</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gauss-bonnet-angle-defect-discrete-curvature-torus-poi-webxr"
            className={lk}
          >
            Discrete Gaussian Curvature & Gauss-Bonnet
          </Link>{" "}
          — angle defect δ_v = 2π − Σθᵢ, the discrete K used in this
          tutorial&apos;s theoretical motivation
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-cotangent-laplacian-mesh-fairing-dirichlet-energy-vrm-webxr"
            className={lk}
          >
            Cotangent Laplacian Mesh Fairing
          </Link>{" "}
          — the more geometrically accurate Laplacian; understand the
          trade-off before choosing uniform vs cotangent weights
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-space-colonisation-algorithm-branching-coral-webxr"
            className={lk}
          >
            Space Colonisation Algorithm — Branching Coral
          </Link>{" "}
          — agent-based coral growth; complement this surface-based ruffle
          approach with volumetric branching to build a full coral scene
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <pre>{`Symptom: mesh folds through itself after ~30 steps
Fix:     reduce GROWTH_BOUNDARY to 0.012 or increase SMOOTH_ITERS to 4

Symptom: ruffle amplitude too low (looks like a shallow dome)
Fix:     increase GROWTH_BOUNDARY to 0.020 or reduce SMOOTH_FACTOR to 0.30

Symptom: vertex count explodes (> 50 000)
Fix:     increase MAX_EDGE_LEN to 0.28 — fewer splits per step

Symptom: export GLB is flat (no Z variation)
Fix:     check SEED_NOISE > 0 — without asymmetry the growth is radial

Blender 5.1 note:
  bmesh.ops.subdivide_edges keyword 'use_grid_fill' is stable in 5.1.
  In Blender 4.x the keyword was 'use_quadfill' — if porting back,
  change accordingly (or check bpy.app.version).`}</pre>
    </>
  );
}

export const entry: Entry = buildInstructable({
  ...data,
  slug: SLUG,
  body: <Body />,
  libraryPath: `/library/blends/scripting/${SLUG.replace("blender-tutorial-", "")}/blueprint.py`,
});
