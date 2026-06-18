import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function FreestyleNprBody() {
  return (
    <>
      <p>
        Freestyle is Blender&rsquo;s post-process NPR line engine. After the main
        Cycles pass finishes, Freestyle analyses the scene geometry in 2-D
        image space and draws programmable strokes along silhouettes, crease
        edges, and material boundaries. The critical architectural distinction
        from Grease Pencil&rsquo;s Line Art modifier is <em>when</em> each system runs:
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline"
          className={lk}
        >
          Grease Pencil Line Art modifier
        </Link>{" "}
        runs in 3-D space as a modifier stack entry before rendering; Freestyle
        runs as a render pass in 2-D image space after the main Cycles pass.
        That difference determines what each can do. Freestyle picks up view-dependent
        silhouettes that shift with every camera move; it draws at sub-pixel precision;
        and it can drive stroke style through modifiers that map stroke parametric
        position to colour, alpha, and thickness. The cost: Freestyle is Cycles-only.
        EEVEE does not support it in any Blender 5.x release.
      </p>

      <p className="mt-3">
        The studio&rsquo;s cel-shading workflow — built in the{" "}
        <Link href="/tutorials/blender-tutorial-eevee-toon-cel-shader" className={lk}>
          EEVEE toon shader tutorial
        </Link>{" "}
        — uses Shader to RGB to quantise diffuse values. Freestyle sits alongside
        that approach for Cycles shots: the toon shader handles fill, Freestyle
        handles outlines, and a Compositor Glare node handles bloom. The three
        layers are composited separately, giving full independent control.
      </p>

      <p className="mt-3">
        Sources:{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/freestyle/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender Manual — Freestyle
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0) ·{" "}
        <a
          href="https://docs.blender.org/api/current/bpy.types.FreestyleLineStyle.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender API — FreestyleLineStyle
        </a>{" "}
        (© Blender Foundation, CC-BY-SA 4.0).
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Line sets vs line styles</h2>
      <p>
        A <strong>line set</strong> is a filter: it selects which edges in the scene
        qualify for drawing. Edge types available include silhouette, crease, contour,
        external contour, material boundary, suggestive contour, ridge, and valley.
        Each line set owns a reference to a <strong>line style</strong>. Multiple line
        sets can share the same line style, or each can have a unique style.
      </p>
      <p className="mt-2">
        The blueprint creates three line sets in priority order (Blender draws
        them bottom-to-top in the list):
      </p>
      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
        <li>
          <code>silhouette</code> — 2.8 px, outer profile. Along-Stroke colour
          gradient (dark blue → warm amber), Perlin-noise 2-D wobble, calligraphic
          taper.
        </li>
        <li>
          <code>crease</code> — 1.3 px, facet edges sharper than 22°. Warm grey,
          lighter wobble. Creates interior structural detail without competing with
          the silhouette weight.
        </li>
        <li>
          <code>material_boundary</code> — 1.0 px, gold dashed (8 on / 4 off).
          Marks the seam between the teal gem body and the gold gem cap at the
          crown. No crease or silhouette edge would catch this seam because the
          geometry is smooth at that joint.
        </li>
      </ul>

      <h2 className="text-lg font-semibold mt-6 mb-2">Along-Stroke colour modifier</h2>
      <p>
        The most expressive Freestyle modifier maps a parametric value{" "}
        <code>t ∈ [0, 1]</code> — the stroke&rsquo;s fractional position from start to
        end — through a colour ramp. At <code>t=0</code> (chain start) the stroke
        is a deep blue-indigo; at <code>t=1</code> (chain end) it has shifted to
        warm amber. The chain start corresponds to the edge vertex furthest from
        the camera by default, so the gradient reads as shadow to highlight — a
        result that feels correct to the eye even though it has nothing to do with
        scene lighting.
      </p>
      <p className="mt-2">
        In Python the ramp is a <code>ColorRamp</code> accessed via{" "}
        <code>modifier.color_ramp.elements[N].color</code>. The ramp object is
        the same type used in the Shader Editor, so existing knowledge of gradient
        stops transfers directly. The modifier&rsquo;s <code>blend</code> field accepts
        any Blender blend mode string; <code>&apos;MIX&apos;</code> replaces the base colour
        entirely at influence 1.0.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Camera-distance alpha and Perlin wobble
      </h2>
      <p>
        The <code>DISTANCE_FROM_CAMERA</code> alpha modifier accepts{" "}
        <code>range_min</code> and <code>range_max</code> (metres from the camera
        origin) and maps each stroke&rsquo;s camera distance to an alpha value between{" "}
        <code>value_min</code> and <code>value_max</code>. Here: fully opaque at
        1.5 m, fading to zero at 13 m. This prevents distant background geometry
        from generating cluttered lines while keeping foreground strokes readable.
      </p>
      <p className="mt-2">
        The <code>PERLIN_NOISE_2D</code> geometry modifier displaces each stroke
        vertex laterally in 2-D screen space. Screen-space operation is the key
        advantage: the wobble magnitude is consistent regardless of the object&rsquo;s
        distance from the camera, so a distant background element gets the same
        hand-drawn quality as a foreground hero object. The Freestyle SVG exporter
        — covered in the{" "}
        <Link href="/tutorials/blender-addon-freestyle-svg-exporter" className={lk}>
          Freestyle SVG Exporter addon tutorial
        </Link>{" "}
        — preserves this wobble in the SVG output, making it a usable path for
        animated SVG illustration production.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Compositor integration
      </h2>
      <p>
        Freestyle strokes are automatically composited onto the main render when{" "}
        <code>scene.render.use_freestyle = True</code>. For fine-grained control —
        such as applying a Glare node to the main render but not to the Freestyle
        strokes — separate the render result from the line layer using the{" "}
        <code>Render Layers</code> compositor node. The{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-aov-custom-render-passes"
          className={lk}
        >
          AOV custom render passes tutorial
        </Link>{" "}
        shows the same multi-pass isolation pattern for Cycles — the same node
        setup applies to Freestyle.
      </p>
      <p className="mt-2">
        If you want Freestyle in only one view layer (for example, an outline pass
        over a clean beauty render), enable <code>use_freestyle</code> on that view
        layer only. The other view layer renders without lines. The Compositor
        then receives both in the same node tree via two Render Layers nodes
        pointing at different layers by name.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Headless bpy API</h2>
      <p>
        The operator{" "}
        <code>bpy.ops.scene.freestyle_lineset_add()</code> requires a Render
        Properties context to be visible, making it fragile in headless scripts.
        The blueprint uses the direct data API instead:{" "}
        <code>freestyle_settings.linesets.new(name)</code> works reliably in
        background mode. Line styles are created with{" "}
        <code>bpy.data.linestyles.new(name)</code> and then assigned via{" "}
        <code>lineset.linestyle = style</code>, which avoids the operator entirely.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "1–2 hours",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1 (free, blender.org)", "Cycles GPU recommended"],
      tools: [
        "blueprint.py (generates freestyle_npr_lines.blend)",
        "record.py (Cycles turntable → viewport.mp4)",
        "OBS Studio or Windows Game Bar (screen.mp4)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py to build the scene",
        body: "Open a terminal in public/library/blends/rendering/freestyle-npr-line-rendering/ and run: blender --background --python blueprint.py. Blender creates freestyle_npr_lines.blend with the hexagonal gem prism, three line sets, and all modifiers configured. Open the .blend to inspect it.",
      },
      {
        title: "Inspect the line sets in Render Properties",
        body: "In the Properties panel, go to Render Properties (camera icon). Scroll to the Freestyle section — it should be enabled. Below it, the Line Sets list shows three entries: silhouette, crease, material_boundary. Click each to see its edge-type checkboxes. Note that silhouette has Select Silhouette and Select Border ticked; crease has only Select Crease; material_boundary has only Select Material Boundary.",
      },
      {
        title: "Inspect the silhouette line style",
        body: "With the silhouette line set selected, click the arrow next to the line style name (style_silhouette) to expand it. Scroll through the four modifier panels: Color shows SilhouetteGradient (Along Stroke, blue → amber ramp); Alpha shows SilhouetteFade (Distance from Camera, 1.5–13 m range); Geometry shows SilhouetteWobble (Perlin Noise 2D, amplitude 1.3); Thickness shows SilhouetteTaper (Along Stroke, min 0.25, max 1.0, Multiply).",
      },
      {
        title: "Render a test frame",
        body: "Press F12 to render frame 1. Watch the status bar: first the Cycles pass runs (progress 0–100%), then a brief Freestyle pass runs separately. When complete, the Image Viewer shows the gem with dark-blue silhouette lines graduating to amber, lighter warm-grey crease lines on the facets, and a dashed gold line along the crown seam. Press Numpad 0 to confirm the camera framing.",
      },
      {
        title: "Adjust the crease threshold",
        body: "In Render Properties › Freestyle, find the Crease Angle slider (default 22°). Increase it to 45° and re-render. More facet edges now qualify as creases — the gem interior fills with lines. Reduce it to 10° and re-render: almost no crease lines appear. The right threshold depends on your geometry's dihedral angles. For this 6-sided prism, 22° is the minimum that catches all side-to-side facet edges without catching the slight bevel on the cap.",
      },
      {
        title: "Enable the material boundary dashes",
        body: "Select the material_boundary line set. In the Line Style panel, scroll to Style › Dashed Line. Confirm dash1=8, gap1=4, all others 0. Render again. The crown seam now appears as a dashed gold line. This edge would be invisible to silhouette and crease detection because the geometry is smooth at the material join — the only way to highlight it is the Material Boundary edge type.",
      },
      {
        title: "Record the turntable",
        body: "Run: blender --background freestyle_npr_lines.blend --python record.py. This renders 150 Cycles frames (32 samples, 960×540) with Freestyle active on every frame. The gem rotates 360° over frames 1–120, then holds for 30 frames. The result is written to public/library/videos/rendering/freestyle-npr-line-rendering/viewport.mp4.",
      },
      {
        title: "Screen-record the walkthrough",
        body: "Follow SCREEN-RECORDING-NOTES.md: OBS window capture at 1920×1080, 30 fps, audio off. Walk through: Freestyle enabled in Render Properties → three line sets → silhouette style modifiers → F12 render showing the two-pass progress. Save to public/library/videos/rendering/freestyle-npr-line-rendering/screen.mp4.",
      },
    ],
    troubleshooting: [
      {
        symptom: "No Freestyle lines appear in the render",
        cause:
          "Either scene.render.use_freestyle is False, or the active view layer has use_freestyle disabled separately (Render Properties › View Layer tab › Freestyle checkbox).",
        fix: "Check both: scene.render.use_freestyle (global switch) and bpy.context.view_layer.use_freestyle (per-layer switch). The blueprint enables both. If re-running blueprint.py after a manual disable, both flags are set again.",
      },
      {
        symptom: "Freestyle not available (greyed out in Render Properties)",
        cause:
          "The active render engine is EEVEE. Freestyle is Cycles-only in Blender 5.x.",
        fix: "In Render Properties › Render Engine, switch to Cycles. The Freestyle section appears immediately below the Sampling section.",
      },
      {
        symptom: "Material boundary line set draws nothing",
        cause:
          "view_layer.freestyle_settings.use_material_boundaries is False, or the adjacent faces genuinely share the same material index.",
        fix: "Blueprint sets fs.use_material_boundaries = True. Verify in Render Properties › Freestyle › Advanced that 'Material Boundaries' is ticked. Also check that the gem_prism object has two distinct material slots assigned to its faces.",
      },
      {
        symptom: "Stroke wobble is invisible or too subtle",
        cause:
          "PERLIN_NOISE_2D amplitude is in pixels at the current render resolution. At 100% of 1280×720, amplitude=1.3 is clearly visible. At 25% resolution preview it is near sub-pixel.",
        fix: "Render at 100% resolution (scene.render.resolution_percentage = 100). For viewport preview, use Render › Viewport Render Image rather than Material Preview.",
      },
    ],
    finalResult:
      "A 1280×720 PNG of a hexagonal gem prism with three Freestyle line layers: 2.8 px blue-to-amber silhouette with hand-drawn wobble and calligraphic taper; 1.3 px warm-grey crease lines revealing the facet structure; and a dashed gold material-boundary line marking the crown seam. A 150-frame Cycles turntable writes to viewport.mp4.",
  },
  {
    slug: "blender-tutorial-freestyle-npr-line-rendering",
    title:
      "Rendering: Freestyle NPR — Silhouette + Crease + Material-Boundary Line Sets with Along-Stroke Gradient (Blender 5.1)",
    date: "2026-06-18",
    kind: "tutorial",
    excerpt:
      "Use Blender 5.1&rsquo;s Freestyle post-process line engine to draw three independent line sets over a hexagonal gem prism: a silhouette with a blue-to-amber Along-Stroke colour gradient and Perlin-noise wobble, interior crease lines at a 22° threshold, and a dashed gold material-boundary line at the crown seam.",
    tags: [
      "blender",
      "freestyle",
      "npr",
      "line-art",
      "rendering",
      "cycles",
      "toon",
      "stylised",
    ],
    Body: FreestyleNprBody,
  },
);
