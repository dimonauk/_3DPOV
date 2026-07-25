import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Any closed 2-D curve can be written as a sum of rotating circles —
        phasors — one per frequency bin of its Discrete Fourier Transform. Each
        phasor is a circle of radius{" "}
        <code>|C[k]|&thinsp;/&thinsp;N</code> that starts at phase{" "}
        <code>arg(C[k])</code> and completes exactly <em>k</em> revolutions over
        one animation period. Chain twenty-two of them as parented Blender
        Empties, animate each with a two-keyframe linear ramp for its Z
        rotation, and the tip of the outermost Empty traces the original path to
        within sub-pixel accuracy. This tutorial uses a poi figure-eight — the
        Lemniscate of Bernoulli — as its input path; the same blueprint works
        verbatim on any poi move sampled from motion-capture data.
      </p>

      <h2>Why the Lemniscate?</h2>
      <p>
        The Lemniscate of Bernoulli,
        x&thinsp;=&thinsp;cos&thinsp;t&thinsp;/&thinsp;(1&thinsp;+&thinsp;sin²t),
        y&thinsp;=&thinsp;sin&thinsp;t&thinsp;·&thinsp;cos&thinsp;t&thinsp;/&thinsp;(1&thinsp;+&thinsp;sin²t),
        has an especially sparse DFT: almost all energy sits in four frequency
        bins (&plusmn;1 and &plusmn;3). This makes it a perfect teaching example
        because you can{" "}
        <em>see</em> the dominant circles doing the work — the two{" "}
        <em>k&thinsp;=&thinsp;&plusmn;1</em> phasors draw the outer envelope,
        and the two <em>k&thinsp;=&thinsp;&plusmn;3</em> ones pull the path
        back to cross the origin correctly. All remaining terms contribute less
        than 1&thinsp;% of the path energy combined.
      </p>
      <p>
        Compare this with the more complex attractor paths produced by the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
          className={lk}
        >
          Rössler attractor RK4 blueprint
        </Link>
        , which requires hundreds of Fourier terms to reconstruct faithfully —
        its DFT is dense because the attractor&apos;s shape is not analytically
        simple.
      </p>

      <h2>FFT coefficient ordering — the one thing that trips everyone up</h2>
      <p>
        <code>numpy.fft.fft()</code> returns coefficients in this order:
      </p>
      <pre>{`Index:  0   1   2  …  N/2−1  N/2  N/2+1  …  N−1
Freq:   0  +1  +2  …  +N/2−1 −N/2  −(N/2−1) … −1`}</pre>
      <p>
        Positive frequencies rotate counter-clockwise; negative frequencies
        rotate clockwise. For a real-valued signal the coefficients obey
        Hermitian symmetry: <code>C[−k]&thinsp;=&thinsp;C[k]*</code> (complex
        conjugate), so the CCW and CW phasors at the same speed have equal
        radii but opposite initial phases. Sorting by{" "}
        <code>|C[k]|</code> descending automatically pairs them; you don&apos;t
        need to handle this case specially.
      </p>

      <h2>Two-keyframe trick for constant angular velocity</h2>
      <p>
        Naïve implementations insert one keyframe per frame (256 keyframes per
        Empty × 22 Empties = 5&thinsp;632 keyframe operations). Because each
        phasor rotates at a <em>constant</em> angular velocity, the F-Curve is
        an exact linear ramp — it needs only two keyframes:
      </p>
      <pre>{`omega = 2π · k / FRAME_END   # radians per frame

fc = action.fcurves.new(data_path="rotation_euler", index=2)
kp1 = fc.keyframe_points.insert(1,             phase)
kp2 = fc.keyframe_points.insert(FRAME_END + 1, phase + omega * FRAME_END)
kp1.interpolation = kp2.interpolation = 'LINEAR'`}</pre>
      <p>
        This reduces keyframe operations by 128&thinsp;× and keeps the{" "}
        <code>.blend</code> file small. The same optimisation applies to any
        constant-velocity animation — see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          NLA FCurve keyframe tutorial
        </Link>{" "}
        for the broader F-Curve modifier vocabulary.
      </p>

      <h2>Depsgraph evaluation for trail positions</h2>
      <p>
        After building the chain, the trail is extracted by evaluating the{" "}
        <em>evaluated</em> (post-modifier, post-constraint) version of the Tip
        Empty at each frame. The key call is:
      </p>
      <pre>{`dg = bpy.context.evaluated_depsgraph_get()
for f in range(1, FRAME_END + 1):
    scene.frame_set(f)
    dg.update()                        # propagate FCurve → parent chain
    tip_ev = tip.evaluated_get(dg)
    trail_pts.append(
        tip_ev.matrix_world.translation.copy()
    )`}</pre>
      <p>
        The <code>dg.update()</code> call after <code>frame_set()</code> is
        non-optional: it flushes the F-Curve evaluation through every parent in
        the chain before <code>matrix_world</code> is read. Omitting it returns
        stale positions from the previous frame. The same pattern appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-depsgraph-object-instances-gn-scatter-webxr-export"
          className={lk}
        >
          depsgraph object-instances export blueprint
        </Link>
        .
      </p>

      <h2>Orbit rings via Bezier circles</h2>
      <p>
        Each phasor orbit is rendered as a bevelled Bezier circle curve, parented
        to the corresponding Empty, so it rotates with the chain automatically:
      </p>
      <pre>{`bpy.ops.curve.primitive_bezier_circle_add(radius=r, location=(0, 0, 0))
ring_obj = bpy.context.active_object
ring_obj.parent = em
ring_obj.data.bevel_depth      = 0.006
ring_obj.data.bevel_resolution = 3
ring_obj.data.materials.append(mat_ring)`}</pre>
      <p>
        Using a curve with bevel is preferable to a mesh circle because the
        bevel depth controls tube thickness without a separate modifier stack,
        and the curve tessellation adapts to the render resolution. Compare the
        approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          GN Points to Curves ribbon tutorial
        </Link>{" "}
        where the bevel profile is a separate cross-section object.
      </p>

      <h2>Failure modes and fixes</h2>
      <pre>{`Problem: trail does not close — first and last point are slightly apart
Fix:     append trail_pts[0] explicitly after the loop before building the mesh

Problem: phasor chain drifts — trail looks wrong after frame 100
Fix:     check that FRAME_END + 1 == N_SAMPLES + 1 in the second keyframe
         insert; if FRAME_END ≠ N_SAMPLES the angular velocity is wrong

Problem: tip positions are all (0,0,0)
Fix:     call dg.update() inside the loop, not once before it

Problem: rings don't rotate with chain
Fix:     set ring_obj.parent = em (the Empty), not the root object`}</pre>

      <h2>Extending the blueprint</h2>
      <p>
        Replace <code>lemniscate(N_SAMPLES)</code> with any sampled poi path —
        for example, a figure-eight with an extra loop imported as a CSV from
        the Kinect Leap capture pipeline described in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget"
          className={lk}
        >
          BVH import &amp; VRM retarget tutorial
        </Link>
        . Extract the wrist-to-poi-head position channel, upsample to{" "}
        <code>N_SAMPLES</code> points, and the rest of the blueprint runs
        unchanged. The DFT will reveal which frequency components characterise
        that move — a diagnostic as useful as the visual.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — FFT Epicycles: Fourier-Series Phasor Chain, DFT Coefficient Ordering & Depsgraph Trail for Poi Light-Painting",
  lede:
    "Decompose a poi Lemniscate of Bernoulli into its Discrete Fourier Transform, chain the top-22 frequency bins as rotating Blender Empties with two-keyframe linear FCurves, and evaluate the depsgraph tip position every frame to extract the glowing Bevel Curve trail.",
  date: "2026-07-25",
  steps: [
    {
      title: "Set parameters",
      body: "Open blueprint.py. N_SAMPLES = 256 is the path resolution (must be a power of 2 for FFT efficiency). N_CIRCLES = 22 keeps 99 %+ of the lemniscate's energy. RADIUS_SCALE = 1.8 maps DFT amplitude to Blender units — increase it if the chain looks too small in your scene.",
    },
    {
      title: "Run the script",
      body: "In Blender 5.1 Scripting workspace, open blueprint.py and press ▶ Run Script. The terminal prints the dominant frequencies: expect [1, -1, 3, -3] for the lemniscate. Building 22 phasors and evaluating 256 trail frames takes under 5 s on any modern CPU.",
    },
    {
      title: "Preview the animation",
      body: "Switch to 3D Viewport, set shading to Material Preview (Z → Material Preview). Press Spacebar to play. The concentric rings rotate at different speeds; the glowing trail traces the figure-eight. The bloom is EEVEE's built-in post-process — no compositor nodes needed.",
    },
    {
      title: "Experiment with N_CIRCLES",
      body: "Reduce N_CIRCLES to 4: you'll see only the two k=±1 circles (the coarse envelope) and the two k=±3 circles (the crossing correction). The trail will be a rough approximation of the figure-eight. Increase N_CIRCLES to 60 to include negligibly-small higher modes — the trail becomes indistinguishable from the analytic curve.",
    },
    {
      title: "Swap the input path",
      body: "Replace the lemniscate() call with your own sampled path: x_path, y_path = your_x_array, your_y_array, then z_path = x_path + 1j * y_path. The DFT and the rest of the blueprint run unchanged. Any closed 2-D curve works — a trefoil, a hypocycloid, or a real poi move from motion-capture.",
    },
    {
      title: "Export the trail as GLB",
      body: "Select hf_epicycle_trail in the outliner. File → Export → glTF 2.0. Tick 'Selected Objects', set Draco compression level 6, textures to WebP. The trail curve exports as a mesh (Blender tessellates the bevel automatically). Load the GLB in Three.js with MeshStandardMaterial and emissiveMap to preserve the glow.",
    },
    {
      title: "Record viewport animation",
      body: "Run record.py after blueprint.py. It adds a 30° camera arc over the 256-frame period and renders viewport.mp4 at 1920×1080 30 fps. The render takes 1–3 minutes in EEVEE Next with bloom enabled.",
    },
  ],
  externalLinks: [
    {
      label:
        "numpy.fft — Fast Fourier Transform routines — BSD-3-Clause — NumPy Contributors",
      href: "https://numpy.org/doc/stable/reference/routines.fft.html",
    },
    {
      label:
        "scipy.fft — Discrete Fourier Transform module — BSD-3-Clause — SciPy Contributors",
      href: "https://docs.scipy.org/doc/scipy/reference/fft.html",
    },
    {
      label:
        "Blender Python API 5.1 — bpy.types.Depsgraph — CC-BY-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Depsgraph.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python numpy — Cahn-Hilliard Phase Separation: Spinodal Decomposition & Displaced WebXR Mesh",
      href: "/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr",
    },
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion: Turing Spots, Stripe Labyrinths & f–k Sweep",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label:
        "GN Points to Curves — Poi Trail & Particle Streak Ribbons for WebXR",
      href: "/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
    },
    {
      label:
        "Python bpy — Biot-Savart Field-Line Tracer: Helix Wire → RK4 → Light-Painting Curves",
      href: "/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "animation",
      "webxr",
    ],
    body: Body,
  },
  data,
);
