import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1822 Joseph Fourier proved that any periodic function can be written
        as a sum of sines and cosines — or, in the complex form that is far more
        elegant for 2-D paths, as a sum of rotating phasors. Each phasor is a
        complex number that spins at a fixed frequency; their vector sum traces
        the original curve. Representing a poi path this way is not an
        abstraction: a poi itself <em>is</em> a rotating phasor. The hand traces
        a circle of some radius at some angular speed; a wrist flower is a second
        phasor added on top; a hyperloop is a third. The Discrete Fourier
        Transform (DFT) takes a sampled version of the path and returns exactly
        those phasors — each one with its amplitude, frequency, and initial
        phase.
      </p>
      <p>
        This blueprint samples a closed poi petal path, computes its DFT in pure
        Python (<code>cmath</code>, no external libraries), and builds a Blender
        5.1 scene where each DFT bin is a rotating arm — a hexagonal prism
        parented to an Empty pivot. The arms are chained: each pivot sits at the
        tip of the previous arm. Keyframing{" "}
        <code>rotation_euler[2]</code> at frames 1 and 181 with LINEAR FCurve
        interpolation gives each arm its constant angular rate. A NURBS trace
        curve baked from the tracer Empty at the chain tip shows the
        reconstructed path in orange; the original source path appears in green
        behind it.
      </p>

      <h2>The DFT and its phasor interpretation</h2>
      <p>
        Given N complex samples z[0], z[1], &hellip;, z[N-1] of a closed curve
        sampled at equal parameter intervals, the DFT yields N complex
        coefficients:
      </p>
      <pre>{`Z[k] = (1/N) Σ_{n=0}^{N-1}  z[n] · exp(−2πi·k·n/N)`}</pre>
      <p>
        Each coefficient Z[k] encodes one rotating phasor:
      </p>
      <pre>{`amplitude  = |Z[k]|          ← arm length
phase      = arg(Z[k])       ← starting angle at t=0
frequency  = k  (if k ≤ N/2)
             k − N (if k > N/2)  ← alias / negative`}</pre>
      <p>
        The <em>alias convention</em> matters for animation. DFT bin k = N−1 is
        mathematically identical to k = −1: one revolution backwards per period.
        Sorting all N bins by magnitude and keeping the largest N_H gives the
        most important harmonics. For our poi petal path:
      </p>
      <pre>{`z(t) = exp(2πit) + 0.5·exp(−4πit)`}</pre>
      <p>
        the DFT will find exactly two non-zero bins — k = 1 (amplitude 1.0,
        frequency +1) and k = N−2 (amplitude 0.5, frequency −2). All other bins
        are numerically zero. Running with N_H = 3 or more gives a perfect
        reconstruction; N_H = 1 gives only the first harmonic (a circle); N_H =
        2 gives the exact petal. This lets you verify the implementation: the
        orange trace curve should be indistinguishable from the green original
        when N_H ≥ 2.
      </p>

      <h2>Keyframe convention and LINEAR FCurves</h2>
      <p>
        Each Empty pivot is keyed at frame 1 with{" "}
        <code>rotation_z = arg(Z[k])</code> and at frame FRAMES+1 with{" "}
        <code>rotation_z = arg(Z[k]) + 2π·freq</code>. The FCurve
        interpolation is set to LINEAR on every keyframe point so that the
        rotation rate is exactly constant between frames. Blender&apos;s default
        BEZIER easing would change the angular velocity mid-frame, breaking the
        phasor relationship — the tip would no longer trace a pure circle.
      </p>
      <p>
        For a negative frequency (say freq = −2), the total rotation over FRAMES
        frames is −4π: two full clockwise revolutions. This is correct:
        Blender&apos;s right-hand-rule convention makes positive
        rotation_euler[2] counterclockwise (CCW), so a negative value is
        clockwise (CW) — matching the negative frequency&apos;s sense of
        rotation in the complex plane.
      </p>
      <p>
        The FCurve runs from frame 1 to FRAMES+1 (inclusive) so that frame
        FRAMES returns to exactly the phase at frame 1. This makes the animation
        loop-seamlessly: the state at the end of frame 180 is identical to the
        state at the start of frame 1.
      </p>
      <p>
        The same principle drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr"
          className={lk}
        >
          NLA / FCurve keyframe tutorial
        </Link>
        , which builds poi performance animations by inserting keyframes
        programmatically — the mechanism is identical, only the intent differs.
      </p>

      <h2>The parent chain and matrix_parent_inverse</h2>
      <p>
        Each Empty[i] is parented to Empty[i-1] and offset along local X by
        the previous arm&apos;s amplitude. Parenting in Blender attaches the
        child in the parent&apos;s <em>current world space</em>, not in the
        parent&apos;s local space, which is why{" "}
        <code>matrix_parent_inverse</code> must be updated after parenting:
      </p>
      <pre>{`child.parent = parent_empty
child.location = (prev_amplitude, 0, 0)
child.matrix_parent_inverse = parent_empty.matrix_world.inverted()`}</pre>
      <p>
        Without this reset, Blender would apply the parent&apos;s current world
        transform twice (once stored in the inverse matrix, once from the live
        parent transform), doubling the offset. The inverted world matrix
        neutralises the stored transform so only the local offset remains. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf fibration tutorial
        </Link>{" "}
        uses the same pattern for chains of stereographically-projected tori.
      </p>

      <h2>Baking the trace curve with evaluated_get()</h2>
      <p>
        To build the orange trace curve, the script steps through every frame,
        evaluates the dependency graph, and reads the tracer Empty&apos;s
        world-space position:
      </p>
      <pre>{`depsgraph = bpy.context.evaluated_depsgraph_get()
for f in range(1, FRAMES + 1):
    scene.frame_set(f)
    depsgraph.update()
    t_eval = tracer.evaluated_get(depsgraph)
    trace_pts.append(t_eval.matrix_world.translation.copy())`}</pre>
      <p>
        <code>evaluated_get(depsgraph)</code> returns the <em>evaluated</em>{" "}
        (post-animation, post-modifier) version of the object without modifying
        the original. Calling{" "}
        <code>tracer.matrix_world.translation</code> directly after{" "}
        <code>frame_set</code> can work too, but is less reliable when object
        drivers or constraints are present — <code>evaluated_get</code> always
        reflects the full computed state.
      </p>
      <p>
        The baked positions are written into a NURBS curve with{" "}
        <code>use_cyclic_u = True</code> to close the loop. The curve uses{" "}
        <code>bevel_depth</code> to give it a round cross-section so it renders
        as a ribbon rather than a hairline. Compare this baking technique with
        the particle-position baking in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz attractor tutorial
        </Link>
        , which bakes geometry-node output points into a curve using the same
        depsgraph pattern.
      </p>

      <h2>Why the petal path has only two non-zero DFT bins</h2>
      <p>
        The source path <code>z(t) = exp(2πit) + 0.5·exp(−4πit)</code> is
        already a finite Fourier series. Sampling it at N evenly-spaced points
        and computing the DFT recovers the exact coefficients — up to the
        aliases introduced by the finite sample count. For k = 1: the DFT
        computes the inner product of the samples with <code>exp(2πit)</code>,
        which returns 1.0 (the amplitude of the first term). For k = N−2: the
        DFT computes the inner product with <code>exp(−4πit)</code> (since
        k = N−2 is the alias of k = −2 when N is large), returning 0.5. Every
        other bin returns 0.
      </p>
      <p>
        Poi moves naturally decompose this way. A basic wrist orbit is{" "}
        <code>exp(2πit)</code>. Spinning the poi at twice the wrist speed but
        half the radius adds the harmonic <code>0.5·exp(4πit)</code>. The
        resulting 3-petal flower is exactly a two-harmonic DFT decomposition —
        the same maths governs both the signal processing and the physical
        performance. This connects to the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr"
          className={lk}
        >
          Kuramoto oscillator tutorial
        </Link>
        , which models phase synchronisation between multiple poi harmonics using
        coupled oscillator dynamics.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "Python DFT Epicycles — Discrete Fourier Transform Decomposition of Poi Paths into Rotating Phasors (Blender 5.1)",
  lede: "A closed poi petal path z(t) = exp(2πit) + 0.5·exp(−4πit) is sampled at 256 points, its DFT computed in pure Python (cmath), and the 10 largest-magnitude bins animated as rotating arm Empties in a Blender 5.1 parent chain — each pivot keyframed at LINEAR FCurve from arg(Z[k]) to arg(Z[k]) + 2π·freq over 180 frames so the arm tip traces the exact reconstructed path, with the orange NURBS trace curve baked via evaluated_get() and the green original path rendered behind it for alias-error comparison.",
  body: Body,
  libraryPath:
    "blends/scripting/python-dft-epicycles-poi-path-phasors-webxr/",
  steps: [
    {
      title: "Run blueprint.py — DFT, chain, keyframes",
      body: "Open Blender 5.1 → **Scripting** workspace. Open `blueprint.py` and press **Run Script**.\n\n`purge()` clears the scene. `compute_dft_bins()` samples `SOURCE_PATH` at N_SAMPLES = 256 points and computes all 256 DFT bins via a direct O(N·N) loop — no numpy, only `cmath.exp`. All bins are sorted by magnitude; the top 10 (N_H) are passed to the chain builder.\n\n`build()` creates N_H Empty pivots in a parent chain. Empty[0] sits at the centroid (for this path, the origin — the DC bin Z[0] ≈ 0). Each subsequent Empty is offset from its parent along local X by the previous arm's amplitude. Each Empty's `rotation_euler[2]` is keyed at frame 1 (initial phase = arg(Z[k])) and frame 181 (phase + 2π·freq). FCurves are forced to LINEAR so rotation is constant-rate.\n\nA hexagonal arm cylinder runs from the pivot origin to (amplitude, 0, 0) in local space, parented to the pivot Empty. After the chain, a tracer Empty sits at the tip of the final arm.\n\nThe console prints each selected DFT bin's frequency, amplitude, and phase. For the poi petal path you should see k=1 (amplitude ≈1.000) and k=254 (alias of k=−2, amplitude ≈0.500) as the dominant bins.",
    },
    {
      title: "Baking and the depsgraph",
      body: "After the chain is built, the script steps through frames 1–180 in a Python loop. At each frame it calls `depsgraph.update()` then `tracer.evaluated_get(depsgraph).matrix_world.translation` to read the chain's fully-animated tip position.\n\nThis is the same dependency-graph pattern used for baking any animated position: `frame_set(f)` changes the current time; `depsgraph.update()` forces Blender to propagate the new time through all animations, constraints, and modifiers; `evaluated_get(depsgraph)` returns a temporary evaluated copy of the object with all transforms applied.\n\nThe 180 world-space points are written into a NURBS spline with `use_cyclic_u = True` (closes the loop) and `bevel_depth = 0.018` (round cross-section for a ribbon look). A second NURBS curve traces the original SOURCE_PATH at full N_SAMPLES resolution for comparison.",
    },
    {
      title: "Inspect the animated chain in the viewport",
      body: "Switch to the **Layout** workspace. Set viewport shading to **Material Preview** (Z key → Material Preview).\n\nSelect `epi_00_f+1` (the first pivot Empty). In the **Properties** panel → Object → Relations, confirm it has no parent and its location is near (0, 0, 0). In the **Graph Editor**, find the `rotation_euler[2]` FCurve: it should be a straight line from frame 1 at phase_value to frame 181 at phase_value + 2π.\n\nSelect `epi_01_f-2` (the second pivot, alias frequency −2). Its FCurve slope is negative (CW rotation) and steeper — twice the angular rate of the first arm. The slope ratio between arms tells you the frequency ratio. Verify: slope[arm1] / slope[arm0] should be |freq_1| / |freq_0| = 2.\n\nPress **Space** to play. The 10 arms spin at their respective frequencies, the chain elongates and collapses, and the orange trace curve appears as a static baked ribbon matching the green original path.",
    },
    {
      title: "Reduce N_H to see aliasing",
      body: "Edit `blueprint.py`: change `N_H = 10` to `N_H = 1`. Re-run the script.\n\nWith only the largest harmonic (k=1, frequency +1, amplitude ≈1.0), the chain is a single arm rotating at one revolution per period. The orange trace curve is a perfect circle — the fundamental frequency but none of the detail.\n\nChange to `N_H = 2`. The DFT now includes both non-zero bins (freq +1 and freq −2). The orange trace matches the green original exactly — a three-petal figure-eight. This confirms the DFT correctly decomposes the path: two phasors reproduce a two-harmonic source perfectly.\n\nChange to `N_H = 5`. The extra three arms all have amplitude < 1e-6 (floating-point noise). They contribute negligible displacement and the trace remains identical to N_H=2. This is the expected behaviour: the DFT correctly returns zero amplitude for harmonics not present in the source.\n\nFor a path with many harmonics — replace SOURCE_PATH with a rectangular wave or a Lissajous figure — higher N_H produces progressively better reconstructions, reproducing the Gibbs phenomenon at sharp corners.",
    },
    {
      title: "GLB export for WebXR",
      body: "To export the chain for WebXR, select all arm cylinders and the two curve objects (trace + original). Run:\n\n```python\nbpy.ops.object.select_all(action='SELECT')\n# Deselect empties — they export as invisible transforms\nfor ob in bpy.context.selected_objects:\n    if ob.type == 'EMPTY':\n        ob.select_set(False)\nbpy.ops.export_scene.gltf(\n    filepath='hf_epicycles.glb',\n    export_format='GLB',\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_animations=True,\n    export_apply=True,\n)\n```\n\nThe exported GLB contains the animated arm cylinders at their keyframed rotations and the baked trace curve. Frame the `export_animations=True` flag captures the rotation FCurves so a WebXR viewer can play the epicycle animation in-browser. The baked trace curve exports as static geometry — it is already the reconstructed path.",
    },
  ],
  finalResult:
    "A 10-arm rotating epicycle chain built from the 10 largest DFT bins of a poi petal path, animated over 180 frames (one full period). Each arm is a hexagonal prism parented to a rotation-keyframed Empty pivot. The arm tip bakes to an orange NURBS trace ribbon; the original path appears in green behind it. With N_H=2, the reconstruction is exact; with N_H=1, only the fundamental circle is shown. Saved as hf_epicycles.blend.",
  variations: [
    "Replace SOURCE_PATH with a 5-petal antispin: `z(t) = exp(2πit) + 0.3*exp(-6πit)`. The DFT finds harmonic +1 (r=1) and harmonic −3 (r=0.3). Three arms suffice for exact reconstruction. Change N_H to 3 to verify, then raise to 5 to confirm the extra arms are numerically zero.",
    "Swap the chain ordering: instead of sorting DFT bins by magnitude descending, sort by ascending frequency (0, 1, 2, ..., then −1, −2, ...). The same trace is produced, but the chain's visual motion is different — slower arms at the base, faster arms at the tip. This is the 'natural frequency order' used in music visualisations.",
    "Add a third path term `+ 0.25*cmath.exp(6j*math.pi*t)` to SOURCE_PATH (harmonic +3). Now three DFT bins are non-zero. Set N_H=4 to get exact reconstruction. Draw the phase portrait in the Blender Graph Editor: each arm's FCurve is a distinct linear slope, and the ratio of slopes confirms the frequency ratios 1 : 2 : 3.",
    "Build orbit-circle meshes around each pivot: for epicycle i, a circle of radius amp[i] parented to empties[i-1] (not empties[i]) at offset (prev_amp, 0, 0). The circle stays static while the arm inside it rotates — visually showing the full orbit each phasor could trace. This matches the classic Fourier epicycles visualisation from 3Blue1Brown.",
    "Use numpy.fft.fft instead of the O(N²) direct DFT for large N. At N=1024, the direct DFT takes ~0.3 s in CPython; numpy FFT takes <1 ms. The result is identical. Add `import numpy as np; Z = np.fft.fft(samples) / N_SAMPLES` and replace the compute_dft_bins function — same sorted output, 300× faster.",
  ],
  troubleshooting: [
    {
      symptom: "The orange trace curve does not match the green original path",
      cause:
        "N_H is too small to capture all non-zero DFT bins of the source path. For the default poi petal (two harmonics), N_H must be ≥ 2.",
      fix: "Increase N_H to at least 2 for the default SOURCE_PATH. Print the `all_bins` list — the console output shows each bin's frequency and amplitude. Any bin with |Z| > 1e-5 should be included in N_H. Floating-point rounding means near-zero bins (amplitude < 1e-7) are genuine zeros.",
    },
    {
      symptom: "The chain arms appear at incorrect positions or overlap",
      cause:
        "matrix_parent_inverse was not updated after parenting. Blender keeps an 'inverse parent matrix' that offsets the child to compensate for the parent's current world transform. If the parent was already at a non-identity transform when the child was parented, the child's effective position is doubled.",
      fix: "After each `child.parent = empties[i-1]`, call `child.matrix_parent_inverse = empties[i-1].matrix_world.inverted()`. This resets the compensation so the child's local (prev_amp, 0, 0) offset is the only displacement.",
    },
    {
      symptom: "Playing the animation does not move the arms — all empties stay still",
      cause:
        "The Linear FCurve keyframes are not set correctly, or the animation data was not created (keyframe_insert returned without writing). A common cause: running the script twice overwrites the empties with new objects that have no keyframes.",
      fix: "Select one of the epi_* empties. In the Graph Editor, confirm it has a rotation_euler[2] FCurve running from frame 1 to 181 as a straight line. If absent, the keyframe_insert calls silently failed — check the console for Python errors. Re-run blueprint.py after purge() to start fresh.",
    },
    {
      symptom: "bpy.ops.render.opengl fails with 'context is incorrect'",
      cause:
        "record.py must be run from the Scripting workspace with a 3D viewport in context. bpy.ops.render.opengl requires an active viewport to render from.",
      fix: "Switch to the Layout workspace first (which has a 3D viewport), then run record.py from the Text Editor while keeping the 3D viewport visible. Alternatively, maximise the 3D viewport (numpad 5 to toggle ortho) before running.",
    },
  ],
  externalLinks: [
    {
      label: "Python cmath module — complex maths functions (PSF Licence)",
      href: "https://docs.python.org/3/library/cmath.html",
    },
    {
      label:
        "Blender Manual — Keyframe Animation: introduction (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/animation/keyframes/introduction.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Kuramoto Coupled Oscillators — Phase Synchronisation & Emergent Coherence",
      href: "/tutorials/blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
    },
    {
      label:
        "NLA / FCurve Keyframes — Programmatic Action Insertion & Poi Performance GLB",
      href: "/tutorials/blender-tutorial-python-bpy-action-nla-fcurve-keyframe-poi-performance-webxr",
    },
    {
      label: "Hopf Fibration — Stereographic S³ Fibres as Linked-Torus Light Sculpture",
      href: "/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr",
    },
    {
      label:
        "Lorenz Strange Attractor — Butterfly Chaos & Sensitive Divergence for Poi Light-Painting",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-dft-epicycles-poi-path-phasors-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "python",
      "fourier",
      "animation",
      "poi",
      "light-painting",
      "mathematics",
    ],
    body: Body,
  },
  data,
);
