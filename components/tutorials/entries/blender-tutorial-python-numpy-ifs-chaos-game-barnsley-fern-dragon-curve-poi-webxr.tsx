import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-ifs-chaos-game-barnsley-fern-dragon-curve-poi-webxr";

const TITLE =
  "Python numpy — IFS Chaos Game: Barnsley Fern, Sierpinski Triangle & 3D Dragon Curve as Poi Light-Trail NURBS for WebXR (Blender 5.1)";

const LEDE =
  "An Iterated Function System (IFS) is a finite set of contractive affine maps {f₁,…,fₙ} whose unique compact attractor A (Hutchinson 1981) satisfies A = ⋃fᵢ(A). The chaos game samples A stochastically: choose rule k with probability p(k) ∝ |det fₖ|, apply xₙ₊₁ = fₖ(xₙ), and discard the warm-up transient — every subsequent point lies on A almost surely (Elton's ergodic theorem 1987). Because each fₖ is contractive, consecutive points in the walk are bounded-distance neighbours, so windows of CHUNK_SIZE = 150 points form coherent brushstroke paths that become NURBS splines directly — no KD-tree sort needed. This tutorial implements three IFS attractors (Barnsley Fern, Sierpinski Triangle, Dragon Curve), extends the Dragon to 3D by accumulating a Z offset per step, exports three Draco-6 GLBs for WebXR, and explains why the chaos game is ergodic and why the brushstroke-curve technique works.";

function Body() {
  return (
    <>
      <p>
        The Iterated Function System was introduced by Hutchinson (1981) and
        popularised by Barnsley (1988) as a method for encoding self-similar
        geometry in a handful of affine transforms. Where an L-system grows
        structure by string rewriting (see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-l-system-lindenmayer-turtle3d-coral-webxr"
          className={lk}
        >
          L-system coral tutorial
        </Link>
        ), an IFS defines structure by contraction: each map{" "}
        <code>fᵢ</code> shrinks and repositions the entire attractor, and the
        attractor is the unique shape that is invariant under the whole
        collection of maps. The DLA dendritic crystal (see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-dla-diffusion-limited-aggregation-dendritic-crystal-webxr"
          className={lk}
        >
          the DLA tutorial
        </Link>
        ) also produces fractal branching, but via a stochastic growth process
        rather than deterministic contraction — the two algorithms look similar
        but generate structurally different attractors.
      </p>

      <h2>Hutchinson operator and why uniqueness is guaranteed</h2>
      <p>
        Define the Hutchinson operator <code>H</code> on the space of
        non-empty compact subsets of ℝᵈ (equipped with the Hausdorff metric{" "}
        <code>d_H</code>) by <code>H(S) = f₁(S) ∪ … ∪ fₙ(S)</code>.
        Because each <code>fᵢ</code> is a contraction with Lipschitz constant{" "}
        <code>cᵢ &lt; 1</code>, the Hausdorff metric of{" "}
        <code>H(S)</code> from <code>H(T)</code> satisfies
        <code> d_H(H(S), H(T)) ≤ max(cᵢ) · d_H(S, T)</code>. So{" "}
        <code>H</code> is itself a contraction on the complete metric space of
        compact subsets, and Banach&apos;s fixed-point theorem gives a unique
        fixed point: the attractor <code>A</code>. Starting from any non-empty
        compact set (a single point works) and iterating{" "}
        <code>Hⁿ(S)</code> converges to <code>A</code> geometrically.
      </p>
      <p>
        The chaos game provides a faster route. Elton&apos;s ergodic theorem
        (1987) guarantees that if the probabilities <code>p(k)</code> are
        strictly positive, the time-average of any continuous function along the
        orbit converges to the space-average over <code>A</code> — i.e. the
        orbit is dense in <code>A</code>. In practice this means that after a
        short warm-up (50 steps here) every point is, to floating-point
        precision, on the attractor.
      </p>

      <h2>Why probability weights equal |det fₖ|</h2>
      <p>
        Barnsley observed that setting <code>p(k) ∝ |det fₖ|</code> makes the
        chaos game sample <code>A</code> according to the natural{" "}
        <em>invariant measure</em> — the distribution that is itself invariant
        under the IFS. For the Barnsley Fern the four determinants are
        approximately 0 (stem maps everything to a line segment), 0.7225
        (largest leaflet, most area), 0.100 and 0.100 (left and right
        sub-leaflets). Renormalising gives the classic{" "}
        <code>[0.01, 0.85, 0.07, 0.07]</code> weights. If you assign equal
        probability to all four transforms, the stem and leaflets are
        equally sampled and the fern looks wrong — points cluster on the stem.
      </p>

      <h2>Brushstroke curves without KD-tree sorting</h2>
      <p>
        A crucial observation for Blender integration: consecutive chaos-game
        points are always close neighbours. For a contractive IFS with maximum
        Lipschitz constant <code>L &lt; 1</code>, the distance
        <code> |xₙ₊₁ − xₙ| = |fₖ(xₙ) − xₙ| ≤ diam(A) + L·|xₙ|</code>
        is bounded above by a constant determined by the attractor diameter and{" "}
        <code>L</code>. This means each CHUNK_SIZE window of consecutive points
        is a locally coherent path on the attractor — suitable for fitting as a
        NURBS spline. Contrast this with the Biot-Savart field-line tracer (see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr"
          className={lk}
        >
          the Biot-Savart tutorial
        </Link>
        ), which requires explicit RK4 integration along the field to get
        ordered points, or the points-to-curves pipeline (see{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          the Points to Curves tutorial
        </Link>
        ) which requires a nearest-neighbour sort. The IFS chaos game is unique
        in delivering ordered brushstroke points for free.
      </p>

      <h2>The Dragon Curve in 3D</h2>
      <p>
        The 2D Dragon Curve IFS uses two maps with determinant 0.5 each (equal
        probability). Its 2D attractor tiles the plane under reflections and
        looks like a crumpled, self-intersecting boundary. To make it useful for
        poi light trails, blueprint.py adds a fixed <code>Z_HELIX_PER_STEP</code>{" "}
        to <code>z</code> on every iteration. Because the Z component only
        accumulates (never contracts), the Dragon Curve&apos;s fractal complexity
        lives entirely in the XY cross-section — any horizontal slice of the 3D
        object reveals the 2D attractor. The overall shape is a helical column
        that reads as a poi orbit trail when viewed from the side.
      </p>

      <h2>NURBS vs Bezier for brushstroke curves</h2>
      <p>
        The blueprint uses NURBS <code>&quot;NURBS&quot;</code> splines rather
        than Bezier curves because NURBS require only one homogeneous control
        point per input point: each <code>sp.points[j].co = (x, y, z, 1.0)</code>{" "}
        sets position and weight directly. Bezier control points require two
        additional handle points (left and right) per vertex. For 30,000 IFS
        points divided into 150-point chunks, setting handles automatically
        with <code>bpy.ops.curve.handle_type_set</code> would require an
        operator context for each spline — expensive and fragile. NURBS with
        order 4 and <code>use_endpoint_u = True</code> gives a C² smooth curve
        that passes through the first and last control points (clamped), which
        is the right behaviour for open brushstroke segments that should not loop
        back to their start.
      </p>

      <h2>Blender bevel depth and emission</h2>
      <p>
        Each Curves data block has <code>bevel_depth = 0.003 m</code> and{" "}
        <code>bevel_resolution = 2</code> — this produces a 6-sided tube around
        the curve without adding a separate Bevel Object. The emission material
        has no diffuse component; in EEVEE Next with bloom enabled, the emissive
        tubes produce the poi light-painting glow effect at zero render-time cost.
        Exporting with <code>export_apply = True</code> bakes the bevel geometry
        into the GLB mesh, which Three.js and A-Frame can render without any
        Blender-specific curve support.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Barnsley, Michael F.</strong> &ldquo;Fractals Everywhere.&rdquo;{" "}
          Academic Press, 1988. The Barnsley Fern IFS parameters (stem: [0, 0, 0,
          0.16, 0, 0], leaflets: [0.85, 0.04, −0.04, 0.85, 0, 1.6], etc.) are
          mathematical constants in the public domain.{" "}
          <a
            href="https://www.sciencedirect.com/book/9780120790692/fractals-everywhere"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Publisher page
          </a>
          . Related: Barnsley&apos;s iterated function systems are now widely
          implemented; see the Wikipedia{" "}
          <a
            href="https://en.wikipedia.org/wiki/Iterated_function_system"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Iterated function system
          </a>{" "}
          article (CC-BY-SA 4.0) and the companion{" "}
          <a
            href="https://en.wikipedia.org/wiki/Barnsley_fern"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            Barnsley fern
          </a>{" "}
          article for the exact parameter table.
        </li>
        <li>
          <strong>Elert, Glenn.</strong> &ldquo;The Chaos Hypertextbook.&rdquo;{" "}
          Free educational resource.{" "}
          <a
            href="https://hypertextbook.com/chaos/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            hypertextbook.com/chaos
          </a>
          . Covers the chaos game, IFS theory, fractal dimension, and Barnsley&apos;s
          collage theorem in accessible depth. Related: see the companion
          physics hypertextbook at{" "}
          <a
            href="https://physics.info/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            physics.info
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const blenderTutorialPythonNumpyIfsChaosGameBarnsleyFernDragonCurvePoiWebxrEntry: Entry =
  buildInstructable(
    {
      blenderVersion: "5.1",
      difficulty: "advanced",
      time: "1–2 hours",
      prerequisites: [
        "Python bpy API — bpy.data.curves, bpy.data.objects, bpy.ops.export_scene.gltf",
        "NumPy basics — array slicing, np.searchsorted, np.cumsum",
        "Blender NURBS curve data model — splines, control points, bevel depth",
      ],
      software: [
        {
          name: "Blender",
          version: "≥ 5.1",
          url: "https://www.blender.org/download/",
          cost: "free",
          platforms: ["windows", "macos", "linux"],
        },
      ],
      steps: [
        {
          title: "Run blueprint.py in the Scripting workspace",
          body: "Open the Scripting workspace. New text block → paste blueprint.py contents → Run Script. The Python console should print '[hf_ifs] Scene built — Barnsley Fern · Sierpinski · Dragon 3D' plus three export lines. Three curve objects appear side-by-side: hf_ifs_fern (green), hf_ifs_sierpinski (orange), hf_ifs_dragon (blue-purple).",
        },
        {
          title: "Verify spline count in the Spreadsheet Editor",
          body: "Select hf_ifs_fern. Open the Spreadsheet Editor and set the domain to Spline. You should see 200 rows (30,000 points / 150 per chunk). Each row is one NURBS brushstroke. There are no attributes stored — the IFS positions live in spline.points[*].co directly.",
          code: `# Verify from Python:
obj = bpy.data.objects["hf_ifs_fern"]
n_splines = len(obj.data.splines)
n_points  = sum(len(sp.points) for sp in obj.data.splines)
print(f"{n_splines} splines, {n_points} control points")
# Expected: 200 splines, 30000 control points`,
        },
        {
          title: "Inspect the fern structure in Material Preview",
          body: "Switch the viewport shading to Material Preview (Z → 2 or the shading ball icon). Enable the Scene Lights and Scene World toggles off so only the emission materials are visible. The fern shape should be recognisable: a dense vertical column (stem, f₁) with spreading leaflets. Press Numpad 4/6 to orbit. The top of the fern is where the leaflet maps concentrate points most densely.",
        },
        {
          title: "Adjust N_POINTS and observe convergence",
          body: "Change N_POINTS from 30_000 to 3_000 at the top of the script and re-run. The attractor is still recognisably a fern at 3,000 points, but gaps appear in the leaflets. Increase to 100_000 to get a fully dense fern with no visible gaps. This demonstrates that the chaos game approximates A arbitrarily well — more iterations → better approximation. The WARM_UP constant (50 steps) prevents the initial transient from polluting the first spline.",
        },
        {
          title: "View the Dragon Curve from the side",
          body: "Select hf_ifs_dragon. Press Numpad 4 to get the front view. You should see the blue helical column. Press Numpad 3 (right side view) to see the XY cross-section — it looks like a jagged, self-similar curve rather than a smooth helix. This is the 2-D Dragon Curve attractor embedded in the helix cross-section. Press Numpad 1 (front) and orbit diagonally to see the 3-D structure.",
          code: `# Measure the helix height:
import bpy, numpy as np
obj = bpy.data.objects["hf_ifs_dragon"]
zs = []
for sp in obj.data.splines:
    zs.extend(p.co[2] for p in sp.points)
print(f"Z range: {min(zs):.3f} to {max(zs):.3f} m")
# Expected: ~ 0.0 to (N_POINTS * Z_HELIX_PER_STEP * SCALE)
# = 30000 * 0.004 * 0.10 = 12.0 m`,
        },
        {
          title: "Export the GLBs and verify in a viewer",
          body: "If EXPORT_GLB = True the script exports automatically. To re-export manually: File → Export → glTF 2.0, Draco L6, Apply Modifiers. Open hf_ifs_fern.glb at gltf.report — the mesh count should be 200 (one sub-mesh per baked NURBS tube). WebXR viewers that support emissive materials will display the fractal glow correctly.",
        },
      ],
      variations: [
        "Replace the Dragon Curve with the Koch Snowflake IFS: three maps that each scale by 1/3 and place a smaller copy on a triangle. Run chaos_game with those rules and set z_per_step=0 — the 2-D snowflake emerges automatically. Add Z_PER_STEP = 0.002 to get a rising spiral snowflake for poi use.",
        "Add a fourth parameter to each NURBS control point: the 'w' (weight) component. Instead of w=1.0 for all points, set w proportional to the iteration index within the chunk — this distorts the NURBS curve toward the most-recently-visited part of the attractor, creating a trailing-off taper effect on each brushstroke. Useful for conveying directionality in poi light-painting animations.",
        "Drive BEVEL_DEPTH by the local density of the attractor: count how many other points fall within a radius r of each point (ε-neighbourhood counting). Dense regions (the stem, the leaflet tips) get thinner tubes; sparse regions get thicker tubes. This approximates the local dimension of the attractor and makes the structural hierarchy of the IFS visually legible.",
        "Export all three fractals into a single GLB scene with a GLTF animation that morphs the fern brushstroke lengths using shape keys. Add shape_key_data on the curve-baked mesh for the zero-length state (a line) and the full-length state; animate the shape_key value from 0 to 1 over 60 frames for a growth-reveal effect on the WebXR page.",
        "Create a hybrid IFS where the transform selection is deterministic (de Bruijn sequence) rather than random. A de Bruijn sequence of order n over the alphabet {0,…,K-1} visits every K-length subsequence exactly once. This makes the chaos-game walk systematic rather than stochastic — the attractor emerges in a structured order that reads well as a screen-recording for tutorial purposes.",
      ],
      troubleshooting: [
        {
          symptom: "Script finishes but no objects appear in the viewport",
          cause:
            "bpy.context.scene.collection may not be the active collection if the Scripting workspace has a different active collection selected.",
          fix: "Add bpy.context.view_layer.active_layer_collection = bpy.context.view_layer.layer_collection before the first make_curves() call to ensure objects are linked to the root scene collection.",
        },
        {
          symptom: "GLB export fails with 'No active object'",
          cause:
            "export_glb() calls bpy.ops.export_scene.gltf which requires an active object in the scene. The object was selected but context.view_layer.objects.active was not set.",
          fix: "The blueprint already sets bpy.context.view_layer.objects.active = obj before each export. If running the export step manually, also call bpy.ops.object.select_all(action='DESELECT') first to ensure only the target is selected.",
        },
        {
          symptom: "Fern looks like noise — leaflet structure is not recognisable",
          cause:
            "The Y↔Z axis swap (fern_pts = fern_pts[:, [0, 2, 1]]) was not applied, so the fern is lying flat in the XY plane instead of standing up.",
          fix: "Check that line 'fern_pts = fern_pts[:, [0, 2, 1]]' is present after the chaos_game() call. Without it the fern's height axis maps to Blender Y (horizontal in the default front view).",
        },
        {
          symptom: "NURBS tubes show sharp kinks at chunk boundaries",
          cause:
            "Each chunk starts at a new point in the attractor walk; the last point of chunk N and the first point of chunk N+1 may be far apart if the chaos-game chose a long-range map at the boundary.",
          fix: "Increase CHUNK_SIZE — longer chunks mean more smoothing from the NURBS order-4 fit within each spline, and the kink gap only appears at chunk boundaries. Alternatively, set sp.use_cyclic_u = True per spline to loop the NURBS, which eliminates end-point discontinuities but changes the visual reading.",
        },
        {
          symptom: "Emission material not appearing in GLB viewport",
          cause:
            "glTF 2.0 emission requires KHR_materials_emissive_strength extension for values above 1.0. Some WebXR runtimes cap emission at 1.0.",
          fix: "In the material setup, reduce em.inputs['Strength'].default_value to 1.0 and compensate with a brighter colour (e.g. (0.2, 1.0, 0.3) → (0.5, 2.5, 0.7) clamped to [0,1]). The Blender glTF exporter includes KHR_materials_emissive_strength automatically when Strength > 1.0.",
        },
      ],
      voiceMode: "aura",
    },
    {
      slug: SLUG,
      title: TITLE,
      date: "2026-07-31",
      kind: "tutorial",
      excerpt: LEDE,
      tags: [
        "blender",
        "python",
        "numpy",
        "fractal",
        "ifs",
        "chaos-game",
        "barnsley-fern",
        "dragon-curve",
        "sierpinski",
        "nurbs",
        "webxr",
        "poi",
        "light-painting",
        "procedural",
      ],
      Body,
    },
  );

export const entry =
  blenderTutorialPythonNumpyIfsChaosGameBarnsleyFernDragonCurvePoiWebxrEntry;
