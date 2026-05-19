export default function KuwaharaFilter() {
  return (
    <>
      <p>
        The Kuwahara filter is an image-processing operator that
        produces painterly, brush-stroked output while preserving
        edges. At each pixel it divides a square neighbourhood into
        four overlapping quadrants, computes the mean colour and the
        variance in each, and replaces the centre pixel with the mean
        of the quadrant that has the lowest variance &mdash; the
        smoothest local region wins. The output looks as if the image
        had been repainted in flat, blocky strokes that follow the
        underlying detail rather than averaging across it.<sup>1</sup>
      </p>
      <p>
        The 1976 original is square-windowed and isotropic, which
        gives the painterly look a slight rectangular grid. Kyprianidis,
        D&ouml;llner, and Kang&rsquo;s 2009 anisotropic Kuwahara is
        the version most commonly cited today: it estimates the local
        structure tensor at every pixel, orients the sampling kernel
        along the dominant gradient, and the brush strokes follow the
        flow of the image like real impasto. A second 2009 paper from
        the same group introduced the generalised Kuwahara &mdash;
        eight overlapping wedges instead of four quadrants &mdash;
        which gives a softer painterly result still.<sup>2</sup>
      </p>
      <p>
        It is beautiful in the way few image-processing filters are.
        It is also XR-unsafe in interesting ways. Run as a full-screen
        post-process at 90 Hz on a Quest 3, it eats the fragment
        budget in one bite; even with foveation, the anisotropic
        variant is slow enough that any moderately busy scene drops
        frames. Worse, the filter smooths low-variance regions
        aggressively, which means a slow head rotation in VR turns
        background detail into shimmering painterly plates that read
        as vection-inducing motion. The studio uses Kuwahara in
        stills, in the painterly variant of the wall-piece moodboard
        export, and as a post-pass on the flat-browser preview of a
        scene; it does not run inside the headset.
      </p>
      <p>
        <strong>Cross-references:</strong>{" "}
        <a
          href="/codex/foveated-rendering"
          className="text-pink-200 underline underline-offset-4"
        >
          foveated rendering
        </a>
        ,{" "}
        <a
          href="/codex/tsl-three-shading-language"
          className="text-pink-200 underline underline-offset-4"
        >
          TSL
        </a>
        ,{" "}
        <a
          href="/codex/webxr"
          className="text-pink-200 underline underline-offset-4"
        >
          WebXR
        </a>
        .
      </p>
      <p>
        <strong>Further reading:</strong>
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <a
            href="https://en.wikipedia.org/wiki/Kuwahara_filter"
            className="text-pink-200 underline underline-offset-4"
          >
            Wikipedia: Kuwahara filter
          </a>
          .
        </li>
        <li>
          Kyprianidis, Kang &amp; D&ouml;llner,{" "}
          <a
            href="https://www.kyprianidis.com/p/eg2009/jkyprian-eg2009.pdf"
            className="text-pink-200 underline underline-offset-4"
          >
            Anisotropic Kuwahara Filtering on the GPU (Eurographics
            2009)
          </a>
          .
        </li>
        <li>
          Kyprianidis et al.,{" "}
          <a
            href="https://www.kyprianidis.com/p/pg2009/jkyprian-pg2009.pdf"
            className="text-pink-200 underline underline-offset-4"
          >
            Image and Video Abstraction by Anisotropic Kuwahara
            Filtering (Pacific Graphics 2009)
          </a>
          .
        </li>
        <li>
          Acerola,{" "}
          <a
            href="https://www.youtube.com/watch?v=LDhN-JK3U9g"
            className="text-pink-200 underline underline-offset-4"
          >
            How to make your own Kuwahara filter
          </a>{" "}
          &mdash; the most-cited tutorial walking through generalised
          + anisotropic variants for real-time shaders.
        </li>
      </ul>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Michiyoshi Kuwahara introduced the original variant in a
          1976 paper on automatic processing of myocardial-scintigraphy
          images. Decades later it became a graphics technique by
          accident, because the same property that made it useful for
          smoothing medical scans without losing diagnostic boundaries
          made it look like an oil painting on a photograph.
        </li>
        <li>
          The anisotropic + generalised variants are what shipped in
          the indie game cel-shaders that brought the filter back to
          public attention around 2021&ndash;2023. The original
          isotropic version still has uses where the grid pattern is
          desirable, such as woodblock-print stylisation.
        </li>
      </ol>
    </>
  );
}
