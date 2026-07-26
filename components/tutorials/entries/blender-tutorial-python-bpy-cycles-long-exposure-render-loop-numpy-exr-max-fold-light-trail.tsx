import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A real long-exposure photograph accumulates photons across the full
        shutter window. The camera records every position the light source
        visited during the exposure — which is why spinning a poi produces a
        complete glowing arc rather than a single frozen snapshot. This
        tutorial replicates that mechanic entirely inside Blender: a Python
        script renders 60 Cycles subframes, each from a 6° step around a
        360° camera orbit, and folds them into one composite image using
        NumPy&apos;s <code>np.maximum</code>. The result is a single PNG that
        shows the full 3D double-helix trail from every camera angle
        simultaneously — structurally identical to a long-exposure of a
        physical poi light trail.
      </p>
      <p>
        Compare this to the real-world technique described in{" "}
        <Link href="/tutorials/your-first-long-exposure" className={lk}>
          Your First Long Exposure
        </Link>
        , and to the codex entry for{" "}
        <Link href="/codex/long-exposure-photography" className={lk}>
          long-exposure photography
        </Link>
        . The Blender approach lets you iterate on geometry and camera
        trajectory before committing to a physical shoot — particularly
        useful for 3D-POV work where the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr"
          className={lk}
        >
          Fourier phasor chain tutorial
        </Link>{" "}
        shows how complex poi paths are computed as superpositions of
        rotating arms.
      </p>

      <h2>MAX vs ADD accumulation</h2>
      <p>
        Two accumulation modes are available via the <code>ACCUM_MODE</code>{" "}
        constant:
      </p>
      <pre>{`ACCUM_MODE = 'MAX'   # np.maximum across all subframes
ACCUM_MODE = 'ADD'   # np.add, then normalise by dividing by peak`}</pre>
      <p>
        <strong>MAX</strong> is the correct model for overbright emissive
        sources on a dark background (World emission&nbsp;=&nbsp;0). When an
        emissive tube passes through a pixel, the Cycles sample returns a
        value significantly above 1.0 due to the emission strength; the black
        background returns values near 0. The MAX fold retains the brightest
        value ever encountered at each pixel, so every camera angle that saw
        the strand contributes its brightness without darkening adjacent
        frames. No tone-mapping is needed. This is photographic peak-hold —
        the electronic equivalent of HDR bracketing across time.
      </p>
      <p>
        <strong>ADD</strong> more closely matches true photon accumulation:
        each subframe&apos;s radiance is summed. On a dark background the
        two modes give visually identical results for sparse emitters, but
        ADD amplifies noise by <em>√N</em> (60 spp equivalent from 60 × 4
        spp) whereas MAX is noise-resistant — any single subframe that
        produced a valid emission sample wins.
      </p>

      <h2>Why 4 Cycles samples per subframe works</h2>
      <p>
        Standard Cycles wisdom says &ldquo;use at least 64 samples to avoid
        fireflies.&rdquo; That guidance applies to scenes with indirect
        lighting, glossy reflections, and area lights. This scene breaks all
        those rules deliberately: the background emits nothing, the only
        source of radiance is the strand surface itself (emission sub-block
        of Principled BSDF v2), and the camera rays hit the strand directly.
        The path length is always exactly 2 vertices — camera → strand
        surface — so the variance is dominated by the bounding-box hit test,
        not multiple-bounce Monte Carlo. At 4 samples per pixel, the
        probability of missing the strand entirely at a pixel that should be
        bright is less than 1% for a 16-pixel-wide emissive tube. The MAX
        fold across 60 subframes then gives 240 effective independent samples
        per emissive pixel, resolving any residual variance.
      </p>
      <pre>{`# Render settings that make 4 spp sufficient
scene.cycles.samples = 4
scene.cycles.use_denoising = False   # denoising at 4 samp smears bright trails
scene.render.image_settings.file_format = 'OPEN_EXR'
scene.render.image_settings.color_depth = '32'   # float32, not 8-bit PNG`}</pre>
      <p>
        The float32 EXR is critical. The emission strength is 20.0, meaning
        pixels on the strand surface have linear radiance values near 20 in
        the EXR. An 8-bit PNG clamps at 1.0 and loses all gradient
        information in the bright core. The float buffer preserves the full
        range; the final output normalisation to [0, 1] can then apply a
        custom tone curve.
      </p>

      <h2>NURBS double helix construction</h2>
      <p>
        Each strand is a NURBS path curve with bevel depth for the tube
        cross-section. The two strands share the same helix parameters but
        are phase-shifted by π radians, placing strand B exactly opposite
        strand A at every height step — the canonical Watson–Crick double
        helix layout.
      </p>
      <pre>{`# Helix parametric form (NURBS control points)
for i, pt in enumerate(sp.points):
    t     = i / (N_CTRL - 1)
    theta = t * HELIX_TURNS * 2 * math.pi + phase_offset  # + π for strand B
    x = HELIX_R * math.cos(theta)
    y = HELIX_R * math.sin(theta)
    z = t * helix_height - helix_height * 0.5   # centred at Z = 0
    pt.co = (x, y, z, 1.0)    # NURBS: homogeneous W = 1`}</pre>
      <p>
        The <code>use_endpoint_u = True</code> flag ensures the NURBS curve
        passes through the first and last control points exactly (endpoint
        interpolation), so each strand starts and ends precisely on the helix
        axis rather than at an interior knot position.
      </p>

      <h2>Float EXR loading and pixel access</h2>
      <p>
        Blender stores image pixel data as a flat RGBA float sequence
        accessible via <code>image.pixels[:]</code>. The API also exposes{" "}
        <code>foreach_get</code> / <code>foreach_set</code>, which transfer
        directly into pre-allocated NumPy buffers without creating an
        intermediate Python list:
      </p>
      <pre>{`img = bpy.data.images.load(path, check_existing=False)
buf = np.empty(RES_Y * RES_X * 4, dtype=np.float32)
img.pixels.foreach_get(buf)         # ~30× faster than buf = np.array(img.pixels[:])
pix = buf.reshape(RES_Y, RES_X, 4)
bpy.data.images.remove(img)         # free immediately; 60 EXRs × 960×540×4 floats ≈ 500 MB`}</pre>
      <p>
        Memory management matters: 60 subframes at 960 × 540 × 4 channels ×
        4 bytes = 499 MB if all are resident simultaneously. The blueprint
        loads, folds into <code>accum</code>, and removes each image
        immediately — peak heap is 2 × frame_size ≈ 17 MB. The same float
        buffer technique is used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-cycles-lightmap-bake-webxr-uv2"
          className={lk}
        >
          Cycles lightmap bake tutorial
        </Link>
        .
      </p>

      <h2>Camera orbit via TrackTo constraint</h2>
      <p>
        Rather than animating camera rotation keyframes, the blueprint places
        a <code>TRACK_TO</code> constraint on the camera pointing at an Empty
        at the helix centre. During the render loop, only{" "}
        <code>cam_obj.location</code> is updated; Blender recalculates the
        orientation automatically:
      </p>
      <pre>{`cam_obj.location = Vector((
    CAM_RADIUS * math.cos(angle),
    CAM_RADIUS * math.sin(angle),
    CAM_HEIGHT,
))
bpy.context.view_layer.update()   # recalculate constraints before render`}</pre>
      <p>
        The <code>view_layer.update()</code> call is essential before
        <code>render.render()</code>: without it, the dependency graph still
        holds the camera matrix from the previous step and the new location
        does not propagate into the render. This is the same recalculation
        pattern used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr"
          className={lk}
        >
          Biot–Savart field-line tracer
        </Link>
        , which repositions trajectory curve objects at each integration step
        and must call <code>update()</code> before sampling the scene graph.
      </p>

    </>
  );
}

const data = {
  title:
    "Python bpy — Cycles Long-Exposure Accumulation: Orbit Render Loop, Float32 EXR & NumPy MAX Fold for Poi Light-Trail Photography",
  lede:
    "Simulate a real long-exposure light-painting photograph in Blender by building an emissive double-helix scene, rendering 60 camera-orbit subframes to float32 EXR files, and folding them with numpy.maximum into a single composite that shows the full 3D trail from every angle simultaneously.",
  date: "2026-07-26",
  steps: [
    {
      title: "Build the scene",
      body: "Save a new .blend file to the library directory so the // paths resolve. Open blueprint.py in the Scripting workspace and press ▶ Run Script. Two NURBS helixes (orange + cyan) appear in the viewport; the camera is positioned at orbit radius 5.8 m. The console prints 'Scene built. Call build_long_exposure() …' and exports hf_longexp_helix.glb.",
    },
    {
      title: "Inspect in Material Preview",
      body: "Switch the 3D Viewport shading to Material Preview (Z → Material Preview). The emissive strands should glow orange and cyan. Orbit around the scene to appreciate the 3D double-helix shape — this is the form that the long-exposure composite will flatten into 2D. Confirm the World is pure black (no ambient light).",
    },
    {
      title: "Run the render loop",
      body: "Open the Python Console panel (split the Scripting area or use Shift+F4). Type build_long_exposure() and press Enter. The console counts 1/60 … 60/60 as it renders each subframe. At 960×540 with 4 Cycles samples, expect 10–30 s per subframe depending on GPU. Total: 10–30 minutes. The temp EXR files are deleted after accumulation.",
    },
    {
      title: "Inspect the composite",
      body: "When complete, open the Image Editor (Shift+F10) and load hf_longexp_composite.png. You should see the full double helix projected from all 60 angles: both strands appear as interlocked spirals regardless of which single camera angle you prefer. The orange strand and cyan strand remain separated by colour even in the composite.",
    },
    {
      title: "Compare MAX and ADD",
      body: "Change ACCUM_MODE = 'ADD' at the top of blueprint.py and re-run the render loop. The ADD composite sums all 60 frames; emission strength effectively multiplies by N_SUBFRAMES before the normalisation step divides back. In practice, for a dark-background emissive scene the two modes look nearly identical; ADD begins to differ in scenes with area lights or sky illumination.",
    },
    {
      title: "Record the screen",
      body: "Open record.py and press ▶ Run Script. This sets up a 120-frame EEVEE animation with camera orbit + emission pulse, suitable for screen recording via OBS. Follow SCREEN-RECORDING-NOTES.md. The viewport.mp4 records the 3D helix; cut to the composite PNG at the end for the full tutorial video.",
    },
  ],
  troubleshooting: [
    {
      symptom: "RuntimeError: Operator bpy.ops.render.render.poll() failed",
      cause:
        "The render operator was called outside a valid window context — typically from a cron/timer or a background script session.",
      fix: "Wrap the call: `with bpy.context.temp_override(window=bpy.context.window_manager.windows[0]): bpy.ops.render.render(write_still=True)`. This is already in blueprint.py; check the pattern is intact.",
    },
    {
      symptom: "Composite PNG is completely black",
      cause:
        "The World emission is non-zero and the emissive strands are lost in the background, OR the EXR files were saved in 8-bit mode (values clamp to [0,1], max-folding 0.05 with 0.05 gives 0.05, not bright).",
      fix: "Confirm scene.render.image_settings.color_depth = '32' and that the World Background strength = 0. Also verify that the camera's TrackTo constraint is resolved — run bpy.context.view_layer.update() before the first render call.",
    },
    {
      symptom: "Out of memory when loading EXRs",
      cause:
        "Multiple EXR images were loaded and not removed, or RES_X/RES_Y was set too high (e.g. 4K).",
      fix: "The blueprint calls bpy.data.images.remove(img) after each numpy copy. Confirm the remove line is present in _accumulate(). For 4K tests, lower N_SUBFRAMES to 20 first to check the pipeline before committing to the full 60-frame run.",
    },
  ],
  externalLinks: [
    {
      label:
        "Blender Python API 5.1 — bpy.ops.render, bpy.data.images — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.ops.render.html",
    },
    {
      label:
        "NumPy — numpy.maximum.reduce — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.maximum.reduce.html",
    },
    {
      label:
        "Light painting — Wikipedia — CC-BY-SA-4.0 — Wikipedia contributors",
      href: "https://en.wikipedia.org/wiki/Light_painting",
    },
  ],
  relatedTutorials: [
    {
      label: "Your First Long Exposure — real-world light-painting photography",
      href: "/tutorials/your-first-long-exposure",
    },
    {
      label:
        "GN Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon Prop for WebXR",
      href: "/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr",
    },
    {
      label:
        "Python numpy FFT — Epicycles: Fourier-Series Phasor Chain & Poi Light-Painting",
      href: "/tutorials/blender-tutorial-python-numpy-fft-epicycles-fourier-phasor-chain-poi-webxr",
    },
    {
      label:
        "Cycles Lightmap Bake — UV2 Channel & WebXR Float Irradiance Pipeline",
      href: "/tutorials/blender-tutorial-cycles-lightmap-bake-webxr-uv2",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-cycles-long-exposure-render-loop-numpy-exr-max-fold-light-trail",
    title: data.title,
    lede: data.lede,
    date: "2026-07-26",
    tags: [
      "blender",
      "scripting",
      "cycles",
      "numpy",
      "light-painting",
      "poi",
      "photography",
    ],
    body: Body,
  },
  data,
);
