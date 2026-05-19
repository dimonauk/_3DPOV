export default function AppleSharp() {
  return (
    <>
      <p>
        SHARP &mdash; <em>Single-Image Hierarchical Adaptive Reconstruction
        of 3D Photographs</em> &mdash; is Apple Machine Learning
        Research&rsquo;s 2024 pipeline for turning one flat photograph
        into a stereo 3D scene viewable on Apple Vision Pro and other
        spatial displays.<sup>1</sup> The studio uses SHARP as the
        premium back-end for the{" "}
        <strong>
          <a
            href="/spatial"
            className="text-pink-200 underline underline-offset-4"
          >
            /spatial
          </a>
        </strong>{" "}
        commission service: visitors upload a flat photograph, SHARP
        renders the stereo, the bench ships back a USDZ or side-by-side
        MP4.
      </p>
      <p>
        How SHARP differs from the more familiar pipeline
        (single-image depth-estimation + parallax-warp): SHARP fits a
        proper layered 3D representation, then re-renders. The output
        has occluded-background reconstruction (the model hallucinates
        what was behind the foreground when the viewpoint shifts) and
        respects scene constraints rather than just shearing pixels.
        On a Vision Pro it sits convincingly in real space; on a
        traditional 3D display it doesn&rsquo;t.<sup>2</sup>
      </p>
      <p>
        <strong>The licence boundary that gates the studio&rsquo;s
        commerce surface.</strong> SHARP ships under Apple&rsquo;s{" "}
        <a
          href="https://github.com/apple/ml-amlr"
          className="text-pink-200 underline underline-offset-4"
        >
          AMLR (Apple Machine Learning Research) licence
        </a>
        , which is explicitly{" "}
        <em>research-only</em>. The studio cannot sell SHARP outputs
        as products in the conventional sense. The path that respects
        the licence:
      </p>
      <ul className="ml-6 list-disc space-y-2">
        <li>
          <strong>Bench-commission only.</strong> SHARP is run on
          studio hardware for individual research-context jobs. The
          buyer is paying for the studio&rsquo;s time + electricity +
          quality control, not for the SHARP weights or output as a
          licensable artefact.
        </li>
        <li>
          <strong>No bulk pipeline.</strong> The studio does not run
          SHARP as a self-serve product on holoflow.co.uk;{" "}
          <code className="font-mono text-chrome-200">
            /spatial
          </code>{" "}
          presents it as a commission you write in to book.
        </li>
        <li>
          <strong>
            Commercial-grade work goes through{" "}
            <a
              href="/codex/trellis"
              className="text-pink-200 underline underline-offset-4"
            >
              TRELLIS
            </a>{" "}
            or InstantMesh.
          </strong>{" "}
          Both ship under Apache-2.0; both produce different output
          (textured mesh, not stereo). The studio is honest with the
          customer about which path their brief needs.
        </li>
      </ul>
      <p>
        For the architecture of the licence-respecting pipeline see the
        <strong>
          <a
            href="/articles/the-research-commerce-line"
            className="text-pink-200 underline underline-offset-4"
          >
            research-commerce line
          </a>
        </strong>{" "}
        article. For the free path (in-browser depth-estimation) see
        <strong>
          <a
            href="/codex/depth-anything-v2"
            className="text-pink-200 underline underline-offset-4"
          >
            Depth Anything V2
          </a>
        </strong>
        .
      </p>

      <hr className="my-12 border-warm-black-800" />
      <ol className="ml-6 list-decimal space-y-2 text-sm text-chrome-400">
        <li>
          Cui et al.,{" "}
          <em>
            SHARP: Single-Image Hierarchical Adaptive Reconstruction of
            3D Photographs
          </em>
          , Apple Machine Learning Research, 2024.
        </li>
        <li>
          The studio runs SHARP locally on a 3080 Ti via the FastAPI
          service at{" "}
          <code className="font-mono text-chrome-200">
            python-services/sharp_service.py
          </code>{" "}
          on port 7842. Visitors don&rsquo;t see this; the bench
          handles the inference and ships back the result.
        </li>
      </ol>
    </>
  );
}
