import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <strong>VertexWeightEditModifier</strong> remaps an existing vertex
        group through a custom curve, and{" "}
        <strong>VertexWeightMixModifier</strong> blends two groups per-vertex
        using arithmetic modes such as MULTIPLY, MINIMUM, or AVERAGE. Together
        they form the canonical weight-pipeline pattern: acquire raw weights
        from geometry or proximity, refine the falloff with a curve, then
        combine with an art-directed mask — all without touching the underlying
        mesh.
      </p>
      <p>
        This tutorial builds a faceted VRM pauldron whose cloth pinning is
        controlled by exactly that pipeline: a height-based proximity gradient
        sharpened by an S-curve, then multiplied against a hand-painted rim
        stripe to produce a clean, narrow pin band at the shoulder contact
        zone.
      </p>

      <h2>Why the S-curve matters</h2>
      <p>
        A raw linear proximity gradient leaves the mid-height vertices at
        weight ≈ 0.5 — half-pinned, which produces cloth that sags awkwardly
        rather than draping cleanly. An S-curve with steep inflections at 0.3
        and 0.7 snaps those mid values: weights below 0.3 collapse toward zero
        (free to simulate), weights above 0.7 clamp toward one (rigidly
        pinned), and only a thin band at the shoulder edge transitions between
        the two states. The result is cloth that behaves like a real garment
        rather than a rubber sheet.
      </p>
      <pre><code>{`mod = ob.modifiers.new("VWEdit", "VERTEX_WEIGHT_EDIT")
mod.vertex_group  = "shoulder_prox"
mod.falloff_type  = 'CURVE'   # activates mod.map_curve

cm  = mod.map_curve            # bpy.types.CurveMapping
c   = cm.curves[0]             # weight channel
pts = c.points

# Default curve: (0,0) and (1,1) — reposition them
pts[0].location = (0.0, 0.0)
pts[1].location = (1.0, 1.0)

# S-curve inflection points
lo = pts.new(0.30, 0.05)
lo.handle_type = 'AUTO_CLAMPED'
hi = pts.new(0.70, 0.95)
hi.handle_type = 'AUTO_CLAMPED'

cm.update()   # REQUIRED — stale handles otherwise`}</code></pre>

      <h2>CurveMapping gotchas</h2>
      <p>
        Three issues trip up almost every first attempt with{" "}
        <code>map_curve</code>:
      </p>
      <ul>
        <li>
          <strong>Forgetting <code>cm.update()</code></strong> — Adding or
          moving points in Python does not automatically rebuild the internal
          spline coefficients. Call <code>mod.map_curve.update()</code> after
          every batch of changes or the modifier evaluates the old cached
          shape.
        </li>
        <li>
          <strong>Handle type defaults to AUTO, not AUTO_CLAMPED</strong> —
          AUTO handles can produce overshoots above 1.0 or below 0.0 when
          the curve has steep inflections, yielding negative weights or
          weights above one that cloth cannot interpret. Always set{" "}
          <code>AUTO_CLAMPED</code> on the inner control points.
        </li>
        <li>
          <strong>curves[0] only</strong> — The weight modifier uses only
          the first curve channel. Indices 1, 2, 3 are reserved for colour
          texture masking and have no effect on weight output.
        </li>
      </ul>

      <h2>VertexWeightMixModifier — blending into a separate result group</h2>
      <p>
        By default, VertexWeightMixModifier <em>overwrites</em> the primary
        group in-place. Set <code>result_vertex_group</code> to a third group
        name and both input groups are left intact, which is essential for
        debugging and iterating on the falloff without losing the intermediate
        state.
      </p>
      <pre><code>{`mod = ob.modifiers.new("VWMix", "VERTEX_WEIGHT_MIX")
mod.vertex_group_a      = "shoulder_prox"   # S-curve remapped values
mod.vertex_group_b      = "cloth_pin"       # hand-painted rim stripe
mod.default_weight_a    = 0.0
mod.default_weight_b    = 0.0
mod.mix_mode            = 'MULTIPLY'        # result = a × b per vertex
mod.mix_set             = 'OR'             # all vertices in a OR b
mod.result_vertex_group = "cloth_result"   # writes here, not into group_a`}</code></pre>

      <h2>mix_mode reference</h2>
      <p>
        The seven blend modes map to standard compositing operations applied
        per-vertex in the float [0, 1] weight domain:
      </p>
      <ul>
        <li>
          <code>MULTIPLY</code> — a × b. Strong values only survive where both
          groups are high. Ideal for combining automated proximity with
          hand-painted masks.
        </li>
        <li>
          <code>MINIMUM</code> — min(a, b). Conservative; result is always ≤
          both inputs. Useful for preventing overdriven cloth pins.
        </li>
        <li>
          <code>REPLACE</code> — b replaces a entirely. Group_a weights are
          ignored; only group_b values are written. Use when group_b is a
          corrective override.
        </li>
        <li>
          <code>ADD</code> — a + b, clamped to 1.0 after normalisation.
          Accumulates weight from multiple sources; tends to produce
          uniformly high values.
        </li>
        <li>
          <code>AVERAGE</code> — (a + b) / 2. Softens both groups toward a
          moderate value; useful when two equally-trusted sources disagree.
        </li>
      </ul>

      <h2>mix_set — which vertices are affected</h2>
      <p>
        <code>mix_set</code> controls the vertex domain:
      </p>
      <ul>
        <li>
          <code>ALL</code> — every vertex, with{" "}
          <code>default_weight_a/b</code> for absent vertices. Can flood the
          result group with zero-weight entries on unrelated geometry.
        </li>
        <li>
          <code>OR</code> — vertices present in either group (union). Safe
          default when groups partially overlap.
        </li>
        <li>
          <code>AND</code> — only vertices present in both groups
          (intersection). Prevents writing to vertices outside the
          intentional overlap zone.
        </li>
        <li>
          <code>A</code> / <code>B</code> — restrict to one source group
          only. Useful for one-sided corrections.
        </li>
      </ul>

      <h2>Modifier stack order</h2>
      <p>
        VertexWeightEditModifier must precede VertexWeightMixModifier in the
        stack if the mix reads the remapped group. Because Blender evaluates
        Modify modifiers top-to-bottom before physics, swapping the order
        causes VWMix to see raw pre-remap weights rather than the S-curve
        output — a subtle bug that produces correct-looking but wrong weight
        distribution.
      </p>
      <p>
        The full production stack for a VRM cloth garment looks like this:
      </p>
      <pre><code>{`[1] VertexWeightProximityModifier  → writes shoulder_prox (raw distance)
[2] VertexWeightEditModifier        → remaps shoulder_prox via S-curve
[3] VertexWeightMixModifier         → MULTIPLY → cloth_result
[4] ClothModifier                   → pin_group = cloth_result`}</code></pre>

      <h2>Debug visualisation</h2>
      <p>
        Reading <code>cloth_result</code> weights back via the depsgraph and
        encoding them as vertex colour is the fastest way to confirm the
        modifier chain is behaving as intended, without running a cloth
        simulation:
      </p>
      <pre><code>{`dg    = bpy.context.evaluated_depsgraph_get()
ob_ev = ob.evaluated_get(dg)
vg_idx = ob_ev.vertex_groups["cloth_result"].index

weights = {}
for v in ob_ev.data.vertices:
    for g in v.groups:
        if g.group == vg_idx:
            weights[v.index] = g.weight
            break

ob.data.color_attributes.new("debug", "FLOAT_COLOR", "CORNER")
attr = ob.data.color_attributes["debug"]
for loop in ob.data.loops:
    w = weights.get(loop.vertex_index, 0.0)
    attr.data[loop.index].color = (w, 1.0 - w, 0.2, 1.0)  # green→red`}</code></pre>

      <h2>Cross-references</h2>
      <p>
        For the upstream proximity modifier that feeds this pipeline, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-vertex-weight-proximity-modifier-distance-mask-physics-vrm"
          className={lk}
        >
          VertexWeightProximityModifier tutorial
        </Link>
        . For the cloth modifier that consumes the result, see{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-surface-deform-vrm-cloth-binding"
          className={lk}
        >
          SurfaceDeformModifier — VRM cloth binding
        </Link>
        . For VRM deformation envelope weight painting, see{" "}
        <Link
          href="/tutorials/blender-tutorial-weight-paint-vrm-deformation-envelope"
          className={lk}
        >
          Weight Paint — VRM deformation envelope
        </Link>
        . For the shell geometry used in this prop, see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-solidify-modifier-shell-rim-complex-mode-hard-surface-webxr"
          className={lk}
        >
          SolidifyModifier — Shell & Rim
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/5.1/bpy.types.VertexWeightEditModifier.html"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            bpy.types.VertexWeightEditModifier (5.1)
          </a>{" "}
          — CC-BY-SA-4.0. Related project:{" "}
          <a
            href="https://projects.blender.org/blender/blender"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            blender/blender
          </a>
          .
        </li>
        <li>
          Khronos Group —{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Blender-IO
          </a>{" "}
          — Apache-2.0. Related project:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Models"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            glTF-Sample-Models
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr",
    title:
      "Python bpy.types.VertexWeightEditModifier + VertexWeightMixModifier — S-Curve Remap & Group Blend: VRM Cloth Pin Pipeline (Blender 5.1)",
    date: "2026-07-20",
    topics: ["blender", "scripting", "vrm", "webxr"],
    description:
      "Remap a vertex group through a custom S-curve with VertexWeightEditModifier, then MULTIPLY-blend it with a hand-painted rim stripe via VertexWeightMixModifier to produce a precise cloth pin group on a faceted VRM pauldron.",
  },
  {
    files: [
      {
        label: "blueprint.py",
        language: "python",
        path: "public/library/blends/scripting/python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr/blueprint.py",
      },
      {
        label: "record.py",
        language: "python",
        path: "public/library/blends/scripting/python-bpy-vertex-weight-edit-mix-modifier-curve-remap-group-blend-vrm-webxr/record.py",
      },
    ],
    body: <Body />,
  }
);
