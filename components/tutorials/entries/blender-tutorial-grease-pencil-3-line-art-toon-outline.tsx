import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function GreasePencil3LineArtBody() {
  return (
    <>
      <p>
        Grease Pencil 3 &mdash; shipped in Blender 4.3 and refined through 5.1
        &mdash; is not an update to the original GP system. It is a full rewrite:
        new data model, new modifier stack shared with the mesh modifier stack,
        and a new Python API under <code>bpy.types.GreasePencilv3</code>. The
        Line Art modifier belongs to this system; it analyses the scene&rsquo;s
        3D geometry each frame, classifies edges by type (CONTOUR, CREASE,
        MATERIAL_BOUNDARY, EDGE_MARK, INTERSECTION) and emits ink strokes into a
        named GP3 layer. Paired with an EEVEE Shader-to-RGB cel-shading material
        on the source mesh, the combination produces stylised 2D-in-3D ink
        illustration without texture painting.
      </p>

      <p className="mt-3">
        This technique sits at the heart of the studio&rsquo;s low-poly
        cel-shaded aesthetic. It connects directly to the edge-detection methods
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-ao-pointiness-edge-highlight"
          className={lk}
        >
          Pointiness + AO edge highlight tutorial
        </Link>{" "}
        and shares the hard-surface vocabulary developed in the{" "}
        <Link
          href="/tutorials/blender-tutorial-uv-unwrap-low-poly-stylised"
          className={lk}
        >
          low-poly UV unwrap tutorial
        </Link>
        . For VRM avatars the same GP3 ink object can be parented to the armature
        and rendered to texture before export; see the{" "}
        <Link
          href="/tutorials/blender-tutorial-vrm-spring-bones-hair-chain"
          className={lk}
        >
          VRM spring-bones tutorial
        </Link>{" "}
        for that export pipeline context. For multi-object scenes the GP3 source
        type can switch to &lsquo;SCENE&rsquo; and generate outlines for every
        instance, including those scattered via Geometry Nodes as in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-scatter"
          className={lk}
        >
          GN Raycast terrain scatter tutorial
        </Link>
        .
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        The GP3 data model — what changed from GP2
      </h2>
      <p>
        Grease Pencil 2 stored strokes in a flat list inside frames.  GP3
        introduces a typed hierarchy, a new Python type, and different material
        assignment:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# ─ GP3 Python path (Blender 4.3 / 5.x) ─────────────────────────────────────
gp_data = gp_obj.data          # bpy.types.GreasePencilv3  ← NEW type
layer   = gp_data.layers.new("Ink Outlines")
frame   = layer.frames.new(1)  # frame_number as positional arg
stroke  = frame.strokes.new()  # populated manually, OR by Line Art at eval time

# ─ GP2 (pre-4.3) — now deprecated ────────────────────────────────────────────
# gp_data = obj.data              # bpy.types.GreasePencil  (v2, different type)
# layer   = gp_data.layers.new("Layer", set_active=True)
# frame   = layer.frames.new(1)
# stroke  = frame.strokes.new(colorname="")  ← v2 took a colour name string

# ─ GP3 material assignment ────────────────────────────────────────────────────
ink_mat = bpy.data.materials.new("gp_ink_black")
bpy.data.materials.create_gpencil_data(ink_mat)    # converts to GP material
ink_mat.grease_pencil.color       = (0, 0, 0, 1)
ink_mat.grease_pencil.show_stroke = True
ink_mat.grease_pencil.show_fill   = False

gp_data.materials.append(ink_mat)   # GP3-specific append — NOT obj.data.materials`}</pre>

      <p className="mt-3">
        The <code>create_gpencil_data</code> call is mandatory; skipping it
        leaves a standard material with no <code>.grease_pencil</code>
        sub-object, and the modifier will refuse to render strokes.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Line Art modifier — edge type anatomy
      </h2>
      <p>
        The modifier type string is <code>GREASE_PENCIL_LINEART</code>. The five
        edge categories and their use on the crystal gem:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`mod = gp_obj.modifiers.new("InkLines", type='GREASE_PENCIL_LINEART')
mod.source_type      = 'OBJECT'      # restrict to one mesh; 'SCENE' = all visible
mod.source_object    = gem_obj
mod.target_layer     = "Ink Outlines"          # GP3 layer name — case-sensitive string
mod.target_material  = gp_obj.data.materials[0]  # GP3 material slot, not mesh slot

# Edge type flags (set literal, Blender 4.3+):
mod.edge_types = {'CONTOUR', 'CREASE', 'MATERIAL_BOUNDARY'}

# CONTOUR          — silhouette: front-facing face adjacent to back-facing face
#                   from the active camera.  Updates every frame as geometry rotates.
#                   Always select for a clean outline.
# CREASE           — interior edges where dihedral angle > crease_threshold.
#                   Icosphere at 2 subdivs has minimum facet-to-facet angle ~28°.
#                   Threshold 25° captures every facet edge → characteristic
#                   low-poly ink illustration look.
# MATERIAL_BOUNDARY— edges between faces using different materials.  Silent here
#                   with one material; fires if the gem later has a flat-base mat.
# EDGE_MARK        — manually marked edges (Ctrl+E → Mark Freestyle Edge in Edit Mode).
#                   Fires regardless of dihedral angle — for bespoke detail lines.
# INTERSECTION     — where two overlapping meshes intersect in 3D space.

mod.crease_threshold    = math.radians(25.0)  # 25° < 28° min dihedral → all facets
mod.thickness           = 15                  # thousandths of px at render height
mod.stroke_depth_offset = 0.001               # Z bias prevents z-fighting with mesh`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Cel-shading — Shader to RGB + CONSTANT ColourRamp
      </h2>
      <p>
        <strong>Shader to RGB</strong> is an EEVEE-only node that evaluates a
        shader&rsquo;s full lighting result &mdash; including shadows &mdash; as
        a 0&ndash;1 colour per pixel. Piping that through a ColourRamp set to{" "}
        <strong>CONSTANT</strong> interpolation quantises the smooth gradient into
        hard-edged toon bands.
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 overflow-x-auto mt-3">{`# Why Diffuse BSDF, not Principled BSDF?
# Principled BSDF has multiple lobes: diffuse + specular + coat + sheen.
# All lobes bleed into the Shader-to-RGB output, blurring the band boundary.
# Diffuse BSDF is a pure cosine single-lobe F(N·L) → clean scalar → sharp CONSTANT steps.
#
# Node chain:
#   Diffuse BSDF → Shader to RGB → ColourRamp(CONSTANT) → Emission → Material Output
#
# ColourRamp stops for sapphire crystal:
#   position=0.00  colour=(0.03, 0.04, 0.12)  ← deep navy shadow
#   position=0.45  colour=(0.15, 0.25, 0.70)  ← mid sapphire
#   position=0.80  colour=(0.55, 0.72, 1.00)  ← icy highlight
#
# Emission node: required because Shader to RGB outputs a colour Value, not a
# Shader.  The Material Output Surface socket expects a Shader, so the colour
# passes through an Emission node (Strength=1.0) to re-enter shader space.
#
# Shader to RGB in Cycles:
# The node exists in Cycles' graph but evaluates per-sample (random shading
# value), not deterministic illumination level.  Toon bands flicker.
# Use EEVEE Next only for this technique.`}</pre>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        View-dependent vs. geometry-dependent strokes
      </h2>
      <p>
        CONTOUR strokes are <em>view-dependent</em>: they mark the camera-facing
        silhouette and update every frame as the object or camera moves. CREASE
        strokes are <em>geometry-dependent</em>: they depend only on the dihedral
        angle between adjacent faces, which is fixed at rest. Rotate the gem in
        the viewport and watch: contour migrates across the surface as the
        silhouette shifts; crease lines stay on the same edges throughout the
        rotation. The 90-frame{" "}
        <code>record.py</code> recording makes this distinction legible in a
        single clip.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Failure modes</h2>
      <ul className="list-disc list-inside text-sm space-y-2 mt-2">
        <li>
          <strong>No ink strokes visible.</strong> Check in order: (1) Viewport
          Overlays &rarr; tick <em>Grease Pencil</em>. (2) The GP3 object is
          not hidden in the Outliner. (3) Press{" "}
          <kbd className="bg-black/30 px-1 rounded">Ctrl+Shift+Q</kbd> to force
          GP3 modifier evaluation. (4) Confirm{" "}
          <code>mod.target_layer</code> matches the layer name exactly
          (case-sensitive). (5) Confirm render engine is EEVEE Next, not Cycles.
        </li>
        <li>
          <strong>Gem shows flat uniform colour with no toon bands.</strong>{" "}
          Shader to RGB evaluates lighting: without a light source, all pixels
          fall into the shadow band. Confirm a SUN light with energy &ge; 3.0
          exists, not parallel to the camera direction.
        </li>
        <li>
          <strong>Crease strokes on every edge (too dense).</strong> Increase{" "}
          <code>crease_threshold</code> toward 40&ndash;45&deg;. Or switch the
          gem to Shade Smooth &mdash; interpolated normals reduce the apparent
          dihedral at minor edges while keeping very sharp corners.
        </li>
        <li>
          <strong>GP3 strokes absent after GLB export.</strong> Grease Pencil
          data is not part of the glTF spec. For WebXR use Three.js
          OutlinePass post-processing, or bake the ink render to a texture and
          apply as a decal on the mesh before export.
        </li>
        <li>
          <strong><code>create_gpencil_data</code> call fails.</strong> This
          function requires the material to not already have GP data. Check with{" "}
          <code>ink_mat.grease_pencil is not None</code> before calling.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Extending — edge marks, intersection, animated camera
      </h2>
      <p>
        To draw bespoke detail lines on specific edges regardless of angle:
        select the gem in Edit Mode, mark the edges (
        <kbd className="bg-black/30 px-1 rounded">Ctrl+E</kbd> &rarr;{" "}
        <em>Mark Freestyle Edge</em>), then add{" "}
        <code>&lsquo;EDGE_MARK&rsquo;</code> to <code>mod.edge_types</code>.
        These edges will fire independently of the crease threshold.
      </p>
      <p className="mt-3">
        For animated cameras, the CONTOUR strokes follow the silhouette
        automatically each frame with no extra setup. INTERSECTION mode
        adds strokes where two meshes clip through each other &mdash; drop a
        second gem partially through the first and the clipping boundary gets ink.
      </p>
      <p className="mt-3">
        To generate outlines for every scattered instance in a Geometry Nodes
        scene: set <code>mod.source_type = &lsquo;SCENE&rsquo;</code>. The
        modifier analyses every visible mesh object. Pair with the scatter method
        from the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-raycast-terrain-decal-scatter"
          className={lk}
        >
          GN Raycast scatter tutorial
        </Link>{" "}
        for field coverage.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Sources</h2>
      <ul className="list-disc list-inside text-sm space-y-1">
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/grease_pencil/modifiers/generate/line_art.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Grease Pencil Line Art Modifier
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. Edge type
          definitions, crease threshold, source type options, GP3 modifier stack.
          Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/grease_pencil/introduction.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Grease Pencil 3 Introduction
          </a>{" "}
          and{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GreasePencilLineartModifier.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            GreasePencilLineartModifier Python API
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/chsh2/nijiGPen"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            nijiGPen (MIT, chsh2)
          </a>{" "}
          &mdash; Blender extension providing GP3 brushes, fill utilities, and
          stroke processing operators for manga-style illustration. The multi-layer
          ink workflow in this blueprint is informed by nijiGPen&rsquo;s layer
          management conventions. Related:{" "}
          <a
            href="https://github.com/chsh2/nijiGPen/tree/main/operators"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            nijiGPen operators/
          </a>{" "}
          (stroke processing utilities, MIT).
        </li>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/shader_to_rgb.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual &mdash; Shader to RGB Node
          </a>{" "}
          &mdash; CC-BY-SA-4.0, Blender Documentation Team. EEVEE-only
          evaluation, shadow interaction, Cycles caveat. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/render/shader_nodes/converter/color_ramp.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            ColourRamp Node
          </a>{" "}
          (CONSTANT interpolation for hard toon steps).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "public/library/blends/grease-pencil/grease-pencil-3-line-art-toon-outline",
    time: "forty-five minutes to one hour",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: [
        "Scripting workspace — Text Editor",
        "3D Viewport — EEVEE Next rendered shading",
        "Properties ▸ Modifier — GREASE_PENCIL_LINEART settings",
        "Properties ▸ Object Data — GP3 layer panel",
        "Shader Editor — Shader to RGB + CONSTANT ColourRamp",
        "Viewport Overlays — Grease Pencil toggle",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Scripting workspace → open blueprint.py → Run Script. A faceted icosphere gem and a GP3 ink object called 'gp_ink' appear in the viewport. The Info bar confirms the scene built without errors.",
      },
      {
        title: "Enable EEVEE Next and Grease Pencil overlay",
        body: "Render Properties → Render Engine: EEVEE Next. In the 3D Viewport header, click Overlays → tick Grease Pencil. If ink strokes are still absent, press Ctrl+Shift+Q to force GP3 modifier evaluation.",
      },
      {
        title: "Inspect the GP3 layer and frame",
        body: "Select gp_ink. Properties → Object Data → Layers shows 'Ink Outlines'. Click the layer: a single frame at frame 1 is listed with zero manually authored strokes. The Line Art modifier populates this frame at evaluation time.",
      },
      {
        title: "Inspect the Line Art modifier",
        body: "Properties → Modifier → InkLines. Confirm: Source Type = Object (gem), Target Layer = 'Ink Outlines', Edge Types = Contour + Crease + Material Boundary, Crease Threshold ≈ 25°, Thickness = 15.",
      },
      {
        title: "Inspect the cel material in the Shader Editor",
        body: "Select the gem object. Shader Editor shows: Diffuse BSDF → Shader to RGB → ColourRamp (CONSTANT interpolation) → Emission → Material Output. The ColourRamp has three stops at 0.0 (navy shadow), 0.45 (sapphire midtone), 0.80 (icy highlight).",
      },
      {
        title: "Observe view-dependent vs geometry-dependent strokes",
        body: "Grab the gem (G Z) and rotate it slowly. Watch the viewport: CONTOUR strokes (silhouette outline) migrate across the surface as the gem rotates — they depend on the camera view. CREASE strokes (interior facet lines) stay fixed on the same edges throughout — they depend only on face angle.",
      },
      {
        title: "Adjust crease threshold live",
        body: "Select gp_ink → Modifier → InkLines → Crease Threshold. Decrease to 15° to add strokes on shallower edges (dense ink network). Increase to 45° to suppress all but the sharpest corners. Press Ctrl+Shift+Q after each change if the viewport does not update automatically.",
      },
      {
        title: "Record the viewport animation",
        body: "Scripting workspace → open record.py → Run Script. The gem rotates 360° over 90 frames (3 s at 30 fps). Renders to public/library/videos/grease-pencil/grease-pencil-3-line-art-toon-outline/viewport.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No ink strokes visible in viewport",
        cause:
          "Grease Pencil overlay is disabled, GP3 modifier has not evaluated, render engine is Cycles, or target_layer name is mismatched.",
        fix: "Viewport Overlays → enable Grease Pencil. Switch to EEVEE Next. Press Ctrl+Shift+Q. Confirm mod.target_layer exactly equals the layer name in Object Data (case-sensitive).",
      },
      {
        symptom: "Gem shows flat single colour — no toon bands",
        cause:
          "No light in the scene, or the light energy is too low for the Diffuse BSDF to produce contrast across the TONE_MID threshold (0.45).",
        fix: "Confirm a SUN light with energy ≥ 3.0 exists and is not parallel to the camera. Enable Render Properties → Shadows for EEVEE Next.",
      },
      {
        symptom: "Crease strokes cover the entire gem (far too dense)",
        cause:
          "crease_threshold is set below the minimum dihedral angle of all faces.",
        fix: "Increase Crease Threshold to 30–45°. Or enable Shade Smooth on the gem to reduce apparent dihedral at minor edges while keeping hard corners.",
      },
      {
        symptom: "GP3 ink strokes absent after GLB export",
        cause:
          "Grease Pencil data is not part of the glTF 2.0 specification.",
        fix: "For WebXR, use Three.js OutlinePass post-processing or bake the ink render to an image texture and apply as a decal material on the mesh before export.",
      },
    ],
    finalResult:
      "A faceted icosphere crystal gem with a three-band EEVEE cel-shading material (shadow navy / sapphire midtone / icy highlight) and a Grease Pencil 3 Line Art modifier generating black ink strokes on CONTOUR silhouette edges and CREASE interior facet edges, plus a 90-frame 360° rotation recording at viewport.mp4.",
  },
  {
    slug: "blender-tutorial-grease-pencil-3-line-art-toon-outline",
    title:
      "Grease Pencil 3 — Line Art Modifier + Toon Ink Outline Render (Blender 5.1)",
    date: "2026-06-14",
    kind: "tutorial",
    excerpt:
      "Automatic ink stroke generation from 3D geometry edges using Blender 5.1's rewritten Grease Pencil 3 system: GREASE_PENCIL_LINEART modifier targeting CONTOUR and CREASE edges, GP3 layer and material setup via Python, and an EEVEE Shader-to-RGB cel-shading material with hard CONSTANT toon bands — the complete stylised 2D-in-3D illustration pipeline without texture painting.",
    Body: GreasePencil3LineArtBody,
  },
);
