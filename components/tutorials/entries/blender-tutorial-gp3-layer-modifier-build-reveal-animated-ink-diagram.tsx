import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Gp3LayerModifierBuildRevealBody() {
  return (
    <>
      <p>
        Grease Pencil 3 (GP3) landed in Blender 4.3 and matured in 5.1. Its
        modifier system looks similar to the old GP2 stack but has a key
        structural difference: modifiers now sit in the same{" "}
        <code>obj.modifiers</code> collection as mesh and curve modifiers,
        with type strings prefixed <code>GREASE_PENCIL_*</code>. Each modifier
        also exposes a <code>layer_filter</code> string that restricts its
        effect to a single named layer — the mechanism behind independent reveal
        timing per diagram stage in this tutorial. Compare this with the field
        approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-gp3-noise-stroke-wave"
          className={lk}
        >
          GN noise-wave tutorial
        </Link>
        , where a Geometry Nodes modifier samples a noise field per point at
        each frame. The GN approach gives you per-point maths; the modifier
        approach gives you high-level animation controls (Build, Length, Time
        Offset) without writing a node tree.
      </p>

      <p className="mt-3">
        This tutorial builds a self-drawing WebXR pipeline diagram — three
        boxes labelled Blender, GLB, WebXR, connected by two arrows — using
        three Build modifiers staged across frames 1–90. A Noise modifier
        running at <code>factor=0.03</code> with <code>use_random=True</code>{" "}
        keeps the settled ink breathing slightly; a light Smooth pass prevents
        kinks at arrowhead junctions where only two points join at an angle.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The GP3 Build modifier — modes and transitions
      </h2>
      <p className="mt-2">
        Build is a <em>generate</em> modifier: it controls which strokes are
        visible at each frame, rather than deforming existing geometry. Three
        properties define its behaviour:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>mode</strong> — <code>SEQUENTIAL</code>: one stroke reveals
          at a time, distributed evenly across the frame window.{" "}
          <code>CONCURRENT</code>: all strokes reveal simultaneously.{" "}
          <code>ADDITIVE</code>: strokes accumulate, never hide — useful for
          ink that builds up across a looping animation.
        </li>
        <li>
          <strong>transition</strong> — <code>GROW</code>: the stroke tip
          advances from point 0 toward the last point, exactly like a pen
          moving across paper. <code>SHRINK</code>: the stroke tail erases
          forward (useful for a disappearing ink effect). <code>FADE</code>:
          opacity ramps from 0 to 1 — no spatial reveal, just a cross-fade.
        </li>
        <li>
          <strong>use_restrict_frame_range</strong> — when <code>True</code>,
          the modifier respects <code>frame_start</code> and{" "}
          <code>frame_end</code> directly. When <code>False</code>, the build
          starts at the scene start and its length is controlled by the{" "}
          <code>length</code> property instead.
        </li>
      </ul>
      <p className="mt-2">
        The tutorial uses three separate Build modifiers, each with{" "}
        <code>layer_filter</code> pointing at a different layer name. This is
        preferable to time-offsetting keyframes because the stroke data stays
        on a single frame (frame 1) — no duplicate data, and you can adjust
        timing by dragging a single float in the modifier panel without
        touching the stroke geometry at all.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        GP3 drawing API — frame.drawing vs frame.strokes
      </h2>
      <p className="mt-2">
        In GP2, strokes were created with <code>frame.strokes.new()</code> and
        edited in place. In GP3 each frame exposes a <code>.drawing</code>{" "}
        handle that owns the stroke geometry:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-black/40 p-3 text-xs">
        {`layer = gp_data.layers.new("boxes")
frame = layer.frames.new(1)          # keyframe at frame 1

frame.drawing.add_strokes(1)         # allocate one stroke record
s = frame.drawing.strokes[-1]        # retrieve it
s.use_cyclic     = True              # closed loop (rectangle)
s.material_index = 0                 # index into gp_data.materials
s.resize(4)                          # 4 points for a quad
for i, (x, y, z) in enumerate(corners):
    s.points[i].position = (x, y, z)
    s.points[i].radius   = 0.028    # pen pressure / line weight
    s.points[i].opacity  = 1.0`}
      </pre>
      <p className="mt-2">
        The <code>resize()</code> call is mandatory before writing any{" "}
        <code>s.points[i]</code> attributes — the points array is empty until
        sized. Skipping this raises an <code>IndexError</code> on the first
        point write. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gp3-frame-by-frame-cel-animation"
          className={lk}
        >
          frame-by-frame cel animation tutorial
        </Link>{" "}
        for a deeper walkthrough of the layer / frame / drawing data model,
        including how multiple keyframes interact with the modifier stack.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Noise modifier — per-point vs full-stroke
      </h2>
      <p className="mt-2">
        The GP3 Noise modifier has two sampling modes controlled by{" "}
        <code>full_stroke</code>:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>full_stroke = False</strong> (default): displacement is
          sampled independently per point. Every vertex gets a different noise
          value, producing the classic hand-drawn wobble. Good for organic
          strokes. Bad for a straight arrow shaft — at high factor you get a
          sawtooth instead of a curve.
        </li>
        <li>
          <strong>full_stroke = True</strong>: a single noise sample applies
          uniformly to the whole stroke. The stroke translates as a rigid body
          rather than deforming. Useful for making label lines drift slightly
          without changing their internal spacing.
        </li>
      </ul>
      <p className="mt-2">
        This tutorial leaves <code>full_stroke = False</code> at factor 0.03
        — just enough jitter to read as ink, not enough to distort the diagram
        geometry. Increase to 0.08–0.12 for a looser sketched look. The{" "}
        <code>use_random = True</code> flag re-evaluates the noise field each
        frame using the current frame number as a temporal offset, so the
        settled diagram continues to breathe. Set <code>use_random = False</code>{" "}
        for a completely static noise pattern frozen at the baked positions.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Layer modifier stack ordering — why it matters
      </h2>
      <p className="mt-2">
        GP3 modifiers evaluate top-to-bottom in the stack, same as mesh
        modifiers. The ordering here is deliberate:
      </p>
      <ol className="mt-2 list-decimal pl-6 space-y-1 text-sm">
        <li>
          <strong>BuildBoxes / BuildArrows / BuildLabels</strong> — control
          visibility. Must be first so Noise and Smooth only operate on visible
          strokes, not on the hidden geometry that Build is suppressing.
        </li>
        <li>
          <strong>InkWobble (Noise)</strong> — displaces visible stroke points.
          If placed before Build, Noise would displace the hidden endpoints of
          not-yet-revealed strokes, wasting GPU cycles and potentially
          introducing pop artefacts when those points become visible mid-build.
        </li>
        <li>
          <strong>EdgeSmooth</strong> — corrects Noise-induced kinks. Must be
          last so it has final say over the output positions. A smooth-before-
          noise stack would have Noise undo the smoothing immediately.
        </li>
      </ol>
      <p className="mt-2">
        You can verify the stack order matters by dragging EdgeSmooth above
        InkWobble in the modifier panel — the arrowhead joints show a visible
        elbow at factor ≥ 0.05 that the smooth pass no longer corrects.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Exporting for WebXR use
      </h2>
      <p className="mt-2">
        GP3 strokes do not export to GLB as geometry — the glTF 2.0
        specification has no stroke primitive. For WebXR use, two strategies
        work:
      </p>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Image sequence</strong>: render frames 1–90 as transparent
          PNGs (
          <code>scene.render.film_transparent = True</code>) and play them as a
          sprite/video texture on a quad in Three.js. Low runtime cost;
          pre-baked. Appropriate for tutorial overlays and explanatory diagrams.
        </li>
        <li>
          <strong>Convert to mesh then export</strong>:{" "}
          <code>bpy.ops.gpencil.convert(type='CURVE')</code> followed by
          <code>bpy.ops.object.convert(target='MESH')</code> bakes the
          build-modifier output at the chosen frame into mesh geometry that GLB
          accepts. You lose the animation but gain a static diagrammatic prop
          with full Holoflow WebXR material support. See the{" "}
          <Link
            href="/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline"
            className={lk}
          >
            Line Art toon outline tutorial
          </Link>{" "}
          for the operator chain.
        </li>
      </ul>
      <p className="mt-2">
        For the tutorial video itself, the image-sequence route is used:
        record.py renders 100 frames, then ffmpeg assembles{" "}
        <code>viewport.mp4</code>. The screen.mp4 recording (modifier panel
        walkthrough + live playback) is assembled in the studio VSE pipeline
        documented in the{" "}
        <Link
          href="/tutorials/blender-tutorial-vse-screen-recording-to-tutorial-export"
          className={lk}
        >
          VSE screen-recording-to-tutorial export tutorial
        </Link>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Troubleshooting — common failure modes
      </h2>
      <ul className="mt-2 list-disc pl-6 space-y-1 text-sm">
        <li>
          <strong>Build modifier shows nothing at any frame</strong>: confirm{" "}
          <code>use_restrict_frame_range = True</code> and that{" "}
          <code>frame_start &lt; frame_end</code>. A frame_start equal to
          frame_end collapses the build to a single frame — all strokes either
          fully visible or hidden with no in-between.
        </li>
        <li>
          <strong>layer_filter has no effect</strong>: the filter is a
          case-sensitive exact match. A layer named "Boxes" (capital B) will
          not match <code>layer_filter = "boxes"</code>. Verify with{" "}
          <code>[l.name for l in gp_data.layers]</code> in the Python console.
        </li>
        <li>
          <strong>Noise produces sawtooth on arrows</strong>: the two-point
          arrow shaft has no internal resolution to absorb displacement. Add
          more intermediate points (resize to 8, distribute evenly) or reduce
          Noise Factor to ≤ 0.04 for low-point strokes.
        </li>
        <li>
          <strong>material_index out of range error</strong>: GP3 requires
          materials to be appended to <code>gp_data.materials</code> (the data
          block) before strokes reference them by index. Appending to{" "}
          <code>gp_obj.material_slots</code> instead creates a slot but does
          not populate the GP3 material palette.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "an afternoon",
    difficulty: "intermediate",
    cost: "free",
    supplies: {
      materials: ["Blender 5.1"],
      tools: ["blueprint.py", "record.py", "ffmpeg (for viewport.mp4)"],
    },
    steps: [
      {
        title: "Run blueprint.py",
        body: "Open Blender 5.1 → Scripting workspace → open blueprint.py → Run Script. Three boxes, two arrows, and nine label strokes appear; five modifiers are visible in the Properties → Modifier panel.",
      },
      {
        title: "Verify layer names in Object Data",
        body: "Switch to Object Data Properties (green GP icon). Confirm three layers: 'boxes', 'arrows', 'labels'. These exact strings must match the layer_filter values in the Build modifiers — case-sensitive.",
      },
      {
        title: "Play the build animation",
        body: "Press Space at frame 1. Boxes draw from frames 1–42, arrows from 36–66, labels from 60–90. Frames 91–100 hold the settled diagram with the Noise wobble still active.",
      },
      {
        title: "Inspect the Noise modifier",
        body: "In Modifier Properties, expand InkWobble. Drag Factor from 0.03 → 0.15 → back. At 0.15 the boxes visibly deform; at 0.03 they read as hand-drawn ink. Set use_random to False to freeze the noise pattern at its current frame value.",
      },
      {
        title: "Confirm stack order",
        body: "Drag EdgeSmooth above InkWobble. Play back — arrowhead joints show a visible kink at the 2-point junction. Drag EdgeSmooth back below InkWobble to restore clean joints. This confirms the Noise-then-Smooth ordering is load-bearing.",
      },
      {
        title: "Spreadsheet POINT domain check",
        body: "Open Spreadsheet editor. Set object to pipeline_diagram. Set Domain to POINT. Step to frame 1 (no points yet), frame 25 (box strokes partial), frame 60 (boxes + arrows complete), frame 90 (all strokes revealed). Point count grows with Build stage completion.",
      },
      {
        title: "Run record.py for viewport.mp4",
        body: "Open record.py → Run Script. 100 PNG frames render to the frames/ subdirectory. Copy and run the printed ffmpeg command to produce viewport.mp4.",
      },
      {
        title: "Capture screen.mp4",
        body: "Follow SCREEN-RECORDING-NOTES.md. Essential takes: modifier panel walkthrough with tooltips, layer list scroll, Build playback at normal and 0.5× speed, Noise Factor live drag. Save to videos/grease-pencil/gp3-layer-modifier-build-reveal-animated-ink-diagram/screen.mp4.",
      },
    ],
  },
  {
    slug: "blender-tutorial-gp3-layer-modifier-build-reveal-animated-ink-diagram",
    title:
      "GP3 Layer Modifier Stack — Build + Noise + Smooth: Animated Self-Drawing Ink Diagram (Blender 5.1)",
    date: "2026-07-03",
    kind: "tutorial",
    excerpt:
      "Drive a Grease Pencil 3 pipeline diagram through a three-stage sequential Build reveal — boxes first, arrows second, labels last — using the layer_filter property to give each stage independent timing. A Noise modifier adds organic ink wobble; a Smooth modifier corrects arrowhead kinks. Covers the GP3 drawing API (frame.drawing.add_strokes, resize, radius/opacity per point), Build mode/transition/frame-range properties, modifier stack ordering, and two WebXR export strategies for GP3 geometry.",
    Body: Gp3LayerModifierBuildRevealBody,
  },
);
