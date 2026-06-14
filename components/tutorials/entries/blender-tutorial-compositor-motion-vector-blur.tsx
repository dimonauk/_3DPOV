import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorMotionVectorBlurBody() {
  return (
    <>
      <p>
        Every EEVEE render is a snapshot: the scene is evaluated at one
        exact frame, rasterised, and written to disk.  Motion blur — the
        streak that communicates speed — is not in that snapshot.  Blender
        offers two ways to add it back.  The first, EEVEE&apos;s built-in
        motion blur, accumulates sub-frame samples during rasterisation:
        cheap, but it produces ghosting artefacts at alpha edges in
        multi-layer composites, and its quality is hard-capped by the TAA
        sample budget.  The second, and the subject of this tutorial, is the{" "}
        <strong>Motion Vector render pass</strong> combined with the{" "}
        <strong>Vector Blur compositor node</strong>: motion blur applied
        entirely in post, after every pixel has been resolved.
      </p>
      <p className="mt-3">
        The Motion Vector (Speed) pass encodes per-pixel 2D velocity as a
        float32 EXR buffer.  Blender&apos;s convention splits the four
        channels into two pairs: R,G carry the <em>backward</em> vector
        (displacement from the previous frame to the current one) and B,A
        carry the <em>forward</em> vector (displacement to the next frame).
        A stationary pixel stores all zeros.  A pixel on the equator of a
        sphere spinning 10° per frame stores a lateral displacement in pixels
        proportional to the sphere&apos;s screen-space radius and the angular
        step.  The VecBlur node reads this split-channel layout, steps{" "}
        <code>samples</code> times along each pixel&apos;s velocity vector,
        and accumulates colour — effectively performing a per-pixel
        directional box blur.  The Z (depth) pass is wired in so that
        near-geometry streaks correctly overwrite far-geometry streaks: the
        gem&apos;s trailing edge does not bleed through the background.
      </p>
      <p className="mt-3">
        This approach is roughly ten times faster than Cycles path-traced
        motion blur at comparable visual quality for rigid-body animation,
        because the blur is a single compositor pass over an already-complete
        render rather than N times more ray samples.  The trade-off is linear
        motion assumption: VecBlur draws a straight streak from the backward
        vector to the forward vector within a single frame&apos;s shutter.  If
        an object reverses direction mid-frame (a bouncing ball at apex) the
        streak will be straight rather than curved.  For constant rotation or
        translation it is exact.  Compare with the Cycles approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-render-cycles-dof-motion-blur-bokeh"
          className={lk}
        >
          DoF + Cinematic Motion Blur tutorial
        </Link>
        , which traces physically correct curved arcs but pays full sample
        cost for every blurred pixel.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Enabling the pass and understanding the channel layout
      </h2>
      <p>
        The pass is not active by default.  In Python:{" "}
        <code>scene.view_layers[0].use_pass_vector = True</code>.  In the UI:
        Properties → View Layer → Passes → Data → Motion Vector.  Once
        enabled, EEVEE Next computes per-object transform deltas for every
        rendered frame; the result appears on the{" "}
        <code>render_layers.outputs[&apos;Vector&apos;]</code> socket in the
        compositor.
      </p>
      <p className="mt-3">
        The channel convention matters if you ever pull the EXR into another
        compositor.  Nuke and DaVinci Resolve expect R,G = forward; B,A =
        backward — the opposite of Blender.  To use a Blender motion vector
        EXR in those applications, pass it through a Shuffle node that swaps
        R↔B and G↔A before wiring into their MotionBlur nodes.  This tutorial
        stays entirely inside Blender, so the VecBlur node reads Blender&apos;s
        convention natively — no shuffle needed.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        VecBlur parameters — what each control actually does
      </h2>
      <p>
        <strong>Speed</strong> is a linear multiplier on the raw vector
        magnitude before the streak is drawn.  At 1.0, the streak length
        equals the actual frame-to-frame screen displacement in pixels.  At
        0.75 (the blueprint default) each streak is 75% of that: slightly
        subtler, still readable.  At 0.5 the effect reads as a conventional
        film-shutter blur; at 1.5 it reads as hyper-kinetic, suitable for
        stylised action.
      </p>
      <p className="mt-3">
        <strong>Max Speed</strong> (in pixels) clamps the streak length.  Without
        it, objects crossing a large portion of the frame — a fast projectile,
        or geometry very close to the camera — produce streaks that tile poorly
        and can run off the frame edge.  80 px is a good upper bound for most
        scenes.  Set it to 0 to disable the clamp.
      </p>
      <p className="mt-3">
        <strong>Samples</strong> controls how many discrete steps are taken
        along each pixel&apos;s velocity vector.  Below 16, banding is visible
        in the streak — discrete steps are wide enough to produce a ladder
        artefact.  32 is clean for most renders; 64 is indistinguishable from
        higher counts and appropriate for film-resolution output.
      </p>

      <p className="mt-4">
        The compositor pipeline here slots naturally into the broader
        post-processing chain from the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Glare + Film Grain + Tone Map tutorial
        </Link>
        : the VecBlur node&apos;s output feeds the Glare node&apos;s input, so
        motion streaks from bright metallic highlights carry their bloom with
        them.  For multi-object scenes that need per-object blur isolation, the
        workflow from{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr"
          className={lk}
        >
          Cryptomatte + Multi-Layer EXR
        </Link>{" "}
        lets you apply VecBlur per render layer before recombining — essential
        when background and foreground objects move at very different speeds
        and you need independent streak lengths.  The metallic gem material
        driving the bright specular highlights in this scene is an application
        of the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          EEVEE Next SSR
        </Link>{" "}
        technique; enabling ray tracing on the renderer is what gives the coat
        highlight its sharp definition at low roughness.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-motion-vector-blur",
  title:
    "Compositor — Motion Vector Pass + Vector Blur: Fast EEVEE Motion Blur",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Enable Blender 5.1's Motion Vector render pass, wire the Vector Blur compositor node with correct Z depth ordering, and produce cinematic motion blur in post-processing — ten times faster than Cycles path-traced blur for rigid-body animation, with full bpy blueprint.",
  Body: CompositorMotionVectorBlurBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath: "blends/compositing/compositor-motion-vector-blur",
    time: "one focused session",
    difficulty: "intermediate",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
      },
    ],
    prerequisites: [
      "Comfortable running Python scripts from Blender's Text Editor (Alt+P)",
      "Basic familiarity with the Compositing workspace and the Use Nodes toggle",
      "Understanding of render passes (Z depth, Image output from Render Layers node)",
    ],
    steps: [
      {
        title: "Run blueprint.py and inspect the scene",
        body: `Open Blender 5.1 — File › New › General. Open the Text Editor (Shift+F11), paste blueprint.py, and press Alt+P.\n\nThe script builds a cobalt-blue metallic faceted Icosphere (flat-shaded, 2 subdivisions), adds a key light and fill light, sets the camera at 50 mm from 6 m, and keyframes a 360° Z-axis rotation over 36 frames.\n\nCrucially, it enables the Motion Vector pass: scene.view_layers["ViewLayer"].use_pass_vector = True. Open Properties › View Layer › Passes › Data — you'll see Motion Vector and Z both ticked. Without these two passes, the Vector Blur node in the compositor has nothing to read from.\n\nSwitch to Rendered shading (Z › Rendered) and press Space to play the timeline — the gem should spin one full revolution over 1.5 seconds at 24 fps. Confirm the motion is smooth and LINEAR (no ease-in/ease-out) — the blueprint forces LINEAR keyframe interpolation so the velocity is constant and the motion vectors have uniform magnitude on every frame.`,
      },
      {
        title: "Explore the compositor node tree",
        body: `Switch to the Compositing workspace. The blueprint has already wired three nodes:\n\n  Render Layers → VecBlur → Composite\n                         → Viewer\n\nThe Render Layers node exposes three sockets we use:\n- **Image**: the colour render (RGBA, scene-linear float32).\n- **Depth**: the Z pass (distance from camera in Blender units; needed by VecBlur for near-over-far ordering).\n- **Vector**: the Motion Vector pass (R,G = backward displacement; B,A = forward displacement, in pixels).\n\nHover over the Vector output socket and read the tooltip — it should say "Speed". Click the Viewer node and open the UV/Image Editor (Shift+F10 in a viewport) — after rendering, you can inspect the raw motion vectors here as a false-colour image (moving pixels appear coloured; stationary pixels are black).\n\nThe VecBlur node inputs:\n- **Image** → colour to smear.\n- **Z** → depth for ordering.\n- **Speed** → the motion vector pass.\n\nParameters: Samples=32, Speed=0.75, Min Speed=0, Max Speed=80, Curved=OFF.`,
      },
      {
        title: "Render frame 18 — the 180° midpoint",
        body: `Set the timeline to frame 18 (the 180° rotation midpoint). At this frame the gem's equator is moving directly left across the screen — the largest lateral velocity for any point on the surface.\n\nPress F12. EEVEE renders the frame plus all enabled passes. The compositor then runs automatically: VecBlur samples 32 steps along each pixel's backward+forward vector and accumulates colour. The output is a cobalt-blue streak arcing from the trailing edge of the gem.\n\nInspect the result in the UV/Image Editor. Notice:\n- The leading edge (direction of travel) shows the gem's sharpest face.\n- The trailing edge fans out into a fading streak — this is the backward vector being traced.\n- The background (zero motion) is perfectly sharp. VecBlur only blurs pixels where the Speed pass is non-zero.\n- Near the camera-facing pole of the sphere, where surface movement is toward/away from camera rather than lateral, the streak is shorter — the screen-space vector for polar points has a smaller X,Y component.\n\nRender time on a mid-range GPU: typically 0.8–2.5 s for the EEVEE frame + 0.1 s for the compositor pass.`,
      },
      {
        title: "A/B comparison — mute the VecBlur node",
        body: `With the blurred render visible in the UV/Image Editor, hover the cursor over the VecBlur node in the compositor and press M to mute it.\n\nPress F12 again. The render skips VecBlur entirely and sends the clean EEVEE frame direct to Composite. You'll see the sharp, faceted gem with no motion blur at all — identical to what EEVEE always produced before you enabled the compositor chain.\n\nUnmute (M again) and re-render. The streak reappears. This A/B is the most direct way to demonstrate what the Vector Blur node contributes, and it's the heart of the screen recording for this tutorial (see SCREEN-RECORDING-NOTES.md).\n\nKey observation: the sharp frame and the blurred frame are computed from the SAME render data. VecBlur adds zero render time — the cost is only the compositor pass, which runs on the CPU and takes a fraction of a second.`,
      },
      {
        title: "Tune Speed and Max Speed interactively",
        body: `With VecBlur active, change the Speed parameter from 0.75 to 1.5 and re-render frame 18. The streak doubles in length — the gem almost becomes a full disc at the equator. This is visually useful for stylised fast-motion effects (drone footage, racing assets for WebXR).\n\nChange Speed back to 0.5 and re-render. The streak is subtle — it reads as a conventional 180° film shutter on a slightly slow rotation. This is appropriate for subtle product-viz blur that communicates rotation without distracting from material detail.\n\nNow change Max Speed from 80 to 20 and re-render at Speed=1.5. The streak is now hard-capped at 20 px regardless of the raw vector magnitude — you'll see a uniform-length smear rather than the characteristic taper. Max Speed is most important for fast-moving objects in the corner of the frame, where screen-space velocity is highest, to prevent streaks from running off the edge or across unrelated geometry.\n\nFinally, change Samples from 32 to 4 and re-render. Count the visible bands in the streak — discrete steps are wide enough to create a ladder artefact. Raise back to 32 or 64 for production.`,
      },
      {
        title: "Render the full animation",
        body: `With parameters tuned to your liking, set Scene › Frame Range back to 1–36 and press Ctrl+F12 (Render Animation). Blender renders each frame through EEVEE + the VecBlur compositor pass, writing a PNG sequence to the //render/ directory relative to the .blend file.\n\nAlternatively, run record.py from the Text Editor: it renders 60 frames (30 without blur, 30 with) and encodes them to viewport.mp4 via ffmpeg if installed. This comparison clip is the viewport.mp4 artefact expected in the library.\n\nImportant: save the scene as vecblur_demo.blend (Ctrl+S, name it in the File Browser) before running the animation render, so the relative //render/ path resolves correctly.`,
      },
    ],
    finalResult:
      "A Blender 5.1 EEVEE compositor pipeline that enables the Motion Vector render pass and uses the Vector Blur node to produce cinematic motion-blur post-processing at a fraction of the cost of Cycles path-traced blur. The blueprint builds the full scene and node tree via bpy; the record.py outputs a 60-frame comparison clip demonstrating the difference between raw and blurred renders.",
    variations: [
      "Chain VecBlur into the Glare pipeline: connect VecBlur's Image output into a Glare node (Fog Glow, threshold=0.60) before the Composite node. Motion streaks from bright metallic highlights carry their bloom with them — the trailing smear glows. This is the production chain for stylised WebXR asset previews where speed and specular together read as energy.",
      "Per-layer blur for multi-speed scenes: in a scene with a fast foreground object and a slow background, render them on separate view layers (each with its own motion vector pass and VecBlur node), then recombine with an Alpha Over node. Each layer gets its own Speed parameter — foreground at Speed=1.2 for dramatic smear, background at Speed=0.3 for subtle environmental drift. See the Cryptomatte + Multi-Layer EXR tutorial for the full multi-layer pipeline.",
      "Use_curved=True for arc correction: on objects rotating rapidly in a tight circle (e.g. a fan blade crossing 30°+ per frame), enable Curved on the VecBlur node. This blends between the backward and forward vector along a curved arc rather than a straight line. The effect is subtle below 15°/frame but removes the slight straight-streak artifact at high rotation rates.",
    ],
    troubleshooting: [
      {
        symptom: "Vector output socket on Render Layers is greyed out or missing",
        cause:
          "The Motion Vector pass is not enabled on the active view layer. The socket only appears in the compositor once use_pass_vector = True on the view layer and the scene has been rendered at least once.",
        fix: "In Properties → View Layer → Passes → Data, tick Motion Vector. Alternatively, ensure the blueprint.py script ran to completion without error — look for any Python traceback in the Blender Info bar (Window › Toggle System Console on Windows to see the full output). After ticking the pass, press F12 once to populate the socket.",
      },
      {
        symptom: "Render shows motion blur but it is applied to static geometry too",
        cause:
          "EEVEE's own render-time motion blur (scene.eevee.use_motion_blur = True) is active simultaneously with the compositor VecBlur. The render-time blur smears every moving object during rasterisation; the compositor VecBlur then smears again. The result is a double-smear artifact — blurry even on frames where the object has barely moved.",
        fix: "Set scene.eevee.use_motion_blur = False (the blueprint sets this by default). Only the compositor VecBlur should be active. Check Properties → Render → Motion Blur — the checkbox should be unticked.",
      },
      {
        symptom: "VecBlur produces no effect — output looks identical to the raw render",
        cause:
          "The Speed (Vector) input is receiving a zero-value pass. Either the object has no animation keyframes, the animation is on a channel not captured by the transform matrix (e.g. a texture coordinate driver that doesn't move geometry), or the scene is being rendered on a frame where the object is stationary (frames 1 or 37 in the blueprint's 36-frame loop, where velocity wraps to zero).",
        fix: "Render on frame 18 where the gem is at 180° — the lateral velocity is maximum there. In the Viewer node output, switch the UV/Image Editor to display the Vector pass directly (select it from the Render Result slot list): moving pixels appear as coloured blobs, stationary pixels are black. If the entire image is black, the motion vector pass is genuinely zero and the object has no transform animation on the rendered frame.",
      },
      {
        symptom:
          "Deformable cloth or fluid simulation shows no motion blur from VecBlur",
        cause:
          "EEVEE Next's Vector pass is computed from per-object transform matrices, not per-vertex positions. Cloth, fluid, soft body, and shape-key animation all move individual vertices without changing the object's world-space transform matrix — these motions are invisible to the motion vector pass.",
        fix: "For deformable geometry, use EEVEE's render-time motion blur (scene.eevee.use_motion_blur = True, motion_blur_shutter = 0.5). This performs sub-frame sampling of the deformed mesh positions at render time and produces accurate per-vertex blur. Combine both approaches: render-time blur for deformable objects on one layer, compositor VecBlur for rigid-body objects on another layer, then composite.",
      },
    ],
  },
  base,
);

export { entry };
