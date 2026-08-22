import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        <code>BevelModifier</code> chamfers edges by inserting face-loop
        strips between adjacent faces. Setting{" "}
        <code>limit_method=&apos;WEIGHT&apos;</code> reads the{" "}
        <code>&quot;bevel_weight_edge&quot;</code> float attribute on the edge
        domain: edges with weight&nbsp;0.0 receive no chamfer, weight&nbsp;1.0
        receives the full <code>mod.width</code>, and intermediate values scale
        proportionally. This gives per-edge chamfer width control without a
        separate modifier for each group — essential for props where the outer
        rim, inner recesses, and vertical silhouette edges all require
        different chamfer widths.
      </p>
      <p>
        This tutorial scripts a hard-surface equipment panel: a base slab with
        an inset border and raised central platform. Bevel weights are assigned
        programmatically by edge Z-position, then a single{" "}
        <code>BevelModifier</code> produces three distinct chamfer widths in
        one pass. <code>harden_normals=True</code> ensures the chamfer seams
        read as machined metal rather than soft-edged plastic.
      </p>

      <h2>Bevel weight API — Blender 4.0+ migration</h2>
      <p>
        In Blender 3.x, bevel weight was a property on{" "}
        <code>BMEdge.bevel_weight</code>. That property was removed in
        Blender&nbsp;4.0. The weight is now a named float attribute on the edge
        domain, accessed via the bmesh float layer:
      </p>
      <pre>{`# Blender 3.x — removed:
edge.bevel_weight = 0.75

# Blender 4.0+ / 5.1 — correct:
layer = (bm.edges.layers.float.get("bevel_weight_edge")
         or bm.edges.layers.float.new("bevel_weight_edge"))
edge[layer] = 0.75`}</pre>
      <p>
        The modifier reads this attribute each time the depsgraph evaluates —
        it is live, not baked. For batch writes on large meshes use{" "}
        <code>me.attributes[&quot;bevel_weight_edge&quot;].data.foreach_set(
          &apos;value&apos;, weights_list
        )</code>
        . See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-mesh-edge-sharp-crease-seam-attribute-webxr"
        >
          sharp_edge / crease_edge / use_seam pipeline
        </Link>{" "}
        for how edge-domain attributes interact with the modifier stack.
      </p>

      <h2>limit_method options</h2>
      <pre>{`bev.limit_method = 'WEIGHT'  # reads bevel_weight_edge float attribute
bev.limit_method = 'ANGLE'   # chamfers edges where dihedral > angle_limit
bev.limit_method = 'VGROUP'  # chamfers edges adjacent to a vertex group
bev.limit_method = 'NONE'    # chamfers every non-flat edge`}</pre>
      <p>
        <code>ANGLE</code> is the simplest default for clean hard-surface
        meshes with clear dihedral breaks. <code>WEIGHT</code> gives per-group
        width control. <code>NONE</code> on a mesh with support loops chamfers
        every internal edge — use only on deliberately minimal topology.
      </p>

      <h2>Profile control — superellipse</h2>
      <pre>{`bev.profile_type = 'SUPERELLIPSE'
bev.profile = 0.5   # perfect circular arc — widest highlight curve
bev.profile = 0.62  # slightly convex outward — machined/stamped look
bev.profile = 1.0   # fully flat strip — no arc curvature

# profile_type='CUSTOM' allows an arbitrary Properties-panel curve;
# not straightforward to author from Python without bpy.types.CurveMapping.`}</pre>
      <p>
        Values above 0.5 push the arc outward (machined edge); below 0.5
        produce a concave scallop (decorative). For WebXR at 2–3 segments,
        0.55–0.70 gives the best highlight per polygon.
      </p>

      <h2>Miter strategies</h2>
      <pre>{`bev.miter_outer = 'MITER_SHARP'  # star-burst spike at convex corners
bev.miter_outer = 'MITER_PATCH'  # concave fill quad — best default for WebXR
bev.miter_outer = 'MITER_ARC'    # arc fill — highest quality, most extra loops
bev.miter_inner = 'MITER_SHARP'  # correct for most concave corners`}</pre>
      <p>
        <code>MITER_PATCH</code> inserts one concave quad per convex corner
        instead of the star-burst artefact from SHARP or the extra{" "}
        <code>segments</code> loops from ARC. For WebXR poly budgets it is the
        right default.
      </p>

      <h2>harden_normals — machined-metal seam</h2>
      <p>
        Standard normal interpolation blends vertex normals across the bevel
        strip, producing a soft gradient that reads as a plastic injection-mould
        radius. With <code>harden_normals=True</code> the modifier assigns a
        Custom Split Normal to each strip face equal to the adjacent flat-face
        normal — the strip gets no normal contribution of its own, so the
        surface appears perfectly flat up to the edge, and the specular
        highlight forms a crisp seam line at the strip boundary.
      </p>
      <pre>{`bev.harden_normals = True   # requires shade_smooth on the mesh
                            # no effect on flat-shaded geometry`}</pre>
      <p>
        The custom normals are written into the evaluated mesh by the modifier
        and exported verbatim into the GLB <code>NORMAL</code> accessor via{" "}
        <code>export_normals=True</code>. Three.js renders them without
        recomputing. For the downstream{" "}
        <code>WeightedNormalModifier</code> interaction see{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-weighted-normal-modifier-face-area-corner-angle-hard-surface-webxr"
        >
          WeightedNormalModifier — Face-Area, Corner-Angle &amp; Face-With-Angle
          Modes
        </Link>
        ; stack Bevel before WeightedNormal so the latter recalculates on the
        bevel-modified geometry.
      </p>

      <h2>use_clamp_overlap</h2>
      <p>
        On thin props, opposing edges can each request a chamfer wider than the
        available half-thickness, causing strips to cross and invert. Setting{" "}
        <code>use_clamp_overlap=True</code> scales both strips proportionally
        to fit without overlap. Always set it on slabs or panels thinner than
        twice the chamfer width.
      </p>

      <h2>Full modifier setup</h2>
      <pre>{`bev = ob.modifiers.new("Bevel", 'BEVEL')
bev.limit_method      = 'WEIGHT'
bev.width             = 0.006      # world-space at bevel_weight = 1.0
bev.segments          = 2
bev.profile_type      = 'SUPERELLIPSE'
bev.profile           = 0.62       # slightly convex
bev.miter_outer       = 'MITER_PATCH'
bev.miter_inner       = 'MITER_SHARP'
bev.harden_normals    = True
bev.use_clamp_overlap = True
bev.loop_slide        = True
bev.face_strength_mode = 'NEW'   # pairs with WeightedNormal downstream

# width_type controls how 'width' is measured:
# 'OFFSET' (default) — strip extends this far from source edge
# 'WIDTH'  — full chamfer face width = this value
# 'PERCENT' — percentage of adjacent edge length (good for variable topology)
bev.width_type = 'OFFSET'`}</pre>

      <h2>GLB export</h2>
      <pre>{`bpy.ops.export_scene.gltf(
    filepath            = "//hf_bevel_panel.glb",
    export_format       = 'GLB',
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format = 'WEBP',
    export_apply        = True,   # evaluates BevelModifier at export
    export_normals      = True,   # writes harden_normals into NORMAL accessor
)`}</pre>
      <p>
        <code>export_apply=True</code> evaluates the full modifier stack; the
        GLB gets the chamfered, normal-hardened mesh without touching the live
        .blend stack. See{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
        >
          SubDiv Crease + Bevel-Weight Hard-Surface
        </Link>{" "}
        for the full hard-surface modifier workflow, and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-smooth-by-angle-modifier-auto-smooth-migration-normals-webxr"
        >
          SMOOTH_BY_ANGLE — Auto-Smooth Migration
        </Link>{" "}
        for how normal-related modifiers interact with the exporter.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Bevel weight has no effect:</strong>{" "}
          <code>limit_method</code> is not <code>&apos;WEIGHT&apos;</code> — with{" "}
          <code>&apos;NONE&apos;</code> every edge is chamfered regardless.
        </li>
        <li>
          <strong>AttributeError on bevel_weight_edge:</strong> Blender 3.x
          code path. Use the float layer API (see above).
        </li>
        <li>
          <strong>harden_normals no visible effect:</strong> mesh is
          flat-shaded. Run <code>bpy.ops.object.shade_smooth()</code> first.
        </li>
        <li>
          <strong>Star-burst spike at corners:</strong> set{" "}
          <code>miter_outer=&apos;MITER_PATCH&apos;</code>.
        </li>
        <li>
          <strong>Strips crossing inside thin prop:</strong> set{" "}
          <code>use_clamp_overlap=True</code>.
        </li>
        <li>
          <strong>GLB missing chamfers:</strong> <code>export_apply</code> was
          False — modifier stack not evaluated at export.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/api/5.1/bpy.types.BevelModifier.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            bpy.types.BevelModifier — Blender Python API 5.1
          </a>{" "}
          (CC BY SA 4.0 · Blender Foundation) — full property reference for{" "}
          <code>limit_method</code>, <code>profile_type</code>,{" "}
          <code>miter_outer</code>, <code>harden_normals</code>,{" "}
          <code>width_type</code>, <code>face_strength_mode</code>. Related:
          projects.blender.org Blender source, developer.blender.org modifier
          design notes, Blender 4.0 release notes documenting bevel_weight
          attribute migration.
        </li>
        <li>
          <a
            className={lk}
            href="https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/bevel.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Bevel Modifier — Blender Manual
          </a>{" "}
          (CC BY SA 4.0 · Blender Documentation Team) — profile diagram,
          miter mode diagrams, harden normals vs Custom Split Normals
          interaction, known limitations with non-manifold meshes. Related
          sibling pages: Solidify Modifier, Boolean Modifier, Subdivision
          Surface — all in the Generate modifiers category.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Blender-IO — Khronos Group
          </a>{" "}
          (Apache-2.0) — bundled glTF exporter; writes the{" "}
          <code>NORMAL</code> accessor from the evaluated custom normal layer.
          Related: KhronosGroup/glTF specification,
          KhronosGroup/glTF-Sample-Assets, three.js{" "}
          <code>GLTFLoader</code>.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr",
  title:
    "Python bpy.types.BevelModifier — Edge-Weight Chamfer, Profile Control & Harden Normals: Hard-Surface Equipment Panel & GLB Export (Blender 5.1)",
  summary:
    "BevelModifier with limit_method='WEIGHT' reads the 'bevel_weight_edge' float attribute (Blender 4.0+ API — old BMEdge.bevel_weight removed) to produce per-group chamfer widths from a single modifier. This tutorial scripts a hard-surface equipment panel with inset border and raised platform, assigns bevel weights via bmesh float layer by edge Z-position, and configures profile, miter_outer='MITER_PATCH', harden_normals for machined-metal specular seams, and use_clamp_overlap for thin-panel safety, then exports to a Draco-compressed GLB with normals verbatim in the NORMAL accessor.",
  tags: [
    "blender",
    "python",
    "scripting",
    "bevel-modifier",
    "bevel-weight",
    "hard-surface",
    "chamfer",
    "harden-normals",
    "modifier",
    "props",
    "webxr",
    "glb",
    "blender-5-1",
  ],
  date: "2026-07-17",
  body: <Body />,
  libraryPath:
    "blends/scripting/python-bpy-bevel-modifier-hard-surface-edge-chamfer-webxr",
});
