import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function RenderCyclesDofMotionBlurBokehBody() {
  return (
    <>
      <p>
        Two optical effects govern how a camera lens records motion and depth.
        <strong> Depth of Field</strong> arises because a lens can only focus
        sharply at one distance at a time; surfaces at other depths project onto
        a disc on the film plane rather than a point.  The disc&rsquo;s radius
        — the <em>Circle of Confusion</em> — is proportional to{" "}
        <code>f² / N</code> (focal length squared divided by f-number), so
        an 85&nbsp;mm lens at f/1.4 produces roughly 15× the bokeh area of
        a 24&nbsp;mm lens at the same aperture.  Setting{" "}
        <code>cam.dof.aperture_blades = 6</code> tells Cycles to model a
        six-blade iris diaphragm, giving the hexagonal bokeh discs
        characteristic of fast prime lenses.  <strong>Motion Blur</strong>{" "}
        accumulates vertex positions across the open-shutter interval:{" "}
        <code>scene.render.motion_blur_shutter = 0.5</code> is the cinema
        180° rule — each frame exposes for half the frame period, producing
        streaks proportional to subject speed divided by frame rate.  Cycles
        samples intermediate positions using{" "}
        <code>cycles.motion_blur_position = &quot;CENTER&quot;</code>, which
        samples at the middle of the shutter window rather than the start,
        giving an unbiased temporal average.
      </p>

      <p>
        The scene built by <code>blueprint.py</code> places five faceted glass
        gems at increasing depths along the camera&rsquo;s view axis.  The
        camera sits at Y&nbsp;=&nbsp;&minus;2&nbsp;m; the gems step from
        Y&nbsp;=&nbsp;1.5&nbsp;m (purple, near) through Y&nbsp;=&nbsp;4.5&nbsp;m
        (gold, focus target) to Y&nbsp;=&nbsp;8&nbsp;m (red, far).  Because the
        camera tracks the gold gem via a Track-To constraint, all depth
        measurements are stable across the 120-frame dolly.  Each gem uses a
        Principled BSDF at{" "}
        <code>Transmission Weight = 0.92</code> and{" "}
        <code>IOR = 1.82</code> — values that produce visible internal
        reflections and contribute strongly to the bokeh shape.  Compare the
        glass material setup with the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-light-path-glass-fireflies"
          className={lk}
        >
          Cycles light path node: glass without fireflies tutorial
        </Link>
        , where the same IOR range is explored in depth with the Light Path
        node to suppress caustic noise.
      </p>

      <p>
        The lateral dolly — a constant-speed X translation from +0.80&nbsp;m
        to &minus;0.80&nbsp;m over 120 frames — is intentionally linear (not
        eased) because ease-in/ease-out curves produce variable blur lengths
        that obscure the direct relationship between shutter angle and streak
        extent.  At 24&nbsp;fps with{" "}
        <code>motion_blur_shutter = 0.5</code>, a gem whose screen-space
        velocity is 120&nbsp;px/frame will produce a 60-px streak.  Out-of-focus
        gems smear further than in-focus ones because their enlarged CoC
        discs integrate a wider range of positions.  This interaction — bokeh
        discs growing directional tails — is the hallmark that distinguishes
        rendered cinematic motion blur from a simple Gaussian post-process
        smear.  The compositor approach to adding filmic grain and tone mapping
        over the resulting render is covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Compositor glare, film grain &amp; tone mapping pipeline
        </Link>
        .
      </p>

      <p>
        Aperture blade count is worth exploring at render time because it
        changes the perceived &ldquo;feel&rdquo; of a shot more than f-stop alone.
        Six blades ({"`APERTURE_BLADES = 6`"}) produce a hexagonal disc with a
        slightly clinical quality favoured for product shots.  Three blades
        give a stark triangular highlight that reads as deliberate art direction.
        Zero forces a perfect mathematical circle — physically unrealisable in
        a real lens but clean for stylised renders.  The rotation parameter
        ({"`APERTURE_ROT`"}) tilts the polygon; at 30° a hex becomes a bow-tie
        shape in extreme foreground blur.  These decisions connect to the
        light-linking and hero-rig decisions described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-light-linking-character-rig"
          className={lk}
        >
          EEVEE-Next light linking: three-light character hero rig tutorial
        </Link>
        , where aperture choices in the camera rig interact with the
        specular highlight shape on skin materials.
      </p>

      <p>
        The mathematical foundation for the aperture sampling used by Cycles
        is formalised in the <em>pbrt-v4</em> physically based rendering
        reference implementation (Apache-2.0, Matt Pharr et al.,{" "}
        <a
          href="https://github.com/mmp/pbrt-v4"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/mmp/pbrt-v4
        </a>
        ; companion text at{" "}
        <a
          href="https://pbr-book.org"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          pbr-book.org
        </a>
        ).  The{" "}
        <code>src/cameras/perspective.cpp</code> aperture sampling routine is
        the same concentric-disc mapping Cycles uses internally — sampling
        uniform area across a disc then projecting to sensor coordinates.
        The Blender manual&rsquo;s{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/render/cameras/depth_of_field.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Depth of Field reference page
        </a>{" "}
        (CC0, Blender Foundation) maps each API property to its physical
        analogue and is the authoritative reference when blueprint constants
        need to match a real lens specification.  For the displacement and
        micropolygon substrate that DoF blur operates on, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles adaptive subdivision + true displacement tutorial
        </Link>
        .
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-render-cycles-dof-motion-blur-bokeh",
  title:
    "Cycles — Cinematic Camera Rig: Depth of Field (Polygon Bokeh) + Rendered Motion Blur (Blender 5.1)",
  date: "2026-06-12",
  kind: "tutorial",
  excerpt:
    "Camera depth of field at the physics level: Circle of Confusion formula, aperture_fstop, aperture_blades (hex/triangle/circle bokeh), aperture_ratio for anamorphic ovals. Rendered motion blur: motion_blur_shutter (180° rule), motion_blur_position CENTER vs START. Lateral dolly animation shows bokeh discs growing directional tails. All via bpy API. Blender 5.1.",
  Body: RenderCyclesDofMotionBlurBokehBody,
};

export const entry = buildInstructable(
  {
    time: "45 minutes",
    difficulty: "intermediate",
    cost: "free — Blender 5.1, Cycles (GPU recommended)",
    supplies: {
      materials: [
        "Blender 5.1",
        "blueprint.py from public/library/blends/rendering/render-cycles-dof-motion-blur-bokeh/",
        "GPU with CUDA/Metal/HIP or CPU fallback (Cycles)",
      ],
      tools: [
        "Scripting workspace (run blueprint.py)",
        "Properties → Camera tab (camera icon) → Depth of Field panel",
        "Properties → Render tab → Motion Blur panel",
        "Render Result window (F12)",
        "Timeline (scrub to frame 60 for peak motion blur)",
      ],
    },
    steps: [
      {
        title: "Run blueprint.py — verify the scene",
        content: `Open Blender 5.1.  Switch to the Scripting workspace.
Click Open → load blueprint.py.  Click Run Script.

The Python console prints:
  DOF + Motion Blur scene ready.
  F12 → render current frame
  Frame 60 → mid-dolly: render here for full motion-blur smear

Switch to the Layout workspace.  Press Numpad 0 for Camera view.
You should see five gem-shaped objects receding along the camera axis,
the gold gem in the centre, purple gem closest, red gem furthest.

In EEVEE viewport shading you will already see a soft blur on the near
and far gems from EEVEE's screen-space DoF approximation.  Cycles gives
the physically correct disc shape when you render.`,
      },
      {
        title: "Explore DoF settings in the Camera panel",
        content: `Click the camera object in the viewport or outliner.
Open Properties → Camera tab (camera icon, left column).

Scroll to the Depth of Field section.  You'll see:
  Focus Object: gem_focus  (the gold gem)
  f-stop:  1.4
  Blades:  6
  Rotation: 0.0°

The Focus Object pin means the focal plane tracks the gem even when the
camera dollies — no manual focus-distance updates needed.

Experiment:
  Change Blades to 0 → circular bokeh (press F12 to preview)
  Change Blades to 3 → triangular bokeh
  Return to 6 for the rest of the tutorial.

Change f-stop to 8.0 — in the viewport all gems should look nearly sharp.
Return to 1.4 for maximum blur.`,
      },
      {
        title: "Render frame 1 — inspect DoF in Cycles",
        content: `Make sure the timeline is on frame 1 (camera at dolly start, no motion yet).
Press F12.  Cycles opens the render view.

With SAMPLES = 128 and OPENIMAGEDENOISE enabled, the render takes roughly:
  20–60 s on a mid-range GPU
  2–5 min on CPU

When complete, examine the result:
  Gold gem (centre, focus):   sharp edges, crisp facets
  Cyan / green gems (mid):    moderate hex blur discs
  Purple gem (near):          large soft hex bokeh blob in foreground
  Red gem (far):              large soft hex bokeh blob in background

The bokeh shape is hexagonal because APERTURE_BLADES = 6.
If the discs look circular, check that Render Properties → Sampling is
set to Cycles (not EEVEE) and that the Camera DoF panel shows Blades = 6.`,
      },
      {
        title: "Render frame 60 — add motion blur",
        content: `Scrub the timeline to frame 60 (mid-dolly).
Press F12.

The camera is now travelling from right to left at peak speed.
In the render you'll see:
  All gems: slight horizontal smear from camera lateral motion
  Near/far gems: smear is wider because their large CoC discs each
                 integrate a broader band of camera positions
  Gold gem (focus): smear is narrower — less CoC, tighter integration

This widening of motion blur on bokeh discs is the optical signature of
physically correct motion blur.  A post-process blur layer applied to a
still frame cannot reproduce it.

Open Render Properties → Motion Blur.  Change Shutter from 0.5 to 0.1
and re-render — the streaks shrink.  Change to 1.0 — unrealistically long
streaks appear.  Return to 0.5 (180° rule).`,
      },
      {
        title: "Render the full sequence",
        content: `Press Ctrl+F12 (or Render → Render Animation).
Cycles writes PNG files to the path set in OUTPUT_PATH:
  //renders/dof_bokeh_0001.png … dof_bokeh_0120.png

This takes considerably longer than a single frame.
Estimate: (single frame time) × 120 ÷ (GPU parallel efficiency ≈ 1).
For a 60-second single frame: expect 2 hours on CPU, 10–20 min on GPU.

To reduce time during testing:
  Lower SAMPLES to 32 in blueprint.py (re-run the script after changing)
  Lower RESOLUTION_X/Y to 960×540

Once complete, convert the sequence to MP4 in a terminal:
  ffmpeg -r 24 -i renders/dof_bokeh_%04d.png \\
         -c:v libx264 -pix_fmt yuv420p \\
         renders/dof_bokeh.mp4`,
      },
      {
        title: "Run record.py — rack-focus viewport preview",
        content: `Open record.py in the Scripting workspace.  Click Run Script.

record.py animates the focus distance from 3.5 m (near gem depth) to
10.0 m (far gem depth) over 60 frames — a rack focus pull — and renders
a quick EEVEE viewport sequence.

The output directory is:
  public/library/videos/rendering/render-cycles-dof-motion-blur-bokeh/

Convert to MP4 with the ffmpeg command printed in the Python console.

WHY EEVEE for the preview: EEVEE uses screen-space DoF, which is fast but
approximates the bokeh shape.  The preview is good enough to show the rack
focus timing and confirm the focus range is correct before committing to
a full Cycles render.`,
      },
      {
        title: "Screen recording",
        content: `Follow SCREEN-RECORDING-NOTES.md for a 4–6 minute OBS capture.

Key shots to capture:
  1. Five-gem scene from Camera view — show depth layering
  2. Camera Properties → Depth of Field panel — change blades live
  3. F12 render result — show hex bokeh discs
  4. Frame 60 render — show motion-blur streaks growing on bokeh discs
  5. Shutter angle comparison: 0.1 vs 0.5 vs 1.0

Save to:
  public/library/videos/rendering/render-cycles-dof-motion-blur-bokeh/screen.mp4`,
      },
    ],
    troubleshooting: [
      {
        problem: "Bokeh discs are circular even with Blades = 6",
        solution:
          "Blades below 3 forces a circle regardless of the input value. Confirm Blades ≥ 3 in the Camera panel. Also verify Render Engine is Cycles — EEVEE ignores the blade count and always produces a circular aperture in its screen-space DoF.",
      },
      {
        problem: "No motion blur visible in render",
        solution:
          "Confirm Render Properties → Motion Blur is ticked AND that you are on a frame > 1. Frame 1 is the dolly start position; there is no motion before that frame so blur is zero. Render frame 60 for peak dolly speed.",
      },
      {
        problem: "Render is extremely noisy around bokeh edges",
        solution:
          "Raise SAMPLES to 256 or 512. DoF bokeh is one of the most sampling-hungry effects in path tracing because each pixel must integrate across a wide disc footprint. Also confirm OPENIMAGEDENOISE is enabled (cycles.use_denoising = True). Increasing Light Path bounces does not help — this is a sampling density issue, not a bounces issue.",
      },
      {
        problem: "Gold gem (focus target) is blurred instead of sharp",
        solution:
          "Check that cam.dof.focus_object is set to bpy.data.objects['gem_focus'] and not None. If focus_object is None, Blender falls back to focus_distance, which defaults to 10 m — far past the gold gem. Re-run blueprint.py to restore the focus object binding.",
      },
      {
        problem: "Motion blur streaks are vertical rather than horizontal",
        solution:
          "The Track-To constraint on the camera is pulling the camera's local axes unexpectedly. Select the camera, check Constraints → Track-To: track_axis must be TRACK_NEGATIVE_Z and up_axis must be UP_Y. If the camera was rotated manually before the constraint was applied, reset the camera rotation (Alt+R) and re-run blueprint.py.",
      },
    ],
  },
  base,
);
