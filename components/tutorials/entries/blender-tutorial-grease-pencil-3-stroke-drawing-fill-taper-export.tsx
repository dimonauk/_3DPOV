import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Gp3StrokeDrawingBody() {
  return (
    <>
      <p>
        Grease Pencil 3 is not a version bump. It is a full rewrite of the GP
        data model shipped as default in Blender 4.3 and refined through 5.1 —
        new internal type, new Python API surface, and a modifier stack that
        shares infrastructure with mesh modifiers rather than living in a
        separate <code>gpencil_modifier_add</code> silo. The existing{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline"
          className={lk}
        >
          GP3 Line Art tutorial
        </Link>{" "}
        covers edge-detection outlines generated <em>from</em> mesh geometry.
        This tutorial covers the other half: authoring <em>original</em> 2D ink
        strokes programmatically — polyline stroke objects, per-material fill
        colour, and a modifier stack that gives them a tapered ink-brush profile
        — and exporting a transparent PNG for title-card compositing.
      </p>

      <p className="mt-3">
        The critical architectural change from GP2: GP3 strokes are not stored
        in <code>layer.frames[i].strokes</code> as a flat array. Instead, each
        frame holds a <code>drawing</code> object of type{" "}
        <code>bpy.types.GreasePencilDrawing</code>, and strokes live inside that
        drawing&rsquo;s <code>add_strokes()</code> call. Points are accessed
        as <code>stroke.points[i].position</code> (a{" "}
        <code>mathutils.Vector</code>) and <code>stroke.points[i].radius</code>{" "}
        (float, driving per-point thickness). The old <code>.pressure</code>{" "}
        and <code>.strength</code> attribute names no longer exist at the point
        level in the GP3 Python binding — they were unified into{" "}
        <code>radius</code> and <code>opacity</code>. Code written for GP2 will
        silently produce no strokes if ported without this change.
      </p>

      <p className="mt-3">
        GP3 materials are standard Blender materials promoted to GP status via{" "}
        <code>bpy.data.materials.create_gpencil_data(mat)</code>. The{" "}
        <code>mat.grease_pencil</code> block then carries{" "}
        <code>color</code> (stroke RGBA), <code>fill_color</code> (fill RGBA),{" "}
        <code>show_stroke</code>, and <code>show_fill</code> booleans. The GP3
        fill engine auto-fills any closed stroke loop (≥ 3 points, first ≈
        last); you do not need a separate fill stroke as in some legacy
        tutorials. The fill is computed per-triangle on the CPU at draw time,
        which means a complex stroke with many crossing self-intersections can
        produce unexpected fill topology — keep logo artwork simple and convex
        for predictable results.
      </p>

      <p className="mt-3">
        The modifier stack added by <code>obj.modifiers.new(name, type)</code>{" "}
        with types prefixed <code>GREASE_PENCIL_*</code> replaces the old{" "}
        <code>bpy.ops.object.gpencil_modifier_add</code> path.{" "}
        <code>GREASE_PENCIL_SMOOTH</code> runs Laplacian smoothing over point
        positions; setting <code>use_smooth_radius = False</code> keeps the
        authored per-point radius intact while cleaning up jitter in hand-drawn
        positions. <code>GREASE_PENCIL_THICKNESS</code> applies a global pixel
        thickness with an optional custom falloff curve — set the curve to
        zero at parameter 0.0 and 1.0, peak at 0.5, and every stroke tapers at
        both ends regardless of how many points it has or how it was drawn. This
        is the technique that gives ink the look of a brush accelerating and
        decelerating rather than a felt-tip dragged at constant width. Compare
        with the EEVEE toon shader approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>
        , where thickness lives in the material rather than the modifier stack.
      </p>

      <p className="mt-3">
        The animated reveal in <code>record.py</code> uses{" "}
        <code>GREASE_PENCIL_TRIM</code> — a modifier that exposes{" "}
        <code>start_factor</code> and <code>end_factor</code> floats in{" "}
        <code>[0, 1]</code>. Keyframing <code>end_factor</code> from 0 → 1
        makes each stroke appear to be drawn progressively. A quadratic ease-in
        curve maps the linear frame index to a slowed start — mimicking the
        physical behaviour of a brush accelerating out of a resting position.
        Unlike GP2&rsquo;s Stroke Time Offset modifier, GREASE_PENCIL_TRIM
        operates on the evaluated stroke geometry and therefore stacks cleanly
        with Smooth and Thickness below it in the stack. For a production
        title-card sequence, combine the PNG output here with the green-screen
        compositing workflow in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-keying-green-screen-despill-tutorial-production"
          className={lk}
        >
          Compositor Keying tutorial
        </Link>{" "}
        to composite ink-drawn titles over screen recording footage, and inspect
        the per-pass alpha via the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          Shader AOV Custom Render Passes tutorial
        </Link>
        . For an entirely different NPR approach without GP objects, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-freestyle-npr-line-rendering"
          className={lk}
        >
          Freestyle NPR Line Rendering tutorial
        </Link>
        .
      </p>

      <p className="mt-3">
        <strong>Outside sources:</strong>{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/grease_pencil/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Grease Pencil
        </a>{" "}
        (CC-BY-4.0, Blender Foundation). Related: Blender Studio
        (studio.blender.org), Blender Extensions (extensions.blender.org).{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.GreasePencil.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          BPY API — bpy.types.GreasePencil
        </a>{" "}
        (CC-BY-4.0, Blender Foundation). Related: Blender Developer Docs
        (developer.blender.org), BPY stub packages on PyPI.
      </p>
    </>
  );
}

const base = {
  date: "2026-06-20",
  slug: "blender-tutorial-grease-pencil-3-stroke-drawing-fill-taper-export",
  title:
    "Grease Pencil 3 — Programmatic 2D Ink: Stroke Drawing, Fill Materials, Thickness Modifiers & EEVEE Transparent Export",
  description:
    "GP3 data model rewrite from Blender 4.3: GreasePencilDrawing.add_strokes(), per-point radius/opacity (not pressure/strength), GP material fill, GREASE_PENCIL_SMOOTH + GREASE_PENCIL_THICKNESS modifier stack with taper curve, GREASE_PENCIL_TRIM reveal animation. EEVEE render to transparent RGBA PNG for title-card compositing. CC0 blueprint.py + record.py.",
  Body: Gp3StrokeDrawingBody,
};

export const entry: Entry = buildInstructable(
  {
    blenderVersion: "5.1",
    time: "one session",
    difficulty: "intermediate",
    libraryPath:
      "blends/grease-pencil/grease-pencil-3-stroke-drawing-fill-taper-export",
    prerequisites: [
      "Comfortable with Blender's Object Mode and Property panels.",
      "Basic Python scripting — the blueprint runs from the Scripting workspace.",
      "No GP2 experience required; GP3 API is sufficiently different that GP2 habits need active unlearning.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "GP3 is the default for new Grease Pencil objects from Blender 4.3 onwards. The GREASE_PENCIL_TRIM modifier type and GreasePencilDrawing.add_strokes() API are available in 4.3+. Legacy GP2 objects created in earlier versions still use the old API and modifier types.",
      },
    ],
    steps: [
      {
        title: "Create a GP3 object",
        body:
          "bpy.ops.object.grease_pencil_add(type='EMPTY') creates a bare GP3 data-block. type='STROKE' adds sample strokes that help you verify the draw pipeline but clutter a scripted scene; prefer EMPTY for programmatic work and build strokes explicitly.\n\nAfter creation, obj.data is a bpy.types.GreasePencil — the same Python type name as GP2, but internally it is the GP3 type (identifiable by obj.type == 'GREASE_PENCIL_V3' in Blender 5.1 Python). Do NOT call bpy.ops.gpencil.primitive_* — those are GP2 operators and create GP2 objects; the GP3 equivalent is bpy.ops.grease_pencil.primitive_* (note the namespace change).\n\nScale the object to a convenient world size (CANVAS_SCALE = 2.0 in the blueprint) so the orthographic camera can frame the artwork without extreme zoom values that lose precision in the viewport.",
      },
      {
        title: "Build a GP3 material with fill",
        body:
          "mat = bpy.data.materials.new('GP_FillStroke')\nbpy.data.materials.create_gpencil_data(mat)  # promote to GP material\ngp = mat.grease_pencil\ngp.show_stroke = True\ngp.color       = (0.04, 0.04, 0.04, 1.0)   # near-black ink\ngp.show_fill   = True\ngp.fill_color  = (0.96, 0.55, 0.10, 1.0)   # amber fill\n\nGP3 materials do not have separate stroke and fill node trees — they are plain data-blocks on the grease_pencil sub-block. The fill engine uses scanline rasterisation of the stroke polygon at draw time; there is no fill Geometry Node or shader node involved. If you need procedural fill variation across an illustration, use multiple materials with different fill_color values and assign them to different strokes via stroke.material_index.\n\nAfter creating the material, attach it to the GP3 object: obj.data.materials.append(mat). Material slots on GP3 objects work identically to mesh objects.",
      },
      {
        title: "Add a layer, frame, and strokes",
        body:
          "layer = gp.layers.new('Shapes', set_active=True)\nframe = layer.frames.new(frame_number=1)\n\n# Stroke creation — GP3 API\nframe.drawing.add_strokes(1)   # allocates one stroke slot\ns = frame.drawing.strokes[-1]\ns.material_index = 0\ns.resize(5)                    # allocate 5 points\nfor i, (px, py) in enumerate(diamond_pts):\n    s.points[i].position = (px, py, 0.0)\n    s.points[i].radius   = 1.0\n    s.points[i].opacity  = 1.0\n\nKey GP3 vs GP2 differences:\n• frame.drawing (new) vs frame.strokes (GP2)\n• add_strokes(count) vs strokes.new()\n• points[i].position, .radius, .opacity vs .co, .pressure, .strength\n• Closed loops: repeat the first point as the last to signal the fill engine\n\nPoints live in object-local space. The GP3 canvas is infinite in XY; Z is depth. Keeping Z=0 for all strokes on the XY plane is the convention for 2D artwork; the camera looking down -Z with an ortho projection captures it flat.",
      },
      {
        title: "Build the GREASE_PENCIL_SMOOTH modifier",
        body:
          "sm = obj.modifiers.new('Smooth', 'GREASE_PENCIL_SMOOTH')\nsm.iterations           = 3\nsm.smooth_factor        = 0.5\nsm.use_smooth_position  = True\nsm.use_smooth_radius    = False   # preserve authored radius profile\nsm.use_smooth_opacity   = False\n\nLaplacian smoothing with use_smooth_position=True moves each point toward the centroid of its two neighbours on each iteration. With iterations=3 and factor=0.5, a jagged hand-drawn curve converges to a fair arc in three passes. The convergence rate is determined by the factor: 0.5 moves each point halfway to the Laplacian centroid per iteration. Factor > 1.0 overshoots (oscillates); 0.5 is safely under the Nyquist limit for discrete Laplacian.\n\nuse_smooth_radius=False keeps the authored per-point radius intact so the THICKNESS modifier's custom curve (added next) works on the raw authored values rather than the smoothed radius values. If both smooth and radius smoothing are active, the falloff curve interacts with smoothed radii — usually producing rounder ends than intended.",
      },
      {
        title: "Build the GREASE_PENCIL_THICKNESS modifier with taper curve",
        body:
          "tk = obj.modifiers.new('Thickness', 'GREASE_PENCIL_THICKNESS')\ntk.thickness         = 4.0         # pixels at 100% strength\ntk.use_custom_curve  = True        # enable falloff curve\ncrv = tk.custom_curve\ncrv.curves[0].points.new(0.0, 0.0)  # stroke start → zero thickness\ncrv.curves[0].points.new(0.5, 1.0)  # stroke midpoint → full thickness\ncrv.curves[0].points.new(1.0, 0.0)  # stroke end → zero thickness\ncrv.update()\n\nThe custom_curve maps [0, 1] along the normalised stroke parameter to a thickness multiplier. Setting it to a bell curve makes every stroke taper at both ends — the signature of traditional brush calligraphy. The curve is evaluated per-point using the point's index as its normalised parameter (index / (count - 1)).\n\nthickness is in screen pixels, not world units, which means the taper looks consistent regardless of camera distance — a useful property for 2D illustration work where artistic intent should not depend on the viewer's zoom level.\n\nModifier order: Smooth fires before Thickness in the stack as set up by blueprint.py. Smooth first means THICKNESS evaluates already-smoothed positions and clean radii, not jittery hand-drawn points.",
      },
      {
        title: "Set up the EEVEE render with transparent background",
        body:
          "sc.render.engine           = 'BLENDER_EEVEE_NEXT'\nsc.render.film_transparent = True\nsc.render.image_settings.file_format = 'PNG'\nsc.render.image_settings.color_mode  = 'RGBA'\n\nfilm_transparent=True instructs EEVEE to write 0.0 alpha for pixels with no geometry coverage, producing a clean cutout of the ink artwork on a transparent ground. Load the PNG into the Compositor or any image editor and the black ink over amber fill appears on whatever background you choose.\n\nSet the World background colour to (0, 0, 0, 0) via the Background shader node to ensure the empty scene behind the GP3 object contributes zero alpha even if film_transparent=False is accidentally toggled. This is a safety net — the film_transparent setting is the authoritative control, but belt-and-braces prevents a surprising grey background on re-renders.\n\nEEVEE sample count of 16 is sufficient for flat GP3 materials — the toon cel-shader tutorial uses 64 samples for mesh BSDF glossy reflections, but GP3 strokes use a special unlit 2D shader path that does not need anti-aliasing on sample accumulation.",
      },
    ],
    troubleshooting: [
      {
        symptom: "add_strokes() AttributeError: 'GreasePencilFrame' has no attribute 'drawing'",
        cause:
          "The object is a GP2 (legacy) object, not GP3. obj.type would be 'GPENCIL' rather than 'GREASE_PENCIL_V3'.",
        fix:
          "Delete the GP2 object and use bpy.ops.object.grease_pencil_add(type='EMPTY'). Do NOT use bpy.ops.gpencil.blank_frame_add — that is the GP2 path.",
      },
      {
        symptom: "Fill not appearing — stroke is drawn but interior is transparent",
        cause:
          "The stroke is not closed: first point ≠ last point, or mat.grease_pencil.show_fill is False.",
        fix:
          "Append the first point's position as the last point, and ensure show_fill=True on the material. The GP3 fill engine requires a closed polygon; open polylines are rendered as lines only.",
      },
      {
        symptom: "GREASE_PENCIL_THICKNESS modifier not in the Add Modifier dropdown",
        cause:
          "The active object is still a mesh or a GP2 object. GP3-specific modifier types only appear in the dropdown when the active object is GP3.",
        fix:
          "Select the GP3 object, check the Properties header shows the GP3 pencil icon (not the legacy GP2 icon). If in doubt, check obj.type == 'GREASE_PENCIL_V3' in the Python console.",
      },
      {
        symptom: "Taper curve has no visible effect — strokes remain constant width",
        cause:
          "use_custom_curve is False, or crv.update() was not called after adding the curve points.",
        fix:
          "Set tk.use_custom_curve = True explicitly before adding points. Call crv.update() after all points are placed. In the UI, the custom curve editor must show a bell shape; if it shows a flat line the points were not written.",
      },
      {
        symptom: "Render shows grey background instead of transparent",
        cause:
          "sc.render.film_transparent is False, or image_settings.color_mode is 'RGB' instead of 'RGBA'.",
        fix:
          "Set both film_transparent=True and color_mode='RGBA' in the render settings. PNG files saved with 'RGB' mode do not carry an alpha channel even if film_transparent is True.",
      },
    ],
  },
  base,
);
