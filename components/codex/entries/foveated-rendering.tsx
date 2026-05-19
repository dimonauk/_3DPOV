export default function FoveatedRendering() {
  return (
    <>
      <p>
        Foveated rendering exploits a property of the human visual
        system: only a small region of the retina &mdash; the fovea,
        about two degrees of arc &mdash; resolves fine detail. Anywhere
        outside that cone the eye is much less sensitive. A renderer
        that knows where the eye is pointing can deliver full
        per-pixel quality inside the fovea and reduce sample count
        (or shading resolution, or texture detail) everywhere else
        without the user noticing the difference. The headset gets
        the perceived fidelity of a panel-native render for a
        substantially lower compute budget.<sup>1</sup>
      </p>
      <p>
        Two implementations show up in shipping XR hardware. Eye-
        tracked foveation, as on the Apple Vision Pro, runs at five
        pixels-per-degree in the periphery and forty in the centre,
        with the foveation region moving as the eyes do. The
        compositor handles it; the application sees an opaque
        framebuffer. Fixed foveation, as on the Meta Quest 3, picks
        a static high-detail region in the centre of each eye&rsquo;s
        view and a lower-detail ring outside. There&rsquo;s no
        eye-tracking on consumer Quest hardware, so the fovea region
        sits where the headset assumes the eye most often points; it
        misses when the user looks sideways through the lens, but it
        still recovers a substantial fragment-cost discount.
      </p>
      <p>
        Foveation changes the performance math for the cel-shaded and
        depth-of-field passes the studio runs in VR. A full-screen
        Kuwahara filter (one of the studio&rsquo;s NPR experiments)
        is unaffordable across the entire framebuffer at 90 Hz on
        Quest 3; running it only inside the foveated region, with a
        cheaper version in the periphery, brings it inside the
        frametime budget on the studio&rsquo;s hard deck. The same
        argument applies to expensive ramp-shading lookups, screen-
        space reflection, and the bloom-plus-tone-map post pack.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        ,{" "}
        <a
          href="/codex/kuwahara-filter"
          className="text-pink-200 underline underline-offset-4"
        >
          Kuwahara filter
        </a>
        ,{" "}
        <a
          href="/codex/ramp-shading"
          className="text-pink-200 underline underline-offset-4"
        >
          ramp shading
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Foveated_rendering"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Foveated rendering
          </a>
          .
        </li>
        <li>
          <a
            href="https://developers.meta.com/horizon/documentation/native/android/mobile-ffr/"
            className="text-pink-200 underline underline-offset-4"
          >
            Meta: Fixed Foveated Rendering on Quest
          </a>
          .
        </li>
        <li>
          <a
            href="https://research.nvidia.com/publication/2016-07_perceptually-based-foveated-virtual-reality"
            className="text-pink-200 underline underline-offset-4"
          >
            Patney et al., Perceptually-Based Foveated Virtual Reality
            (NVIDIA / SIGGRAPH 2016)
          </a>
          .
        </li>
        <li>
          The studio&rsquo;s per-device foveation policy lives at{" "}
          <code className="font-mono text-chrome-200">
            docs/WEBXR-DEVICE-TARGETS.md
          </code>
          .
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          The classic citation for the falloff is Anstis (1974),
          which mapped letter acuity against eccentricity and gave
          the field a usable curve. Modern foveation uses variants of
          the same falloff, sometimes with additional adjustment for
          contrast sensitivity at different temporal frequencies.
        </li>
      </ol>
    </>
  );
}
