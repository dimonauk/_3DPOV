import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Gp3CelAnimationBody() {
  return (
    <>
      <p>
        Frame-by-frame cel animation is the oldest digital-art form that
        predates computers: draw the key poses, fill in the in-betweens,
        photograph each cel. Grease Pencil 3 (GP3, shipped as default in
        Blender 4.3 and refined in 5.1) maps onto this model with unusual
        fidelity. Each layer owns a flat list of{" "}
        <code>GreasePencilFrame</code> objects keyed to timeline positions;
        between drawn frames the renderer holds the last drawing. No
        interpolation fires unless you add it — which is exactly what
        traditional animators expect.
      </p>

      <p className="mt-3">
        This tutorial builds the canonical animation test: a bouncing ball
        with squash, stretch, arc of motion, and timed spacing. It uses
        only five keyframes across 24 frames (one full bounce cycle at 24
        fps) to show how much expression comes from <em>where</em> you
        place keyframes on the timeline, not how many there are. All stroke
        data is written programmatically in <code>blueprint.py</code> so the
        exact ellipse geometry, material colours, and onion skinning
        configuration are reproducible and readable as specification, not
        mystery. Compare the pure-stroke approach here with the modifier-
        driven line-art method in the{" "}
        <Link
          href="/tutorials/blender-tutorial-grease-pencil-3-line-art-toon-outline"
          className={lk}
        >
          GP3 Line Art Toon Outline tutorial
        </Link>
        , which generates outlines <em>from</em> mesh geometry rather than
        authoring strokes directly.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The GP3 frame data model — what HOLD means
      </h2>
      <p className="mt-2">
        The most important conceptual shift from GP2:{" "}
        <code>layer.frames.new(frame_number)</code> creates a{" "}
        <em>GP drawing keyframe</em>, not an NLA or Dopesheet keyframe. The
        two systems are entirely independent. Animating the position of the
        whole GP3 object across the timeline requires separate object
        keyframes (via <code>obj.keyframe_insert</code>); animating which
        drawing is shown at each frame is controlled by which{" "}
        <code>layer.frames</code> entries exist.
      </p>
      <p className="mt-3">
        Between two drawing keyframes the renderer shows the <em>last</em>{" "}
        drawn frame — a HOLD. This is not a bug or a default setting to
        disable; it is the definition of how traditional cel animation works.
        Smooth mathematical in-betweening is optional and would be added via
        the <code>GREASE_PENCIL_BUILD</code> modifier or by inserting
        hand-drawn tween drawings at intermediate frame numbers.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Squash & stretch as point arrays
      </h2>
      <p className="mt-2">
        Squash and stretch in GP3 is not a modifier parameter — it is
        different point coordinate data per frame. The{" "}
        <code>ellipse_pts(cx, cy, rx, ry)</code> helper in the blueprint
        generates a closed polyline at a specified centre and with
        independently controllable x- and y-radii. At the impact frame
        (frame 12): <code>rx=0.50, ry=0.13</code> — wide and flat. At the
        rebound (frame 14): <code>rx=0.18, ry=0.44</code> — tall and
        narrow. These are added to separate{" "}
        <code>layer.frames.new(12)</code> and{" "}
        <code>layer.frames.new(14)</code> objects; the GP3 renderer jumps
        between them with no interpolation, giving the snappy elastic feel
        of classic bouncy-ball animation.
      </p>
      <p className="mt-3">
        The shape transition is abrupt by design. In a hand-drawn production
        pipeline you would add one or two drawn in-betweens between frames
        12 and 14 (the squash and the stretch) to smooth the transition.
        Because those frames are so close together — just 2 timeline frames
        at 24 fps = 83 ms — most audiences do not perceive the snap as a
        jump. This is the same technique used in classic Warner Bros. and
        Tex Avery cartoons where impact deformation is exaggerated precisely
        <em>because</em> it is brief.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Timing: frame spacing and perceived physics
      </h2>
      <p className="mt-2">
        The five keyframe positions are not evenly spaced:
      </p>
      <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
        <li>
          <strong>Frames 1 → 7</strong> (6 frames, fast fall): the ball
          accelerates downward under gravity — more distance per frame
          means wider spacing.
        </li>
        <li>
          <strong>Frames 7 → 12</strong> (5 frames, closing on ground):
          faster still, tightly spaced.
        </li>
        <li>
          <strong>Frames 12 → 14</strong> (2 frames, elastic impact): the
          fastest segment of the whole arc — squash and stretch flash by
          in under 85 ms.
        </li>
        <li>
          <strong>Frames 14 → 24</strong> (10 frames, slow rise):
          decelerating upward against gravity — widest spacing, slowest
          apparent motion.
        </li>
      </ul>
      <p className="mt-3">
        These proportions come from treating the bounce as a parabola: the
        ball spends more time near the apex (where velocity is lowest) and
        less time near the ground (where it is highest). Spacing your
        keyframes to reflect this gives an animation that reads as physical
        even without any simulation. For a deeper look at F-curve-based
        timing control, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-animation-fcurve-modifiers-noise-cycles-stepped"
          className={lk}
        >
          F-Curve Modifiers tutorial
        </Link>{" "}
        — the Stepped modifier there is the mathematical inverse of what we
        are doing here: instead of hand-spacing keyframes, it forces a
        hold-step pattern onto a smooth F-curve.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Onion skinning API</h2>
      <p className="mt-2">
        Onion skinning superimposes translucent copies of neighbouring
        drawings over the current frame so you can judge timing and spacing
        without playing back. In GP3 the settings sit on the{" "}
        <code>bpy.types.GreasePencil</code> datablock rather than on
        individual layers:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-xs">
        {`gp.use_onion_skinning   = True
gp.onion_mode           = "ABSOLUTE"  # show N nearest drawn frames
gp.onion_before_range   = 2           # up to 2 previous drawings
gp.onion_after_range    = 1           # 1 upcoming drawing
gp.onion_factor         = 0.45        # ghost opacity
gp.onion_color_before   = (0.145, 0.475, 0.850)  # blue — past
gp.onion_color_after    = (0.765, 0.122, 0.122)  # red — future
gp.onion_keyframe_type  = "ALL"`}
      </pre>
      <p className="mt-3">
        <code>onion_mode='ABSOLUTE'</code> shows the N nearest{" "}
        <em>drawn</em> keyframes regardless of how many timeline frames
        apart they are — the most useful mode for sparse frame-by-frame
        work. <code>onion_mode='RELATIVE'</code> shows the N frames before
        and after the current frame number, which means it ghosts hold
        frames where no drawing changed. Each layer can independently opt
        out via <code>layer.use_onion_skinning = False</code> — the
        blueprint uses this on the BG (floor) and Shadow layers so only the
        Ball layer contributes onion skins to the viewport.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Proximity shadow — a drawn convention
      </h2>
      <p className="mt-2">
        A separate Shadow layer holds a flattened ellipse at the floor level
        for each keyframe. Its x-radius scales inversely with the ball&rsquo;s
        height above the ground: large shadow when the ball is close, small
        shadow when it is at the apex. This encodes a light-proximity
        relationship with no physics simulation — the same convention used
        in traditional cel animation where shadows were painted on a
        separate paper layer placed beneath the character layer. The
        <code>use_onion_skinning = False</code> flag keeps the shadow layer
        clean; ghosted shadow ellipses would clutter the onion-skin
        display without adding useful timing information.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Viewport render vs EEVEE render
      </h2>
      <p className="mt-2">
        <code>record.py</code> uses{" "}
        <code>bpy.ops.render.opengl(animation=True)</code> rather than{" "}
        <code>bpy.ops.render.render(animation=True)</code>. The distinction
        matters: the OpenGL viewport render composites the GP3 overlay
        including onion skin ghost frames, making it visible in the output
        frames. The EEVEE render pipeline does not include viewport overlays
        — it renders only the geometry as EEVEE would shade it, which gives
        clean output for compositing (used in{" "}
        <code>blueprint.py</code>). For a compositing workflow that takes
        those clean PNG frames and adds colour grading or film grain, see
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-toon-cel-shader"
          className={lk}
        >
          EEVEE toon cel-shader tutorial
        </Link>
        , which uses a similar transparent-background render setup for a
        mesh-based cel shading approach.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Outside sources and further reading
      </h2>
      <ul className="mt-2 ml-4 list-disc space-y-1 text-sm">
        <li>
          Blender Manual: Grease Pencil Layers —{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/grease_pencil/animation/layers.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org
          </a>{" "}
          — CC-BY-SA-4.0 — Blender Foundation. Related:{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/grease_pencil/animation/drawing.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Drawing on Frames
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/grease_pencil/display/onion_skinning.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Onion Skinning
          </a>
          .
        </li>
        <li>
          njanakiev/blender-scripting — MIT — Nicolas Janakiev —{" "}
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/njanakiev/blender-scripting
          </a>
          . Sibling repo:{" "}
          <a
            href="https://github.com/njanakiev/blender-jupyter"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            blender-jupyter
          </a>{" "}
          (MIT) — running Blender bpy inside Jupyter for iterative scripting.
        </li>
        <li>
          bpy.types.GreasePencil Python API reference — CC-BY-SA-4.0 —
          Blender Foundation —{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GreasePencil.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            docs.blender.org/api/current
          </a>
          . Related:{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GreasePencilLayer.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            GreasePencilLayer
          </a>
          ,{" "}
          <a
            href="https://docs.blender.org/api/current/bpy.types.GreasePencilFrame.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            GreasePencilFrame
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-gp3-frame-by-frame-cel-animation",
  title:
    "Grease Pencil 3 — Frame-by-Frame Cel Animation: Bouncing Ball, Onion Skinning & PNG Sequence Render",
  subtitle:
    "Squash & stretch, timing via frame spacing, the HOLD model, and onion skinning configuration in Blender 5.1 GP3.",
  date: "2026-06-27",
  tags: ["blender", "grease-pencil", "animation", "cel-animation", "2d"],
  body: <Gp3CelAnimationBody />,
});
