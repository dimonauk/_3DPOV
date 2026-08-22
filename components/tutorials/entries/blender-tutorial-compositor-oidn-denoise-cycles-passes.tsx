import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function CompositorOidnDenoiseCyclesPassesBody() {
  return (
    <>
      <p>
        Every Cycles path-trace is a Monte Carlo estimate: each pixel fires a
        batch of rays, averages their returned colour, and calls the result
        good.  The statistical noise — the grain that tells you a render has
        too few samples — vanishes as sample count rises, but the relationship
        is brutal: halving the noise requires four times as many samples.
        Intel&apos;s{" "}
        <strong>Open Image Denoise</strong> (OIDN), wrapped in Blender 5.1&apos;s{" "}
        <strong>Denoise compositor node</strong>, breaks this inverse-square
        law.  The network — trained on millions of physically-based renders —
        learns which patterns are signal and which are Monte Carlo variance,
        and reconstructs a clean image from as few as 8–32 samples per pixel
        that is visually indistinguishable from a 512-spp path-trace.
      </p>
      <p className="mt-3">
        The key to quality is the auxiliary passes.  OIDN can denoise the
        Combined (beauty) pass alone, but without context it treats every
        pixel independently: it blurs across sharp geometric edges and muddles
        material colour.  The <strong>Normal pass</strong> tells the network
        which pixels share the same geometric surface — it averages noise
        within a flat wall without bleeding across the hard boundary with the
        floor.  The <strong>Albedo pass</strong> (Blender&apos;s{" "}
        <code>DiffCol</code> — flat material colour with no lighting) separates
        illumination noise from colour; the network cleans the illumination
        layer and then multiplies the original albedo back, preserving exact
        material colour accuracy.  Together, these two auxiliary inputs lift
        denoising quality by roughly the equivalent of 4–8× more samples.
      </p>
      <p className="mt-3">
        The OIDN source (Apache-2.0, Intel Corporation — see{" "}
        <a
          href="https://github.com/OpenImageDenoise/oidn"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/OpenImageDenoise/oidn
        </a>
        ) ships compiled into every Blender binary since 3.5; in 5.1 it runs
        on GPU via OIDN 2.x&apos;s HIP/CUDA/Metal back-ends, making the
        denoising step nearly instantaneous on a modern card.  The related{" "}
        <a
          href="https://www.openimagedenoise.org/"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Intel Embree
        </a>{" "}
        (ray-intersection kernel) and OSPRay (volumetric renderer) projects are
        also Apache-2.0 and share the same rendering-science ancestry; OIDN&apos;s
        training data was generated using Embree-powered path-tracers.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        Enabling the passes and understanding the node wiring
      </h2>
      <p>
        Three Python lines are all that separates a default scene from a
        denoise-ready one:
      </p>
      <pre className="text-xs bg-black/30 rounded p-3 mt-2 overflow-x-auto whitespace-pre">
{`vl = scene.view_layers["ViewLayer"]
vl.use_pass_normal        = True   # world-space surface normals
vl.use_pass_diffuse_color = True   # flat material colour (OIDN albedo)`}
      </pre>
      <p className="mt-3">
        In the compositor, the Render Layers node grows two new output sockets:
        <code> Normal</code> (a float32 RGB buffer of world-space XYZ) and{" "}
        <code>DiffCol</code> (the base colour of every surface).  Wire Normal
        into the Denoise node&apos;s <em>Normal</em> input and DiffCol into
        its <em>Albedo</em> input.  The third input — <em>Image</em> — receives
        the noisy Combined pass.  The Denoise node&apos;s output is the clean
        beauty, ready to wire into Composite (and optionally a Viewer node for
        in-progress inspection).
      </p>
      <p className="mt-3">
        The <strong>Prefilter</strong> setting on the Denoise node governs how
        OIDN handles the Normal and Albedo inputs before using them as guides.
        At low sample counts (≤ 32 spp) those passes are themselves noisy:{" "}
        <code>NONE</code> passes them straight through and the noisy normals
        confuse the denoiser, producing smeared edges.  <code>FAST</code>{" "}
        runs a single-pass OIDN pre-filter on them — adequate above 32 spp.{" "}
        <code>ACCURATE</code> runs iterative pre-filtering — about 30% extra
        time, but the normal and albedo guides are as clean as the denoiser can
        make them, which matters most at 8–32 spp.  For the 32-spp stone sphere
        in this tutorial, ACCURATE is the correct choice.
      </p>

      <h2 className="text-lg font-semibold mt-6 mb-2">
        HDR mode — never clamp before denoising
      </h2>
      <p>
        The <code>use_hdr</code> flag on the Denoise node is set to{" "}
        <code>True</code> by the blueprint.  Without it, Blender clamps the
        Combined pass to [0, 1] before feeding OIDN, stripping all HDR
        specular data.  The denoiser then sees blown-out white blobs where
        metal highlights should be and reconstructs them as flat white
        patches — correct luminance but no specular detail.  With HDR mode the
        full float32 range is preserved: tight specular glints remain sharp
        after denoising even on rough metallic surfaces.  The only time to
        disable HDR mode is in a pipeline that explicitly requires a
        tone-mapped LDR input before denoising, which is rare and generally
        an artefact of an earlier workflow not updated for EXR delivery.
      </p>

      <p className="mt-4">
        This denoised output plugs cleanly into the broader compositor chains
        described elsewhere in the library.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-glare-filmgrain-tonemapping"
          className={lk}
        >
          Glare + Film Grain + Tone Map tutorial
        </Link>{" "}
        builds the downstream chain: Denoise output feeds a Glare node
        (Fog Glow, threshold 0.85) so that grain is removed before bloom is
        added — preventing noise from being amplified into false glowing
        speckles.  For scenes that need per-material isolation, the{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-cryptomatte-multilayer-exr"
          className={lk}
        >
          Cryptomatte + Multi-Layer EXR tutorial
        </Link>{" "}
        shows how to store the Normal and Albedo passes inside the EXR so that
        an offline OIDN pass in DaVinci Resolve or Natron can denoise the same
        data after delivery.  For motion-blurred sequences, denoise the beauty
        pass first, then apply{" "}
        <Link
          href="/tutorials/blender-tutorial-compositor-motion-vector-blur"
          className={lk}
        >
          Vector Blur
        </Link>{" "}
        downstream: denoising a motion-blurred frame is harder because the
        streak artificially smears noise into directional banding that confuses
        OIDN&apos;s spatial priors.  The displacement material on the stone
        sphere in this blueprint is a direct application of the technique from
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-cycles-displacement-adaptive-subdivision"
          className={lk}
        >
          Cycles Adaptive Subdivision + True Displacement tutorial
        </Link>
        , where micro-polygon displacement is the typical use case for denoising
        — the high-frequency surface detail drives up noise variance and the
        auxiliary passes are essential to preserve the ridges after cleaning.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-compositor-oidn-denoise-cycles-passes",
  title:
    "Compositor — OIDN Denoise Node: Cycles Denoising with Normal + Albedo Passes",
  date: "2026-06-14",
  kind: "tutorial",
  excerpt:
    "Enable Cycles' Normal and Albedo (DiffCol) render passes, wire Intel OIDN through Blender 5.1's Denoise compositor node, and reduce Cycles render time by 16–64× with full bpy blueprint and prefilter-mode comparison.",
  Body: CompositorOidnDenoiseCyclesPassesBody,
};

export const entry = buildInstructable(
  {
    blenderVersion: "5.1",
    libraryPath:
      "blends/compositing/compositor-oidn-denoise-cycles-passes",
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
      "Understanding that Cycles is a path-tracer and EEVEE is a rasteriser",
    ],
    steps: [
      {
        title: "Run blueprint.py and confirm the scene",
        body: `Open Blender 5.1 → File › New › General.  Open the Text Editor (Shift+F11), paste blueprint.py, and press Alt+P.

The script builds a displaced sandstone sphere, three-point area lighting (key/fill/rim), a dark neutral world shader, and an 85 mm camera.  Two crucial lines happen silently:

  vl.use_pass_normal        = True
  vl.use_pass_diffuse_color = True

Open Properties → View Layer → Passes → Data.  You should see three active passes: Combined (always on), Normal, and Diffuse › Color (labelled DiffCol in the compositor).  Without these ticked, the Denoise node's Normal and Albedo inputs carry only zeroes and denoising quality collapses to OIDN's image-only mode.

Switch to Rendered shading (Z › Rendered) in the 3D Viewport.  The sphere's sand-coloured surface with ridge displacement should be visible.  Cycles progressive rendering starts automatically; let it run to about 20 passes — the grain level you see here is what you're starting from.`,
      },
      {
        title: "Inspect the compositor node tree",
        body: `Switch to the Compositing workspace.  Three nodes are wired:

  RenderLayers → Denoise (three inputs) → Composite
                                        → Viewer

Examine the Denoise node closely.  It has three input sockets:
  • Image  — receives the noisy Combined (beauty) pass.
  • Normal — receives the world-space surface normal pass.
  • Albedo — receives DiffCol, the flat material colour.

All three are wired.  Click the Denoise node to select it; the Properties panel (N key) shows Prefilter = ACCURATE and Use HDR = ON.

Hover the cursor over the Normal input socket.  The socket carries the world-space XYZ of every surface normal, encoded as a signed float (values from −1 to +1 mapped into the RGB range).  On a sphere this looks like a smooth rainbow gradient — but at 32 spp, the gradient has visible noise spiking at each pixel.  ACCURATE prefilter runs OIDN on this noisy normal pass before using it as a guide, so the guidance itself is clean.

Press F12 to render the first frame.  Cycles sends all three passes to disk (internally, as the render buffer); the compositor then runs the Denoise node automatically.`,
      },
      {
        title: "A/B comparison — mute the Denoise node",
        body: `The render completed.  Switch the UV/Image Editor to show the Render Result.  The stone sphere should look clean — smooth tonal gradients, preserved ridge detail, no visible grain at 32 spp.

Now hover the cursor over the Denoise node and press M to mute it.

Press F12 again.  The compositor skips the Denoise node; the raw Combined pass goes directly to Composite.  You'll see the sphere covered in Monte Carlo noise — bright and dark speckles from low-sample variance.  The ridge detail is still there but buried under grain.

Unmute (M) and press F12 once more.  The clean version reappears.  This A/B is the most direct demonstration of what OIDN contributes.  Note that both renders take the same Cycles time — the denoising step is a fraction-of-a-second compositor pass.

Open the Image Editor and zoom into a shadow region at 100% zoom.  The denoised shadow should be smooth; the raw version should show pepper-grain.  Also zoom into the edge of the sphere against the dark background.  The denoised edge should be sharp; if it is slightly blurred you are seeing the denoiser's edge-preservation working from the Normal guide.`,
      },
      {
        title: "Compare Prefilter modes at 32 spp",
        body: `In the Denoise node's Properties panel (N key with node selected), change Prefilter to NONE and press F12.

At 32 spp, the Normal and Albedo passes themselves have measurable noise.  Without prefiltering, OIDN uses these noisy guides directly.  The output still looks much better than the raw render but you may see:
  • Slight smearing across the sphere silhouette edge.
  • Small colour patches where noisy DiffCol corrupted the albedo guide.
  • Loss of fine ridge detail in mid-tones.

Change to FAST and re-render.  FAST runs a single-pass OIDN clean on the Normal and Albedo passes first; it is noticeably better than NONE at 32 spp and adds only ~15% to the compositor time.

Return to ACCURATE and re-render.  At 32 spp, ACCURATE's iterative prefilter produces visibly cleaner edges and better ridge preservation than FAST.  The extra ~30% compositor time (fractions of a second) is almost always worth it below 64 spp.

Rule of thumb: use ACCURATE for ≤ 64 spp, FAST for 64–256 spp, NONE only for ≥ 512 spp where the Normal and Albedo passes are already essentially noise-free.`,
      },
      {
        title: "Stress-test at 8 spp",
        body: `Open the Text Editor, change the constant RENDER_SAMPLES from 32 to 8 and re-run Alt+P.  Press F12.

At 8 spp Cycles produces an extremely noisy image — individual ray samples are visible as bright and dark patches rather than smooth gradients.  The OIDN network's output at this extreme is a good illustration of the denoiser's limits:

  • Large uniform surfaces (the fill-lit side of the sphere) denoise well even at 8 spp — the network has enough signal to average over.
  • The high-frequency ridge displacement introduces local variance that 8 spp cannot resolve.  Fine ridges may be partially reconstructed; others may vanish under the smoothing.  This is the regime where auxiliary passes earn their place: the Normal guide tells OIDN that the ridges are geometric, not noise, and the ACCURATE prefilter cleans the noisy normal pass itself.
  • The specular highlight from the key light may show faint ghosting — OIDN's estimate of the specular shape from 8 samples can be imprecise.

Return RENDER_SAMPLES to 32 and re-run the blueprint for the final saved state.  8 spp denoising is genuinely useful for preview renders and fast iteration; for final delivery, 32–64 spp with OIDN produces reliable results on most surfaces.`,
      },
      {
        title: "Save and chain into the compositor pipeline",
        body: `Press Ctrl+S and save as stone_denoise.blend.  This is the file the artefact catalogue expects.

To extend the pipeline, add a Glare node between the Denoise output and the Composite input:

  Denoise → Glare (Fog Glow, Threshold=0.85, Quality=HIGH) → Composite

The Glare node runs on the already-denoised image: specular highlights are clean and the bloom is derived from actual high-luminance pixels rather than noise spikes.  Without denoising first, Glare amplifies Monte Carlo noise into false glowing speckles — a common complaint about Cycles + Bloom workflows at low sample counts.

For the recording, run record.py from the Text Editor.  It renders 60 frames: the first 30 with the Denoise node muted (noisy), the last 30 denoised, outputting a viewport.mp4 comparison clip to public/library/videos/compositing/compositor-oidn-denoise-cycles-passes/.`,
      },
    ],
    finalResult:
      "A Blender 5.1 Cycles compositor pipeline that enables Normal and Albedo (DiffCol) render passes, wires Intel OIDN through the Denoise compositor node with ACCURATE prefilter and HDR mode, and produces clean renders from 32 spp equivalent in quality to ~512 spp path-tracing. The blueprint builds the full scene and node tree via bpy; record.py outputs a 60-frame muted-vs-denoised comparison clip.",
    variations: [
      "Chain Denoise into Glare for bloom without noise amplification: connect Denoise output → Glare node (Fog Glow, Threshold=0.85, Quality=HIGH) → Composite. Denoising first ensures that only genuine bright pixels trigger bloom, not noise spikes. This is the correct order for the production compositor chain from the Glare + Film Grain + Tone Map tutorial.",
      "Multi-layer EXR with deferred OIDN: instead of compositing inside Blender, use the File Output node to save the Combined, Normal, and DiffCol passes as separate channels in a DWAA-compressed multi-layer EXR. Open in DaVinci Resolve Fusion or Natron, feed those three channels into an OIDN filter node (both applications support OIDN plugins), and denoise offline at delivery. This decouples rendering from denoising and lets you experiment with OIDN settings without re-rendering. See the Cryptomatte + Multi-Layer EXR tutorial for the File Output node setup.",
      "Temporal denoising for animation: for sequences where per-frame OIDN flickers, switch from the compositor Denoise node to Cycles' built-in temporal denoiser: scene.cycles.use_denoising = True and scene.cycles.denoiser = 'OPENIMAGEDENOISE'. This processes adjacent frames together, suppressing temporal variance at the cost of slightly more render memory per batch. The compositor Denoise node used in this tutorial is best for single-frame renders and previews; the built-in temporal denoiser is better for final animation sequences.",
    ],
    troubleshooting: [
      {
        symptom:
          "Denoise node output looks identical to the raw noisy input — no improvement",
        cause:
          "The Normal and/or Albedo inputs to the Denoise node are disconnected or receiving a zero buffer. This happens if use_pass_normal or use_pass_diffuse_color was not enabled on the view layer before the render, leaving those pass buffers empty.",
        fix: "In the compositor, disconnect and reconnect the Normal and Albedo links to force the node to re-read the buffers. If the sockets on the Render Layers node are missing, open Properties → View Layer → Passes → Data, tick Normal and Diffuse › Color, then press F12 to render again — the sockets only appear after the pass is enabled and a render has completed.",
      },
      {
        symptom:
          "Sharp edges (sphere silhouette, ridge tops) appear blurred or smeared after denoising",
        cause:
          "Prefilter is set to NONE while the Normal pass at the current sample count is noisy. Noisy normals make the denoiser unable to identify the geometric boundary and it smooths across the edge.",
        fix: "Change Prefilter to ACCURATE and re-render. Also check that the Normal pass is correctly wired to the Normal input (not the Albedo input — the two sockets are adjacent and easy to swap). In the Viewer node, switch the Image Editor to show the Normal pass: it should display as a smooth colour-coded gradient over the sphere, not as a noisy static field.",
      },
      {
        symptom:
          "Specular highlights and glossy reflections look flat or have incorrect colour after denoising",
        cause:
          "use_hdr is False on the Denoise node. Blender clamps the Combined pass to [0, 1] before feeding OIDN, stripping the HDR data that represents high-luminance specular detail. The denoiser reconstructs the clipped region as a flat white patch.",
        fix: "Set denoise_node.use_hdr = True or tick Use HDR in the Denoise node's Properties panel. Re-render. The specular highlight should now retain shape and colour after denoising. This is particularly important for metallic materials and glass surfaces where specular luminance far exceeds 1.0 in linear float.",
      },
      {
        symptom:
          "Caustic fireflies or bright speckles survive denoising and appear as small glowing dots",
        cause:
          "Caustic light paths (light concentrated by glass or curved mirrors) produce very high-luminance samples that cannot be averaged out by the spatial denoiser — the speckle is not noise, it is a genuine single-sample ray event that OIDN has no way to verify as signal or variance.",
        fix: "Reduce Cycles' Clamp Indirect value (scene.cycles.sample_clamp_indirect, e.g. 4.0) to suppress extreme sample values before denoising. Alternatively, increase glossy/transparent bounces and sample count specifically in regions with caustics. The correct long-term fix is Cycles' native caustic rendering with Manifold Path Sampling (scene.cycles.use_light_tree = True), which distributes caustic samples more efficiently and reduces per-sample variance.",
      },
    ],
  },
  base,
);

export { entry };
